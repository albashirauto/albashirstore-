"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Check, Copy, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { browserClient } from "@/lib/supabase";
import { analyze, fillVars, type VarCtx } from "@/lib/seo";
import { isOut } from "@/lib/stock";
import { ScorePill } from "./seo/ScoreRing";
import { emptyP, emptyX, fromPriv, fromRow, toRows, type Opt, type Options, type P, type X } from "./model";
import QuickCreate, { type QuickKind } from "./QuickCreate";
import BasicInfo from "./sections/BasicInfo";
import Bundle from "./sections/Bundle";
import Descriptions from "./sections/Descriptions";
import Media from "./sections/Media";
import PricingStock from "./sections/PricingStock";
import SellerPurchase from "./sections/SellerPurchase";
import Seo from "./sections/Seo";
import Specs from "./sections/Specs";
import Variants from "./sections/Variants";
import Visibility from "./sections/Visibility";

const NAV = [
  { id: "basic", label: "Basic info" }, { id: "media", label: "Images & video" }, { id: "pricing", label: "Pricing & stock" },
  { id: "seller", label: "Seller & purchase" }, { id: "descriptions", label: "Descriptions" }, { id: "specs", label: "Specifications" },
  { id: "variants", label: "Variants" }, { id: "bundle", label: "Bundle" }, { id: "seo", label: "SEO" }, { id: "visibility", label: "Visibility" },
];

