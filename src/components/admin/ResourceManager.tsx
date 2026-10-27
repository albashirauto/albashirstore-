"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Inbox, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { browserClient } from "@/lib/supabase";
import { refreshAfterEdit } from "./ResourceForm";
import type { Resource } from "@/lib/admin-config";
import { analyze, entityInput, scoreTone, type SeoEntity } from "@/lib/seo";

type Row = Record<string, any>;
type Opts = Record<string, { value: string; label: string }[]>;

const SAVED: Record<string, string> = { added: "Added", saved: "Saved", deleted: "Deleted" };

/** List of any table in RESOURCES. Add / edit open their own page (ResourceForm at /admin/<resource>/new or /<id>). */
export default function ResourceManager({ resource: R, slug }: { resource: Resource; slug: string }) {
  const db = browserClient();
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState<Opts>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [sitename, setSitename] = useState<string | undefined>();

  const flash = (ok: boolean, text: string) => { setMsg({ ok, text }); setTimeout(() => setMsg(null), 3500); };
  const href = (id: string) => `/admin/${slug}/${id}`;

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await db.from(R.table).select("*").order(R.orderBy, { ascending: R.ascending ?? true }).limit(1000);
    if (error) flash(false, error.message);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }, [db, R]);

  useEffect(() => { load(); setQ(""); }, [load]);

  // ?saved=… after the form page; ?edit=<id> (old links, e.g. the live page's SEO button) opens that row's page
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const edit = sp.get("edit"), saved = sp.get("saved");
    if (edit) return router.replace(href(edit));
    if (saved && SAVED[saved]) { flash(true, SAVED[saved]); window.history.replaceState(null, "", window.location.pathname); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!R.seo) return;
    db.from("settings").select("value").eq("key", "store_name").maybeSingle().then(({ data }: { data: { value: string } | null }) => setSitename(data?.value || undefined));
  }, [db, R]);
  const seoScore = (r: Row) => (R.seo ? analyze(entityInput(R.seo, r as SeoEntity, rows as SeoEntity[], sitename)).score : 0);

  // names for relation columns
  useEffect(() => {
    const rel = new Map<string, string>();
    R.columns.forEach((c) => c.relation && rel.set(c.relation.table, c.relation.label));
    (async () => {
      const out: Opts = {};
      for (const [table, label] of rel) {
        const { data } = await db.from(table).select(`id,${label}`).order(label, { ascending: true });
        out[table] = ((data as any[]) ?? []).map((d) => ({ value: d.id, label: d[label] }));
      }
      setOpts(out);
    })();
  }, [db, R]);

  const filtered = useMemo(() => rows.filter((r) => !q || String(r[R.searchKey] ?? "").toLowerCase().includes(q.toLowerCase())), [rows, q, R]);

  const remove = async (r: Row) => {
    if (!confirm(`Delete "${r[R.searchKey]}"? This cannot be undone.`)) return;
    const { error } = await db.from(R.table).delete().eq("id", r.id);
    if (error) return flash(false, error.message);
    flash(true, "Deleted");
    refreshAfterEdit(db);
    load();
  };

  const toggle = async (r: Row, key: string) => {
    setRows((cur) => cur.map((x) => (x.id === r.id ? { ...x, [key]: !r[key] } : x)));
    const { error } = await db.from(R.table).update({ [key]: !r[key] }).eq("id", r.id);
    if (error) { flash(false, error.message); load(); } else refreshAfterEdit(db);
  };

  const label = (table: string, id: string) => opts[table]?.find((o) => o.value === id)?.label ?? "";
  const input = "w-full rounded-xl border-2 border-line bg-card px-4 py-2.5 outline-none transition focus:border-brand-500";

  const cols = R.columns.length + (R.seo ? 2 : 1);
  const live = rows.filter((r) => r.active !== false).length;
  const iconBtn = "grid h-9 w-9 place-items-center rounded-xl border transition active:scale-90";
  const editBtn = `${iconBtn} border-brand-100 bg-brand-50 text-brand-600 hover:border-brand-600 hover:bg-brand-600 hover:text-white dark:border-brand-900 dark:bg-brand-900/60 dark:text-brand-100`;
  const delBtn = `${iconBtn} border-hot/15 bg-hot/5 text-hot hover:border-hot hover:bg-hot hover:text-white`;
  const imgCol = R.columns.find((c) => c.kind === "image");
  const firstImg = (r: Row) => (imgCol ? (Array.isArray(r[imgCol.key]) ? r[imgCol.key][0] : r[imgCol.key]) : null);
  const text = (r: Row, c: Resource["columns"][number]) =>
    c.kind === "money" ? `Rs. ${Number(r[c.key] ?? 0).toLocaleString("en-PK")}` : c.kind === "relation" ? label(c.relation!.table, r[c.key]) : r[c.key] == null ? "" : String(r[c.key]);
  const Switch = ({ r, c }: { r: Row; c: Resource["columns"][number] }) => (
    <button onClick={(e) => { e.stopPropagation(); toggle(r, c.key); }} aria-label={`Toggle ${c.label}`} title={r[c.key] ? "On: click to turn off" : "Off: click to turn on"} className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 align-middle transition ${r[c.key] ? "bg-green-500 shadow-inner shadow-green-700/30" : "bg-line"}`}><span className={`block h-5 w-5 rounded-full bg-white shadow transition ${r[c.key] ? "translate-x-5" : ""}`} /></button>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-3xl font-extrabold sm:text-4xl uppercase text-brand-700 dark:text-white">
            {R.title}
            {!loading && <span className="rounded-full bg-brand-50 px-3 py-1 font-sans text-sm font-bold normal-case text-brand-700 dark:bg-brand-900 dark:text-brand-100">{rows.length} total{"active" in (rows[0] ?? {}) ? ` · ${live} live` : ""}</span>}
          </h1>
          <p className="mt-1 max-w-xl text-muted">{R.description}</p>
        </div>
        <Link href={href("new")} className="group flex shrink-0 items-center justify-center gap-2 max-sm:w-full rounded-full bg-gradient-to-r from-hot to-hot-dark px-6 py-3 font-bold text-white shadow-lg shadow-hot/25 transition hover:-translate-y-0.5 hover:shadow-hot/40 active:translate-y-0">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-white/20 transition group-hover:rotate-90"><Plus size={16} /></span>Add {R.singular}
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${R.title.toLowerCase()}…`} className={`${input} pl-10 pr-10`} />
          {q && <button onClick={() => setQ("")} aria-label="Clear search" className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-soft text-muted transition hover:bg-line hover:text-fg"><X size={14} /></button>}
        </div>
        {q && !loading && <span className="text-sm text-muted">{filtered.length} of {rows.length}</span>}
      </div>

      {/* phones: one card per row */}
      <ul className="mt-5 space-y-2.5 md:hidden">
        {loading && Array.from({ length: 3 }).map((_, i) => <li key={i} className="h-20 animate-pulse rounded-2xl bg-card" />)}
        {!loading && filtered.length === 0 && (
          <li className="rounded-2xl border border-dashed border-line bg-card p-8 text-center">
            <p className="font-bold">{q ? `No ${R.title.toLowerCase()} match “${q}”` : "Nothing here yet"}</p>
            {!q && <Link href={href("new")} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white"><Plus size={16} />Add the first {R.singular}</Link>}
          </li>
        )}
        {!loading && filtered.map((r, i) => {
          const img = firstImg(r);
          const others = R.columns.filter((c) => c.kind !== "image" && c.kind !== "bool" && c.key !== R.searchKey).map((c) => text(r, c)).filter(Boolean);
          const bools = R.columns.filter((c) => c.kind === "bool");
          return (
            <motion.li key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: Math.min(i, 10) * 0.03 }}
              className="rounded-2xl border border-line bg-card p-3 shadow-sm">
              <div className="flex items-center gap-3">
                <Link href={href(r.id)} className="flex min-w-0 flex-1 items-center gap-3">
                  {imgCol && (img ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={img} alt="" className="h-14 w-14 shrink-0 rounded-xl border border-line bg-white object-cover" /> : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-soft text-xs text-muted">—</span>)}
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{String(r[R.searchKey] ?? "") || "Untitled"}</span>
                    {others.length > 0 && <span className="block truncate text-xs text-muted">{others.join(" · ")}</span>}
                  </span>
                </Link>
                <Link href={href(r.id)} aria-label="Edit" className={editBtn}><Pencil size={16} /></Link>
                <button onClick={() => remove(r)} aria-label="Delete" className={delBtn}><Trash2 size={16} /></button>
              </div>
              {(bools.length > 0 || R.seo) && (
                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-2.5 text-xs font-semibold text-muted">
                  {bools.map((c) => <span key={c.key} className="flex items-center gap-2"><Switch r={r} c={c} />{c.label}</span>)}
                  {R.seo && (() => { const sc = seoScore(r), t = scoreTone(sc); return <span className={`ml-auto rounded-full px-2.5 py-1 font-bold ${t.bg} ${t.text}`}>SEO {sc}</span>; })()}
                </div>
              )}
            </motion.li>
          );
        })}
      </ul>

      <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-line bg-card shadow-sm md:block">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-soft text-xs font-bold uppercase tracking-wider text-muted">
            <tr>{R.columns.map((c) => <th key={c.key} className={`px-5 py-3.5 align-middle ${c.kind === "bool" ? "text-center" : ""}`}>{c.label}</th>)}{R.seo && <th className="px-5 py-3.5 text-center">SEO</th>}<th className="w-32 px-5 py-3.5 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: 3 }).map((_, i) => (
              <tr key={i} className="border-t border-line">
                {Array.from({ length: cols }).map((__, j) => <td key={j} className="px-5 py-4"><span className="block h-4 animate-pulse rounded bg-soft" style={{ width: j === 0 ? 48 : "70%" }} /></td>)}
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={cols} className="p-12 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900 dark:text-brand-100"><Inbox size={26} /></span>
                <p className="mt-3 font-bold">{q ? `No ${R.title.toLowerCase()} match “${q}”` : "Nothing here yet"}</p>
                {!q && <Link href={href("new")} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700"><Plus size={16} />Add the first {R.singular}</Link>}
              </td></tr>
            )}
            {!loading && filtered.map((r, i) => (
              <motion.tr
                key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: Math.min(i, 12) * 0.03 }}
                onClick={() => router.push(href(r.id))}
                className="group cursor-pointer border-t border-line transition hover:bg-brand-50/60 dark:hover:bg-brand-900/40"
              >
                {R.columns.map((c) => (
                  <td key={c.key} className={`px-5 py-3 align-middle ${c.kind === "bool" ? "text-center" : ""}`}>
                    {c.kind === "image" ? (
                      (Array.isArray(r[c.key]) ? r[c.key][0] : r[c.key]) ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={Array.isArray(r[c.key]) ? r[c.key][0] : r[c.key]} alt="" className="h-12 w-12 rounded-xl border border-line bg-white object-cover shadow-sm transition group-hover:scale-105" /> : <span className="grid h-12 w-12 place-items-center rounded-xl bg-soft text-xs text-muted">—</span>
                    ) : c.kind === "bool" ? (
                      <Switch r={r} c={c} />
                    ) : c.kind === "money" ? <span className="font-semibold tabular-nums">Rs. {Number(r[c.key] ?? 0).toLocaleString("en-PK")}</span>
                      : c.kind === "relation" ? label(c.relation!.table, r[c.key]) || <span className="text-muted">—</span>
                      : r[c.key] === null || r[c.key] === undefined || r[c.key] === "" ? <span className="text-muted">—</span>
                      : <span className={c.key === R.searchKey ? "font-bold text-fg transition group-hover:text-brand-700 dark:group-hover:text-white" : ""}>{String(r[c.key])}</span>}
                  </td>
                ))}
                {R.seo && (() => { const sc = seoScore(r), t = scoreTone(sc); return <td className="px-5 py-3 text-center align-middle"><span title={`SEO: ${t.label}`} className={`rounded-full px-2.5 py-1 text-xs font-bold ${t.bg} ${t.text}`}>{sc}</span></td>; })()}
                <td className="px-5 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-2">
                    <Link href={href(r.id)} title="Edit" aria-label="Edit" className={editBtn}><Pencil size={16} /></Link>
                    <button onClick={() => remove(r)} title="Delete" aria-label="Delete" className={delBtn}><Trash2 size={16} /></button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {msg && (
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} role="status" className={`fixed bottom-6 left-1/2 z-[70] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 font-bold text-white shadow-xl ${msg.ok ? "bg-green-600" : "bg-hot"}`}>
            {msg.ok && <Check size={18} />}{msg.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
