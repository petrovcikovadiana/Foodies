"use server";

import { saveMeal, deleteMeal as deleteMealFromDb } from "./meals";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

function isInvalidText(text) {
  return !text || text.trim() === "";
}

function timeToMinutes(value) {
  // value is "HH:MM"
  if (typeof value !== "string") return NaN;
  const v = value.trim();
  if (!/^\d{2}:\d{2}$/.test(v)) return NaN;

  const [h, m] = v.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;

  return h * 60 + m;
}

// this function only executes in the server
export async function shareMeal(prevState, formData) {
  const groupTitles = formData
    .getAll("ingredient_group_title")
    .map((v) => String(v).trim());

  const ingredientGroups = groupTitles
    .map((title, gi) => {
      const amounts = formData
        .getAll(`ingredient_amount_${gi}[]`)
        .map((v) => String(v).trim());

      const units = formData
        .getAll(`ingredient_unit_${gi}[]`)
        .map((v) => String(v).trim());

      const names = formData
        .getAll(`ingredient_name_${gi}[]`)
        .map((v) => String(v).trim());

      const items = names
        .map((name, i) => {
          const amountRaw = amounts[i] ?? "";
          const unitRaw = units[i] ?? "";

          const amount =
            amountRaw === ""
              ? null
              : Number(String(amountRaw).replace(",", "."));

          return {
            amount: Number.isFinite(amount) ? amount : null,
            unit: unitRaw || null,
            name: name || null,
          };
        })
        .filter((ing) => ing.name && String(ing.name).trim());

      return {
        title: title || null,
        items,
      };
    })
    // delete blank sections
    .filter((g) => (g.title && g.title.trim()) || g.items.length > 0);

  const normalizedIngredientGroups = ingredientGroups.map((g) => ({
    title: g.title && g.title.trim() ? g.title.trim() : "Ingredients",
    items: g.items,
  }));

  const totalIngredients = normalizedIngredientGroups.reduce(
    (sum, g) => sum + g.items.length,
    0,
  );

  if (totalIngredients === 0) {
    return { message: "Please add at least one ingredient." };
  }

  const servingsRaw = formData.get("servings");
  const servings = Number(String(servingsRaw ?? "").trim());

  if (!Number.isInteger(servings) || servings < 1 || servings > 20) {
    return { message: "Please select a valid number of servings (1–20)." };
  }

  const instructionsArr = formData
    .getAll("instructions")
    .map((s) => String(s).trim())
    .filter((s) => s.trim());

  const categoriesArr = formData
    .getAll("categories")
    .map((s) => String(s).trim())
    .filter(Boolean);

  const cookingTimeRaw = formData.get("cooking_time");
  const cookingTime = timeToMinutes(String(cookingTimeRaw ?? ""));

  if (!Number.isFinite(cookingTime) || cookingTime <= 0) {
    return { message: "Please enter a valid cooking time." };
  }

  const meal = {
    title: formData.get("title"),
    ingredients: JSON.stringify(normalizedIngredientGroups),
    instructions: JSON.stringify(instructionsArr),
    image: formData.get("image"),
    cooking_time: cookingTime,
    categories: JSON.stringify(categoriesArr),
    servings,
    creator: formData.get("name"),
    creator_email: formData.get("email"),
  };

  if (
    isInvalidText(meal.title) ||
    isInvalidText(meal.instructions) ||
    isInvalidText(meal.creator) ||
    isInvalidText(meal.creator_email) ||
    !meal.creator_email.includes("@") ||
    !meal.image ||
    meal.image.size === 0
  ) {
    // if the input is missing or invalid, return an error message
    return {
      message: "Invalid input.",
    };
  }

  await saveMeal(meal);
  //   tells next to revalidate the page
  revalidatePath("/meals");
  revalidatePath(`/meals/${meal.slug}`);
  redirect("/meals");
}

export async function deleteMealAction(formData) {
  const slug = formData.get("slug");

  if (!slug) {
    return { message: "Chybí slug receptu." };
  }

  deleteMealFromDb(slug);

  revalidatePath("/meals");
  // redirect("/meals");

  return { message: null };
}
