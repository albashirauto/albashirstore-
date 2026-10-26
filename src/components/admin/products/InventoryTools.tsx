"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Download, FileSpreadsheet, Upload, X } from "lucide-react";
import { browserClient } from "@/lib/supabase";
import { money } from "@/lib/format";
import { download, parseCsv, toCsv } from "@/lib/csv";

export type InvRow = { id: string; name: string; sku: string | null; price: number; compare_price?: number | null; stock: number | null; active: boolean };
type Change = { id: string; sku: string; name: string; price?: [number, number]; compare?: [number | null, number | null]; stock?: [number | null, number] };
const COLS = ["sku", "name", "price", "compare_price", "stock", "category", "brand", "live"];

/** Export the shown products, or update price / old price / stock in bulk from a CSV (matched by SKU), with a preview first. */
export function ExportButton({ rows, nameOf }: { rows: (InvRow & { category_id: string | null; brand_id: string | null })[]; nameOf: (id: string | null) => string }) {
  const go = () => download(`products-${new Date().toISOString().slice(0, 10)}.csv`, toCsv([COLS, ...rows.map((r) => [r.sku, r.name, r.price, r.compare_price ?? "", r.stock ?? "", nameOf(r.category_id), nameOf(r.brand_id), r.active ? "yes" : "no"])]));
  return <button onClick={go} disabled={!rows.length} className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2.5 text-sm font-bold transition hover:border-brand-500 disabled:opacity-50"><Download size={15} />Export CSV ({rows.length})</button>;
}

