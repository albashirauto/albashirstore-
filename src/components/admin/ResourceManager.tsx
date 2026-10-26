"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { browserClient } from "@/lib/supabase";
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
    load();
  };

  const toggle = async (r: Row, key: string) => {
    setRows((cur) => cur.map((x) => (x.id === r.id ? { ...x, [key]: !r[key] } : x)));
    const { error } = await db.from(R.table).update({ [key]: !r[key] }).eq("id", r.id);
    if (error) { flash(false, error.message); load(); }
  };

  const label = (table: string, id: string) => opts[table]?.find((o) => o.value === id)?.label ?? "";
  const input = "w-full rounded-xl border-2 border-line bg-card px-4 py-2.5 outline-none transition focus:border-brand-500";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold uppercase text-brand-700 dark:text-white">{R.title}</h1>
          <p className="mt-1 max-w-xl text-muted">{R.description}</p>
        </div>
        <Link href={href("new")} className="flex items-center gap-2 rounded-full bg-hot px-6 py-3 font-bold text-white shadow transition hover:bg-hot-dark"><Plus size={18} />Add {R.singular}</Link>
      </div>

      <div className="relative mt-6 max-w-sm">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${R.title.toLowerCase()}…`} className={`${input} pl-10`} />
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-soft text-xs font-bold text-muted">
            <tr>{R.columns.map((c) => <th key={c.key} className="px-4 py-3">{c.label}</th>)}{R.seo && <th className="px-4 py-3">SEO</th>}<th className="px-4 py-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={R.columns.length + 2} className="p-8 text-center text-muted">Loading…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={R.columns.length + 2} className="p-10 text-center text-muted">Nothing here yet. Click “Add {R.singular}”.</td></tr>}
            {filtered.map((r) => (
              <tr key={r.id} onClick={() => router.push(href(r.id))} className="cursor-pointer border-t border-line transition hover:bg-brand-50/60 dark:hover:bg-brand-900/40">
                {R.columns.map((c) => (
                  <td key={c.key} className="px-4 py-2.5">
                    {c.kind === "image" ? (
                      (Array.isArray(r[c.key]) ? r[c.key][0] : r[c.key]) ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={Array.isArray(r[c.key]) ? r[c.key][0] : r[c.key]} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-lg bg-soft text-xs text-muted">—</span>
                    ) : c.kind === "bool" ? (
                      <button onClick={(e) => { e.stopPropagation(); toggle(r, c.key); }} aria-label={`Toggle ${c.label}`} className={`h-6 w-11 rounded-full p-0.5 transition ${r[c.key] ? "bg-brand-600" : "bg-line"}`}><span className={`block h-5 w-5 rounded-full bg-white shadow transition ${r[c.key] ? "translate-x-5" : ""}`} /></button>
                    ) : c.kind === "money" ? `Rs. ${Number(r[c.key] ?? 0).toLocaleString("en-PK")}`
                      : c.kind === "relation" ? label(c.relation!.table, r[c.key]) || "—"
                      : <span className={c.key === R.searchKey ? "font-bold" : ""}>{String(r[c.key] ?? "—")}</span>}
                  </td>
                ))}
                {R.seo && (() => { const sc = seoScore(r), t = scoreTone(sc); return <td className="px-4 py-2.5"><span title={`SEO: ${t.label}`} className={`rounded-full px-2.5 py-1 text-xs font-bold ${t.bg} ${t.text}`}>{sc}</span></td>; })()}
                <td className="px-4 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                  <Link href={href(r.id)} className="mr-1 inline-block rounded-full p-2 text-brand-600 hover:bg-brand-50" aria-label="Edit"><Pencil size={16} /></Link>
                  <button onClick={() => remove(r)} className="rounded-full p-2 text-hot hover:bg-hot/10" aria-label="Delete"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {msg && (
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} role="status" className={`fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 font-bold text-white shadow-xl ${msg.ok ? "bg-green-600" : "bg-hot"}`}>
            {msg.ok && <Check size={18} />}{msg.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
