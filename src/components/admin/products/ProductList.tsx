"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Copy, Eye, EyeOff, Gift, ImageOff, PackagePlus, Pencil, Search, Trash2, X } from "lucide-react";
import { browserClient } from "@/lib/supabase";
import { money } from "@/lib/format";
import { isOut } from "@/lib/stock";
import { BulkEdit, ExportButton, ImportCsv, type InvRow } from "./InventoryTools";
import { analyze, fillVars, scoreTone } from "@/lib/seo";

type Row = {
  id: string; name: string; slug: string; sku: string | null; price: number; compare_price?: number | null; stock: number | null; images: string[] | null; active: boolean;
  stock_status?: "auto" | "in_stock" | "out_of_stock" | null; scheme_buy: number | null; scheme_free: number | null;
  category_id: string | null; brand_id: string | null; vehicle_id: string | null;
};
type SeoRow = { description?: string | null; details_html?: string | null; seo_title?: string | null; seo_description?: string | null; focus_keywords?: string | null; video_url?: string | null; specs?: { label: string; value: string }[] | null };
type Priv = { product_id: string; supplier_sku: string | null; location: string | null; reorder_level: number | null };
const PER = 20;

/** Product list: search (name, slug, SKU, supplier no., brand, category, bike), filters, live on/off switch. */
export default function ProductList() {
  const db = browserClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [priv, setPriv] = useState<Map<string, Priv>>(new Map());
  const [names, setNames] = useState<Map<string, string>>(new Map());
  const [cats, setCats] = useState<{ id: string; name: string; parent_id: string | null }[]>([]);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [site, setSite] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [stock, setStock] = useState("all");
  const [vis, setVis] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      const [p, c, b, v, x, st] = await Promise.all([
        db.from("products").select("*").order("created_at", { ascending: false }).limit(5000),
        db.from("categories").select("id,name,parent_id").order("sort_order"),
        db.from("brands").select("id,name"),
        db.from("vehicles").select("id,name"),
        db.from("product_costs").select("product_id,supplier_sku,location,reorder_level"),
        db.from("settings").select("key,value"),
      ]);
      setRows((p.data as Row[]) ?? []);
      setCats((c.data as { id: string; name: string; parent_id: string | null }[]) ?? []);
      setNames(new Map([...(c.data ?? []), ...(b.data ?? []), ...(v.data ?? [])].map((r: { id: string; name: string }) => [r.id, r.name])));
      setPriv(new Map(((x.data as Priv[]) ?? []).map((r) => [r.product_id, r])));
      setSite(Object.fromEntries(((st.data as { key: string; value: string }[]) ?? []).map((r) => [r.key, r.value ?? ""])));
      setLoaded(true);
    })();
  }, [db]);

  const catOf = (id: string | null) => cats.find((c) => c.id === id);
  /** [main category, sub-category] for a product */
  const catPair = (r: Row): [string, string] => {
    const c = catOf(r.category_id);
    if (!c) return ["", ""];
    const parent = c.parent_id ? catOf(c.parent_id) : null;
    return parent ? [parent.name, c.name] : [c.name, ""];
  };

  // same Rank Math-style score as the editor, for every row
  const seoScore = useMemo(() => {
    const m = new Map<string, number>();
    const mainKw = (r: Row & SeoRow) => (r.focus_keywords ?? "").split(",")[0].trim();
    rows.forEach((row) => {
      const r = row as Row & SeoRow;
      const ctx = { name: r.name, brand: names.get(r.brand_id ?? ""), category: names.get(r.category_id ?? ""), vehicle: names.get(r.vehicle_id ?? ""), price: r.price, sku: r.sku ?? undefined, sitename: site.store_name, sep: site.seo_separator };
      m.set(r.id, analyze({
        keywords: (r.focus_keywords ?? "").split(",").map((k) => k.trim()).filter(Boolean),
        title: fillVars(r.seo_title || site.seo_product_title || "%name% %sep% %sitename%", ctx),
        description: fillVars(r.seo_description || r.description || site.seo_product_description || "", ctx),
        slug: r.slug, name: r.name, shortDesc: r.description ?? "", html: r.details_html ?? "",
        images: r.images?.length ?? 0, video: !!r.video_url, specs: (r.specs ?? []).length,
        otherKeywords: rows.filter((o) => o.id !== r.id).map((o) => mainKw(o as Row & SeoRow)).filter(Boolean),
      }).score);
    });
    return m;
  }, [rows, names, site]);

  const low = (r: Row) => !isOut(r) && (r.stock_status ?? "auto") === "auto" && (r.stock ?? 0) <= (priv.get(r.id)?.reorder_level ?? 5);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (cat && r.category_id !== cat && catOf(r.category_id)?.parent_id !== cat) return false;
      if (vis === "live" && !r.active) return false;
      if (vis === "hidden" && r.active) return false;
      if (stock === "out" && !isOut(r)) return false;
      if (stock === "low" && !low(r)) return false;
      if (stock === "in" && isOut(r)) return false;
      if (!t) return true;
      const x = priv.get(r.id);
      return [r.name, r.slug, r.sku, x?.supplier_sku, x?.location, ...catPair(r), names.get(r.brand_id ?? ""), names.get(r.vehicle_id ?? "")]
        .filter(Boolean).join(" ").toLowerCase().includes(t);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, cat, stock, vis, priv, names]);

  const pages = Math.max(1, Math.ceil(shown.length / PER));
  const items = shown.slice((page - 1) * PER, page * PER);

  const toggleLive = async (r: Row) => {
    setRows((c) => c.map((x) => (x.id === r.id ? { ...x, active: !r.active } : x)));
    const { error } = await db.from("products").update({ active: !r.active }).eq("id", r.id);
    if (error) { alert(error.message); setRows((c) => c.map((x) => (x.id === r.id ? { ...x, active: r.active } : x))); }
  };

  const duplicate = async (r: Row) => {
    const { data: full } = await db.from("products").select("*").eq("id", r.id).single();
    const { data: priv } = await db.from("product_costs").select("*").eq("product_id", r.id).maybeSingle();
    if (!full) return;
    const { id: _id, created_at: _c, ...rest } = full as Record<string, unknown>;
    const stamp = Date.now().toString(36).slice(-4);
    const { data, error } = await db.from("products").insert({ ...rest, name: `${r.name} (copy)`, slug: `${r.slug}-copy-${stamp}`, sku: r.sku ? `${r.sku}-COPY` : null, active: false }).select("*").single();
    if (error) return alert(error.message);
    if (priv) { const { product_id: _p, ...pr } = priv as Record<string, unknown>; await db.from("product_costs").insert({ ...pr, product_id: (data as Row).id }); }
    setRows((c) => [data as Row, ...c]);
  };

  const removeMany = async (ids: string[]) => {
    const one = rows.find((r) => r.id === ids[0])?.name;
    if (!ids.length || !confirm(ids.length === 1 ? `Delete "${one}"? This cannot be undone.` : `Delete ${ids.length} products? This cannot be undone.`)) return;
    const { error } = await db.from("products").delete().in("id", ids);
    if (error) return alert(error.message);
    setRows((c) => c.filter((r) => !ids.includes(r.id)));
    setSel(new Set());
  };

  const setLive = async (ids: string[], active: boolean) => {
    const { error } = await db.from("products").update({ active }).in("id", ids);
    if (error) return alert(error.message);
    setRows((c) => c.map((r) => (ids.includes(r.id) ? { ...r, active } : r)));
    setSel(new Set());
  };

  // rows changed by import / bulk edit
  const merge = (changed: InvRow[]) => setRows((c) => c.map((r) => { const x = changed.find((y) => y.id === r.id); return x ? { ...r, ...x } : r; }));

  const chip = (on: boolean) => `rounded-full px-3 py-1.5 text-sm font-bold transition ${on ? "bg-brand-900 text-white dark:bg-white dark:text-brand-900" : "bg-card text-muted ring-1 ring-line hover:text-fg"}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold uppercase leading-none text-brand-900 dark:text-white md:text-5xl">Products</h1>
          <p className="mt-1.5 text-muted">{rows.length} products · {rows.filter((r) => r.active).length} live on the website</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportButton rows={shown} nameOf={(id) => names.get(id ?? "") ?? ""} />
          <ImportCsv rows={rows} onDone={merge} />
          <Link href="/admin/products/new" className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-bold text-white shadow-lg shadow-brand-600/25 transition hover:-translate-y-0.5 hover:bg-brand-700"><PackagePlus size={18} />Add product</Link>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-0 flex-1 basis-72 items-center gap-2 rounded-full border border-line bg-card px-4 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10">
          <Search size={18} className="shrink-0 text-muted" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="Search name, web address, SKU, supplier no., brand, category or bike" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted" />
          {q && <button onClick={() => setQ("")} aria-label="Clear" className="text-muted hover:text-fg"><X size={16} /></button>}
        </label>
        <select value={cat} onChange={(e) => { setCat(e.target.value); setPage(1); }} className="rounded-full border border-line bg-card px-4 py-3 text-sm font-semibold outline-none focus:border-brand-500" aria-label="Category">
          <option value="">All categories</option>
          {cats.filter((c) => !c.parent_id).map((m) => (
            <optgroup key={m.id} label={m.name}>
              <option value={m.id}>{m.name} (all)</option>
              {cats.filter((c) => c.parent_id === m.id).map((c) => <option key={c.id} value={c.id}>↳ {c.name}</option>)}
            </optgroup>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-muted">Stock:</span>
        {[["all", "All"], ["in", "In stock"], ["low", "Low"], ["out", "Out of stock"]].map(([k, l]) => <button key={k} onClick={() => { setStock(k); setPage(1); }} className={chip(stock === k)}>{l}</button>)}
        <span className="ml-3 font-semibold text-muted">Website:</span>
        {[["all", "All"], ["live", "Live"], ["hidden", "Hidden"]].map(([k, l]) => <button key={k} onClick={() => { setVis(k); setPage(1); }} className={chip(vis === k)}>{l}</button>)}
      </div>

      {sel.size > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-2xl bg-brand-900 px-4 py-3 text-sm text-white shadow-xl">
          <b className="mr-2">{sel.size} selected</b>
          <BulkEdit rows={rows} ids={[...sel]} onDone={(c) => { merge(c); setSel(new Set()); }} />
          <button onClick={() => setLive([...sel], true)} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-bold hover:bg-white/20"><Eye size={14} />Show on site</button>
          <button onClick={() => setLive([...sel], false)} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-bold hover:bg-white/20"><EyeOff size={14} />Hide</button>
          <button onClick={() => removeMany([...sel])} className="inline-flex items-center gap-1.5 rounded-full bg-hot px-3 py-1.5 font-bold hover:bg-hot-dark"><Trash2 size={14} />Delete</button>
          <button onClick={() => setSel(new Set())} className="ml-auto font-semibold text-white/70 hover:text-white">Clear</button>
        </div>
      )}

      {!loaded ? <p className="py-10 text-center text-muted">Loading…</p> : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-16 text-center">
          <p className="font-semibold">{rows.length ? "No products match" : "No products yet"}</p>
          <Link href="/admin/products/new" className="mt-3 inline-flex items-center gap-1.5 font-bold text-brand-600 hover:text-hot"><PackagePlus size={16} />Add your first product</Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="border-b border-line bg-soft/60 text-left text-xs uppercase tracking-wider text-muted">
              <tr><th className="w-10 pl-4"><input type="checkbox" aria-label="Select all on this page" checked={items.length > 0 && items.every((r) => sel.has(r.id))} onChange={(e) => setSel((cur) => { const n = new Set(cur); items.forEach((r) => (e.target.checked ? n.add(r.id) : n.delete(r.id))); return n; })} className="h-4 w-4 accent-brand-600" /></th><th className="px-3 py-3 font-semibold">Product</th><th className="px-3 font-semibold">Category</th><th className="px-3 font-semibold">Sub-category</th><th className="px-3 text-right font-semibold">Price</th><th className="px-3 font-semibold">Stock</th><th className="px-3 font-semibold">SEO</th><th className="px-3 font-semibold">Website</th><th /></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((r) => {
                const out = isOut(r), lo = low(r), x = priv.get(r.id);
                return (
                  <tr key={r.id} className={`transition hover:bg-soft/50 ${sel.has(r.id) ? "bg-brand-50/60 dark:bg-brand-900/40" : ""}`}>
                    <td className="pl-4"><input type="checkbox" aria-label={`Select ${r.name}`} checked={sel.has(r.id)} onChange={() => setSel((cur) => { const n = new Set(cur); if (n.has(r.id)) n.delete(r.id); else n.add(r.id); return n; })} className="h-4 w-4 accent-brand-600" /></td>
                    <td className="px-3 py-3">
                      <Link href={`/admin/products/${r.id}`} className="flex items-center gap-3">
                        <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-soft text-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {r.images?.[0] ? <img src={r.images[0]} alt="" className="h-full w-full object-cover" /> : <ImageOff size={18} />}
                        </span>
                        <span className="min-w-0">
                          <span className="block max-w-xs truncate font-bold hover:text-brand-600">{r.name}</span>
                          <span className="block truncate text-xs text-muted">{r.sku ?? "no SKU"}{x?.location ? ` · ${x.location}` : ""}{names.get(r.brand_id ?? "") ? ` · ${names.get(r.brand_id ?? "")}` : ""}</span>
                        </span>
                        {(r.scheme_buy ?? 0) > 0 && <span title="Has a scheme" className="text-green-600"><Gift size={15} /></span>}
                      </Link>
                    </td>
                    <td className="px-3 font-semibold">{catPair(r)[0] || <span className="font-normal text-muted">—</span>}</td>
                    <td className="px-3 text-muted">{catPair(r)[1] || "—"}</td>
                    <td className="px-3 text-right font-bold">{money(r.price)}</td>
                    <td className="px-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${out ? "bg-hot/10 text-hot" : lo ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>
                        {out ? "Out" : r.stock_status === "in_stock" ? "In stock" : `${r.stock ?? 0} ${lo ? "low" : "in stock"}`}
                      </span>
                    </td>
                    <td className="px-3">
                      {(() => { const sc = seoScore.get(r.id) ?? 0; const t = scoreTone(sc); return <Link href={`/admin/products/${r.id}#seo`} title={`SEO: ${t.label}`} className={`rounded-full px-2.5 py-1 text-xs font-bold ${t.bg} ${t.text}`}>{sc}</Link>; })()}
                    </td>
                    <td className="px-3">
                      <button onClick={() => toggleLive(r)} aria-label={r.active ? "Hide from website" : "Show on website"} className="flex items-center gap-2">
                        <span className={`relative h-5 w-9 rounded-full transition ${r.active ? "bg-brand-600" : "bg-line"}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${r.active ? "left-[18px]" : "left-0.5"}`} /></span>
                        <span className="text-xs font-semibold text-muted">{r.active ? "Live" : "Hidden"}</span>
                      </button>
                    </td>
                    <td className="px-4">
                      <div className="flex justify-end gap-1">
                        <Link href={`/admin/products/${r.id}`} title="Edit" className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900"><Pencil size={15} /></Link>
                        <button onClick={() => duplicate(r)} title="Duplicate" className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900"><Copy size={15} /></button>
                        <button onClick={() => removeMany([r.id])} title="Delete" className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-hot/10 hover:text-hot"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {shown.length > PER && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted">Showing <b className="text-fg">{(page - 1) * PER + 1}–{(page - 1) * PER + items.length}</b> of {shown.length}</p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((x) => Math.max(1, x - 1))} disabled={page === 1} aria-label="Previous" className="grid h-9 w-9 place-items-center rounded-full border border-line disabled:opacity-40"><ChevronLeft size={16} /></button>
            <span className="font-semibold">Page {page} of {pages}</span>
            <button onClick={() => setPage((x) => Math.min(pages, x + 1))} disabled={page === pages} aria-label="Next" className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-white disabled:opacity-40"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
