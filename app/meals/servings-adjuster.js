"use client";

import { useMemo, useState } from "react";
import classes from "./servings.module.css";

function roundSmart(n) {
  if (!Number.isFinite(n)) return "";
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

function isGroupFormat(ingredients) {
  return (
    Array.isArray(ingredients) &&
    ingredients.length > 0 &&
    ingredients[0] &&
    typeof ingredients[0] === "object" &&
    Array.isArray(ingredients[0].items)
  );
}

export default function ServingsAdjuster({ baseServings = 1, ingredients }) {
  const [servings, setServings] = useState(baseServings);
  const factor = baseServings > 0 ? servings / baseServings : 1;

  const scaled = useMemo(() => {
    if (!ingredients) return [];

    if (isGroupFormat(ingredients)) {
      return ingredients.map((group) => {
        const items = (group.items || []).map((ing) => {
          if (typeof ing === "string") return ing;

          const amountNum = Number(ing.amount);
          const hasAmount = Number.isFinite(amountNum);

          return {
            ...ing,
            amount: hasAmount ? amountNum * factor : ing.amount,
          };
        });

        return {
          title: group.title ?? "",
          items,
        };
      });
    }

    return (ingredients || []).map((ing) => {
      if (typeof ing === "string") return ing;

      const amountNum = Number(ing.amount);
      const hasAmount = Number.isFinite(amountNum);

      return {
        ...ing,
        amount: hasAmount ? amountNum * factor : ing.amount,
      };
    });
  }, [ingredients, factor]);

  const increase = () => setServings((s) => Math.min(s + 1, 20));
  const decrease = () => setServings((s) => Math.max(s - 1, 1));

  const renderIngredient = (ing) => {
    if (typeof ing === "string") return ing;

    const amount =
      ing.amount != null && ing.amount !== ""
        ? roundSmart(Number(ing.amount))
        : null;

    const unit = ing.unit ? String(ing.unit).trim() : null;
    const name = ing.name ? String(ing.name).trim() : null;

    return [amount, unit, name].filter(Boolean).join(" ");
  };

  return (
    <div>
      <div className={classes.servings}>
        <label className={classes.label}>Serves</label>

        <div className={classes.controls}>
          <button
            type="button"
            onClick={decrease}
            disabled={servings === 1}
            className={classes.button}
          >
            −
          </button>

          <span className={classes.value}>{servings}</span>

          <button
            type="button"
            onClick={increase}
            disabled={servings === 20}
            className={classes.button}
          >
            +
          </button>
        </div>
      </div>
      {isGroupFormat(ingredients) ? (
        <div className={classes.groupWrap}>
          {scaled.map((group, gi) => (
            <div key={gi} className={classes.group}>
              {group.title ? (
                <div className={classes.groupTitle}>{group.title}</div>
              ) : null}

              <ul className={classes.list}>
                {(group.items || []).map((ing, i) => (
                  <li key={i}>{renderIngredient(ing)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className={classes.list}>
          {scaled.map((ing, i) => (
            <li key={i}>{renderIngredient(ing)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
