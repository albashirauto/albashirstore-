"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Database, ExternalLink, PackagePlus } from "lucide-react";
import DateFilter from "@/components/admin/dashboard/DateFilter";
import InventoryAlerts from "@/components/admin/dashboard/InventoryAlerts";
import KpiGrid from "@/components/admin/dashboard/KpiGrid";
import { metrics } from "@/components/admin/dashboard/metrics";
import OrderPipeline from "@/components/admin/dashboard/OrderPipeline";
import QuickActions from "@/components/admin/dashboard/QuickActions";
import { inRange, presetRange, previous, ymd, type Preset } from "@/components/admin/dashboard/range";
import RecentActivity from "@/components/admin/dashboard/RecentActivity";
import RecentOrders from "@/components/admin/dashboard/RecentOrders";
import SalesOverview from "@/components/admin/dashboard/SalesOverview";
import SetupChecklist, { type Step } from "@/components/admin/dashboard/SetupChecklist";
import TopProducts from "@/components/admin/dashboard/TopProducts";
import type { DActivity, DOrder, DProduct } from "@/components/admin/dashboard/types";
import { browserClient } from "@/lib/supabase";

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-muted">{children}</h2>;
}

/** Admin home. Every number comes from the database; sections live in src/components/admin/dashboard/. */
export default function Dashboard() {
  const [orders, setOrders] = useState<DOrder[]>([]);
  const [products, setProducts] = useState<DProduct[]>([]);
  const [costs, setCosts] = useState<Map<string, number>>(new Map());
  const [activity, setActivity] = useState<DActivity[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [migrated, setMigrated] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const [preset, setPreset] = useState<Preset>("30d");
  const [custom, setCustom] = useState(() => ({ from: ymd(new Date(Date.now() - 6 * 86400000)), to: ymd(new Date()) }));

  useEffect(() => {
    const db = browserClient();
    (async () => {
      const [o, p, s, c, a] = await Promise.all([
        db.from("orders").select("*").order("created_at", { ascending: false }).limit(5000),
        db.from("products").select("*"),
        db.from("settings").select("key,value"),
        db.from("product_costs").select("product_id,cost_price"),
        db.from("activity").select("*").order("at", { ascending: false }).limit(12),
      ]);
      setOrders((o.data as DOrder[]) ?? []);
      setProducts((p.data as DProduct[]) ?? []);
      setSettings(Object.fromEntries(((s.data as { key: string; value: string }[]) ?? []).map((r) => [r.key, r.value ?? ""])));
      setCosts(new Map(((c.data as { product_id: string; cost_price: number | null }[]) ?? []).filter((r) => r.cost_price !== null).map((r) => [r.product_id, Number(r.cost_price)])));
      setActivity((a.data as DActivity[]) ?? []);
      setMigrated(!c.error && !a.error);
      setLoaded(true);
    })();
  }, []);

  const range = useMemo(() => presetRange(preset, custom), [preset, custom]);
  const firstOrder = useMemo(() => {
    const m = new Map<string, number>();
    orders.forEach((o) => { const t = new Date(o.created_at).getTime(); if (!m.has(o.phone) || t < m.get(o.phone)!) m.set(o.phone, t); });
    return m;
  }, [orders]);
  const cur = useMemo(() => metrics(orders, range, costs, firstOrder), [orders, range, costs, firstOrder]);
  const prev = useMemo(() => metrics(orders, previous(range), costs, firstOrder), [orders, range, costs, firstOrder]);
  const inPeriod = orders.filter((o) => inRange(o.created_at, range));

  const placeholder = (v?: string) => !v || /0000000/.test(v);
  const steps: Step[] = [
    { label: "Add your real phone & WhatsApp", done: !placeholder(settings.phone) && !placeholder(settings.whatsapp), href: "/admin/settings" },
    { label: "Add your 3 team contacts", done: !placeholder(settings.contact1_phone), href: "/admin/settings" },
    { label: "Add your first product", done: products.length > 0, href: "/admin/products" },
    { label: "Add cost prices (for profit)", done: products.length > 0 && costs.size >= products.length, href: "/admin/products" },
    { label: "Set a buy-X-get-Y scheme", done: products.some((p) => (p.scheme_buy ?? 0) > 0), href: "/admin/products" },
    { label: "Add social media links", done: Boolean(settings.facebook || settings.instagram || settings.tiktok), href: "/admin/settings" },
  ];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className={`space-y-8 transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-50"}`}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted">{new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          <h1 className="mt-1 text-4xl font-extrabold uppercase leading-none text-brand-900 dark:text-white md:text-5xl">{greet} 👋</h1>
          <p className="mt-1.5 text-muted">Here is how {settings.store_name || "your store"} is doing.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/" target="_blank" className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2.5 text-sm font-bold transition hover:border-brand-500"><ExternalLink size={16} />View store</Link>
          <Link href="/admin/products" className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"><PackagePlus size={16} />Add product</Link>
        </div>
      </div>

      {loaded && !migrated && (
        <div className="flex gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <Database size={20} className="shrink-0 text-amber-700" />
          <p><b>One more step:</b> run <code>supabase/002_dashboard.sql</code> in Supabase SQL Editor to turn on profit, payment status, returns, fitment checks and the activity log.</p>
        </div>
      )}

      <DateFilter preset={preset} setPreset={setPreset} custom={custom} setCustom={setCustom} range={range} />

      <KpiGrid m={cur} p={prev} totalProducts={products.length} liveProducts={products.filter((p) => p.active).length} />

      {loaded && <SetupChecklist steps={steps} />}

      <section>
        <Heading>Sales &amp; order status</Heading>
        <div className="grid gap-6 xl:grid-cols-[1.8fr_1fr]">
          <SalesOverview orders={orders} range={range} costs={costs} firstOrder={firstOrder} />
          <OrderPipeline orders={inPeriod} />
        </div>
      </section>

      <section>
        <Heading>Inventory alerts &amp; recent orders</Heading>
        <div className="grid gap-6 xl:grid-cols-[1fr_1.8fr]">
          <InventoryAlerts products={products} costs={costs} />
          <RecentOrders orders={orders} />
        </div>
      </section>

      <section>
        <Heading>Top products, quick actions &amp; activity</Heading>
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <TopProducts orders={orders} range={range} />
          <QuickActions />
          <RecentActivity items={activity} ready={migrated} />
        </div>
      </section>
    </div>
  );
}
