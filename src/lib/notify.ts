// SERVER ONLY. Builds and sends the notification emails (Admin > Notifications) through the shop's Gmail.
// Events come from the database (supabase/014_notifications.sql) via /api/notify.
import nodemailer from "nodemailer";
import { adminClient } from "./supabaseAdmin";
import { money } from "./format";
import { placeLine } from "./pk-places";
import { payLabel } from "./receipt";
import { SITE_URL } from "./seo";
import type { Kind } from "./notify-kinds";

export { KINDS, type Kind } from "./notify-kinds";

type Mail = { subject: string; title: string; rows: [string, string][]; lines?: string[]; link: string; linkLabel: string; tone: string };
type Item = { name: string; qty: number; price: number; free?: number };

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const no = (id: string) => id.slice(0, 8).toUpperCase();
const STATUS: Record<string, { word: string; tone: string }> = {
  confirmed: { word: "confirmed", tone: "#1d4fd8" }, shipped: { word: "dispatched", tone: "#7c3aed" }, delivered: { word: "delivered", tone: "#16a34a" },
  cancelled: { word: "cancelled", tone: "#e11d2e" }, returned: { word: "returned", tone: "#d97706" }, new: { word: "set back to new", tone: "#64748b" },
};

/** What to send for one event, or null if the order / product is gone. */
async function compose(db: ReturnType<typeof adminClient>, kind: Kind, id: string): Promise<Mail | null> {
  if (kind === "review") {
    const { data: r } = await db.from("product_reviews").select("*, product:products(name,slug)").eq("id", id).maybeSingle();
    if (!r) return null;
    return {
      subject: `${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)} New review: ${r.product?.name ?? "a product"}`,
      title: "New review waiting", tone: r.rating >= 4 ? "#16a34a" : r.rating === 3 ? "#d97706" : "#e11d2e",
      rows: [["Product", r.product?.name ?? "—"], ["Rating", `${r.rating} of 5`], ["From", `${r.name}${r.city ? `, ${r.city}` : ""}`], ["Phone", r.phone ?? "—"], ["Verified buyer", r.verified ? "Yes" : "No"]],
      lines: [r.title ? `“${r.title}”` : "", r.body].filter(Boolean),
      link: `${SITE_URL}/admin/reviews`, linkLabel: "Approve or reject",
    };
  }
  if (kind === "part_request") {
    const { data: r } = await db.from("part_requests").select("*").eq("id", id).maybeSingle();
    if (!r) return null;
    return {
      subject: `🔎 Part request: ${r.part}${r.vehicle ? ` (${r.vehicle})` : ""}`,
      title: "A customer needs a part", tone: "#d97706",
      rows: [["Part", r.part], ["Bike / vehicle", r.vehicle ?? "—"], ["Name", r.name], ["Phone", r.phone], ["City", r.city ?? "—"]],
      lines: [r.details ?? "", "Call them with stock and price, then mark it in admin."].filter(Boolean),
      link: `${SITE_URL}/admin/requests/${r.id}`, linkLabel: "Open the request",
    };
  }
  if (kind === "wholesale") {
    const { data: w } = await db.from("wholesale_enquiries").select("*").eq("id", id).maybeSingle();
    if (!w) return null;
    return {
      subject: `🤝 Wholesale enquiry: ${w.business || w.name}${w.city ? `, ${w.city}` : ""}`,
      title: "New wholesale enquiry", tone: "#1d4fd8",
      rows: [["Name", w.name], ["Business", w.business ?? "—"], ["Type", w.business_type ?? "—"], ["Phone", w.phone], ["City", w.city ?? "—"], ["Wants", w.interests ?? "—"], ["Monthly order", w.volume ?? "—"]],
      lines: [w.message ?? "", "Call them back soon. Mark it Contacted in admin when you do."].filter(Boolean),
      link: `${SITE_URL}/admin/wholesale/${w.id}`, linkLabel: "Open the enquiry",
    };
  }
  if (kind === "stock") {
    const { data: p } = await db.from("products").select("id,name,sku,stock,slug").eq("id", id).maybeSingle();
    if (!p) return null;
    const { data: c } = await db.from("product_costs").select("reorder_level").eq("product_id", id).maybeSingle();
    const out = (p.stock ?? 0) <= 0;
    return {
      subject: out ? `⛔ Out of stock: ${p.name}` : `⚠️ Low stock: ${p.name} (${p.stock} left)`,
      title: out ? "Out of stock" : "Low stock", tone: out ? "#e11d2e" : "#d97706",
      rows: [["Product", p.name], ["SKU", p.sku ?? "—"], ["Stock now", String(p.stock ?? 0)], ["Alert level", String(c?.reorder_level ?? 5)]],
      lines: [out ? "Customers now see this part as sold out." : "Order more soon so it doesn't run out."],
      link: `${SITE_URL}/admin/products`, linkLabel: "Open products",
    };
  }

  const { data: o } = await db.from("orders").select("*").eq("id", id).maybeSingle();
  if (!o) return null;
  const n = no(o.id);
  const items = ((o.items as Item[]) ?? []).map((i) => `${i.qty} × ${i.name}${i.free ? ` (+${i.free} free)` : ""} · ${money(i.price * i.qty)}`);
  const customer: [string, string][] = [["Customer", o.customer_name], ["Phone", o.phone], ["City", placeLine(o) || "—"]];
  const link = `${SITE_URL}/admin/orders`;

  if (kind === "new_order") {
    return {
      subject: `🛒 New order #${n} · ${money(o.total)} · ${o.customer_name}${o.city ? ` (${o.city})` : ""}`,
      title: `New order #${n}`, tone: "#16a34a", link, linkLabel: "Open orders",
      rows: [...customer, ["Address", o.address], ["Payment", `${payLabel(o.payment_method)}${o.payment_ref ? ` · TID ${o.payment_ref}` : " · not paid yet"}`],
        ["Subtotal", money(o.subtotal)], ...(Number(o.discount) > 0 ? [["Discount", `−${money(Number(o.discount))}${o.coupon_code ? ` (${o.coupon_code})` : ""}`] as [string, string]] : []), ["Delivery", money(o.shipping)], ["Total", money(o.total)], ...(o.note ? [["Note", o.note] as [string, string]] : [])],
      lines: items,
    };
  }
  if (kind === "payment") {
    return {
      subject: `💰 Payment confirmed · #${n} · ${money(o.total)}`, title: `Payment confirmed #${n}`, tone: "#16a34a", link, linkLabel: "Open orders",
      rows: [...customer, ["Method", payLabel(o.payment_method)], ["TID", o.payment_ref ?? "—"], ["Total", money(o.total)]],
    };
  }
  const s = STATUS[o.status] ?? { word: o.status, tone: "#64748b" };
  const extra: [string, string][] = o.status === "shipped" ? [["Courier", o.courier ?? "—"], ["Tracking no.", o.tracking_no ?? "—"]]
    : ["cancelled", "returned"].includes(o.status) && o.status_reason ? [["Reason", o.status_reason]] : [];
  return {
    subject: `📦 Order #${n} ${s.word}${o.status === "shipped" && o.courier ? ` · ${o.courier}${o.tracking_no ? ` ${o.tracking_no}` : ""}` : ""} · ${o.customer_name}`,
    title: `Order #${n} ${s.word}`, tone: s.tone, link, linkLabel: "Open orders",
    rows: [...customer, ...extra, ["Total", money(o.total)], ["Payment", o.payment_status === "paid" ? "Paid" : "Not paid yet"]],
    lines: items,
  };
}

