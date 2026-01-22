import Link from "next/link";
import Image from "next/image";

import classes from "./meal-item.module.css";

export default function MealItem({ title, slug, image, summary }) {
  return (
    <article>
      <header className={classes.meal}>
        <Link href={`/meals/${slug}`}>
          {" "}
          <div className={classes.image}>
            <Image src={image} alt={title} fill />
          </div>
        </Link>
      </header>
      <div className={classes.headerText}>
        <h2>{title}</h2>
      </div>
      <div className={classes.content}>
        <p className={classes.summary}>{summary}</p>
        {/* <div className={classes.actions}>
          <Link href={`/meals/${slug}`}>View Details</Link>
        </div> */}
      </div>
    </article>
  );
}
