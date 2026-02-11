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
