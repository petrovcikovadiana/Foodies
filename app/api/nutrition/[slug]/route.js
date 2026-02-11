import { NextResponse } from "next/server";
import { getMeal } from "@/lib/meals";
import {
  computeNutritionFromIngredients,
  getNutritionCache,
  setNutritionCache,
} from "@/lib/nutrition";

export const runtime = "nodejs";

export async function GET(_req, { params }) {
  try {
    const slug = params.slug;

    const meal = await getMeal(slug);
    if (!meal) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // cache TTL 7 dní
    const cached = await getNutritionCache(slug);
    const TTL = 7 * 24 * 60 * 60 * 1000;

    if (cached?.updated_at) {
      const age = Date.now() - new Date(cached.updated_at).getTime();
      if (age < TTL) {
        return NextResponse.json(cached.data);
      }
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

    await setNutritionCache(slug, data);

    return NextResponse.json(data);
  } catch (e) {
    console.error("nutrition route error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
