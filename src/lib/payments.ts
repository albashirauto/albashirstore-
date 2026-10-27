// Which payment methods the store offers, and the cash-on-delivery rules (Admin > Settings > Delivery & payments).
// When cash on delivery is off, nothing on the store mentions it: checkout hides it and {{tokens}} in pages and FAQs drop it.
import { money } from "./format";
import { PAY_METHODS, type PayMethod } from "./receipt";
import type { Faq, Settings } from "./types";

const num = (v?: string) => Math.max(0, Number(String(v ?? "").replace(/[^\d.]/g, "")) || 0);

export const codOn = (s: Settings) => s.cod_enabled === "yes";
/** extra charge for cash on delivery (0 = none) */
export const codFee = (s: Settings) => (codOn(s) ? num(s.cod_fee) : 0);
/** biggest order total allowed on cash on delivery (0 = no limit) */
export const codMax = (s: Settings) => num(s.cod_max);
/** why cash on delivery can't be used for this total, or "" */
export const codBlocked = (s: Settings, total: number) => (codMax(s) && total > codMax(s) ? `Cash on delivery is for orders up to ${money(codMax(s))}. Please pay online for this order.` : "");

export const methodsFor = (s: Settings) => PAY_METHODS.filter((m) => m.key !== "cod" || codOn(s));
export const isMethod = (s: Settings, k?: string | null): k is PayMethod => methodsFor(s).some((m) => m.key === k);

const list = (words: string[]) => (words.length < 2 ? words.join("") : `${words.slice(0, -1).join(", ")} or ${words.at(-1)}`);
/** "cash on delivery, JazzCash, Easypaisa or bank transfer" */
export const payWords = (s: Settings) => list(methodsFor(s).map((m) => (m.key === "cod" ? "cash on delivery" : m.key === "bank" ? "bank transfer" : m.label)));

function codRules(s: Settings) {
  return [
    codFee(s) ? `A cash on delivery charge of ${money(codFee(s))} is added at checkout.` : "",
    codMax(s) ? `Available on orders up to ${money(codMax(s))}.` : "",
  ].filter(Boolean).join(" ");
}

/**
 * Fill the payment tokens the shop can use in Pages and FAQs:
 *   {{payment_methods}}  the methods that are on now
 *   {{cod_terms}}        (alone in a list item) cash-on-delivery terms, or the whole item disappears when it is off
 */
export function fillPayment(html: string, s: Settings) {
  const cod = codOn(s)
    ? `<li><strong>Cash on delivery:</strong> pay the rider in cash when your parcel arrives. ${codRules(s)} Please keep the exact amount ready.</li><li>Refusing a cash on delivery parcel without a good reason may mean we ask for payment in advance on your next order.</li>`
    : "";
  return html
    .replace(/<li>\s*(?:<p>)?\s*\{\{\s*cod_terms\s*\}\}\s*(?:<\/p>)?\s*<\/li>/g, cod)
    .replace(/\{\{\s*cod_terms\s*\}\}/g, "")
    .replace(/\{\{\s*payment_methods\s*\}\}/g, payWords(s));
}

/** FAQs with tokens filled, plus a cash-on-delivery answer right after the payment question when it is on. */
export function faqsFor(items: Faq[], s: Settings): Faq[] {
  const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
  const out = items.map((f) => ({ ...f, question: cap(fillPayment(f.question, s)), answer: cap(fillPayment(f.answer, s)) }));
  if (!codOn(s)) return out;
  const cod: Faq = { id: "auto-cod", topic: "orders", question: "Can I pay cash on delivery?", answer: `Yes. Choose Cash on delivery at checkout and pay the rider when your parcel arrives. ${codRules(s)}`.trim() };
  const at = out.findIndex((f) => /payment/i.test(f.question));
  return at < 0 ? [cod, ...out] : [...out.slice(0, at + 1), cod, ...out.slice(at + 1)];
}
