type StockLike = { stock?: number | null; stock_status?: string | null; show_stock?: boolean | null };

/** Sold out? A manual "In stock / Out of stock" choice beats the stock number. */
export const isOut = (p: StockLike) =>
  p.stock_status === "out_of_stock" ? true : p.stock_status === "in_stock" ? false : (p.stock ?? 1) <= 0;

/** "Only 3 left" badge: only when following the number, showing stock is allowed, and 5 or fewer left. */
export const lowLeft = (p: StockLike) =>
  (p.stock_status ?? "auto") === "auto" && p.show_stock !== false && p.stock !== undefined && p.stock !== null && p.stock > 0 && p.stock <= 5 ? p.stock : 0;

/** Cart / order line key: product id, plus "~index" when a variant was chosen. */
export const lineKey = (productId: string, variant?: number | null) => (variant === null || variant === undefined ? productId : `${productId}~${variant}`);
export const parseKey = (key: string) => {
  const [id, v] = key.split("~");
  return { id, variant: v === undefined ? null : Number(v) };
};
