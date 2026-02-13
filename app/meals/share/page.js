"use client";

import ImagePicker from "@/app/components/meals/image-picker";
import classes from "./page.module.css";
import { shareMeal } from "@/lib/action";
import MealsFormSubmit from "@/app/components/meals/meals-form-submit";
import { useFormState } from "react-dom";
import { useState, useRef } from "react";

import { FaRegTrashAlt } from "react-icons/fa";

export default function ShareMealPage() {
  const [state, formAction] = useFormState(shareMeal, { message: null });

  const instructionRefs = useRef([]);

  const UNIT_GROUPS = [
    {
      label: "Weight",
      options: [
        { value: "mg", label: "mg" },
        { value: "g", label: "g" },
        { value: "kg", label: "kg" },
      ],
    },
    {
      label: "Volume",
      options: [
        { value: "ml", label: "ml" },
        { value: "l", label: "l" },
      ],
    },
    {
      label: "Spoons",
      options: [
        { value: "tsp", label: "tsp" },
        { value: "tbsp", label: "tbsp" },
        { value: "pinch", label: "pinch" },
      ],
    },
    {
      label: "Pieces",
      options: [
        { value: "pcs", label: "pcs" },
        { value: "cup", label: "cup" },
        { value: "pack", label: "pack" },
      ],
    },
  ];

  const formatIngredient = (ing) => {
    const amount = ing.amount?.toString().trim();
    const unit = ing.unit;
    const name = ing.name?.trim();
    return [amount, unit, name].filter(Boolean).join(" ");
  };

  const [ingredientGroups, setIngredientGroups] = useState([
    {
      title: "",
      items: [{ amount: "", unit: "g", name: "" }],
    },
  ]);

  const addGroup = () => {
    setIngredientGroups((prev) => [
      ...prev,
      { title: "", items: [{ amount: "", unit: "g", name: "" }] },
    ]);
  };

  const removeGroup = (gIndex) => {
    setIngredientGroups((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== gIndex),
    );
  };

  const updateGroupTitle = (gIndex, value) => {
    setIngredientGroups((prev) =>
      prev.map((g, i) => (i === gIndex ? { ...g, title: value } : g)),
    );
  };

  const addIngredientToGroup = (gIndex) => {
    setIngredientGroups((prev) =>
      prev.map((g, i) =>
        i === gIndex
          ? { ...g, items: [...g.items, { amount: "", unit: "g", name: "" }] }
          : g,
      ),
    );
  };

  const removeIngredientFromGroup = (gIndex, index) => {
    setIngredientGroups((prev) =>
      prev.map((g, i) => {
        if (i !== gIndex) return g;
        if (g.items.length === 1) return g;
        return { ...g, items: g.items.filter((_, j) => j !== index) };
      }),
    );
  };

  const handleIngredientChange = (gIndex, index, field, value) => {
    setIngredientGroups((prev) =>
      prev.map((g, i) => {
        if (i !== gIndex) return g;

        const items = g.items.map((ing, j) =>
          j === index ? { ...ing, [field]: value } : ing,
        );

        return { ...g, items };
      }),
    );
  };

  const [instructions, setInstructions] = useState([""]);

  const handleInstructionsChange = (event, index) => {
    const value = event.target.value;

    setInstructions((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const addInstruction = () => {
    setInstructions((prev) => {
      const next = [...prev, ""];
      return next;
    });

    setTimeout(() => {
      const index = instructionRefs.current.length - 1;
      const el = instructionRefs.current[index];
      if (el) el.focus();
    }, 0);
  };

  const removeInstruction = (index) => {
    setInstructions((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index),
    );
  };

  const categoryOptions = [
    { label: "Main Dishes", value: "main_dishes" },
    { label: "Breakfast", value: "breakfast" },
    { label: "Dinner", value: "dinner" },
    { label: "Desserts", value: "desserts" },
    { label: "Snack", value: "snack" },
    { label: "Drinks", value: "drinks" },
  ];

  const servingsOptions = Array.from({ length: 20 }, (_, i) => i + 1);

  return (
    <>
      <header className={classes.header}>
        <h1>
          Share your <span className={classes.highlight}>favorite meal</span>
        </h1>
        <p>Or any other meal you feel needs sharing!</p>
      </header>
      <main className={classes.main}>
        <form className={classes.form} action={formAction}>
          <div className={classes.row}>
            <p>
              <label htmlFor="name">Your name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Your name"
                required
              />
            </p>
            <p>
              <label htmlFor="email">Your email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Your email"
                required
              />
            </p>
          </div>
          <p>
            <label htmlFor="title">Recipe Name</label>
            <input
              type="text"
              id="title"
              name="title"
              placeholder="Recipe name"
              required
            />
          </p>
          <p className={classes.listField}>
            <label>Ingredients</label>

            {ingredientGroups.map((group, gIndex) => (
              <div key={gIndex} className={classes.groupBox}>
                <div className={classes.groupHeader}>
                  <input
                    type="text"
                    value={group.title}
                    onChange={(e) => updateGroupTitle(gIndex, e.target.value)}
                    placeholder="Name of section"
                    className={classes.groupTitleInput}
                    name="ingredient_group_title"
                  />

                  <button
                    type="button"
                    className={classes.iconButton}
                    onClick={() => removeGroup(gIndex)}
                    disabled={ingredientGroups.length === 1}
                    title="Remove group"
                    aria-label="Remove group"
                  >
                    <FaRegTrashAlt />
                  </button>
                </div>

                {group.items.map((ingredient, index) => (
                  <div key={index} className={classes.listRow}>
                    <input
                      type="number"
                      className={classes.amountInput}
                      value={ingredient.amount}
                      placeholder="1"
                      onChange={(e) =>
                        handleIngredientChange(
                          gIndex,
                          index,
                          "amount",
                          e.target.value,
                        )
                      }
                      name={`ingredient_amount_${gIndex}[]`}
                      min="0"
                      step="any"
                      aria-label="Amount"
                    />

                    <select
                      className={classes.addButton}
                      value={ingredient.unit}
                      onChange={(e) =>
                        handleIngredientChange(
                          gIndex,
                          index,
                          "unit",
                          e.target.value,
                        )
                      }
                      name={`ingredient_unit_${gIndex}[]`}
                      aria-label="Unit"
                    >
                      {UNIT_GROUPS.map((group) => (
                        <optgroup key={group.label} label={group.label}>
                          {group.options.map((u) => (
                            <option key={u.value} value={u.value}>
                              {u.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>

                    <textarea
                      className={classes.listTextarea}
                      value={ingredient.name}
                      placeholder="Ingredient"
                      onChange={(e) =>
                        handleIngredientChange(
                          gIndex,
                          index,
                          "name",
                          e.target.value,
                        )
                      }
                      name={`ingredient_name_${gIndex}[]`}
                      rows="1"
                      maxLength={60}
                      aria-label="Ingredient name"
                    />

                    <button
                      type="button"
                      className={classes.iconButton}
                      onClick={() => removeIngredientFromGroup(gIndex, index)}
                      disabled={group.items.length === 1}
                      title="Remove ingredient"
                      aria-label="Remove ingredient"
                    >
                      <FaRegTrashAlt />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className={classes.addButton}
                  onClick={() => addIngredientToGroup(gIndex)}
                >
                  + Add ingredient
                </button>
              </div>
            ))}

            <button
              type="button"
              className={classes.addButton}
              onClick={addGroup}
            >
              + Add section (Dough / Filling / ...)
            </button>
          </p>
          <p className={classes.listField}>
            <label htmlFor="instructions">Instructions</label>

            {instructions.map((instruction, index) => (
              <div key={index} className={classes.listRow}>
                <textarea
                  className={classes.listTextarea}
                  value={instruction}
                  ref={(el) => (instructionRefs.current[index] = el)}
                  onChange={(event) => handleInstructionsChange(event, index)}
                  name="instructions"
                  placeholder="Instructions"
                  rows="3"
                />
                <button
                  type="button"
                  className={classes.iconButton}
                  onClick={() => removeInstruction(index)}
                  disabled={instructions.length === 1}
                  title="Remove step"
                  aria-label="Remove step"
                >
                  <FaRegTrashAlt />
                </button>
              </div>
            ))}

            <button
              type="button"
              className={classes.addButton}
              onClick={addInstruction}
            >
              + Add step
            </button>
          </p>
          <p>
            <label htmlFor="cooking_time">Cooking time</label>
            <input
              type="time"
              id="cooking_time"
              name="cooking_time"
              className={classes.cooking_time}
              step="60"
              required
            />
          </p>
          <div className={classes.row}>
            <p>
              <label htmlFor="servings">Serves</label>
              <select
                id="servings"
                name="servings"
                required
                className={classes.addButton}
              >
                {servingsOptions.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </p>
          </div>
          <div className={classes.row}>
            <p>
              <label htmlFor="price_min_usd">Price (min) USD / serving</label>
              <input
                type="number"
                id="price_min_usd"
                name="price_min_usd"
                placeholder="e.g. 2.50"
                min="0"
                step="0.01"
                inputMode="decimal"
              />
            </p>

            <p>
              <label htmlFor="price_max_usd">Price (max) USD / serving</label>
              <input
                type="number"
                id="price_max_usd"
                name="price_max_usd"
                placeholder="e.g. 6.00"
                min="0"
                step="0.01"
                inputMode="decimal"
              />
            </p>
          </div>
          <div className={classes.categories}>
            <label className={classes.label}>Categories</label>

            <div className={classes.categoryButtons}>
              {categoryOptions.map((cat) => (
                <label
                  key={cat.value}
                  className={`${classes.categoryButton} ${classes[`cat_${cat.value}`]}`}
                >
                  <input
                    className={classes.categoryCheckbox}
                    type="checkbox"
                    name="categories"
                    value={cat.value}
                  />
                  <span>{cat.label}</span>
                </label>
              ))}
            </div>
          </div>
          <ImagePicker label="Your image" name="image" />{" "}
          {state.message && <p>{state.message}</p>}
          <p className={classes.actions}>
            <MealsFormSubmit />{" "}
          </p>
        </form>
      </main>
    </>
  );
}
