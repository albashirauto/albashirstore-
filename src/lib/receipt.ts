// Plain-text receipt for WhatsApp (customer -> shop after checkout, shop -> customer from admin).

export const PAY_METHODS = [
  { key: "jazzcash", label: "JazzCash" },
  { key: "easypaisa", label: "Easypaisa" },
  { key: "bank", label: "Bank transfer" },
] as const;
export type PayMethod = (typeof PAY_METHODS)[number]["key"];
export const payLabel = (k?: string | null) => PAY_METHODS.find((m) => m.key === k)?.label ?? (k ? k.replace(/\b\w/g, (c) => c.toUpperCase()) : "Not chosen");

type Line = { name: string; qty: number; price: number; free?: number };
const rs = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-PK")}`;

export function receiptText(o: {
  orderNo: string; name: string; phone: string; city?: string | null; address: string;
  lines: Line[]; subtotal: number; shipping: number; total: number; discount?: number; coupon?: string | null;
  method?: string | null; ref?: string | null; paid?: boolean; store: string;
}) {
  const items = o.lines.map((l, i) => `${i + 1}. ${l.name} × ${l.qty}${l.free ? ` (+${l.free} free)` : ""} = ${rs(l.price * l.qty)}`).join("\n");
  return [
    `*${o.store}: Order receipt*`,
    `Order #${o.orderNo}`,
    "",
    items,
    "",
    `Subtotal: ${rs(o.subtotal)}`,
    ...(o.discount ? [`Discount${o.coupon ? ` (${o.coupon})` : ""}: -${rs(o.discount)}`] : []),
    `Delivery: ${o.shipping ? rs(o.shipping) : "FREE"}`,
    `*Total: ${rs(o.total)}*`,
    "",
    `Payment: ${payLabel(o.method)}${o.ref ? ` · TID ${o.ref}` : ""}${o.paid ? " · PAID" : ""}`,
    `Deliver to: ${o.name}, ${o.phone}`,
    `${o.address}${o.city ? `, ${o.city}` : ""}`,
  ].join("\n");
}
