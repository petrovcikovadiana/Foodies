"use client";
import { useEffect, useState } from "react";
import classes from "./nutrition-table.module.css";

function r(n, digits = 1) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "–";
  return x.toFixed(digits);
}

export default function NutritionTable({ slug }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`/api/nutrition/${slug}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ error: true }));
  }, [slug]);

  if (!data) return <p>Calculating nutrition values…</p>;
  if (data.error) return <p>Failed to load nutrition values.</p>;

  const p = data.perServing;

  return (
    <section className={classes.paper}>
      <header className={classes.header}>
        <h3 className={classes.title}>Estimated nutrition</h3>
        <span className={classes.badge}>1 serving</span>
      </header>

      <table className={classes.table}>
        <tbody>
          <tr>
            <td className={classes.label}>Energy</td>
            <td className={classes.value}>{r(p.kcal, 0)} kcal</td>
          </tr>
          <tr>
            <td className={classes.label}>Protein</td>
            <td className={classes.value}>{r(p.protein_g)} g</td>
          </tr>
          <tr>
            <td className={classes.label}>Carbs</td>
            <td className={classes.value}>{r(p.carbs_g)} g</td>
          </tr>
          <tr>
            <td className={classes.label}>Fat</td>
            <td className={classes.value}>{r(p.fat_g)} g</td>
          </tr>
          <tr>
            <td className={classes.label}>Fiber</td>
            <td className={classes.value}>{r(p.fiber_g)} g</td>
          </tr>
          <tr>
            <td className={classes.label}>Salt</td>
            <td className={classes.value}>{r(p.salt_g)} g</td>
          </tr>
        </tbody>
      </table>

      {data.unknown?.length ? (
        <p className={classes.note}>
          Some ingredients could not be calculated.
        </p>
      ) : null}
    </section>
  );
}
