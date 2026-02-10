import classes from "./page.module.css";
import MealsGrid from "../components/meals/meals-grid";
import { getMeals } from "@/lib/meals";
import { Suspense } from "react";
import MealsSearch from "../components/meals/meals-search";
import CategoriesSidebar from "../components/meals/categories-sidebar";

export const metadata = {
  title: "All Meals",
  description: "Browse the delicious meals shared by our vibrant community.",
};

const CATEGORY_OPTIONS = [
  { label: "Main Dishes", value: "main_dishes" },
  { label: "Breakfast", value: "breakfast" },
  { label: "Dinner", value: "dinner" },
  { label: "Desserts", value: "desserts" },
  { label: "Snack", value: "snack" },
  { label: "Drinks", value: "drinks" },
];

async function Meals({ category, q }) {
  const meals = await getMeals({ category, q });

  if (!meals || meals.length === 0) {
    const what = q ? `"${q}"` : "your filters";
    return <p className={classes.empty}>No meals found for {what}.</p>;
  }

  return <MealsGrid meals={meals} />;
}

export default function MealsPage({ searchParams }) {
  const category = searchParams?.category || "";
  const q = searchParams?.q || "";

  return (
    <main className={classes.main}>
      <MealsSearch />
      <div className={classes.meals}>
        <Suspense fallback={null}>
          <CategoriesSidebar />
        </Suspense>
        <div className={classes.mealsContent}>
          {" "}
          <Suspense
            fallback={<p className={classes.loading}>Fetching meals...</p>}
          >
            <Meals category={category} q={q} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
