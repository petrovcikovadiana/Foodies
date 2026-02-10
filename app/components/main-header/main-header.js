"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

import logoImg from "@/assets/icons/icon.svg";
import classes from "./main-header.module.css";
import NavLink from "./nav-link";

export default function MainHeader() {
  const [open, setOpen] = useState(false);

  function toggle() {
    setOpen((p) => !p);
  }

  function close() {
    setOpen(false);
  }

  return (
    <header className={classes.header}>
      <Link className={classes.logo} href="/" onClick={close}>
        <Image src={logoImg} alt="A plate with food on it" priority />
        GrandFood
      </Link>

      <button
        type="button"
        className={classes.menuButton}
        onClick={toggle}
        aria-label="Open menu"
        aria-expanded={open}
      >
        <span className={classes.burger} />
      </button>

      <nav className={`${classes.nav} ${open ? classes.open : ""}`}>
        <ul>
          <li>
            <NavLink href="/meals" onClick={close}>
              Browse Recipes
            </NavLink>
          </li>
          <li>
            <NavLink href="/meals/share" onClick={close}>
              Share recipe
            </NavLink>
          </li>
        </ul>
      </nav>

      {open && <div className={classes.backdrop} onClick={close} />}
    </header>
  );
}
