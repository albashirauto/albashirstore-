"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import { BarChart3, HardDrive, Image as ImageIcon, Landmark, Loader2, MapPin, Megaphone, Search, Share2, Store, Users } from "lucide-react";
import { AnalyticsSection, VerificationSection } from "@/components/admin/settings/Tracking";
import { BrandingSection, LocationSection, PaymentsSection, SeoSection, SiteTextSection, SocialSection, StorageSection, StoreSection, TeamSection } from "@/components/admin/settings/Sections";
import Feeds from "@/components/admin/settings/Feeds";
import type { CardProps, Vals } from "@/components/admin/settings/SettingsCard";
import { browserClient } from "@/lib/supabase";
import { SOCIAL_KEYS } from "@/lib/social";

const TABS = [
  { k: "store", l: "Store & contact", icon: Store, C: StoreSection, keys: /^(store_name|tagline|phone|whatsapp|email|open_hours)$/ },
  { k: "brand", l: "Logo & favicon", icon: ImageIcon, C: BrandingSection, keys: /^(logo|logo_dark|favicon)$/ },
  { k: "team", l: "Owners & phones", icon: Users, C: TeamSection, keys: /^(contact\d_|owners_)/ },
  { k: "social", l: "Social media", icon: Share2, C: SocialSection, keys: new RegExp(`^(${[...SOCIAL_KEYS, "social_custom"].join("|")})$`) },
  { k: "location", l: "Location", icon: MapPin, C: LocationSection, keys: /^(address|map_link|latitude|longitude)$/ },
  { k: "payments", l: "Delivery & payments", icon: Landmark, C: PaymentsSection, keys: /^(shipping_|pickup_|cod_|jazzcash_|easypaisa_|bank_)/ },
  { k: "text", l: "Site text", icon: Megaphone, C: SiteTextSection, keys: /^announcement$/ },
  { k: "storage", l: "Storage & uploads", icon: HardDrive, C: StorageSection, keys: /^(storage_|upload_max_mb|image_max_px)$/ },
  { k: "seo", l: "SEO & site files", icon: Search, C: SeoTab, keys: /^(seo_|ai_crawlers)/ },
  { k: "tracking", l: "Verification & analytics", icon: BarChart3, C: TrackingTab, keys: /^(google_site_verification|bing_|yandex_|pinterest_|facebook_domain|ga4_|gtm_|meta_pixel|tiktok_pixel|clarity_)/ },
] as const;
type TabKey = (typeof TABS)[number]["k"];

function SeoTab(p: CardProps) {
  return <div className="space-y-6"><SeoSection {...p} /><Feeds /></div>;
}

function TrackingTab(p: CardProps) {
  return <div className="space-y-6"><VerificationSection {...p} /><AnalyticsSection {...p} /></div>;
}

/**
 * Store settings. Desktop: tabs in a sticky column on the left (all always visible).
 * Phone: one scrolling row that keeps the chosen tab in view. Every card saves its own fields.
 */
export default function Settings() {
  const [v, setV] = useState<Vals>({});
  const [saved, setSaved] = useState<Vals>({});
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<TabKey>("store");
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("tab");
    if (t && TABS.some((x) => x.k === t)) setTab(t as TabKey);
    browserClient().from("settings").select("key,value").then(({ data }: { data: { key: string; value: string }[] | null }) => {
      const m = Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? ""]));
      setV(m); setSaved(m); setLoaded(true);
    });
  }, []);

  // phone row: bring the chosen tab into view
  useEffect(() => {
    rowRef.current?.querySelector<HTMLElement>(`[data-tab="${tab}"]`)?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [tab]);

  const props: CardProps = {
    v, saved,
    set: (k, val) => setV((x) => ({ ...x, [k]: val })),
    onSaved: (keys) => setSaved((s) => ({ ...s, ...Object.fromEntries(keys.map((k) => [k, (v[k] ?? "").trim()])) })),
  };
  const unsaved = (re: RegExp) => Object.keys(v).some((key) => re.test(key) && (v[key] ?? "") !== (saved[key] ?? ""));
  const Active = TABS.find((t) => t.k === tab)!.C;
  const dot = (t: (typeof TABS)[number], on: boolean) => unsaved(t.keys) && <span className={`ml-auto h-2 w-2 shrink-0 rounded-full ${on ? "bg-white" : "bg-amber-500"}`} title="Unsaved changes" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold uppercase leading-none text-brand-900 dark:text-white sm:text-4xl md:text-5xl">Settings</h1>
        <p className="mt-1.5 text-muted">Store details, logo, team, location, payments, storage, SEO and analytics. Each card has its own Save button.</p>
      </div>

      {/* phone / tablet: one scrolling row */}
      <div className="sticky top-14 z-20 -mx-4 bg-soft/90 px-4 py-2 backdrop-blur lg:hidden">
        <div ref={rowRef} className="flex gap-1 overflow-x-auto rounded-2xl border border-line bg-card p-1.5 scrollbar-none [mask-image:linear-gradient(90deg,transparent,#000_16px,#000_calc(100%-16px),transparent)]">
          {TABS.map((t) => (
            <button key={t.k} data-tab={t.k} onClick={() => setTab(t.k)} className={`relative flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition-colors ${tab === t.k ? "text-white" : "text-fg/70"}`}>
              {tab === t.k && <motion.span layoutId="settings-tab-row" className="absolute inset-0 rounded-xl bg-brand-600" transition={{ type: "spring", stiffness: 450, damping: 36 }} />}
              <t.icon size={15} className="relative" /><span className="relative">{t.l}</span>
              <span className="relative">{dot(t, tab === t.k)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        {/* desktop: sticky column */}
        <nav className="hidden lg:block" aria-label="Settings sections">
          <ul className="sticky top-6 space-y-1 rounded-2xl border border-line bg-card p-2">
            {TABS.map((t) => {
              const on = tab === t.k;
              return (
                <li key={t.k}>
                  <button onClick={() => setTab(t.k)} aria-current={on ? "page" : undefined}
                    className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition-colors ${on ? "text-white" : "text-fg/75 hover:bg-soft hover:text-fg"}`}>
                    {on && <motion.span layoutId="settings-tab-col" className="absolute inset-0 rounded-xl bg-brand-600 shadow-md shadow-brand-600/25" transition={{ type: "spring", stiffness: 450, damping: 36 }} />}
                    <t.icon size={17} className={`relative shrink-0 ${on ? "" : "text-muted"}`} />
                    <span className="relative">{t.l}</span>
                    <span className="relative ml-auto">{dot(t, on)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0">
          {!loaded ? (
            <div className="grid place-items-center py-24"><Loader2 className="animate-spin text-brand-500" size={32} /></div>
          ) : (
            <motion.div key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              <Active {...props} />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
