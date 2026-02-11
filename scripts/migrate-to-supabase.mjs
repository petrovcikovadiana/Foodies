import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import sql from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const sqlite = sql("meals.db");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const BUCKET = "meal-images";

function safeJson(v) {
  try {
    return JSON.parse(v);
  } catch {
    return [];
  }
}

async function main() {
  const rows = sqlite.prepare("SELECT * FROM meals ORDER BY id ASC").all();

  for (const m of rows) {
    const ingredients = safeJson(m.ingredients);
    const instructions = safeJson(m.instructions);
    const categories = safeJson(m.categories);

    // image je "/images/xxx.ext"
    const localImagePath = path.join(process.cwd(), "public", m.image);
    const fileName = path.basename(localImagePath);

    let imageUrl = m.image;

    if (fs.existsSync(localImagePath)) {
      const buf = fs.readFileSync(localImagePath);

      const { error: upErr } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, buf, { upsert: true, contentType: "image/*" });

      if (upErr) throw upErr;

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(fileName);
      imageUrl = publicUrlData.publicUrl;
    }

    const payload = {
      slug: m.slug,
      title: m.title,
      image: imageUrl,
      ingredients,
      instructions,
      cooking_time: m.cooking_time,
      categories,
      servings: m.servings ?? 1,
      creator: m.creator,
      creator_email: m.creator_email,
    };

    const { error: insErr } = await supabase
      .from("meals")
      .upsert(payload, { onConflict: "slug" });

    if (insErr) throw insErr;

    console.log("✅ migrated", m.slug);
  }

  console.log("DONE");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
