import sql from "better-sqlite3";
import slugify from "slugify";
import xss from "xss";
// working with file system
import fs from "node:fs";

const db = sql("meals.db");

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS meals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    image TEXT NOT NULL,
    ingredients TEXT NOT NULL,
    instructions TEXT NOT NULL,
    cooking_time INTEGER NOT NULL,
    categories TEXT NOT NULL,
        servings INTEGER NOT NULL DEFAULT 1,

    creator TEXT NOT NULL,
    creator_email TEXT NOT NULL
  )
`,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS ingredient_map (
    ingredient_norm TEXT PRIMARY KEY,
    fdc_id INTEGER NOT NULL,
    note TEXT
  )
`,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS nutrition_cache (
    meal_slug TEXT PRIMARY KEY,
    data_json TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )
`,
).run();

db.prepare(
  `
  CREATE TABLE IF NOT EXISTS piece_weights (
    ingredient_norm TEXT PRIMARY KEY,
    grams_per_piece REAL NOT NULL
  )
`,
).run();

export async function getMeals({ category = "", q = "" } = {}) {
  await new Promise((resolve) => setTimeout(resolve, 2000));

  let query = "SELECT * FROM meals";
  const where = [];
  const params = {};

  if (category) {
    where.push("categories LIKE @cat");
    params.cat = `%\"${category}\"%`;
  }

  if (q) {
    where.push("LOWER(title) LIKE @q");
    params.q = `%${q.toLowerCase().trim()}%`;
  }

  if (where.length) {
    query += " WHERE " + where.join(" AND ");
  }

  query += " ORDER BY id DESC";

  const meals = db.prepare(query).all(params);

  return meals.map((m) => ({
    ...m,
    ingredients: safeJsonArray(m.ingredients),
    instructions: safeJsonArray(m.instructions),
    categories: safeJsonArray(m.categories),
  }));
}

export function getMeal(slug) {
  const meal = db.prepare("SELECT * FROM meals Where slug = ?").get(slug);

  if (!meal) return null;

  return {
    ...meal,
    ingredients: safeJsonArray(meal.ingredients),
    instructions: safeJsonArray(meal.instructions),
    categories: safeJsonArray(meal.categories),
  };
}

// function to save file and data to database
export async function saveMeal(meal) {
  meal.slug = slugify(meal.title, { lower: true });
  meal.instructions = xss(meal.instructions);

  meal.cooking_time = Number(meal.cooking_time);
  if (!Number.isFinite(meal.cooking_time) || meal.cooking_time <= 0) {
    throw new Error("Invalid cooking time");
  }

  meal.servings = Number(meal.servings);
  if (
    !Number.isInteger(meal.servings) ||
    meal.servings < 1 ||
    meal.servings > 20
  ) {
    throw new Error("Invalid servings");
  }

  const extension = meal.image.name.split(".").pop();
  const fileName = `${meal.slug}.${extension}`;

  const stream = fs.createWriteStream(`public/images/${fileName}`);
  const bufferedImage = await meal.image.arrayBuffer();

  stream.write(Buffer.from(bufferedImage), (error) => {
    if (error) {
      throw new Error("Saving image filed");
    }
  });

  meal.image = `/images/${fileName}`;

  db.prepare(
    `
    INSERT INTO meals
      (title, ingredients, instructions, image, cooking_time, categories, servings, creator, creator_email, slug)
    VALUES
      (@title, @ingredients, @instructions, @image, @cooking_time, @categories,@servings, @creator, @creator_email, @slug)
  `,
  ).run(meal);
}

export function deleteMeal(slug) {
  const meal = getMeal(slug);

  if (meal?.image) {
    const imagePath = `public${meal.image}`;
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
  }

  // delete from the database
  db.prepare("DELETE FROM meals WHERE slug = ?").run(slug);
}

function safeJsonArray(value) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return String(value || "")
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
}
