// Campaigns (Admin > Campaigns): popups, top bars, home hero banners and floating badges.
// Shared by the builder (admin) and the store, so the preview is exactly what visitors see.

export type Kind = "popup" | "topbar" | "hero" | "badge";
export type Content = {
  badge?: string; headline?: string; sub?: string; button?: string; link?: string; button2?: string; link2?: string;
  code?: string; note?: string; image?: string; bg_image?: string; products?: string[];
};
export type Design = {
  preset?: string; bg?: string; bg2?: string; text?: string; accent?: string; button?: string; buttonText?: string;
  pattern?: "none" | "dots" | "sparkles" | "grid" | "stripes"; radius?: number; size?: "sm" | "md" | "lg"; align?: "center" | "left";
  fonts?: string; headFont?: string; bodyFont?: string; urduFont?: string; headSize?: number; subSize?: number; uppercase?: boolean;
  animation?: "fade" | "zoom" | "slide" | "bounce" | "none"; overlay?: number; imageSide?: "left" | "right" | "top";
  /** extras: rotating glow border, floating light blobs, twinkling sparkles, store logo, lines appearing one by one, button shine */
  fx?: { ring?: boolean; blobs?: boolean; stars?: boolean; logo?: boolean; stagger?: boolean; shine?: boolean };
};
export type Rules = {
  pages?: "all" | "home" | "products" | "shop" | "custom"; paths?: string; devices?: "all" | "mobile" | "desktop";
  trigger?: "load" | "delay" | "scroll" | "exit"; delay?: number; scroll?: number;
  frequency?: "always" | "session" | "day" | "once"; audience?: "all" | "new" | "returning";
  countdown_to?: string | null; mobile?: "sheet" | "center"; badge_corner?: "left" | "right";
};
export type Campaign = {
  id: string; name: string; kind: Kind; template: string; status: "draft" | "active" | "paused"; priority: number;
  starts_at: string | null; ends_at: string | null; content: Content; design: Design; rules: Rules;
  views?: number; clicks?: number; closes?: number; created_at?: string; updated_at?: string | null;
};

// ---------------------------------------------------------------- colour themes
export const PRESETS: Record<string, { label: string; d: Design }> = {
  welcome: { label: "Welcome (light)", d: { bg: "#ffffff", bg2: "#eef3ff", text: "#0f172a", accent: "#6d28d9", button: "#1d4fd8", buttonText: "#ffffff", pattern: "sparkles" } },
  brand: { label: "Al Bashir blue", d: { bg: "#0a1f66", bg2: "#1d4fd8", text: "#ffffff", accent: "#e11d2e", button: "#ffffff", buttonText: "#0a1f66", pattern: "dots" } },
  sale: { label: "Hot sale red", d: { bg: "#b91c1c", bg2: "#ea580c", text: "#ffffff", accent: "#fde047", button: "#ffffff", buttonText: "#b91c1c", pattern: "stripes" } },
  midnight: { label: "11.11 midnight gold", d: { bg: "#0b1020", bg2: "#1e1b4b", text: "#ffffff", accent: "#fbbf24", button: "#fbbf24", buttonText: "#0b1020", pattern: "sparkles" } },
  navy: { label: "12.12 navy & red", d: { bg: "#0f172a", bg2: "#172554", text: "#ffffff", accent: "#ef4444", button: "#ef4444", buttonText: "#ffffff", pattern: "grid" } },
  flash: { label: "Flash yellow", d: { bg: "#facc15", bg2: "#f59e0b", text: "#111827", accent: "#111827", button: "#111827", buttonText: "#facc15", pattern: "stripes" } },
  eid: { label: "Eid emerald & gold", d: { bg: "#064e3b", bg2: "#047857", text: "#ffffff", accent: "#fcd34d", button: "#fcd34d", buttonText: "#064e3b", pattern: "sparkles" } },
  ramadan: { label: "Ramadan night", d: { bg: "#1e1b4b", bg2: "#4c1d95", text: "#ffffff", accent: "#fde68a", button: "#fde68a", buttonText: "#1e1b4b", pattern: "sparkles" } },
  fresh: { label: "Fresh green", d: { bg: "#ecfdf5", bg2: "#d1fae5", text: "#064e3b", accent: "#059669", button: "#059669", buttonText: "#ffffff", pattern: "dots" } },
  dark: { label: "Black & white", d: { bg: "#0a0a0a", bg2: "#262626", text: "#ffffff", accent: "#e11d2e", button: "#ffffff", buttonText: "#0a0a0a", pattern: "none" } },
};

