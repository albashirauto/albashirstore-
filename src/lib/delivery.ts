// Delivery charge rules (Admin > Settings > Delivery & payments). Used by checkout, the cart and placeOrder,
// so the browser and the server always work out the same charge.
//   shipping_flat       default charge (Rs.)
//   shipping_free_over  free delivery when the parts total reaches this (empty = never)
//   shipping_zones      JSON [{ province, district?, city?, fee, days? }]: the most specific match wins
//   pickup_enabled      "yes" = customers may collect from the shop for free; pickup_note = what to tell them
type S = Record<string, string | undefined>;
export type Zone = { province: string; district?: string; city?: string; fee: number; days?: string };
export type Place = { province?: string | null; district?: string | null; city?: string | null };

export function parseZones(raw?: string): Zone[] {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v) ? v.filter((z) => z && z.province && Number.isFinite(Number(z.fee))).map((z) => ({ ...z, fee: Math.max(0, Number(z.fee)) })) : [];
  } catch { return []; }
}

const same = (a?: string | null, b?: string | null) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/** The zone for a place: city beats district beats province. */
export function zoneFor(zones: Zone[], p: Place): Zone | undefined {
  const score = (z: Zone) =>
    !same(z.province, p.province) ? -1
    : z.city ? (same(z.city, p.city) && (!z.district || same(z.district, p.district)) ? 3 : -1)
    : z.district ? (same(z.district, p.district) ? 2 : -1)
    : 1;
  return zones.map((z) => ({ z, s: score(z) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s)[0]?.z;
}

export type DeliveryQuote = {
  fee: number; base: number; free: boolean; pickup: boolean;
  /** "Okara district", "Punjab", "Rest of Pakistan" */
  area: string; days?: string;
  /** free-delivery threshold and what is still missing (0 = reached) */
  freeOver: number | null; missing: number;
};

export function deliveryQuote(s: S, place: Place, subtotal: number, pickup = false): DeliveryQuote {
  const flat = Math.max(0, Number(s.shipping_flat || 400));
  const freeOver = Number(s.shipping_free_over) > 0 ? Number(s.shipping_free_over) : null;
  if (pickup && s.pickup_enabled === "yes") return { fee: 0, base: 0, free: true, pickup: true, area: "Collect from shop", freeOver, missing: 0 };
  const z = place.province ? zoneFor(parseZones(s.shipping_zones), place) : undefined;
  const base = z ? z.fee : flat;
  const missing = freeOver ? Math.max(0, freeOver - subtotal) : 0;
  const free = !!freeOver && missing === 0;
  const area = z ? (z.city ? z.city : z.district ? `${z.district} district` : z.province) : place.province ? "Rest of Pakistan" : "All Pakistan";
  return { fee: free ? 0 : base, base, free, pickup: false, area, days: z?.days, freeOver, missing };
}

/** Lowest and highest delivery charge, for "Delivery from Rs. 150" in the cart. */
export function feeRange(s: S) {
  const fees = [Math.max(0, Number(s.shipping_flat || 400)), ...parseZones(s.shipping_zones).map((z) => z.fee)];
  return { min: Math.min(...fees), max: Math.max(...fees) };
}
