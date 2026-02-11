import Link from "next/link";
import classes from "./page.module.css";
import logoImg from "@/assets/background-hero.png";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <header className={classes.header}></header>
      <main>
        {" "}
        <div>
          <div className={classes.hero}>
            <div className={classes.imageWrapper}>
              <Image
                src={logoImg}
                alt="A plate with food on it"
                priority
                fill
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </div>
            <div className={classes.heroText}>
              <h1>Discover Delicious Recipes</h1>
              <p>Taste & share food from all over the world.</p>
              <div className={classes.cta}>
                <Link href="/meals">Browse recipes</Link>
              </div>
            </div>
          </div>
        </div>
      </main>{" "}
    </>
  );
}
