// Demo content used only while Supabase is not connected. Once you add .env.local
// and run supabase/schema.sql, the site reads everything from your database instead.
import type { Banner, Brand, Category, Faq, Feature, Page, Product, Promotion, Settings, Testimonial, Vehicle } from "./types";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const demoSettings: Settings = {
  store_name: "Al Bashir Autos",
  tagline: "Spare parts for motorcycles, cycles, rickshaws & loaders",
  phone: "+92 300 0000000",
  whatsapp: "923000000000",
  email: "albashirauto@gmail.com",
  address: "Pakpattan Road, opposite MCB Bank, Haveli Lakha, Tehsil Depalpur, District Okara",
  announcement: "Genuine parts  •  Pakistan-wide delivery  •  7-day exchange",
  shipping_flat: "400",
  open_hours: "Mon – Sat, 9:00 am to 9:00 pm",
  facebook: "https://facebook.com", instagram: "https://instagram.com", tiktok: "https://tiktok.com", youtube: "",
  contact1_name: "Shop counter", contact1_role: "Sales & orders", contact1_phone: "+92 300 0000000",
  contact2_name: "Parts expert", contact2_role: "Fitment & part numbers", contact2_phone: "+92 301 0000000",
  contact3_name: "Delivery desk", contact3_role: "Order tracking", contact3_phone: "+92 302 0000000",
};

const cats = ["Chain Kits & Sprockets", "Batteries", "Engine Oil & Lubricants", "Lights & Indicators", "Brakes & Clutch", "Tyres & Tubes", "Spark Plugs", "Speedometers", "Fuel Tanks", "Silencers & Exhausts", "Rickshaw Parts", "Cycle Parts"];
export const demoCategories: Category[] = cats.map((name, i) => ({
  id: `c${i + 1}`, name, slug: slugify(name).replace("-sprockets", "").replace("-lubricants", ""), show_in_nav: true, show_on_home: true, sort_order: i, active: true,
}));
// keep slugs identical to supabase/schema.sql
const slugFix: Record<string, string> = {
  "Chain Kits & Sprockets": "chain-kits", "Engine Oil & Lubricants": "engine-oil", "Lights & Indicators": "lights",
  "Brakes & Clutch": "brakes-clutch", "Tyres & Tubes": "tyres", "Silencers & Exhausts": "silencers",
};
demoCategories.forEach((c) => { if (slugFix[c.name]) c.slug = slugFix[c.name]; });

export const demoBrands: Brand[] = ["TQR", "ISH", "RP", "DYL Lubricants", "Odiking"].map((name, i) => ({
  id: `b${i + 1}`, name, slug: slugify(name), sort_order: i, active: true,
}));

export const demoVehicles: Vehicle[] = [
  ["Honda CD 70", "motorcycle", "Honda"], ["Honda CG 125", "motorcycle", "Honda"], ["Honda CB 150F", "motorcycle", "Honda"],
  ["Auto Rickshaw", "rickshaw", "Various"],
  ["Loader Rickshaw", "loader", "Various"], ["Bicycle", "cycle", "Various"],
].map(([name, type, company], i) => ({ id: `v${i + 1}`, name, slug: slugify(name), type, company, sort_order: i, active: true }));

export const demoPromotions: Promotion[] = [
  { id: "p1", title: "Half Price Sale", slug: "half-price-sale", subtitle: "Selected parts at half price", badge: "50% OFF", show_on_home: true, sort_order: 1, active: true },
  { id: "p2", title: "30% Off Week", slug: "30-off-sale", subtitle: "Chain kits, batteries and more", badge: "30% OFF", show_on_home: true, sort_order: 2, active: true },
  { id: "p3", title: "Under Rs. 999", slug: "under-999", subtitle: "Everyday parts that cost less", badge: "Rs. 999", show_on_home: true, sort_order: 3, active: true },
  { id: "p4", title: "Trending Now", slug: "trending", subtitle: "What riders are buying this week", badge: "HOT", show_on_home: true, sort_order: 4, active: true },
];

