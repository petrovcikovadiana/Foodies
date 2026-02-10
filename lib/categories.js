export const CATEGORY_OPTIONS = [
  { label: "Main Dishes", value: "main_dishes" },
  { label: "Breakfast", value: "breakfast" },
  { label: "Dinner", value: "dinner" },
  { label: "Desserts", value: "desserts" },
  { label: "Snack", value: "snack" },
  { label: "Drinks", value: "drinks" },
];

export function categoryClass(value) {
  return `cat_${value}`;
}
