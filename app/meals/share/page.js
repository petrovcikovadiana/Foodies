"use client";

import ImagePicker from "@/app/components/meals/image-picker";
import classes from "./page.module.css";
import { shareMeal } from "@/lib/action";
import MealsFormSubmit from "@/app/components/meals/meals-form-submit";
import { useFormState } from "react-dom";
import { useState } from "react";

export default function ShareMealPage() {
  const [state, formAction] = useFormState(shareMeal, { message: null });

  const [instructions, setInstructions] = useState(["1) "]);

  const handleInstructionsChange = (event, index) => {
    const newInstructions = [...instructions];
    newInstructions[index] = event.target.value;
    setInstructions(newInstructions);
  };

  const handleKeyDown = (event, index) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const nextStepNumber = instructions.length + 1;
      setInstructions([...instructions, `${nextStepNumber}) `]);
    }
  };

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
                placeholder="Enter your name"
                required
              />
            </p>
            <p>
              <label htmlFor="email">Your email</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
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
              placeholder="Enter recipe name"
              required
            />
          </p>
          <p>
            <label htmlFor="summary">Short Summary</label>
            <input type="text" id="summary" name="summary" required />
          </p>
          <p>
            <label htmlFor="instructions">Ingredients</label>
            {instructions.map((instruction, index) => (
              <textarea
                key={index}
                value={instruction}
                onChange={(event) => handleInstructionsChange(event, index)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                name="instructions"
                rows="3"
                placeholder="List all ingredients with quantities"
              ></textarea>
            ))}
          </p>
          <p>
            <label htmlFor="instructions">Instructions</label>
            {instructions.map((instruction, index) => (
              <textarea
                key={index}
                value={instruction}
                onChange={(event) => handleInstructionsChange(event, index)}
                onKeyDown={(event) => handleKeyDown(event, index)}
                name="instructions"
                rows="3"
              ></textarea>
            ))}
          </p>
          <ImagePicker label="Your image" name="image" />{" "}
          {state.messaage && <p>{state.message}</p>}
          <p className={classes.actions}>
            <MealsFormSubmit />{" "}
          </p>
        </form>
      </main>
    </>
  );
}
