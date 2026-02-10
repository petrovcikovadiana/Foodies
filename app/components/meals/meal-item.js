import Link from "next/link";
import Image from "next/image";
import { deleteMealAction } from "@/lib/action";
import { MdAccessTime } from "react-icons/md";

import classes from "./meal-item.module.css";

export default function MealItem({
  title,
  slug,
  image,
  cooking_time,
  categories,
}) {
  const cats = Array.isArray(categories)
    ? categories
    : String(categories || "")
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

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
    <article className={classes.card}>
      <header className={classes.meal}>
        <Link href={`/meals/${slug}`}>
          {" "}
          <div className={classes.image}>
            <Image src={image} alt={title} fill />
          </div>
        </Link>
        {/* --- DELETE BUTTON --- */}
        <form action={deleteMealAction}>
          <input type="hidden" name="slug" value={slug} />
          <button
            type="submit"
            className={classes.deleteButton}
            title="Delete recipe"
          >
            ×
          </button>
        </form>
      </header>
      <div className={classes.headerText}>
        <h2>{title}</h2>
      </div>
      <div className={classes.content}>
        <div className={classes.categories}>
          {cats.map((cat) => (
            <Link
              key={cat}
              href={`/meals?category=${cat}`}
              className={classes.categoryPill}
              style={{
                "--cat-bg": `var(--cat-${cat}-bg)`,
                "--cat-border": `var(--cat-${cat}-border)`,
                "--cat-text": `var(--cat-${cat}-text)`,
              }}
            >
              {cat.replaceAll("_", " ")}
            </Link>
          ))}
        </div>

        <div className={classes.cooking_time}>
          <p className={classes.time}>
            <MdAccessTime />
          </p>
          <p>{formatMinutes(cooking_time)}</p>
        </div>
      </div>
    </article>
  );
}
