"use server";

import { hasSupabase, serverClient } from "@/lib/supabase";
import { getSettings } from "@/lib/data";
import { demoProducts } from "@/lib/demo";
import { freeQty } from "@/lib/scheme";
import { parseKey } from "@/lib/stock";
import type { Product } from "@/lib/types";
import { codBlocked, codFee, isMethod } from "@/lib/payments";
import { deliveryQuote } from "@/lib/delivery";

/** Cart key (product id, optionally ~variant index) -> order line with the real database price. */
function toLine(p: Product | undefined, key: string, qtyIn: number) {
  if (!p) return [];
  const { variant } = parseKey(key);
  const v = variant !== null ? p.variants?.[variant] : undefined;
  if (variant !== null && !v) return [];
  const qty = Math.max(1, Math.min(999, qtyIn));
  return [{ id: p.id, name: v ? `${p.name} (${v.name})` : p.name, variant: v?.name ?? null, price: Number(v?.price ?? p.price), qty, free: freeQty(qty, p) }];
}

export async function subscribe(_prev: unknown, form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, message: "Enter a valid email address." };
  if (hasSupabase) {
    const { error } = await serverClient().from("newsletter").insert({ email });
    if (error && !error.message.includes("duplicate")) return { ok: false, message: "Could not subscribe. Please try again." };
  }
  return { ok: true, message: "You're in! Watch your inbox for deals." };
}

export type OrderInput = {
  name: string; phone: string; email?: string; province?: string; district?: string; city?: string; address: string; note?: string;
  items: { id: string; qty: number }[];
  /** cod (when on in Settings) | jazzcash | easypaisa | bank */
  payment_method?: string;
  /** transaction id the customer got after paying (optional) */
  payment_ref?: string;
  /** coupon code (checked again here) */
  coupon?: string;
  /** collect from the shop instead of delivery (only when the shop allows it) */
  pickup?: boolean;
};

export type OrderResult = {
  ok: boolean; orderNo?: number | string; message?: string;
  /** what the server actually charged, for the receipt */
  receipt?: { lines: { name: string; qty: number; price: number; free: number }[]; subtotal: number; shipping: number; total: number; discount?: number; coupon?: string | null };
};

export type CouponQuote = { ok: boolean; message?: string; code?: string; kind?: string; discount?: number; free_shipping?: boolean; description?: string };

/** Checkout "Apply" button. The same check runs again in placeOrder, so the browser can never set its own discount. */
export async function checkCoupon(code: string, subtotal: number, phone = ""): Promise<CouponQuote> {
  const c = String(code ?? "").trim();
  if (!c) return { ok: false, message: "Enter a coupon code." };
  if (!hasSupabase) return { ok: false, message: "Coupons work once the store is connected to the database." };
  const { data, error } = await serverClient().rpc("coupon_quote", { p_code: c.slice(0, 40), p_subtotal: Math.max(0, Number(subtotal) || 0), p_phone: phone });
  if (error) return { ok: false, message: "Could not check the coupon. Please try again." };
  return data as CouponQuote;
}

export type Tracked = {
  no: string; name: string; city: string | null; status: string; reason: string | null;
  courier: string | null; tracking_no: string | null; payment_method: string | null; payment_status: string;
  total: number; items: { name: string; qty: number; free: number }[];
  created_at: string; dispatched_at: string | null; updated_at: string | null;
};

/** "Track my order": order number + phone must both match (checked in the database by track_order, migration 012). */
export async function trackOrder(no: string, phone: string): Promise<{ ok: boolean; order?: Tracked; message?: string }> {
  const n = String(no ?? "").replace(/[^0-9a-z]/gi, ""), p = String(phone ?? "").replace(/\D/g, "");
  if (n.length !== 8) return { ok: false, message: "Your order number has 8 letters and numbers, e.g. 3A9F1C02. It is on your receipt." };
  if (p.length < 10) return { ok: false, message: "Enter the phone number you used when ordering." };
  if (!hasSupabase) return { ok: false, message: "Order tracking works once the store is connected to the database." };
  const { data, error } = await serverClient().rpc("track_order", { p_no: n, p_phone: p });
  if (error) return { ok: false, message: "Could not check your order right now. Please try again or call us." };
  if (!data) return { ok: false, message: "No order found with that number and phone. Check both and try again." };
  return { ok: true, order: data as Tracked };
}

/** Checkout: keep the cart of someone who typed their phone, so the shop can follow up if they leave (Admin > Abandoned carts). */
export async function saveCart(input: { phone: string; name?: string; city?: string; items: { id: string; slug?: string; name: string; qty: number; price: number }[] }) {
  if (!hasSupabase || String(input.phone ?? "").replace(/\D/g, "").length < 10 || !input.items?.length) return;
  const items = input.items.slice(0, 50).map((i) => ({ id: String(i.id).slice(0, 80), slug: String(i.slug ?? "").slice(0, 120), name: String(i.name).slice(0, 160), qty: Math.max(1, Math.min(999, Number(i.qty) || 1)), price: Math.max(0, Number(i.price) || 0) }));
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
  await serverClient().rpc("save_cart", { p_phone: input.phone, p_name: input.name ?? "", p_city: input.city ?? "", p_items: items, p_subtotal: subtotal });
}

