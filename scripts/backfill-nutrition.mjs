import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { makeNutritionHelpers } from "./nutrition.mjs";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const apiKey = process.env.FDC_API_KEY;

if (!url || !key) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}
if (!apiKey) {
  throw new Error("Missing FDC_API_KEY");
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

// ✅ tu si vyrobíme compute funkciu, ktorá používa SUPABASE klienta
const { computeNutritionFromIngredients } = makeNutritionHelpers(supabase);

function ensureArray(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const p = JSON.parse(v);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function main() {
  const { data: meals, error } = await supabase
    .from("meals")
    .select("id, slug, ingredients, servings, nutrition_per_serving")
    .is("nutrition_per_serving", null)
    .order("id", { ascending: true });

  if (error) throw error;

  console.log(`Found ${meals?.length ?? 0} meals to backfill`);

  for (const m of meals ?? []) {
    const ingredients = ensureArray(m.ingredients);
    const servings = m.servings ?? 1;

    try {
      const nutrition = await computeNutritionFromIngredients(
        ingredients,
        servings,
        apiKey,
      );

      const payload = {
        nutrition_per_serving: nutrition.perServing ?? null,
        nutrition_per_recipe: nutrition.perRecipe ?? null,
        nutrition_unknown: nutrition.unknown ?? null,
        nutrition_updated_at: new Date().toISOString(),
      };

      const { error: upErr } = await supabase
        .from("meals")
        .update(payload)
        .eq("slug", m.slug);

      if (upErr) throw upErr;

      console.log("✅ backfilled", m.slug);
    } catch (e) {
      console.log("❌ failed", m.slug, e?.message ?? e);
    }

    await new Promise((r) => setTimeout(r, 250));
  }

  console.log("DONE");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
