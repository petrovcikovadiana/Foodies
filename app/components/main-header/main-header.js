import Link from "next/link";

import logoImg from "@/assets/icons/icon.svg";
import classes from "./main-header.module.css";
import Image from "next/image";
import MainHeaderBackground from "./main-header-background";
import NavLink from "./nav-link";

export default function MainHeader() {
  return (
    <>
      {/* <MainHeaderBackground /> */}
      <header className={classes.header}>
        <Link className={classes.logo} href="/">
          <Image src={logoImg} alt="A plate with food on it" priority />
          GrandFood
        </Link>{" "}
        <nav className={classes.nav}>
          <ul>
            <li>
              <NavLink href="/meals">Browse Recipes</NavLink>
            </li>
            <li>
              <NavLink href="/meals/share">Share recipe</NavLink>
            </li>
            <li>
              <NavLink href="/community">About</NavLink>
            </li>
          </ul>
        </nav>
      </header>
    </>
  );
}
