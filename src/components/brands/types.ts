import type { Brand } from "@/lib/types";

/** A brand plus what we stock from it, worked out on the server from the product list. */
export type BrandInfo = Brand & {
  count: number;
  cats: string[];
  top: { name: string; slug: string; price: number }[];
};
