"use client";

import { useState } from "react";
import { Facebook, Globe, Image as ImageIcon, Instagram, Landmark, LocateFixed, MapPin, Megaphone, Phone, Search, Share2, Store, Truck, Users, Youtube } from "lucide-react";
import ImageField from "@/components/admin/ImageField";
import Logo from "@/components/Logo";
import { OpenBadge } from "@/components/OpenNow";
import { parseHours } from "@/lib/hours";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { coords, coordsFromLink, directionsUrl, mapEmbed } from "@/lib/location";
import SettingsCard, { Field, input, type CardProps } from "./SettingsCard";

const T = (p: CardProps, k: string, ph = "", type = "text") => (
  <input type={type} value={p.v[k] ?? ""} onChange={(e) => p.set(k, e.target.value)} placeholder={ph} className={input} />
);

// ---------------------------------------------------------------- Store & contact
export function StoreSection(p: CardProps) {
  return (
    <SettingsCard {...p} title="Store & contact" sub="Your shop name and the main way to reach you." icon={Store} keys={["store_name", "tagline", "phone", "whatsapp", "email", "open_hours"]}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Store name">{T(p, "store_name", "Al Bashir Autos")}</Field>
        <Field label="Opening hours" help={p.v.open_hours && !parseHours(p.v.open_hours) ? "Can't read these hours, so the website won't show Open now / Closed. Use one line per day group, like the example." : "One line per day group. The website shows Open now / Closed automatically (Pakistan time)."}>
          <textarea rows={3} value={p.v.open_hours ?? ""} onChange={(e) => p.set("open_hours", e.target.value)} placeholder={"Saturday – Thursday: 8:00 am – 8:00 pm\nFriday: 8:00 am – 1:00 pm\nSunday: Closed"} className={`${input} resize-y`} />
          <OpenBadge hours={p.v.open_hours} className="mt-2" />
        </Field>
        <Field label="Tagline" wide help="One line under the logo and in Google.">{T(p, "tagline", "Spare parts for motorcycles, cycles, rickshaws & loaders")}</Field>
        <Field label="Main phone" help="Shown in the header and footer.">{T(p, "phone", "+92 300 1234567", "tel")}</Field>
        <Field label="WhatsApp number" help="Digits only with country code, e.g. 923001234567">{T(p, "whatsapp", "923001234567", "tel")}</Field>
        <Field label="Email" wide>{T(p, "email", "shop@example.com", "email")}</Field>
      </div>
    </SettingsCard>
  );
}

// ---------------------------------------------------------------- Logo & favicon
export function BrandingSection(p: CardProps) {
  return (
    <SettingsCard {...p} title="Logo & favicon" sub="Upload once, shows on the whole website." icon={ImageIcon} keys={["logo", "logo_dark", "favicon"]}>
      <div className="grid gap-6 lg:grid-cols-3">
        <Field label="Logo" help="PNG/SVG, transparent background, about 400 × 120.">
          <ImageField value={p.v.logo || null} onChange={(x) => p.set("logo", (x as string) ?? "")} folder="brand" />
        </Field>
        <Field label="Logo for dark mode (optional)" help="A white version for the dark theme.">
          <ImageField value={p.v.logo_dark || null} onChange={(x) => p.set("logo_dark", (x as string) ?? "")} folder="brand" />
        </Field>
        <Field label="Favicon" help="Square PNG, 512 × 512. The small icon in the browser tab.">
          <ImageField value={p.v.favicon || null} onChange={(x) => p.set("favicon", (x as string) ?? "")} folder="brand" />
        </Field>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line bg-white p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Header preview (light)</p>
          <Logo name={p.v.store_name || "Al Bashir Autos"} src={p.v.logo || undefined} size={44} />
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-line bg-neutral-100 p-4">
          <span className="flex items-center gap-2 rounded-t-lg bg-white px-3 py-2 text-xs shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {p.v.favicon ? <img src={p.v.favicon} alt="" className="h-4 w-4 object-contain" /> : <span className="h-4 w-4 rounded bg-brand-600" />}
            <span className="max-w-40 truncate text-neutral-700">{p.v.store_name || "Al Bashir Autos"}</span>
          </span>
          <span className="text-xs text-neutral-500">← browser tab</span>
        </div>
      </div>
    </SettingsCard>
  );
}

