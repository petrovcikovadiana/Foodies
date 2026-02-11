import { supabaseServer } from "./supabaseServer";

const FDC_BASE = "https://api.nal.usda.gov/fdc/v1";

// ---------- helpers ----------
function normName(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

async function getPieceWeightGrams(ingredientNorm) {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("piece_weights")
    .select("grams_per_piece")
    .eq("ingredient_norm", ingredientNorm)
    .maybeSingle();

  if (error) throw error;
  return data?.grams_per_piece ?? null;
}

function toGrams(amount, unit, gramsPerPiece) {
  const a = Number(amount);
  if (!Number.isFinite(a) || a <= 0) return null;

  const u = (unit || "").trim().toLowerCase();

  if (u === "mg") return a / 1000;
  if (u === "g") return a;
  if (u === "kg") return a * 1000;

  // pozor: ml/l tu berieš ako gramy (1 ml = 1 g) — približné
  if (u === "ml") return a;
  if (u === "l") return a * 1000;

  if (u === "tsp") return a * 5;
  if (u === "tbsp") return a * 15;
  if (u === "pinch") return a * 0.3;

  if (u === "pcs") {
    if (!gramsPerPiece) return null;
    return a * Number(gramsPerPiece);
  }

  return null;
}

async function fdcSearch(query, apiKey) {
  if (!apiKey) throw new Error("Missing FDC_API_KEY");

  const url =
    `${FDC_BASE}/foods/search?` +
    new URLSearchParams({
      api_key: apiKey,
      query,
      pageSize: "5",
    });

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Foodies/1.0",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`FDC search failed: ${res.status} ${body}`);
  }

  return res.json();
}

async function fdcFood(fdcId, apiKey) {
  const res = await fetch(`${FDC_BASE}/food/${fdcId}?api_key=${apiKey}`);
  if (!res.ok) throw new Error(`FDC food failed: ${res.status}`);
  return res.json();
}

function pickNutrients(foodJson) {
  const out = {
    kcal_100g: 0,
    protein_g_100g: 0,
    carbs_g_100g: 0,
    fat_g_100g: 0,
    fiber_g_100g: 0,
    sodium_mg_100g: 0,
  };

  const nutrients = foodJson?.foodNutrients || [];
  for (const n of nutrients) {
    const name = (n.nutrient?.name || n.nutrientName || "").toLowerCase();
    const unit = (n.nutrient?.unitName || n.unitName || "").toLowerCase();
    const val = Number(n.amount ?? n.value);
    if (!Number.isFinite(val)) continue;

    if (name.includes("energy") && unit === "kcal") out.kcal_100g = val;

    if (name.includes("protein") && unit === "g") out.protein_g_100g = val;
    if (name.includes("carbohydrate") && unit === "g") out.carbs_g_100g = val;
    if ((name.includes("total lipid") || name === "fat") && unit === "g")
      out.fat_g_100g = val;

    if (name.includes("fiber") && unit === "g") out.fiber_g_100g = val;
    if (name.includes("sodium") && unit === "mg") out.sodium_mg_100g = val;
  }

  return out;
}

function sumNutrients(sum, n, grams) {
  const factor = grams / 100;
  sum.kcal += n.kcal_100g * factor;
  sum.protein_g += n.protein_g_100g * factor;
  sum.carbs_g += n.carbs_g_100g * factor;
  sum.fat_g += n.fat_g_100g * factor;
  sum.fiber_g += n.fiber_g_100g * factor;
  sum.sodium_mg += n.sodium_mg_100g * factor;
}

// ---------- Supabase mapping cache ----------
async function getMappedFdcId(ingredientNorm) {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("ingredient_map")
    .select("fdc_id")
    .eq("ingredient_norm", ingredientNorm)
    .maybeSingle();

  if (error) throw error;
  return data?.fdc_id ?? null;
}

async function upsertMappedFdcId(ingredientNorm, fdcId, note) {
  const supabase = supabaseServer();

  const { error } = await supabase
    .from("ingredient_map")
    .upsert(
      { ingredient_norm: ingredientNorm, fdc_id: fdcId, note: note || null },
      { onConflict: "ingredient_norm" },
    );

  if (error) throw error;
}

// ---------- Nutrition cache ----------
export async function getNutritionCache(slug) {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("nutrition_cache")
    .select("data_json, updated_at")
    .eq("meal_slug", slug)
    .maybeSingle();

  if (error) throw error;

  return data ? { data: data.data_json, updated_at: data.updated_at } : null;
}

export async function setNutritionCache(slug, dataJson) {
  const supabase = supabaseServer();

  const { error } = await supabase.from("nutrition_cache").upsert(
    {
      meal_slug: slug,
      data_json: dataJson,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "meal_slug" },
  );

  if (error) throw error;
}

// ---------- Main compute ----------
export async function computeNutritionFromIngredients(
  ingredientGroups,
  servings,
  apiKey,
) {
  const total = {
    kcal: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0,
    sodium_mg: 0,
    unknown: [],
  };

  // flatten groups → items
  const items = [];
  for (const g of ingredientGroups || []) {
    for (const ing of g.items || []) items.push(ing);
  }

  for (const ing of items) {
    const nameNorm = normName(ing.name);
    if (!nameNorm) continue;

    const gramsPerPiece = await getPieceWeightGrams(nameNorm);
    const grams = toGrams(ing.amount, ing.unit, gramsPerPiece);

    if (!grams) {
      total.unknown.push({
        ...ing,
        reason: "Neviem prepočítať jednotku na gramy (pcs/lyžice bez váhy).",
      });
      continue;
    }

    // mapping table in Supabase
    let fdcId = await getMappedFdcId(nameNorm);

    if (!fdcId) {
      const search = await fdcSearch(nameNorm, apiKey);
      const hit = search?.foods?.[0];
      if (!hit?.fdcId) {
        total.unknown.push({ ...ing, reason: "Nenašlo sa v USDA databáze." });
        continue;
      }

      fdcId = hit.fdcId;
      await upsertMappedFdcId(
        nameNorm,
        fdcId,
        `auto-match: ${hit.description || ""}`,
      );
    }

    const food = await fdcFood(fdcId, apiKey);
    const n = pickNutrients(food);
    sumNutrients(total, n, grams);
  }

  const salt_g = (total.sodium_mg / 1000) * 2.5;

  const safeServings =
    Number.isFinite(Number(servings)) && Number(servings) > 0
      ? Number(servings)
      : 1;

  return {
    perRecipe: {
      kcal: total.kcal,
      protein_g: total.protein_g,
      carbs_g: total.carbs_g,
      fat_g: total.fat_g,
      fiber_g: total.fiber_g,
      salt_g,
    },
    perServing: {
      kcal: total.kcal / safeServings,
      protein_g: total.protein_g / safeServings,
      carbs_g: total.carbs_g / safeServings,
      fat_g: total.fat_g / safeServings,
      fiber_g: total.fiber_g / safeServings,
      salt_g: salt_g / safeServings,
    },
    unknown: total.unknown,
  };
}