/** Full product editor: one long page, sticky section menu, sticky save bar. Sections live in ./sections/. */
export default function ProductEditor({ id }: { id: string }) {
  const router = useRouter();
  const db = browserClient();
  const isNew = id === "new";
  const [p, setP] = useState<P>(emptyP());
  const [x, setXState] = useState<X>(emptyX());
  const [saved, setSaved] = useState("");
  const [opts, setOpts] = useState<Options>({ categories: [], brands: [], vehicles: [], promotions: [], products: [] });
  const [loading, setLoading] = useState(!isNew);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [active, setActive] = useState("basic");
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [quick, setQuick] = useState<{ kind: QuickKind; parent?: string } | null>(null);
  const [site, setSite] = useState<Record<string, string>>({});
  const [otherKw, setOtherKw] = useState<string[]>([]);

  const set = (v: Partial<P>) => setP((c) => ({ ...c, ...v }));
  const setX = (v: Partial<X>) => setXState((c) => ({ ...c, ...v }));
  const snapshot = useMemo(() => JSON.stringify([p, x]), [p, x]);
  const dirty = snapshot !== saved;
  const flash = (ok: boolean, t: string) => { setMsg({ ok, t }); setTimeout(() => setMsg(null), 3500); };

  // dropdown options
  const loadOpts = async () => {
    const [c, b, v, pr, ps] = await Promise.all([
      db.from("categories").select("id,name,parent_id").order("sort_order"),
      db.from("brands").select("id,name").order("name"),
      db.from("vehicles").select("id,name,type").order("sort_order"),
      db.from("promotions").select("id,title").order("sort_order"),
      db.from("products").select("id,name,price,sku").order("name"),
    ]);
    setOpts({
      categories: (c.data as Opt[]) ?? [], brands: (b.data as Opt[]) ?? [], vehicles: (v.data as Opt[]) ?? [],
      promotions: ((pr.data as { id: string; title: string }[]) ?? []).map((r) => ({ id: r.id, name: r.title })),
      products: (ps.data as Options["products"]) ?? [],
    });
  };

  // store name + SEO templates, and main keywords other products already use (for the "unique keyword" check)
  useEffect(() => {
    db.from("settings").select("key,value").then(({ data }: { data: { key: string; value: string }[] | null }) => setSite(Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? ""]))));
    db.from("products").select("id,focus_keywords").then(({ data, error }: { data: { id: string; focus_keywords: string | null }[] | null; error: unknown }) => {
      if (!error) setOtherKw((data ?? []).filter((r) => r.id !== id && r.focus_keywords).map((r) => r.focus_keywords!.split(",")[0].trim()));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const nameOf = (list: Opt[], v: string) => list.find((o) => o.id === v)?.name;
  const ctx: VarCtx = {
    name: p.name || "Product name", brand: nameOf(opts.brands, p.brand_id), category: nameOf(opts.categories, p.category_id),
    vehicle: nameOf(opts.vehicles, p.vehicle_id), price: Number(p.price) || 0, sku: p.sku, sitename: site.store_name, sep: site.seo_separator,
  };
  const tpl = { title: site.seo_product_title || "%name% %sep% %sitename%", desc: site.seo_product_description || "Buy %name% for %vehicle% at %price%. Genuine quality, checked before dispatch, delivered across Pakistan." };
  const seo = useMemo(() => analyze({
    keywords: p.focus_keywords.split(",").map((k) => k.trim()).filter(Boolean),
    title: fillVars(p.seo_title || tpl.title, ctx), description: fillVars(p.seo_description || p.description || tpl.desc, ctx),
    slug: p.slug, name: p.name, shortDesc: p.description, html: p.details_html,
    images: p.images.length, video: !!p.video_url, specs: p.specs.filter((s) => s.label && s.value).length, otherKeywords: otherKw,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [p, site, otherKw, opts]);
  const inStock = !isOut({ stock: Number(p.stock), stock_status: p.stock_status });

  useEffect(() => {
    loadOpts();
    (async () => {
      if (isNew) { setSaved(JSON.stringify([emptyP(), emptyX()])); return; }
      const [{ data: row, error }, { data: priv }] = await Promise.all([
        db.from("products").select("*").eq("id", id).maybeSingle(),
        db.from("product_costs").select("*").eq("product_id", id).maybeSingle(),
      ]);
      if (error || !row) { flash(false, "Product not found."); setLoading(false); return; }
      const fp = fromRow(row), fx = fromPriv(priv);
      setP(fp); setXState(fx); setSaved(JSON.stringify([fp, fx])); setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // highlight the section in view
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-section]"));
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: "-20% 0px -70% 0px" });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [loading]);

  // warn before leaving with unsaved changes
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!p.name.trim()) return flash(false, "Add a product name.");
    if (!p.price) return flash(false, "Add a price.");
    setBusy(true);
    const { product, priv } = toRows(p, x);
    const res = isNew
      ? await db.from("products").insert(product).select("id").single()
      : await db.from("products").update(product).eq("id", id).select("id").single();
    if (res.error) {
      setBusy(false);
      const m = res.error.message;
      return flash(false, m.includes("duplicate") ? "That web address (slug) or SKU is already used." : m.includes("column") ? "Run supabase/005_products.sql first (adds the new fields)." : m);
    }
    const pid = res.data.id as string;
    const r2 = await db.from("product_costs").upsert({ product_id: pid, ...priv });
    setBusy(false);
    if (r2.error) flash(false, `Saved, but private details failed: ${r2.error.message}`);
    else flash(true, isNew ? "Product added" : "Saved");
    setSaved(snapshot);
    if (isNew) router.replace(`/admin/products/${pid}`);
  };

  const duplicate = async () => {
    if (dirty && !confirm("You have unsaved changes. Duplicate the last saved version?")) return;
    const { product, priv } = toRows(p, x);
    const stamp = Date.now().toString(36).slice(-4);
    const { data, error } = await db.from("products").insert({ ...product, name: `${product.name} (copy)`, slug: `${product.slug}-copy-${stamp}`, sku: product.sku ? `${product.sku}-COPY` : null, active: false }).select("id").single();
    if (error) return flash(false, error.message);
    await db.from("product_costs").upsert({ product_id: data.id, ...priv });
    router.push(`/admin/products/${data.id}`);
  };

  const remove = async () => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    const { error } = await db.from("products").delete().eq("id", id);
    if (error) return flash(false, error.message);
    setSaved(snapshot);
    router.push("/admin/products");
  };

  const onCreated = (kind: QuickKind, row: Opt) => {
    setQuick(null);
    loadOpts();
    if (kind === "category" || kind === "subcategory") set({ category_id: row.id });
    if (kind === "brand") set({ brand_id: row.id });
    if (kind === "vehicle") set({ vehicle_id: row.id });
    if (kind === "promotion") set({ promotion_id: row.id });
    flash(true, `${row.name} added`);
  };

  if (loading) return <div className="grid place-items-center py-32"><Loader2 className="animate-spin text-brand-500" size={36} /></div>;

  return (
    <form onSubmit={save} className="pb-28">
      {/* header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-hot"><ArrowLeft size={15} />All products</Link>
          <h1 className="mt-1 text-4xl font-extrabold uppercase leading-none text-brand-900 dark:text-white">{isNew ? "Add product" : p.name || "Edit product"}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted">
            {!isNew && <span>{p.active ? "Live on the website" : "Hidden from the website"}{p.sku ? ` · ${p.sku}` : ""}</span>}
            <button type="button" onClick={() => document.getElementById("seo")?.scrollIntoView({ behavior: "smooth" })}><ScorePill score={seo.score} /></button>
          </p>
        </div>
        {!isNew && (
          <div className="flex flex-wrap gap-2">
            {p.active && <a href={`/products/${p.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 text-sm font-bold transition hover:border-brand-500"><ExternalLink size={15} />View on site</a>}
            <button type="button" onClick={duplicate} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-4 py-2 text-sm font-bold transition hover:border-brand-500"><Copy size={15} />Duplicate</button>
            <button type="button" onClick={remove} className="inline-flex items-center gap-1.5 rounded-full border border-hot/30 bg-card px-4 py-2 text-sm font-bold text-hot transition hover:bg-hot hover:text-white"><Trash2 size={15} />Delete</button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[210px_1fr]">
        {/* section menu */}
        <nav className="hidden lg:block">
          <ul className="sticky top-6 space-y-1">
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(n.id)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                  className={`relative block rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${active === n.id ? "text-brand-600" : "text-fg/70 hover:bg-card hover:text-fg"}`}>
                  {active === n.id && <motion.span layoutId="editor-nav" className="absolute inset-0 -z-10 rounded-xl bg-brand-50 dark:bg-brand-900" transition={{ type: "spring", stiffness: 450, damping: 36 }} />}
                  <span className="flex items-center justify-between gap-2">{n.label}{n.id === "seo" && <span className={`rounded-full px-1.5 text-[10px] ${seo.score >= 81 ? "bg-green-100 text-green-800" : seo.score >= 51 ? "bg-amber-100 text-amber-800" : "bg-hot/10 text-hot"}`}>{seo.score}</span>}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-6">
          <BasicInfo p={p} set={set} opts={opts} quick={(kind, parent) => setQuick({ kind, parent })} slugTouched={slugTouched} setSlugTouched={setSlugTouched} />
          <Media p={p} set={set} />
          <PricingStock p={p} set={set} x={x} setX={setX} />
          <SellerPurchase x={x} setX={setX} />
          <Descriptions p={p} set={set} />
          <Specs p={p} set={set} />
          <Variants p={p} set={set} />
          <Bundle p={p} set={set} opts={opts} />
          <Seo p={p} set={set} ctx={ctx} tpl={tpl} result={seo} inStock={inStock} />
          <Visibility p={p} set={set} opts={opts} quick={(kind) => setQuick({ kind })} />
        </div>
      </div>

      {/* save bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/95 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 md:px-8">
          <AnimatePresence mode="wait">
            {msg ? (
              <motion.p key="m" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`flex items-center gap-1.5 text-sm font-bold ${msg.ok ? "text-green-600" : "text-hot"}`}>{msg.ok && <Check size={16} />}{msg.t}</motion.p>
            ) : (
              <motion.p key="d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted">{dirty ? "You have unsaved changes" : "All changes saved"}</motion.p>
            )}
          </AnimatePresence>
          <div className="ml-auto flex gap-2">
            <Link href="/admin/products" className="rounded-full border border-line px-5 py-2.5 text-sm font-bold transition hover:bg-card">Close</Link>
            <button disabled={busy || (!dirty && !isNew)} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-7 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-50">
              {busy && <Loader2 size={15} className="animate-spin" />}{isNew ? "Add product" : "Save changes"}
            </button>
          </div>
        </div>
      </div>

      <QuickCreate kind={quick?.kind ?? null} defaultParent={quick?.parent} parents={opts.categories.filter((c) => !c.parent_id)} onClose={() => setQuick(null)} onCreated={onCreated} />
    </form>
  );
}
