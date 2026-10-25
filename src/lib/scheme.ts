// Bulk schemes: "buy 20, get 5 free". Set per product in Admin > Products (scheme_buy / scheme_free).
// Used by the cart, the order (server) and every badge, so the maths is the same everywhere.

type HasScheme = { scheme_buy?: number | null; scheme_free?: number | null };

export const hasScheme = (p: HasScheme) => (p.scheme_buy ?? 0) > 0 && (p.scheme_free ?? 0) > 0;

/** Free pieces earned for a paid quantity: every full "buy" block earns "free" pieces. */
export const freeQty = (qty: number, p: HasScheme) =>
  hasScheme(p) ? Math.floor(qty / p.scheme_buy!) * p.scheme_free! : 0;

/** Paid pieces still needed to unlock the next free block (0 when there is no scheme). */
export const toNextFree = (qty: number, p: HasScheme) =>
  hasScheme(p) ? p.scheme_buy! - (qty % p.scheme_buy!) : 0;

export const schemeLabel = (p: HasScheme) => `Buy ${p.scheme_buy} Get ${p.scheme_free} Free`;