// ---------------------------------------------------------------- fonts (Google Fonts, loaded only when used)
export const FONTS = {
  english: ["Barlow Condensed", "Manrope", "Inter", "Poppins", "Playfair Display", "Anton", "Cinzel", "Pacifico", "Bebas Neue", "Montserrat"],
  urdu: ["Noto Nastaliq Urdu", "Noto Sans Arabic", "Lalezar", "Amiri", "El Messiri", "Gulzar", "Lateef"],
};
export const FONT_PRESETS: Record<string, { label: string; d: string; headFont: string; bodyFont: string; urduFont: string; uppercase?: boolean }> = {
  store: { label: "Store fonts", d: "Barlow Condensed headlines and Manrope text, like the rest of the site.", headFont: "Barlow Condensed", bodyFont: "Manrope", urduFont: "Noto Nastaliq Urdu", uppercase: true },
  nastaliq: { label: "Classic Nastaliq", d: "Noto Nastaliq Urdu with Playfair Display; calm and readable.", headFont: "Playfair Display", bodyFont: "Inter", urduFont: "Noto Nastaliq Urdu" },
  modern: { label: "Modern Urdu", d: "Noto Sans Arabic with Inter. Light files, crisp on phones.", headFont: "Inter", bodyFont: "Inter", urduFont: "Noto Sans Arabic" },
  bold: { label: "Bold Sale", d: "Anton headlines and Lalezar Urdu for loud sale banners.", headFont: "Anton", bodyFont: "Poppins", urduFont: "Lalezar", uppercase: true },
  elegant: { label: "Elegant", d: "Cinzel and Amiri: refined, for Eid and gifts.", headFont: "Cinzel", bodyFont: "Montserrat", urduFont: "Amiri" },
  playful: { label: "Playful", d: "Pacifico headline, Poppins text and El Messiri Urdu.", headFont: "Pacifico", bodyFont: "Poppins", urduFont: "El Messiri" },
};
/** Google Fonts stylesheet for the fonts a design uses (store fonts are already on the page). */
export function fontHref(d: Design) {
  const own = new Set(["Barlow Condensed", "Manrope"]);
  const fam = [...new Set([d.headFont, d.bodyFont, d.urduFont].filter((f): f is string => !!f && !own.has(f)))];
  return fam.length ? `https://fonts.googleapis.com/css2?${fam.map((f) => `family=${f.replace(/ /g, "+")}:wght@400;700`).join("&")}&display=swap` : null;
}
/** Urdu / Arabic script in a string? (then: right-to-left, Urdu font, no letter spacing or capitals) */
export const isUrdu = (t?: string) => !!t && /[؀-ۿ]/.test(t);