export const demoBanners: Banner[] = [
  { id: "n1", eyebrow: "Genuine & imported parts", title: "Keep every ride running strong", subtitle: "Chain kits, batteries, lights and engine parts for motorcycles, rickshaws and cycles, delivered across Pakistan.", button_text: "Shop all parts", link: "/shop", sort_order: 1, active: true },
  { id: "n2", eyebrow: "Deal Zone", title: "Up to 50% off this week", subtitle: "Half-price sale on selected parts. Limited stock, fast delivery.", button_text: "See deals", link: "/promotions/half-price-sale", sort_order: 2, active: true },
  { id: "n3", eyebrow: "Find parts by bike", title: "Pick your model, see what fits", subtitle: "Honda CD 70, CG 125, CB 150F, rickshaws, loaders and cycles.", button_text: "Browse by bike", link: "/vehicles", sort_order: 3, active: true },
];

// Contact page questions, used until the faqs table exists (supabase/010_content.sql)
export const demoFaqs: Faq[] = [
  { id: "q1", question: "Do you deliver outside Okara?", answer: "Yes, we deliver all over Pakistan. Delivery charges are confirmed by phone and taken in advance." },
  { id: "q2", question: "How fast will my order ship?", answer: "Orders usually ship within 24 hours after we confirm them with you by phone." },
  { id: "q3", question: "I am not sure which part fits my bike.", answer: "Send us a photo of the old part or your bike model on WhatsApp. We will tell you the right part before you order." },
  { id: "q4", question: "What if I receive the wrong part?", answer: "Return it within 7 days in its original condition and we will exchange it." },
  { id: "q5", question: "Can I order on WhatsApp instead of the website?", answer: "Yes. Send the part name or photo and your address, and we will confirm the price and delivery with you." },
  { id: "q6", question: "Do you have bulk schemes for workshops?", answer: "Yes, many parts have “buy X get Y free” schemes. See the Deal zone for the full list." },
];

export const demoFeatures: Feature[] = [
  { id: "f1", title: "Fast delivery", body: "Orders ship within 24 hours. Delivery charges are taken in advance.", icon: "truck", active: true },
  { id: "f2", title: "Same part you chose", body: "We deliver exactly the product you ordered, every time.", icon: "shield", active: true },
  { id: "f3", title: "Support 6 days a week", body: "Call or WhatsApp us from 9 am to 9 pm.", icon: "headset", active: true },
  { id: "f4", title: "7-day exchange", body: "Wrong part? Return it within 7 days for an exchange.", icon: "refresh", active: true },
];

export const demoTestimonials: Testimonial[] = [
  { id: "t1", name: "Ahmed Raza", city: "Okara", body: "Ordered a chain kit for my CD 70. It arrived in two days and fit perfectly.", rating: 5, active: true },
  { id: "t2", name: "Usman Khalid", city: "Depalpur", body: "Good prices and the staff know which part goes on which bike.", rating: 5, active: true },
  { id: "t3", name: "Faisal Mehmood", city: "Lahore", body: "Bought a battery and spark plugs. Both genuine, both working fine.", rating: 5, active: true },
];

export const demoPages: Page[] = [
  { id: "g1", title: "About us", slug: "about", show_in_footer: true, active: true, content: "<h2>About Al Bashir Autos</h2><p>We are a parts shop on Pakpattan Road, Haveli Lakha, serving riders, rickshaw drivers and workshops with motorcycle, cycle and loader spare parts.</p><p>We deal in Honda, RP Speedo, ISH, TQR and other trusted brands.</p>" },
  { id: "g2", title: "Contact", slug: "contact", show_in_footer: true, active: true, content: "<h2>Contact us</h2><p>Visit the shop or call us during opening hours.</p>" },
  { id: "g3", title: "Refund & exchange policy", slug: "refund-policy", show_in_footer: true, active: true, content: "<h2>Refund and exchange</h2><p>If you received the wrong part, return it within 7 days in its original condition for an exchange.</p>" },
  { id: "g4", title: "Delivery information", slug: "delivery", show_in_footer: true, active: true, content: "<h2>Delivery</h2><p>We deliver across Pakistan. Delivery charges are taken in advance.</p>" },
];

