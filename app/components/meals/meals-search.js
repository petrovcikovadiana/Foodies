"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import classes from "./meals-search.module.css";

export default function MealsSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const qParam = searchParams.get("q") || "";
  const [q, setQ] = useState(qParam);

  useEffect(() => setQ(qParam), [qParam]);

  function onSubmit(e) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    const value = q.trim();
    if (value) params.set("q", value);
    else params.delete("q");

    const url = params.toString() ? `/meals?${params.toString()}` : "/meals";
    router.push(url);
  }

  function clear() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("q");
    const url = params.toString() ? `/meals?${params.toString()}` : "/meals";
    router.push(url);
  }

  return (
    <form onSubmit={onSubmit} className={classes.searchForm}>
      <input
        type="search"
        placeholder="Search meals "
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className={classes.searchBar}
      />
      <button type="submit" className={classes.searchBtn}>
        Search
      </button>
      {qParam && (
        <button type="button" onClick={clear} className={classes.searchBtn}>
          Clear
        </button>
      )}
    </form>
  );
}