// ---------------------------------------------------------------- templates
type T = { key: string; label: string; group: string; kind: Kind; content: Content; design: Design; rules?: Rules };
const soon = (h: number) => new Date(Date.now() + h * 3600000).toISOString();
export const TEMPLATES: T[] = [
  { key: "welcome", label: "Welcome", group: "Welcome", kind: "popup",
    content: { badge: "خوش آمدید", headline: "Welcome to Al Bashir Autos", sub: "Genuine spare parts for motorcycles, rickshaws, loaders and cycles, delivered across Pakistan.", button: "Start shopping", link: "/shop" },
    design: { preset: "welcome", fonts: "store", animation: "zoom", size: "md", fx: { ring: true, blobs: true, stars: true, logo: true, stagger: true, shine: true } }, rules: { trigger: "delay", delay: 3, frequency: "day" } },
  { key: "offer", label: "Offer / Discount", group: "Sale", kind: "popup",
    content: { badge: "LIMITED OFFER", headline: "Up to 30% off", sub: "On chain kits, batteries and brake parts. Use the code at checkout.", button: "Shop the sale", link: "/shop?sale=1", code: "" },
    design: { preset: "sale", fonts: "bold", animation: "bounce", size: "md" }, rules: { trigger: "delay", delay: 5, frequency: "day" } },
  { key: "1111", label: "11.11 Sale", group: "Sale", kind: "popup",
    content: { badge: "11.11", headline: "11.11 Mega Sale", sub: "The biggest price drops of the year, one day only.", button: "Grab the deals", link: "/shop?sale=1" },
    design: { preset: "midnight", fonts: "bold", animation: "zoom", size: "lg", fx: { ring: true, stars: true, stagger: true, shine: true } }, rules: { trigger: "delay", delay: 2, frequency: "session", countdown_to: soon(24) } },
  { key: "1212", label: "12.12 Sale", group: "Sale", kind: "popup",
    content: { badge: "12.12", headline: "12.12 Year-End Sale", sub: "Last big sale of the year. Stock up before the new year.", button: "Shop 12.12", link: "/shop?sale=1" },
    design: { preset: "navy", fonts: "bold", animation: "zoom", size: "lg", fx: { ring: true, blobs: true, stagger: true, shine: true } }, rules: { trigger: "delay", delay: 2, frequency: "session", countdown_to: soon(24) } },
  { key: "flash", label: "Flash Sale", group: "Sale", kind: "topbar",
    content: { badge: "⚡ FLASH SALE", headline: "Prices drop for 24 hours only", button: "See deals", link: "/shop?sale=1" },
    design: { preset: "flash", fonts: "bold" }, rules: { countdown_to: soon(24), frequency: "always" } },
  { key: "eid", label: "Eid Sale", group: "Festival", kind: "popup",
    content: { badge: "عید مبارک", headline: "Eid Sale", sub: "Get your ride ready for Eid. Special prices on popular parts.", button: "Shop Eid deals", link: "/shop?sale=1" },
    design: { preset: "eid", fonts: "elegant", animation: "fade", size: "md", fx: { ring: true, stars: true, stagger: true, shine: true } }, rules: { trigger: "delay", delay: 3, frequency: "day" } },
  { key: "ramadan", label: "Ramadan", group: "Festival", kind: "popup",
    content: { badge: "رمضان کریم", headline: "Ramadan Kareem", sub: "Shop from home this Ramadan. Orders confirmed by phone, delivered to your door.", button: "Browse parts", link: "/shop" },
    design: { preset: "ramadan", fonts: "nastaliq", animation: "fade", size: "md", fx: { stars: true, blobs: true, stagger: true } }, rules: { trigger: "delay", delay: 4, frequency: "day" } },
  { key: "delivery", label: "Free delivery", group: "Info", kind: "topbar",
    content: { headline: "Free delivery on orders over Rs. 5,000", button: "Shop now", link: "/shop" },
    design: { preset: "brand", fonts: "store" }, rules: { frequency: "always" } },
  { key: "new", label: "New arrivals", group: "Info", kind: "hero",
    content: { badge: "JUST IN", headline: "New parts in the shop", sub: "Fresh stock for CD 70, CG 125, rickshaws and loaders.", button: "See what's new", link: "/shop" },
    design: { preset: "brand", fonts: "store", animation: "slide", imageSide: "right" } },
  { key: "badge", label: "Corner offer badge", group: "Info", kind: "badge",
    content: { badge: "%", headline: "Today's offer", sub: "10% off your first order.", button: "Shop now", link: "/shop", code: "" },
    design: { preset: "sale", fonts: "store", animation: "bounce" }, rules: { badge_corner: "left", frequency: "always" } },
  { key: "custom", label: "Custom (blank)", group: "Custom", kind: "popup",
    content: { headline: "Your headline", sub: "A line about your offer.", button: "Shop now", link: "/shop" },
    design: { preset: "brand", fonts: "store", animation: "zoom", size: "md" } },
];

/** Full design: preset colours + font preset + the campaign's own changes. */
export function fullDesign(d: Design): Required<Pick<Design, "bg" | "bg2" | "text" | "accent" | "button" | "buttonText" | "pattern" | "radius" | "size" | "align" | "animation" | "headFont" | "bodyFont" | "urduFont" | "overlay" | "imageSide">> & Design {
  const p = PRESETS[d.preset ?? "brand"]?.d ?? PRESETS.brand.d;
  const f = FONT_PRESETS[d.fonts ?? "store"] ?? FONT_PRESETS.store;
  return {
    radius: 24, size: "md", align: "center", animation: "zoom", overlay: 55, imageSide: "right", pattern: "none",
    headFont: f.headFont, bodyFont: f.bodyFont, urduFont: f.urduFont, uppercase: f.uppercase,
    ...p, ...Object.fromEntries(Object.entries(d).filter(([, v]) => v !== undefined && v !== "" && v !== null)),
  } as ReturnType<typeof fullDesign>;
}

// ---------------------------------------------------------------- where / when
export const pageMatches = (r: Rules, path: string) => {
  const p = r.pages ?? "all";
  if (p === "all") return true;
  if (p === "home") return path === "/";
  if (p === "products") return path.startsWith("/products/");
  if (p === "shop") return /^\/(shop|collections|brands|vehicles|parts|promotions)/.test(path);
  return (r.paths ?? "").split(/[\n,]/).map((x) => x.trim()).filter(Boolean).some((x) => (x.endsWith("*") ? path.startsWith(x.slice(0, -1)) : path === x));
};
export const isLive = (c: Pick<Campaign, "status" | "starts_at" | "ends_at">, now = Date.now()) =>
  c.status === "active" && (!c.starts_at || new Date(c.starts_at).getTime() <= now) && (!c.ends_at || new Date(c.ends_at).getTime() > now);
