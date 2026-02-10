import sql from "better-sqlite3";

const db = sql("meals.db");

const FDC_BASE = "https://api.nal.usda.gov/fdc/v1";

function toGrams(amount, unit, ingredientNorm) {
  const a = Number(amount);
  if (!Number.isFinite(a) || a <= 0) return null;

  const u = (unit || "").trim();

  if (u === "mg") return a / 1000;
  if (u === "g") return a;
  if (u === "kg") return a * 1000;

  if (u === "ml") return a;
  if (u === "l") return a * 1000;

  if (u === "tsp") return a * 5;
  if (u === "tbsp") return a * 15;
  if (u === "pinch") return a * 0.3;

  if (u === "pcs") {
    const row = db
      .prepare(
        "SELECT grams_per_piece FROM piece_weights WHERE ingredient_norm = ?",
      )
      .get(ingredientNorm);
    if (!row) return null;
    return a * Number(row.grams_per_piece);
  }

  return null;
}

function normName(name) {
  return String(name || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
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
      "User-Agent": "Foodies/1.0 (local dev)",
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

    if (name.includes("energy") && (unit === "kcal" || unit === "kj")) {
      if (unit === "kcal") out.kcal_100g = val;
    }

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

    const grams = toGrams(ing.amount, ing.unit, nameNorm);
    if (!grams) {
      total.unknown.push({
        ...ing,
        reason: "Neviem prepočítať jednotku na gramy (pcs/lyžice bez váhy).",
      });
      continue;
    }

    const mapped = db
      .prepare("SELECT fdc_id FROM ingredient_map WHERE ingredient_norm = ?")
      .get(nameNorm);

    let fdcId = mapped?.fdc_id;

    if (!fdcId) {
      const search = await fdcSearch(nameNorm, apiKey);
      const hit = search?.foods?.[0];
      if (!hit?.fdcId) {
        total.unknown.push({ ...ing, reason: "Nenašlo sa v USDA databáze." });
        continue;
      }
      fdcId = hit.fdcId;

      db.prepare(
        "INSERT OR REPLACE INTO ingredient_map (ingredient_norm, fdc_id, note) VALUES (?, ?, ?)",
      ).run(nameNorm, fdcId, `auto-match: ${hit.description || ""}`);
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

  const perServing = {
    kcal: total.kcal / safeServings,
    protein_g: total.protein_g / safeServings,
    carbs_g: total.carbs_g / safeServings,
    fat_g: total.fat_g / safeServings,
    fiber_g: total.fiber_g / safeServings,
    salt_g: salt_g / safeServings,
  };

  const perRecipe = {
    kcal: total.kcal,
    protein_g: total.protein_g,
    carbs_g: total.carbs_g,
    fat_g: total.fat_g,
    fiber_g: total.fiber_g,
    salt_g,
  };

  return { perRecipe, perServing, unknown: total.unknown };
}
