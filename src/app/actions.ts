"use server";

import { hasSupabase, serverClient } from "@/lib/supabase";
import { getSettings } from "@/lib/data";
import { demoProducts } from "@/lib/demo";
import { freeQty } from "@/lib/scheme";
import { parseKey } from "@/lib/stock";
import type { Product } from "@/lib/types";
import { PAY_METHODS } from "@/lib/receipt";

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
  /** jazzcash | easypaisa | bank */
  payment_method?: string;
  /** transaction id the customer got after paying (optional) */
  payment_ref?: string;
};

export type OrderResult = {
  ok: boolean; orderNo?: number | string; message?: string;
  /** what the server actually charged, for the receipt */
  receipt?: { lines: { name: string; qty: number; price: number; free: number }[]; subtotal: number; shipping: number; total: number };
};

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

/** Product review from the product page. Checked and saved by the database (submit_review, migration 018); waits for approval. */
export async function submitReview(input: { productId: string; name: string; phone: string; city?: string; rating: number; title?: string; body: string }) {
  if (!hasSupabase) return { ok: false, message: "Reviews work once the store is connected to the database." };
  const { data, error } = await serverClient().rpc("submit_review", {
    p_product: input.productId, p_name: input.name, p_phone: input.phone, p_city: input.city ?? "", p_rating: Math.round(input.rating), p_title: input.title ?? "", p_body: input.body,
  });
  if (error) return { ok: false, message: "Could not send your review. Please try again." };
  return data === "ok" ? { ok: true, message: "Thank you! Your review will appear after we check it." } : { ok: false, message: String(data) };
}

/** Prices are re-read from the database here, so the browser can never set its own price. */
export async function placeOrder(input: OrderInput): Promise<OrderResult> {
  const name = input.name?.trim(), phone = input.phone?.trim(), address = input.address?.trim();
  if (!name || !phone || !address) return { ok: false, message: "Please fill in your name, phone and address." };
  if (!/^[+\d][\d\s-]{8,}$/.test(phone)) return { ok: false, message: "Enter a valid phone number." };
  if (!input.items?.length) return { ok: false, message: "Your cart is empty." };

  const settings = await getSettings();
  const flat = Number(settings.shipping_flat || 400);

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
  const shipping = flat;
  const total = subtotal + shipping;

  const method = PAY_METHODS.some((m) => m.key === input.payment_method) ? input.payment_method! : null;
  if (!method) return { ok: false, message: "Choose how you will pay." };
  const ref = input.payment_ref?.trim().slice(0, 60) || null;
  const receipt = { lines: lines.map(({ name, qty, price, free }) => ({ name, qty, price, free })), subtotal, shipping, total };

  if (!hasSupabase) return { ok: true, orderNo: `DEMO-${Date.now().toString().slice(-5)}`, receipt };

  const id = crypto.randomUUID();
  const cut = (s?: string) => s?.trim().slice(0, 80) || null;
  const row = { id, customer_name: name, phone, email: input.email || null, province: cut(input.province), district: cut(input.district), city: cut(input.city), address, note: input.note || null, items: lines, subtotal, shipping, total, payment_method: method };
  let { error } = await serverClient().from("orders").insert({ ...row, payment_ref: ref });
  // database not upgraded yet (no payment_ref column): still save the order, keep the TID in the note
  if (error?.message.includes("payment_ref")) ({ error } = await serverClient().from("orders").insert({ ...row, note: [row.note, ref && `TID: ${ref}`].filter(Boolean).join(" · ") || null }));
  if (error) return { ok: false, message: "We could not save your order. Please call us to order." };
  return { ok: true, orderNo: id.slice(0, 8).toUpperCase(), receipt };
}