// ---------------------------------------------------------------- Team phones
export function TeamSection(p: CardProps) {
  const keys = [1, 2, 3, 4].flatMap((n) => [`contact${n}_name`, `contact${n}_role`, `contact${n}_phone`, `contact${n}_whatsapp`]);
  return (
    <SettingsCard {...p} title="Team & phone numbers" sub="People customers can call. Shown in the footer, About and Contact pages." icon={Users} keys={keys}>
      <div className="grid gap-4 lg:grid-cols-2">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="rounded-xl border border-line p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display font-bold text-white">{(p.v[`contact${n}_name`] || String(n)).charAt(0)}</span>
              <p className="font-bold">Contact {n}{n === 4 ? " (optional)" : ""}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {T(p, `contact${n}_name`, "Name, e.g. Bashir Ahmad")}
              {T(p, `contact${n}_role`, "Role, e.g. Owner, Sales")}
              <div className="relative sm:col-span-2">
                <Phone size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input type="tel" value={p.v[`contact${n}_phone`] ?? ""} onChange={(e) => p.set(`contact${n}_phone`, e.target.value)} placeholder="Phone, e.g. 0300 1234567" className={`${input} pl-10`} />
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" checked={p.v[`contact${n}_whatsapp`] !== "no"} onChange={(e) => p.set(`contact${n}_whatsapp`, e.target.checked ? "" : "no")} className="h-4 w-4 accent-[#25D366]" />
                <WhatsAppIcon size={15} className="text-[#25D366]" />Also on WhatsApp
              </label>
            </div>
          </div>
        ))}
      </div>
    </SettingsCard>
  );
}

// ---------------------------------------------------------------- Social media
const SOCIAL = [
  { k: "facebook", l: "Facebook", icon: Facebook, ph: "https://facebook.com/yourpage" },
  { k: "instagram", l: "Instagram", icon: Instagram, ph: "https://instagram.com/yourpage" },
  { k: "tiktok", l: "TikTok", icon: Share2, ph: "https://tiktok.com/@yourpage" },
  { k: "youtube", l: "YouTube", icon: Youtube, ph: "https://youtube.com/@yourchannel" },
  { k: "x", l: "X (Twitter)", icon: Share2, ph: "https://x.com/yourpage" },
  { k: "whatsapp_channel", l: "WhatsApp channel", icon: Globe, ph: "https://whatsapp.com/channel/…" },
];
export function SocialSection(p: CardProps) {
  return (
    <SettingsCard {...p} title="Social media" sub="Icons in the footer. Empty = hidden." icon={Share2} keys={SOCIAL.map((s) => s.k)}>
      <div className="grid gap-4 sm:grid-cols-2">
        {SOCIAL.map(({ k, l, icon: I, ph }) => {
          const ok = !p.v[k] || /^https?:\/\/\S+\.\S+/.test(p.v[k]);
          return (
            <Field key={k} label={l} help={ok ? undefined : "Start with https://"}>
              <div className="relative">
                <I size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input type="url" value={p.v[k] ?? ""} onChange={(e) => p.set(k, e.target.value)} placeholder={ph} className={`${input} pl-10 ${ok ? "" : "border-hot"}`} />
              </div>
            </Field>
          );
        })}
      </div>
    </SettingsCard>
  );
}

