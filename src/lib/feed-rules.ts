import type { Product } from "./types";

/** Why a product is left out of the Google / Facebook feed, or null if it goes in. */
export const feedSkip = (p: Pick<Product, "active" | "price" | "images">) => (!p.active ? "hidden" : !(Number(p.price) > 0) ? "no price" : !p.images?.length ? "no photo" : null);
