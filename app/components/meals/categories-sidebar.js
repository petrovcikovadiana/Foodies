"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import classes from "./categories-sidebar.module.css";

import { MdKeyboardArrowRight } from "react-icons/md";
import { MdKeyboardArrowDown } from "react-icons/md";

const CATEGORY_OPTIONS = [
  { label: "Main Dishes", value: "main_dishes" },
  { label: "Breakfast", value: "breakfast" },
  { label: "Dinner", value: "dinner" },
  { label: "Desserts", value: "desserts" },
  { label: "Snack", value: "snack" },
  { label: "Drinks", value: "drinks" },
];

export default function CategoriesSidebar() {
  const sp = useSearchParams();
  const category = sp.get("category") || "";
  const q = sp.get("q") || "";

  const [open, setOpen] = useState(false);

  const allHref = useMemo(() => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const s = params.toString();
    return s ? `/meals?${s}` : "/meals";
  }, [q]);

  const catHref = (value) => {
    const params = new URLSearchParams();
    if (value) params.set("category", value);
    if (q) params.set("q", q);
    return `/meals?${params.toString()}`;
  };

  return (
    <aside className={classes.sidebar}>
      <Link
        href={allHref}
        className={!category ? classes.active : classes.link}
        style={{
          "--cat-bg": "var(--cat-all-bg)",
          "--cat-border": "var(--cat-all-border)",
          "--cat-text": "var(--cat-all-text)",
        }}
      >
        All
      </Link>

      <button
        type="button"
        className={classes.toggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          "--pill-bg": "var(--cat-all-bg)",
          "--pill-border": "var(--cat-all-border)",
          "--pill-text": "var(--cat-all-text)",
        }}
      >
        Categories
        <span className={classes.chev}>
          {open ? <MdKeyboardArrowDown /> : <MdKeyboardArrowRight />}
        </span>
      </button>

      {open && (
        <div className={classes.list}>
          {CATEGORY_OPTIONS.map((c) => {
            const isActive = category === c.value;
            return (
              <Link
                key={c.value}
                href={catHref(c.value)}
                className={isActive ? classes.active : classes.link}
                style={{
                  "--cat-bg": `var(--cat-${c.value}-bg)`,
                  "--cat-border": `var(--cat-${c.value}-border)`,
                  "--cat-text": `var(--cat-${c.value}-text)`,
                }}
              >
                {c.label}
              </Link>
            );
          })}
        </div>
      )}
    </aside>
  );
}