function html(m: Mail, store: string) {
  return `<!doctype html><html><body style="margin:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;color:#0f172a">
<div style="max-width:560px;margin:0 auto;padding:24px 12px">
  <div style="background:#0a1f66;color:#fff;border-radius:16px 16px 0 0;padding:18px 22px;font-weight:700;font-size:15px">${esc(store)}</div>
  <div style="background:#fff;border-radius:0 0 16px 16px;padding:22px">
    <div style="display:inline-block;background:${m.tone};color:#fff;border-radius:999px;padding:4px 12px;font-size:12px;font-weight:700">${esc(m.title)}</div>
    <table style="width:100%;border-collapse:collapse;margin-top:16px;font-size:14px">
      ${m.rows.map(([k, v]) => `<tr><td style="padding:7px 0;color:#64748b;width:120px;vertical-align:top">${esc(k)}</td><td style="padding:7px 0;font-weight:600">${esc(v)}</td></tr>`).join("")}
    </table>
    ${m.lines?.length ? `<div style="margin-top:14px;border-top:1px solid #e2e8f0;padding-top:12px;font-size:14px;line-height:1.7">${m.lines.map(esc).join("<br>")}</div>` : ""}
    <a href="${esc(m.link)}" style="display:inline-block;margin-top:20px;background:#1d4fd8;color:#fff;text-decoration:none;border-radius:999px;padding:11px 22px;font-weight:700;font-size:14px">${esc(m.linkLabel)} →</a>
  </div>
  <p style="text-align:center;color:#94a3b8;font-size:12px;margin-top:14px">Sent by your store. Change who gets these in Admin → Notifications.</p>
</div></body></html>`;
}

const text = (m: Mail) => [m.title, "", ...m.rows.map(([k, v]) => `${k}: ${v}`), ...(m.lines?.length ? ["", ...m.lines] : []), "", `${m.linkLabel}: ${m.link}`].join("\n");

export async function sendMail(user: string, pass: string, to: string[], m: Mail, store: string) {
  const t = nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass } });
  await t.sendMail({ from: { name: store, address: user }, to, subject: m.subject, text: text(m), html: html(m, store) });
}

/** Handle one database event. Returns how many people were emailed. */
export async function deliver(kind: Kind, id: string) {
  const db = adminClient();
  const [{ data: cfg }, { data: people }, { data: name }] = await Promise.all([
    db.from("notify_config").select("gmail_user,gmail_password").eq("id", 1).maybeSingle(),
    db.from("notify_recipients").select("email").eq("active", true).contains("events", [kind]),
    db.from("settings").select("value").eq("key", "store_name").maybeSingle(),
  ]);
  const to = (people ?? []).map((p) => p.email);
  if (!to.length) return 0;
  if (!cfg?.gmail_user || !cfg.gmail_password) throw new Error("Sender Gmail is not set up yet (Admin > Notifications).");
  const m = await compose(db, kind, id);
  if (!m) return 0;
  await sendMail(cfg.gmail_user, cfg.gmail_password, to, m, name?.value || "Al Bashir Autos");
  return to.length;
}

export const testMail = (store: string): Mail => ({
  subject: `✅ Test email from ${store}`, title: "Notifications are working", tone: "#16a34a",
  rows: [["Store", store], ["Sent at", new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })]],
  lines: ["If you can read this, the shop can email you about orders, payments and stock."],
  link: `${SITE_URL}/admin/notifications`, linkLabel: "Notification settings",
});
