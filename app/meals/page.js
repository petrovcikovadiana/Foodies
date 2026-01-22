import Link from "next/link";
import classes from "./page.module.css";
import MealsGrid from "../components/meals/meals-grid";
import { getMeals } from "@/lib/meals";
import { Suspense } from "react";

export const metadata = {
  title: "All Meals",
  description: "Browse the delicious meals shared by our vibrant community.",
};

async function Meals() {
  const meals = await getMeals();
  return <MealsGrid meals={meals} />;
}

export default function MealsPage() {
  return (
    <>
      <header className={classes.header}>
        {/* <h1>
          Delicious meals, created{" "}
          <span className={classes.highlight}>by you</span>{" "}
        </h1> */}
        <p>
          <input
            type="search"
            id="search"
            name="search"
            placeholder="Search"
            className={classes.search}
          />
        </p>{" "}
        <p className={classes.cta}>
          <Link href="/meals/share">Share your favourite recipe</Link>
        </p>
      </header>
      <main className={classes.main}>
        <Suspense
          fallback={<p className={classes.loading}>Fetching meals...</p>}
        >
          {" "}
          <Meals />
        </Suspense>
      </main>
    </>
  );
}