type P = [string, number, number | null, string, string, string, string?, boolean?, boolean?];
// name, price, compare, category slug, brand slug, vehicle slug, promo slug, featured, trending
const rows: P[] = [
  ["CD 70 Chain Kit (Chain + Sprockets)", 1650, 1950, "chain-kits", "honda", "honda-cd-70", "30-off-sale", true, true],
  ["CG 125 Heavy Duty Chain Kit", 2450, 2800, "chain-kits", "tqr", "honda-cg-125", "30-off-sale", true, true],
  ["Dry Battery 12V 5Ah", 2650, null, "batteries", "unique", "honda-cd-70", undefined, true, true],
  ["Maintenance-Free Battery 12V 9Ah", 4100, 4600, "batteries", "atlas-honda", "honda-cb-150f", "30-off-sale", false, true],
  ["Genuine Engine Oil 20W-50 (1L)", 1450, null, "engine-oil", "honda", "honda-cg-125", undefined, true, false],
  ["Headlight Bulb Set LED", 899, 1299, "lights", "tqr", "honda-cd-70", "under-999", true, true],
  ["Indicator Set (4 pcs)", 750, null, "lights", "ish", "honda-cg-125", "under-999", false, false],
  ["Front Brake Shoe Set", 650, null, "brakes-clutch", "honda", "honda-cd-70", "under-999", false, false],
  ["Clutch Plate Kit", 1350, 1600, "brakes-clutch", "atlas-honda", "honda-cg-125", undefined, true, false],
  ["Tubeless Tyre 2.75-18", 5400, null, "tyres", "unique", "honda-cd-70", undefined, false, false],
  ["Spark Plug (Standard)", 350, null, "spark-plugs", "honda", "honda-cg-125", "under-999", false, true],
  ["Digital Speedometer", 3200, 3800, "speedometers", "rp-speedo", "honda-cb-150f", "half-price-sale", true, true],
  ["Analog Speedometer CD 70", 1900, 2400, "speedometers", "rp-speedo", "honda-cd-70", "half-price-sale", false, false],
  ["CG 125 Fuel Tank Outfit", 8000, null, "fuel-tanks", "ish", "honda-cg-125", undefined, true, true],
  ["Racing Silencer", 3500, 4200, "silencers", "tqr", "honda-cg-125", "half-price-sale", false, true],
  ["Rickshaw Clutch Cable", 480, null, "rickshaw-parts", "unique", "auto-rickshaw", "under-999", false, false],
  ["Loader Rickshaw Brake Pad Set", 1250, null, "rickshaw-parts", "unique", "loader-rickshaw", undefined, false, false],
  ["Bicycle Chain (Heavy)", 420, null, "cycle-parts", "unique", "bicycle", "under-999", false, false],
];

// bulk schemes on a few demo parts: [buy, free]
const demoSchemes: Record<string, { scheme_buy: number; scheme_free: number }> = Object.fromEntries(([
  ["spark-plug-standard", 20, 5], ["front-brake-shoe-set", 10, 2], ["indicator-set-4-pcs", 12, 2],
  ["rickshaw-clutch-cable", 20, 4], ["bicycle-chain-heavy", 20, 5], ["headlight-bulb-set-led", 10, 1],
  ["genuine-engine-oil-20w-50-1l", 12, 1], ["loader-rickshaw-brake-pad-set", 10, 2],
] as const).map(([s, b, f]) => [s, { scheme_buy: b, scheme_free: f }]));

export const demoProducts: Product[] = rows.map(([name, price, compare, cat, brand, veh, promo, feat, trend], i) => {
  const c = demoCategories.find((x) => x.slug === cat)!;
  const b = demoBrands.find((x) => x.slug === brand)!;
  const v = demoVehicles.find((x) => x.slug === veh)!;
  const p = demoPromotions.find((x) => x.slug === promo);
  return {
    id: `pr${i + 1}`, name, slug: slugify(name), sku: `ABA-${1000 + i}`, price, compare_price: compare, stock: 12 + i,
    description: `${name} for ${v.name}. Quality checked before dispatch. Edit this description from the admin panel.`,
    images: [], category_id: c.id, brand_id: b.id, vehicle_id: v.id, promotion_id: p?.id ?? null,
    is_featured: !!feat, is_trending: !!trend, active: true, ...(demoSchemes[slugify(name)] ?? {}),
    category: { name: c.name, slug: c.slug }, brand: { name: b.name, slug: b.slug }, vehicle: { name: v.name, slug: v.slug },
  };
});
