export const UNIT_LABELS_CS = {
  mg: "mg",
  g: "g",
  kg: "kg",
  ml: "ml",
  l: "l",

  ks: "ks",
  pcs: "ks",

  pinch: "špetka",
  tsp: "lžička",
  tbsp: "lžíce",

  oz: "oz",
  lb: "lb",
  pack: "balení",
  bar: "kostka",
};

export function unitToCs(unit) {
  const u = (unit ?? "").toString().trim();
  return UNIT_LABELS_CS[u] ?? u;
}