// ---------------------------------------------------------------- Location
export function LocationSection(p: CardProps) {
  const [msg, setMsg] = useState("");
  const c = coords(p.v);
  const fromLink = () => {
    const x = coordsFromLink(p.v.map_link ?? "");
    if (!x) return setMsg(/goo\.gl|maps\.app/.test(p.v.map_link ?? "") ? "Short links hide the coordinates. Open the link, then copy the long address from the browser bar." : "No coordinates found in that link.");
    p.set("latitude", x.lat); p.set("longitude", x.lng); setMsg("Coordinates filled from the link.");
  };
  const here = () => {
    if (!navigator.geolocation) return setMsg("This browser cannot share location.");
    setMsg("Finding you…");
    navigator.geolocation.getCurrentPosition(
      (pos) => { p.set("latitude", pos.coords.latitude.toFixed(6)); p.set("longitude", pos.coords.longitude.toFixed(6)); setMsg("Filled from this device. Use it while standing in the shop."); },
      () => setMsg("Location permission was refused."), { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <SettingsCard {...p} title="Shop location" sub="Address text, Google Maps link and exact pin. The map on the site uses the pin when it is set." icon={MapPin} keys={["address", "map_link", "latitude", "longitude"]}>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="grid content-start gap-4">
          <Field label="Address (as customers should read it)">
            <textarea rows={3} value={p.v.address ?? ""} onChange={(e) => p.set("address", e.target.value)} placeholder="Pakpattan Road, opposite MCB Bank, Haveli Lakha, Okara" className={`${input} resize-y`} />
          </Field>
          <Field label="Google Maps link" help="Open your shop in Google Maps, copy the address from the browser bar.">
            <div className="flex gap-2">
              <input type="url" value={p.v.map_link ?? ""} onChange={(e) => p.set("map_link", e.target.value)} placeholder="https://www.google.com/maps/place/…" className={input} />
              <button type="button" onClick={fromLink} disabled={!p.v.map_link} className="shrink-0 rounded-xl border border-line px-3 text-xs font-bold transition hover:border-brand-500 disabled:opacity-40">Get pin</button>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude">{T(p, "latitude", "30.451234")}</Field>
            <Field label="Longitude">{T(p, "longitude", "73.654321")}</Field>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={here} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-bold transition hover:border-brand-500 hover:text-brand-600"><LocateFixed size={15} />Use my current location</button>
            {c && <a href={directionsUrl(p.v)} target="_blank" rel="noreferrer" className="text-sm font-bold text-brand-600 hover:underline">Test directions →</a>}
          </div>
          {msg && <p className="text-sm text-muted">{msg}</p>}
          {(p.v.latitude || p.v.longitude) && !c && <p className="text-sm font-semibold text-hot">Latitude must be −90 to 90 and longitude −180 to 180.</p>}
        </div>
        <div className="overflow-hidden rounded-xl border border-line">
          {p.v.address || c ? <iframe title="Map preview" src={mapEmbed(p.v)} className="h-80 w-full border-0" loading="lazy" /> : <div className="grid h-80 place-items-center text-sm text-muted">Add an address or pin to see the map.</div>}
          <p className="border-t border-line bg-soft px-3 py-2 text-xs text-muted">{c ? `Exact pin: ${c.lat}, ${c.lng}` : "Using the address text (add a pin for an exact spot)."}</p>
        </div>
      </div>
    </SettingsCard>
  );
}

// ---------------------------------------------------------------- Delivery & payments
export function PaymentsSection(p: CardProps) {
  return (
    <SettingsCard {...p} title="Delivery & payments" sub="Delivery charge and the accounts customers pay into at checkout." icon={Landmark}
      keys={["shipping_flat", "jazzcash_number", "jazzcash_name", "easypaisa_number", "easypaisa_name", "bank_name", "bank_title", "bank_iban"]}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Delivery charge (Rs.), all Pakistan" help="One price for every order."><div className="relative"><Truck size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" /><input inputMode="numeric" value={p.v.shipping_flat ?? ""} onChange={(e) => p.set("shipping_flat", e.target.value.replace(/[^\d]/g, ""))} placeholder="400" className={`${input} pl-10`} /></div></Field>
        <div />
        <div className="rounded-xl border border-[#d71f26]/30 p-4 sm:col-span-1">
          <p className="mb-3 text-sm font-bold text-[#d71f26]">JazzCash</p>
          <div className="grid gap-3">{T(p, "jazzcash_number", "0300 1234567")}{T(p, "jazzcash_name", "Account name")}</div>
        </div>
        <div className="rounded-xl border border-[#3bb54a]/30 p-4">
          <p className="mb-3 text-sm font-bold text-[#3bb54a]">Easypaisa</p>
          <div className="grid gap-3">{T(p, "easypaisa_number", "0345 1234567")}{T(p, "easypaisa_name", "Account name")}</div>
        </div>
        <div className="rounded-xl border border-line p-4 sm:col-span-2">
          <p className="mb-3 text-sm font-bold">Bank transfer</p>
          <div className="grid gap-3 sm:grid-cols-3">{T(p, "bank_name", "Bank, e.g. Meezan Bank")}{T(p, "bank_title", "Account title")}{T(p, "bank_iban", "IBAN / account number")}</div>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">Empty accounts are hidden at checkout. Customers then get the details on WhatsApp.</p>
    </SettingsCard>
  );
}

// ---------------------------------------------------------------- Site text
export function SiteTextSection(p: CardProps) {
  return (
    <SettingsCard {...p} title="Site text" sub="The thin announcement bar at the very top of every page." icon={Megaphone} keys={["announcement"]}>
      <Field label="Announcement bar" help="Separate items with  •  e.g. Genuine parts  •  Delivery all over Pakistan">{T(p, "announcement")}</Field>
      {p.v.announcement && <div className="mt-4 rounded-lg bg-brand-900 px-4 py-2 text-center text-xs font-semibold text-white/85">{p.v.announcement}</div>}
    </SettingsCard>
  );
}

// ---------------------------------------------------------------- SEO
export function SeoSection(p: CardProps) {
  return (
    <SettingsCard {...p} title="SEO & site files" sub="Default Google titles, sitemap, robots and llms.txt." icon={Search} keys={["seo_separator", "seo_product_title", "seo_product_description", "ai_crawlers"]}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title separator" help="Used for %sep%, e.g. | or -">{T(p, "seo_separator", "|")}</Field>
        <div />
        <Field label="Default product title" wide help="Variables: %name% %brand% %category% %vehicle% %price% %sku% %sitename% %sep%">{T(p, "seo_product_title", "%name% %sep% %sitename%")}</Field>
        <Field label="Default product description" wide><textarea rows={2} value={p.v.seo_product_description ?? ""} onChange={(e) => p.set("seo_product_description", e.target.value)} className={`${input} resize-y`} /></Field>
      </div>

      <div className="mt-6 border-t border-line pt-5">
        <p className="font-bold">Search engine files <span className="font-normal text-muted">(made automatically, update every 10 minutes)</span></p>
        <p className="text-sm text-muted">Add a product, category, brand, bike or blog post and it appears in these files on its own.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            { f: "/sitemap.xml", d: "Every page for Google & Bing. Submit it in Search Console." },
            { f: "/robots.txt", d: "Which pages search engines may visit. Admin, cart and checkout stay private." },
            { f: "/llms.txt", d: "Short guide to your store for AI assistants (ChatGPT, Claude…)." },
            { f: "/llms-full.txt", d: "Full catalogue for AI: every part with price, stock and fitment." },
          ].map((x) => (
            <a key={x.f} href={x.f} target="_blank" rel="noreferrer" className="group flex items-start gap-3 rounded-xl border border-line p-3 transition hover:border-brand-500/50 hover:bg-soft">
              <span className="rounded-lg bg-brand-50 px-2 py-1 font-mono text-xs font-bold text-brand-700 dark:bg-brand-900 dark:text-white">{x.f}</span>
              <span className="text-xs text-muted">{x.d}</span>
            </a>
          ))}
        </div>
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-line p-3.5">
          <input type="checkbox" checked={p.v.ai_crawlers !== "block"} onChange={(e) => p.set("ai_crawlers", e.target.checked ? "" : "block")} className="mt-0.5 h-4 w-4 accent-[#1d4fd8]" />
          <span className="text-sm">
            <span className="block font-semibold">Allow AI assistants to read the shop</span>
            <span className="block text-xs text-muted">On (recommended): ChatGPT, Claude, Perplexity and Google AI can recommend your parts. Off: they are blocked in robots.txt. Google Search is never blocked.</span>
          </span>
        </label>
      </div>
    </SettingsCard>
  );
}
