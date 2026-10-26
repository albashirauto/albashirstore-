// Shared by Admin > Coupons (list + editor).
export type Coupon = {
  id: string; code: string; description: string | null; kind: "percent" | "fixed" | "free_shipping"; value: number; min_order: number;
  max_discount: number | null; starts_at: string | null; ends_at: string | null; usage_limit: number | null; per_customer_limit: number | null;
  first_order_only: boolean; active: boolean; created_at?: string; updated_at?: string | null;
};
export type Use = { coupon_code: string; discount: number; total: number; status: string; created_at: string };

const rs = (n: number) => `Rs. ${Math.round(n).toLocaleString("en-PK")}`;

/** "10% off (max Rs. 300)" / "Rs. 200 off" / "Free delivery" */
export const offer = (c: Pick<Coupon, "kind" | "value" | "max_discount">) =>
  c.kind === "percent" ? `${Number(c.value)}% off${c.max_discount ? ` (max ${rs(c.max_discount)})` : ""}` : c.kind === "fixed" ? `${rs(c.value)} off` : "Free delivery";

/** Plain-English rules for the editor and list. */
export const rules = (c: Coupon) => [
  Number(c.min_order) > 0 && `orders over ${rs(c.min_order)}`,
  c.first_order_only && "first order only",
  c.per_customer_limit && `${c.per_customer_limit}× per customer`,
  c.usage_limit && `${c.usage_limit} uses in total`,
  c.ends_at && `until ${new Date(c.ends_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}`,
].filter(Boolean) as string[];

export type CouponState = "active" | "scheduled" | "expired" | "used_up" | "off";
export const couponState = (c: Coupon, uses: number, now = Date.now()): CouponState =>
  !c.active ? "off" : c.starts_at && new Date(c.starts_at).getTime() > now ? "scheduled" : c.ends_at && new Date(c.ends_at).getTime() < now ? "expired" : c.usage_limit && uses >= c.usage_limit ? "used_up" : "active";
export const STATE_STYLE: Record<CouponState, { l: string; cls: string }> = {
  active: { l: "Active", cls: "bg-green-100 text-green-800" }, scheduled: { l: "Scheduled", cls: "bg-purple-100 text-purple-800" },
  expired: { l: "Expired", cls: "bg-soft text-muted" }, used_up: { l: "Used up", cls: "bg-amber-100 text-amber-800" }, off: { l: "Off", cls: "bg-hot/10 text-hot" },
};
/** sold, not given back */
export const counts = (u: Use) => u.status !== "cancelled" && u.status !== "returned";
