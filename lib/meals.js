// import sql from "better-sqlite3";
// import slugify from "slugify";
// import xss from "xss";
// // working with file system
// import fs from "node:fs";

// const db = sql("meals.db");

// db.prepare(
//   `
//   CREATE TABLE IF NOT EXISTS meals (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     slug TEXT NOT NULL UNIQUE,
//     title TEXT NOT NULL,
//     image TEXT NOT NULL,
//     ingredients TEXT NOT NULL,
//     instructions TEXT NOT NULL,
//     cooking_time INTEGER NOT NULL,
//     categories TEXT NOT NULL,
//         servings INTEGER NOT NULL DEFAULT 1,

//     creator TEXT NOT NULL,
//     creator_email TEXT NOT NULL
//   )
// `,
// ).run();

// db.prepare(
//   `
//   CREATE TABLE IF NOT EXISTS ingredient_map (
//     ingredient_norm TEXT PRIMARY KEY,
//     fdc_id INTEGER NOT NULL,
//     note TEXT
//   )
// `,
// ).run();

// db.prepare(
//   `
//   CREATE TABLE IF NOT EXISTS nutrition_cache (
//     meal_slug TEXT PRIMARY KEY,
//     data_json TEXT NOT NULL,
//     updated_at INTEGER NOT NULL
//   )
// `,
// ).run();

// db.prepare(
//   `
//   CREATE TABLE IF NOT EXISTS piece_weights (
//     ingredient_norm TEXT PRIMARY KEY,
//     grams_per_piece REAL NOT NULL
//   )
// `,
// ).run();

// export async function getMeals({ category = "", q = "" } = {}) {
//   await new Promise((resolve) => setTimeout(resolve, 2000));

//   let query = "SELECT * FROM meals";
//   const where = [];
//   const params = {};

//   if (category) {
//     where.push("categories LIKE @cat");
//     params.cat = `%\"${category}\"%`;
//   }

//   if (q) {
//     where.push("LOWER(title) LIKE @q");
//     params.q = `%${q.toLowerCase().trim()}%`;
//   }

//   if (where.length) {
//     query += " WHERE " + where.join(" AND ");
//   }

//   query += " ORDER BY id DESC";

//   const meals = db.prepare(query).all(params);

//   return meals.map((m) => ({
//     ...m,
//     ingredients: safeJsonArray(m.ingredients),
//     instructions: safeJsonArray(m.instructions),
//     categories: safeJsonArray(m.categories),
//   }));
// }

// export function getMeal(slug) {
//   const meal = db.prepare("SELECT * FROM meals Where slug = ?").get(slug);

//   if (!meal) return null;

//   return {
//     ...meal,
//     ingredients: safeJsonArray(meal.ingredients),
//     instructions: safeJsonArray(meal.instructions),
//     categories: safeJsonArray(meal.categories),
//   };
// }

// // function to save file and data to database
// export async function saveMeal(meal) {
//   meal.slug = slugify(meal.title, { lower: true });
//   meal.instructions = xss(meal.instructions);

//   meal.cooking_time = Number(meal.cooking_time);
//   if (!Number.isFinite(meal.cooking_time) || meal.cooking_time <= 0) {
//     throw new Error("Invalid cooking time");
//   }

//   meal.servings = Number(meal.servings);
//   if (
//     !Number.isInteger(meal.servings) ||
//     meal.servings < 1 ||
//     meal.servings > 20
//   ) {
//     throw new Error("Invalid servings");
//   }

//   const extension = meal.image.name.split(".").pop();
//   const fileName = `${meal.slug}.${extension}`;

//   const stream = fs.createWriteStream(`public/images/${fileName}`);
//   const bufferedImage = await meal.image.arrayBuffer();

//   stream.write(Buffer.from(bufferedImage), (error) => {
//     if (error) {
//       throw new Error("Saving image filed");
//     }
//   });

//   meal.image = `/images/${fileName}`;

