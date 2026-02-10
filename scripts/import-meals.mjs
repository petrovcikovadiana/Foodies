import fs from "node:fs";
import path from "node:path";
import sql from "better-sqlite3";
import slugify from "slugify";

const DB_PATH = path.join(process.cwd(), "meals.db");
const JSON_PATH = path.join(process.cwd(), "data", "meals.json");
const IMAGES_IN_DIR = path.join(process.cwd(), "public", "images");
const IMAGES_OUT_DIR = path.join(process.cwd(), "public", "images");

if (!fs.existsSync(JSON_PATH)) {
  console.error("Missing data/meals.json");
  process.exit(1);
}
if (!fs.existsSync(IMAGES_OUT_DIR)) {
  fs.mkdirSync(IMAGES_OUT_DIR, { recursive: true });
}

const db = sql(DB_PATH);

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

const rows = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
if (!Array.isArray(rows)) {
  console.error("data/meals.json must be an array");
  process.exit(1);
}

function assertIntInRange(n, min, max, field) {
  const v = Number(n);
  if (!Number.isFinite(v) || !Number.isInteger(v) || v < min || v > max) {
    throw new Error(`Invalid ${field}: ${n}`);
  }
  return v;
}

function assertPositiveInt(n, field) {
  const v = Number(n);
  if (!Number.isFinite(v) || !Number.isInteger(v) || v <= 0) {
    throw new Error(`Invalid ${field}: ${n}`);
  }
  return v;
}

function jsonStringifyArray(value, field) {
  if (!Array.isArray(value)) {
    throw new Error(`${field} must be an array`);
  }
  return JSON.stringify(value);
}

function copyImageToPublic(slug, imageFile) {
  if (!imageFile) throw new Error(`Missing imageFile for "${slug}"`);

  const src = path.join(IMAGES_IN_DIR, imageFile);
  if (!fs.existsSync(src)) {
    throw new Error(`Image not found: ${src}`);
  }

  const ext = path.extname(imageFile).replace(".", "") || "jpg";
  const outName = `${slug}.${ext}`;
  const dest = path.join(IMAGES_OUT_DIR, outName);

  fs.copyFileSync(src, dest);

  return `/images/${outName}`;
}

const insert = db.prepare(`
  INSERT INTO meals
    (title, ingredients, instructions, image, cooking_time, categories, servings, creator, creator_email, slug)
  VALUES
    (@title, @ingredients, @instructions, @image, @cooking_time, @categories, @servings, @creator, @creator_email, @slug)
`);

const upsertMode = true;

const tx = db.transaction((items) => {
  for (const item of items) {
    const title = String(item.title || "").trim();
    if (!title) throw new Error("Missing title");

    const slug = slugify(title, { lower: true });

    const cooking_time = assertPositiveInt(item.cooking_time, "cooking_time");
    const servings = assertIntInRange(item.servings ?? 1, 1, 20, "servings");

    const creator = String(item.creator || "Admin").trim();
    const creator_email = String(
      item.creator_email || "admin@example.com",
    ).trim();

    const image = copyImageToPublic(slug, item.imageFile);

    const mealRow = {
      title,
      slug,
      image,
      cooking_time,
      servings,
      creator,
      creator_email,
      ingredients: jsonStringifyArray(item.ingredients ?? [], "ingredients"),
      instructions: jsonStringifyArray(item.instructions ?? [], "instructions"),
      categories: jsonStringifyArray(item.categories ?? [], "categories"),
    };

    try {
      insert.run(mealRow);
      console.log(`✓ inserted ${slug}`);
    } catch (e) {
      if (upsertMode && String(e.message).includes("UNIQUE")) {
        console.log(`↷ skipped (exists) ${slug}`);
      } else {
        throw e;
      }
    }
  }
});

try {
  tx(rows);
  console.log(`Done. Processed ${rows.length} recipes.`);
} catch (e) {
  console.error("Import failed:", e.message);
  process.exit(1);
}