export function ImportCsv({ rows, onDone }: { rows: InvRow[]; onDone: (changed: InvRow[]) => void }) {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<{ changes: Change[]; unknown: string[]; bad: string[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const bySku = useMemo(() => new Map(rows.filter((r) => r.sku).map((r) => [r.sku!.trim().toUpperCase(), r])), [rows]);

  const read = async (f: File | undefined) => {
    setErr(""); setPlan(null);
    if (!f) return;
    const grid = parseCsv(await f.text());
    if (grid.length < 2) return setErr("The file has no rows.");
    const head = grid[0].map((h) => h.trim().toLowerCase().replace(/[^a-z_]/g, ""));
    const ix = (n: string[]) => head.findIndex((h) => n.includes(h));
    const iSku = ix(["sku", "partnumber", "code"]), iPrice = ix(["price", "saleprice"]), iCmp = ix(["compare_price", "compareprice", "oldprice", "old_price", "mrp"]), iStock = ix(["stock", "qty", "quantity"]);
    if (iSku < 0) return setErr('The first row must have a "sku" column (plus price, compare_price and/or stock).');
    if (iPrice < 0 && iStock < 0 && iCmp < 0) return setErr('Add at least one of these columns: price, compare_price, stock.');
    const n = (v?: string) => { const s = String(v ?? "").replace(/[^\d.]/g, ""); return s === "" ? null : Number(s); };
    const changes: Change[] = [], unknown: string[] = [], bad: string[] = [];
    for (const r of grid.slice(1)) {
      const sku = (r[iSku] ?? "").trim();
      if (!sku) continue;
      const p = bySku.get(sku.toUpperCase());
      if (!p) { unknown.push(sku); continue; }
      const c: Change = { id: p.id, sku, name: p.name };
      const price = iPrice >= 0 ? n(r[iPrice]) : null, cmp = iCmp >= 0 ? n(r[iCmp]) : undefined, stock = iStock >= 0 ? n(r[iStock]) : null;
      if (price !== null && (price <= 0 || price > 10000000)) { bad.push(`${sku}: price ${r[iPrice]}`); continue; }
      if (price !== null && price !== Number(p.price)) c.price = [Number(p.price), price];
      if (cmp !== undefined && (cmp ?? null) !== (p.compare_price ?? null)) c.compare = [p.compare_price ?? null, cmp];
      if (stock !== null && stock !== (p.stock ?? null)) c.stock = [p.stock, Math.round(stock)];
      if (c.price || c.compare || c.stock) changes.push(c);
    }
    setPlan({ changes, unknown, bad });
  };

  const apply = async () => {
    if (!plan?.changes.length) return;
    setBusy(true); setErr("");
    const db = browserClient(), done: InvRow[] = [];
    for (const c of plan.changes) {
      const v: Record<string, number | null> = {};
      if (c.price) v.price = c.price[1];
      if (c.compare) v.compare_price = c.compare[1];
      if (c.stock) v.stock = c.stock[1];
      const { error } = await db.from("products").update(v).eq("id", c.id);
      if (error) { setErr(`${c.sku}: ${error.message}`); break; }
      const old = rows.find((r) => r.id === c.id)!;
      done.push({ ...old, ...(v as Partial<InvRow>) });
    }
    setBusy(false);
    onDone(done);
    if (done.length === plan.changes.length) { setOpen(false); setPlan(null); }
  };
  const template = () => download("price-stock-template.csv", toCsv([["sku", "price", "compare_price", "stock"], ...rows.slice(0, 3).map((r) => [r.sku, r.price, r.compare_price ?? "", r.stock ?? ""])]));

  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-2.5 text-sm font-bold transition hover:border-brand-500"><Upload size={15} />Import prices / stock</button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[70] flex items-end justify-center bg-brand-900/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !busy && setOpen(false)}>
            <motion.div role="dialog" aria-label="Import prices and stock" onClick={(e) => e.stopPropagation()} className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-bg p-6 shadow-2xl sm:rounded-3xl" initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-2xl font-extrabold uppercase"><FileSpreadsheet className="text-green-600" />Import prices & stock</h2>
                  <p className="mt-1 text-sm text-muted">Upload a CSV from Excel with a <b>sku</b> column and any of <b>price</b>, <b>compare_price</b> (old price), <b>stock</b>. You see every change before anything is saved.</p>
                </div>
                <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-2 hover:bg-soft"><X size={18} /></button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={() => file.current?.click()} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white"><Upload size={15} />Choose CSV file</button>
                <button onClick={template} className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm font-bold"><Download size={15} />Download example</button>
                <input ref={file} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { read(e.target.files?.[0]); e.target.value = ""; }} />
              </div>
              {err && <p role="alert" className="mt-4 rounded-xl bg-hot/10 px-4 py-2.5 text-sm font-semibold text-hot">{err}</p>}
              {plan && (
                <div className="mt-5 space-y-3">
                  <p className="text-sm font-bold">{plan.changes.length} product{plan.changes.length === 1 ? "" : "s"} will change{plan.unknown.length ? ` · ${plan.unknown.length} SKU${plan.unknown.length === 1 ? "" : "s"} not found` : ""}{plan.bad.length ? ` · ${plan.bad.length} skipped` : ""}</p>
                  {plan.changes.length > 0 && (
                    <div className="max-h-72 overflow-auto rounded-xl border border-line">
                      <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-soft text-left text-xs uppercase text-muted"><tr><th className="px-3 py-2">Product</th><th className="px-3">Price</th><th className="px-3">Old price</th><th className="px-3">Stock</th></tr></thead>
                        <tbody className="divide-y divide-line">
                          {plan.changes.map((c) => (
                            <tr key={c.id}>
                              <td className="px-3 py-2"><b className="font-mono text-xs">{c.sku}</b><span className="block truncate text-xs text-muted">{c.name}</span></td>
                              <td className="px-3">{c.price ? <><s className="text-muted">{money(c.price[0])}</s> → <b>{money(c.price[1])}</b></> : "—"}</td>
                              <td className="px-3">{c.compare ? <>{c.compare[0] ? money(c.compare[0]) : "none"} → <b>{c.compare[1] ? money(c.compare[1]) : "none"}</b></> : "—"}</td>
                              <td className="px-3">{c.stock ? <>{c.stock[0] ?? "?"} → <b className={c.stock[1] > (c.stock[0] ?? 0) ? "text-green-700" : "text-hot"}>{c.stock[1]}</b></> : "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {plan.unknown.length > 0 && <p className="text-xs text-muted">Not found: {plan.unknown.slice(0, 15).join(", ")}{plan.unknown.length > 15 ? "…" : ""}</p>}
                  {plan.bad.length > 0 && <p className="text-xs text-hot">Skipped (bad value): {plan.bad.slice(0, 10).join(", ")}</p>}
                  <button onClick={apply} disabled={busy || !plan.changes.length} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-green-600 py-3 font-bold text-white disabled:opacity-50"><Check size={17} />{busy ? "Saving…" : `Apply ${plan.changes.length} change${plan.changes.length === 1 ? "" : "s"}`}</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Bulk price / stock change for the selected products. */
export function BulkEdit({ rows, ids, onDone }: { rows: InvRow[]; ids: string[]; onDone: (changed: InvRow[]) => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"price_pct" | "price_set" | "stock_set" | "stock_add">("price_pct");
  const [val, setVal] = useState("");
  const [busy, setBusy] = useState(false);
  const picked = rows.filter((r) => ids.includes(r.id));
  const n = Number(val);
  const next = (r: InvRow): Partial<InvRow> | null => {
    if (val.trim() === "" || !Number.isFinite(n)) return null;
    if (mode === "price_pct") return { price: Math.max(1, Math.round(Number(r.price) * (1 + n / 100))) };
    if (mode === "price_set") return n > 0 ? { price: Math.round(n) } : null;
    if (mode === "stock_set") return n >= 0 ? { stock: Math.round(n) } : null;
    return { stock: Math.max(0, (r.stock ?? 0) + Math.round(n)) };
  };
  const apply = async () => {
    setBusy(true);
    const db = browserClient(), done: InvRow[] = [];
    for (const r of picked) { const v = next(r); if (!v) continue; const { error } = await db.from("products").update(v).eq("id", r.id); if (!error) done.push({ ...r, ...v }); }
    setBusy(false); onDone(done); setOpen(false); setVal("");
  };
  const MODES = [["price_pct", "Price ± %", "e.g. 10 or -5"], ["price_set", "Set price", "Rs."], ["stock_set", "Set stock", "pieces"], ["stock_add", "Add / remove stock", "e.g. 20 or -3"]] as const;
  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-bold hover:bg-white/20">Edit price / stock</button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-brand-900/60 p-4 text-fg backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !busy && setOpen(false)}>
            <motion.div role="dialog" aria-label="Bulk edit" onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-3xl bg-bg p-6 shadow-2xl" initial={{ scale: 0.96 }} animate={{ scale: 1 }}>
              <h2 className="text-2xl font-extrabold uppercase">Change {picked.length} product{picked.length === 1 ? "" : "s"}</h2>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {MODES.map(([k, l]) => <button key={k} onClick={() => setMode(k)} className={`rounded-xl border-2 px-3 py-2 text-sm font-bold transition ${mode === k ? "border-brand-600 bg-brand-50 dark:bg-brand-900" : "border-line"}`}>{l}</button>)}
              </div>
              <input autoFocus inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value.replace(/[^\d.-]/g, ""))} placeholder={MODES.find((m) => m[0] === mode)![2]} className="mt-3 w-full rounded-xl border border-line bg-card px-4 py-3 text-lg font-bold outline-none focus:border-brand-500" />
              <ul className="mt-3 max-h-48 divide-y divide-line overflow-auto rounded-xl border border-line text-sm">
                {picked.map((r) => { const v = next(r); return (
                  <li key={r.id} className="flex justify-between gap-3 px-3 py-2"><span className="truncate">{r.name}</span>
                    <span className="shrink-0">{mode.startsWith("price") ? <>{money(r.price)}{v?.price !== undefined && <> → <b>{money(v.price)}</b></>}</> : <>{r.stock ?? 0}{v?.stock !== undefined && <> → <b>{v.stock}</b></>}</>}</span></li>
                ); })}
              </ul>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setOpen(false)} className="rounded-full border border-line px-5 py-2.5 font-bold">Cancel</button>
                <button onClick={apply} disabled={busy || !picked.some((r) => next(r))} className="flex-1 rounded-full bg-brand-600 py-2.5 font-bold text-white disabled:opacity-50">{busy ? "Saving…" : "Apply"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
