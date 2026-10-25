"use client";

import { BarChart3, CheckCircle2, CircleDashed, ExternalLink, ShieldCheck, TriangleAlert } from "lucide-react";
import { cleanId, validId, type TrackKey } from "@/lib/analytics";
import SettingsCard, { input, type CardProps } from "./SettingsCard";

type Item = { k: TrackKey; name: string; ph: string; where: string; link: string; note?: string };

/** One service row: name, Connected / Not set / Check format badge, input, where to find the ID. */
function Row({ p, it }: { p: CardProps; it: Item }) {
  const raw = p.v[it.k] ?? "";
  const ok = validId(p.v, it.k);
  const state = !raw ? "empty" : ok ? "ok" : "bad";
  return (
    <div className={`rounded-xl border p-4 transition ${state === "ok" ? "border-green-600/40 bg-green-600/[0.04]" : state === "bad" ? "border-hot/40" : "border-line"}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-bold">{it.name}</p>
        {state === "ok" ? <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800"><CheckCircle2 size={12} />Connected</span>
          : state === "bad" ? <span className="inline-flex items-center gap-1 rounded-full bg-hot/10 px-2.5 py-0.5 text-xs font-bold text-hot"><TriangleAlert size={12} />Check format</span>
          : <span className="inline-flex items-center gap-1 rounded-full bg-soft px-2.5 py-0.5 text-xs font-bold text-muted"><CircleDashed size={12} />Not set</span>}
      </div>
      <input value={raw} onChange={(e) => p.set(it.k, e.target.value)} onBlur={(e) => e.target.value && p.set(it.k, cleanId(e.target.value))} placeholder={it.ph} className={`${input} mt-2 font-mono`} spellCheck={false} />
      <p className="mt-1.5 text-xs text-muted">
        {it.where} <a href={it.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 font-semibold text-brand-600 hover:underline">Open<ExternalLink size={10} /></a>
        {it.note && <span className="block">{it.note}</span>}
      </p>
    </div>
  );
}

const VERIFY: Item[] = [
  { k: "google_site_verification", name: "Google Search Console", ph: "Paste the code or the whole <meta> tag", where: "Add property › URL prefix › HTML tag.", link: "https://search.google.com/search-console", note: "After saving, press Verify in Search Console, then submit /sitemap.xml." },
  { k: "bing_verification", name: "Bing Webmaster Tools", ph: "msvalidate.01 code", where: "Add site › HTML Meta Tag. (Or simply import from Google Search Console.)", link: "https://www.bing.com/webmasters" },
  { k: "yandex_verification", name: "Yandex Webmaster", ph: "yandex-verification code", where: "Add site › Meta tag.", link: "https://webmaster.yandex.com" },
  { k: "pinterest_verification", name: "Pinterest", ph: "p:domain_verify code", where: "Settings › Claimed accounts › Websites › Add HTML tag.", link: "https://www.pinterest.com/settings/claim" },
  { k: "facebook_domain_verification", name: "Facebook / Meta domain", ph: "facebook-domain-verification code", where: "Business settings › Brand safety › Domains › Meta-tag verification.", link: "https://business.facebook.com/settings/owned-domains" },
];

const ANALYTICS: Item[] = [
  { k: "ga4_id", name: "Google Analytics 4", ph: "G-XXXXXXXXXX", where: "Admin › Data streams › Web › Measurement ID.", link: "https://analytics.google.com", note: "Tracks visits, add to cart, checkout and purchases with value in PKR." },
  { k: "gtm_id", name: "Google Tag Manager", ph: "GTM-XXXXXXX", where: "Container ID at the top of Tag Manager.", link: "https://tagmanager.google.com", note: "Use either GA4 or GTM for Google Analytics, not both, or visits count twice." },
  { k: "meta_pixel_id", name: "Meta (Facebook / Instagram) Pixel", ph: "15-digit Pixel ID", where: "Events Manager › Data sources › your Pixel.", link: "https://business.facebook.com/events_manager", note: "Lets Facebook / Instagram ads see who bought." },
  { k: "tiktok_pixel_id", name: "TikTok Pixel", ph: "CXXXXXXXXXXXXXXXXXXX", where: "TikTok Ads › Assets › Events › Web events.", link: "https://ads.tiktok.com" },
  { k: "clarity_id", name: "Microsoft Clarity (free heatmaps)", ph: "project id, e.g. abcd1234ef", where: "Settings › Overview › Project ID.", link: "https://clarity.microsoft.com", note: "Watch real visits and see where people click. Free." },
];

export function VerificationSection(p: CardProps) {
  return (
    <SettingsCard {...p} title="Site verification" sub="Prove you own the website. Paste the code (or the whole <meta> tag), Save, then press Verify on the service." icon={ShieldCheck} keys={VERIFY.map((x) => x.k)}>
      <div className="grid gap-3 lg:grid-cols-2">{VERIFY.map((it) => <Row key={it.k} p={p} it={it} />)}</div>
    </SettingsCard>
  );
}

export function AnalyticsSection(p: CardProps) {
  return (
    <SettingsCard {...p} title="Analytics & pixels" sub="Loaded on shop pages only (never in Admin). Add to cart, checkout and purchases are sent automatically." icon={BarChart3} keys={ANALYTICS.map((x) => x.k)}>
      <div className="grid gap-3 lg:grid-cols-2">{ANALYTICS.map((it) => <Row key={it.k} p={p} it={it} />)}</div>
      {validId(p.v, "ga4_id") && validId(p.v, "gtm_id") && <p className="mt-3 rounded-xl bg-amber-500/10 p-3 text-sm font-semibold text-amber-800">Both GA4 and Tag Manager are set. If GA4 is also inside your Tag Manager, clear one so visits are not counted twice.</p>}
    </SettingsCard>
  );
}