//   db.prepare(
//     `
//     INSERT INTO meals
//       (title, ingredients, instructions, image, cooking_time, categories, servings, creator, creator_email, slug)
//     VALUES
//       (@title, @ingredients, @instructions, @image, @cooking_time, @categories,@servings, @creator, @creator_email, @slug)
//   `,
//   ).run(meal);
// }

// export function deleteMeal(slug) {
//   const meal = getMeal(slug);

//   if (meal?.image) {
//     const imagePath = `public${meal.image}`;
//     if (fs.existsSync(imagePath)) {
//       fs.unlinkSync(imagePath);
//     }
//   }

//   // delete from the database
//   db.prepare("DELETE FROM meals WHERE slug = ?").run(slug);
// }

// function safeJsonArray(value) {
//   try {
//     const parsed = JSON.parse(value);
//     return Array.isArray(parsed) ? parsed : [];
//   } catch {
//     return String(value || "")
//       .split(/[\n,]/)
//       .map((s) => s.trim())
//       .filter(Boolean);
//   }
// }

import slugify from "slugify";
import xss from "xss";
import { supabaseServer } from "./supabaseServer";

const BUCKET = "meal-images";

export async function getMeals({ category = "", q = "" } = {}) {
  const supabase = supabaseServer();

  let query = supabase
    .from("meals")
    .select("*")
    .order("id", { ascending: false });

  if (q) {
    query = query.ilike("title", `%${q.toLowerCase().trim()}%`);
  }

  if (category) {
    // categories je jsonb array: ["breakfast","vegan",...]
    query = query.contains("categories", [category]);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data ?? [];
}

export async function getMeal(slug) {
  const supabase = supabaseServer();

  const { data, error } = await supabase
    .from("meals")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function saveMeal(meal) {
  const supabase = supabaseServer();

  const slug = slugify(meal.title, { lower: true });

  const cooking_time = Number(meal.cooking_time);
  if (!Number.isFinite(cooking_time) || cooking_time <= 0) {
    throw new Error("Invalid cooking time");
  }

  const servings = Number(meal.servings);
  if (!Number.isInteger(servings) || servings < 1 || servings > 20) {
    throw new Error("Invalid servings");
  }

  // 1) sanitize instructions (tvoje instructions prichádzajú ako JSON string)
  const instructionsStr = xss(String(meal.instructions || "[]"));

  // 2) parse JSON strings to arrays (lebo v action.js posielaš JSON.stringify)
  const ingredients = JSON.parse(meal.ingredients || "[]");
  const instructions = JSON.parse(instructionsStr || "[]");
  const categories = JSON.parse(meal.categories || "[]");

  // 3) upload image to Storage
  const extension = meal.image.name.split(".").pop();
  const fileName = `${slug}.${extension}`;

  const arrayBuffer = await meal.image.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, fileBuffer, {
      upsert: true,
      contentType: meal.image.type || "image/*",
    });

  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(fileName);
  const imageUrl = publicUrlData.publicUrl;

  // 4) insert row
  const payload = {
    slug,
    title: meal.title,
    image: imageUrl,
    ingredients,
    instructions,
    cooking_time,
    categories,
    servings,
    creator: meal.creator,
    creator_email: meal.creator_email,
  };

  const { error: insertError } = await supabase.from("meals").insert(payload);
  if (insertError) throw insertError;

  return slug; // vraciame slug, aby action vedela revalidatePath správne
}

export async function deleteMeal(slug) {
  const supabase = supabaseServer();

  // zisti meal (kvôli obrázku)
  const meal = await getMeal(slug);
  if (!meal) return;

  // odstráň obrázok zo storage (best effort)
  if (meal.image) {
    const fileName = meal.image.split("/").pop();
    await supabase.storage.from(BUCKET).remove([fileName]);
  }

  // delete z DB
  const { error } = await supabase.from("meals").delete().eq("slug", slug);
  if (error) throw error;
}
