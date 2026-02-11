import classes from "./page.module.css";

import { getMeal } from "@/lib/meals";
import { notFound } from "next/navigation";
import { MdAccessTime } from "react-icons/md";
import { PiForkKnife } from "react-icons/pi";
import ServingsAdjuster from "../servings-adjuster";

import Image from "next/image";
import NutritionTable from "@/app/components/nutrition-table";

export async function generateMetadata({ params }) {
  const meal = await getMeal(params.mealSlug);

  if (!meal) return { title: "Meal not found" };

  return {
    title: meal.title,
    description: meal.summary ?? "",
  };
}

export default async function MealDetailsPage({ params }) {
  const meal = await getMeal(params.mealSlug);
  if (!meal) {
    notFound();
  }
  //calculate cooking time
  function formatMinutes(total) {
    const n = Number(total);
    if (!Number.isFinite(n) || n <= 0) return "";

    const h = Math.floor(n / 60);
    const m = n % 60;

    if (h === 0) return `${m} min`;
    if (m === 0) return `${h} h`;
    return `${h} h ${m} min`;
  }

  return (
    <div className={classes.wrapper}>
      <header className={classes.header}>
        <div className={classes.headerText}>
          <div>
            {" "}
            <h1>{meal.title}</h1>
            <p className={classes.creator}>by {meal.creator}</p>
          </div>
        </div>
      </header>

      <main className={classes.main}>
        <div className={classes.nutrition}>
          <div className={classes.image}>
            <div className={classes.imageMedia}>
              <Image src={meal.image} alt={meal.title} fill />
            </div>

            <div className={classes.info}>
              <div className={classes.cooking_time}>
                <MdAccessTime />
                <p>Cooking time</p>
                <p>{formatMinutes(meal.cooking_time)}</p>
              </div>
              <div className={classes.verticalDivider} />

              <div className={classes.cooking_time}>
                <PiForkKnife /> <p>Serves</p>
                <span> {meal.servings ?? 1}</span>
              </div>
            </div>
          </div>

          <NutritionTable slug={meal.slug} />
        </div>

        <section className={classes.ingredients}>
          <h2>Ingredients</h2>

          <div className={classes.ingredientsCard}>
            <ServingsAdjuster
              baseServings={meal.servings ?? 1}
              ingredients={meal.ingredients}
            />
          </div>
        </section>

        <section className={classes.instructions}>
          <h2>Instructions</h2>
          <ol className={classes.instructionsList}>
            {meal.instructions.map((step, i) => (
              <li key={i} className={classes.instructionItem}>
                <span className={classes.stepIndex}>{i + 1}</span>
                <p>{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
    </div>
  );
}
