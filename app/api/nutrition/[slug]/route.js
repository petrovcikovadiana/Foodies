import { NextResponse } from "next/server";
import { getMeal } from "@/lib/meals";
import sql from "better-sqlite3";
import { computeNutritionFromIngredients } from "@/lib/nutrition";

const db = sql("meals.db");

export async function GET(_req, { params }) {
  const slug = params.slug;
  const meal = getMeal(slug);
  if (!meal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // cache (napr. 7 dní)
  const cached = db
    .prepare(
      "SELECT data_json, updated_at FROM nutrition_cache WHERE meal_slug = ?",
    )
    .get(slug);

  const now = Date.now();
  const TTL = 7 * 24 * 60 * 60 * 1000;

  if (cached && now - Number(cached.updated_at) < TTL) {
    return NextResponse.json(JSON.parse(cached.data_json));
  }

  const apiKey = process.env.FDC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Missing FDC_API_KEY in env" },
      { status: 500 },
    );
  }

  const data = await computeNutritionFromIngredients(
    meal.ingredients,
    meal.servings ?? 1,
    apiKey,
  );

  db.prepare(
    `
    INSERT OR REPLACE INTO nutrition_cache (meal_slug, data_json, updated_at)
    VALUES (?, ?, ?)
  `,
  ).run(slug, JSON.stringify(data), now);

  return NextResponse.json(data);
}