/** Product review from the product page. Checked and saved by the database (submit_review, migration 018); waits for approval. */
export async function submitReview(input: { productId: string; name: string; phone: string; city?: string; rating: number; title?: string; body: string }) {
  if (!hasSupabase) return { ok: false, message: "Reviews work once the store is connected to the database." };
  const { data, error } = await serverClient().rpc("submit_review", {
    p_product: input.productId, p_name: input.name, p_phone: input.phone, p_city: input.city ?? "", p_rating: Math.round(input.rating), p_title: input.title ?? "", p_body: input.body,
  });
  if (error) return { ok: false, message: "Could not send your review. Please try again." };
  return data === "ok" ? { ok: true, message: "Thank you! Your review will appear after we check it." } : { ok: false, message: String(data) };
}

/** Wholesale / dealer enquiry (/wholesale). Checked and saved by the database (submit_wholesale, migration 035). */
export async function submitWholesale(input: { name: string; business?: string; phone: string; city?: string; type?: string; interests?: string[]; volume?: string; message?: string }) {
  if (!hasSupabase) return { ok: false, message: "Enquiries work once the store is connected to the database." };
  const { data, error } = await serverClient().rpc("submit_wholesale", {
    p_name: input.name, p_business: input.business ?? "", p_phone: input.phone, p_city: input.city ?? "", p_type: input.type ?? "",
    p_interests: (input.interests ?? []).join(", "), p_volume: input.volume ?? "", p_message: input.message ?? "",
  });
  if (error) return { ok: false, message: "Could not send your enquiry. Please try again or WhatsApp us." };
  return data === "ok" ? { ok: true, message: "Thank you! We will call you within one working day." } : { ok: false, message: String(data) };
}

/** Prices are re-read from the database here, so the browser can never set its own price. */
export async function placeOrder(input: OrderInput): Promise<OrderResult> {
  const settings = await getSettings();
  const pickup = !!input.pickup && settings.pickup_enabled === "yes";
  const name = input.name?.trim(), phone = input.phone?.trim(), address = pickup ? (input.address?.trim() || "Collect from shop") : input.address?.trim();
  if (!name || !phone || !address) return { ok: false, message: "Please fill in your name, phone and address." };
  if (!/^[+\d][\d\s-]{8,}$/.test(phone)) return { ok: false, message: "Enter a valid phone number." };
  if (!input.items?.length) return { ok: false, message: "Your cart is empty." };


  // free = scheme pieces sent at no charge (worked out here from the database, never trusted from the browser)
  let lines: { id: string; name: string; variant: string | null; price: number; qty: number; free: number }[] = [];

  if (!hasSupabase) {
    lines = input.items.flatMap((i) => toLine(demoProducts.find((x) => x.id === parseKey(i.id).id), i.id, i.qty));
  } else {
    const db = serverClient();
    const { data, error } = await db.from("products").select("*").in("id", [...new Set(input.items.map((i) => parseKey(i.id).id))]);
    if (error) return { ok: false, message: "Could not read products. Please try again." };
    lines = input.items.flatMap((i) => toLine((data as Product[] | null)?.find((x) => x.id === parseKey(i.id).id && x.active), i.id, i.qty));
  }
  if (!lines.length) return { ok: false, message: "Those products are no longer available." };

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  // coupon: priced from the database subtotal, never from the browser
  let coupon: CouponQuote | null = null;
  if (input.coupon?.trim() && hasSupabase) {
    coupon = await checkCoupon(input.coupon, subtotal, phone);
    if (!coupon.ok) return { ok: false, message: coupon.message ?? "This coupon cannot be used." };
  }
  const discount = Math.min(subtotal, Math.max(0, Number(coupon?.discount ?? 0)));
  // delivery by area / free over / pickup: same rules as the checkout page (src/lib/delivery.ts)
  const method = isMethod(settings, input.payment_method) ? input.payment_method : null;
  if (!method) return { ok: false, message: "Choose how you will pay." };
  // cash on delivery charge is kept with the delivery charge on the order
  const shipping = (coupon?.free_shipping ? 0 : deliveryQuote(settings, input, subtotal, pickup).fee) + (method === "cod" ? codFee(settings) : 0);
  const total = subtotal - discount + shipping;
  if (method === "cod" && codBlocked(settings, total)) return { ok: false, message: codBlocked(settings, total) };
  const ref = input.payment_ref?.trim().slice(0, 60) || null;
  const receipt = { lines: lines.map(({ name, qty, price, free }) => ({ name, qty, price, free })), subtotal, shipping, total, discount, coupon: coupon?.code ?? null };

  if (!hasSupabase) return { ok: true, orderNo: `DEMO-${Date.now().toString().slice(-5)}`, receipt };

  const id = crypto.randomUUID();
  const cut = (s?: string) => s?.trim().slice(0, 80) || null;
  const row = { id, customer_name: name, phone, email: input.email || null, province: cut(input.province), district: cut(input.district), city: cut(input.city), address, note: input.note || null, items: lines, subtotal, shipping, total, payment_method: method, delivery_method: pickup ? "pickup" : "delivery", ...(coupon?.code ? { coupon_code: coupon.code, discount } : {}) };
  let { error } = await serverClient().from("orders").insert({ ...row, payment_ref: ref });
  // database not upgraded yet (no payment_ref column): still save the order, keep the TID in the note
  if (error?.message.includes("payment_ref")) ({ error } = await serverClient().from("orders").insert({ ...row, note: [row.note, ref && `TID: ${ref}`].filter(Boolean).join(" · ") || null }));
  if (error) return { ok: false, message: "We could not save your order. Please call us to order." };
  return { ok: true, orderNo: id.slice(0, 8).toUpperCase(), receipt };
}
