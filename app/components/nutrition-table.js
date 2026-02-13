"use client";
import classes from "./nutrition-table.module.css";

function r(n, digits = 1) {
  const x = Number(n);
  if (!Number.isFinite(x)) return "–";
  return x.toFixed(digits);
}

export default function NutritionTable({ perServing, unknown }) {
  if (!perServing) return <p>Nutrition data is not available.</p>;

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
            <td className={classes.value}>{r(perServing.kcal, 0)} kcal</td>
          </tr>
          <tr>
            <td className={classes.label}>Protein</td>
            <td className={classes.value}>{r(perServing.protein_g)} g</td>
          </tr>
          <tr>
            <td className={classes.label}>Carbs</td>
            <td className={classes.value}>{r(perServing.carbs_g)} g</td>
          </tr>
          <tr>
            <td className={classes.label}>Fat</td>
            <td className={classes.value}>{r(perServing.fat_g)} g</td>
          </tr>
          <tr>
            <td className={classes.label}>Fiber</td>
            <td className={classes.value}>{r(perServing.fiber_g)} g</td>
          </tr>
          <tr>
            <td className={classes.label}>Salt</td>
            <td className={classes.value}>{r(perServing.salt_g)} g</td>
          </tr>
        </tbody>
      </table>

      {unknown?.length ? (
        <p className={classes.note}>
          Some ingredients could not be calculated.
        </p>
      ) : null}
    </section>
  );
}
