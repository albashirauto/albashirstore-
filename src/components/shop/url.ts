export type SP = {
  category?: string; brand?: string; vehicle?: string; sort?: string; q?: string;
  price?: string; stock?: string; sale?: string; scheme?: string; page?: string;
};

export const PER_PAGE = 20;

export const SORTS = [
  { v: "newest", l: "Newest first" },
  { v: "price-asc", l: "Price: low to high" },
  { v: "price-desc", l: "Price: high to low" },
  { v: "name", l: "Name A–Z" },
];

export const PRICES = [
  { v: "0-1000", l: "Under Rs. 1,000" },
  { v: "1000-3000", l: "Rs. 1,000 – 3,000" },
  { v: "3000-7000", l: "Rs. 3,000 – 7,000" },
  { v: "7000-", l: "Over Rs. 7,000" },
];

/** "1000-3000" -> 1000 <= price <= 3000; "7000-" has no upper limit */
export const inPrice = (price: number, range?: string) => {
  if (!range) return true;
  const [a, b] = range.split("-");
  return price >= Number(a || 0) && (!b || price <= Number(b));
};

/** Same listing URL with some params changed. undefined/"" removes a param. Any change other than `page` goes back to page 1. */
export function buildHref(basePath: string, sp: SP, patch: Partial<SP>) {
  const usp = new URLSearchParams();
  Object.entries({ ...sp, page: undefined, ...patch }).forEach(([k, v]) => { if (v && !(k === "page" && v === "1")) usp.set(k, String(v)); });
  const s = usp.toString();
  return s ? `${basePath}?${s}` : basePath;
}
