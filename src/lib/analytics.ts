// Analytics + site verification IDs from Admin > Settings > Verification & analytics.
// Every ID is checked against its exact format before it is put in the page, so a bad paste can never inject code.

type S = Record<string, string | undefined>;

const PATTERNS = {
  ga4_id: /^G-[A-Z0-9]{4,20}$/,
  gtm_id: /^GTM-[A-Z0-9]{4,12}$/,
  meta_pixel_id: /^\d{6,20}$/,
  tiktok_pixel_id: /^[A-Z0-9]{10,30}$/,
  clarity_id: /^[a-z0-9]{6,20}$/,
  // verification "content" values: letters, digits and - _ only
  google_site_verification: /^[A-Za-z0-9_-]{10,100}$/,
  bing_verification: /^[A-Za-z0-9_-]{10,100}$/,
  yandex_verification: /^[A-Za-z0-9_-]{8,100}$/,
  pinterest_verification: /^[A-Za-z0-9_-]{8,100}$/,
  facebook_domain_verification: /^[A-Za-z0-9_-]{10,100}$/,
} as const;
export type TrackKey = keyof typeof PATTERNS;

/** People often paste the whole <meta …> tag: keep only the content="…" value. */
export const cleanId = (v: string) => {
  const m = v.match(/content=["']([^"']+)["']/i);
  return (m ? m[1] : v).trim();
};

/** The ID if it has the right format, otherwise null. */
export const validId = (s: S, k: TrackKey) => {
  const v = s[k] ? cleanId(s[k]!) : "";
  return v && PATTERNS[k].test(v) ? v : null;
};

/** Site verification <meta> tags for Next.js metadata. */
export function verificationMeta(s: S) {
  const other: Record<string, string> = {};
  const bing = validId(s, "bing_verification"), pin = validId(s, "pinterest_verification"), fb = validId(s, "facebook_domain_verification");
  if (bing) other["msvalidate.01"] = bing;
  if (pin) other["p:domain_verify"] = pin;
  if (fb) other["facebook-domain-verification"] = fb;
  const google = validId(s, "google_site_verification") ?? undefined, yandex = validId(s, "yandex_verification") ?? undefined;
  return google || yandex || Object.keys(other).length ? { google, yandex, other } : undefined;
}

// ---------------------------------------------------------------- events (browser)
type W = Window & { gtag?: (...a: unknown[]) => void; dataLayer?: unknown[]; fbq?: (...a: unknown[]) => void; ttq?: { track: (e: string, d?: unknown) => void } };

/** Send one shop event to whichever tools are installed (GA4 / GTM, Meta Pixel, TikTok). Safe to call when none are. */
export function track(event: "add_to_cart" | "begin_checkout" | "purchase", data: { value: number; items?: { id: string; name: string; price: number; qty: number }[]; orderNo?: string }) {
  if (typeof window === "undefined") return;
  const w = window as W;
  const items = data.items?.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.qty }));
  try {
    const ga = { currency: "PKR", value: data.value, items, ...(data.orderNo ? { transaction_id: data.orderNo } : {}) };
    if (w.gtag) w.gtag("event", event, ga);
    else w.dataLayer?.push({ event, ecommerce: ga });
    const meta = { add_to_cart: "AddToCart", begin_checkout: "InitiateCheckout", purchase: "Purchase" }[event];
    w.fbq?.("track", meta, { currency: "PKR", value: data.value, content_ids: data.items?.map((i) => i.id), content_type: "product" });
    const tt = { add_to_cart: "AddToCart", begin_checkout: "InitiateCheckout", purchase: "CompletePayment" }[event];
    w.ttq?.track(tt, { currency: "PKR", value: data.value, contents: data.items?.map((i) => ({ content_id: i.id, quantity: i.qty, price: i.price })) });
  } catch { /* analytics must never break the shop */ }
}
