"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { browserClient } from "@/lib/supabase";
import type { Field, Resource } from "@/lib/admin-config";
import ImageField from "./ImageField";
import HtmlEditor from "./HtmlEditor";
import EntitySeoPanel from "./EntitySeoPanel";
import { analyze, entityInput, scoreTone, type SeoEntity } from "@/lib/seo";

type Row = Record<string, any>;
type Opts = Record<string, { value: string; label: string }[]>;

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const toLocal = (iso?: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

function defaults(fields: Field[]): Row {
  const r: Row = {};
  fields.forEach((f) => {
    if (f.type === "bool") r[f.key] = true;
    else if (f.type === "images") r[f.key] = [];
    else if (f.key === "sort_order" || f.key === "stock") r[f.key] = 0;
    else if (f.key === "rating") r[f.key] = 5;
    else r[f.key] = "";
  });
  return r;
}

export default function ResourceManager({ resource: R }: { resource: Resource }) {
  const db = browserClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState<Opts>({});
  const [form, setForm] = useState<Row | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [sitename, setSitename] = useState<string | undefined>();

  const flash = (ok: boolean, text: string) => { setMsg({ ok, text }); setTimeout(() => setMsg(null), 3500); };

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await db.from(R.table).select("*").order(R.orderBy, { ascending: R.ascending ?? true }).limit(1000);
    if (error) flash(false, error.message);
    let list = (data as Row[]) ?? [];
    // merge values that live in side tables (e.g. private cost price)
    for (const f of R.fields.filter((x) => x.side)) {
      const { data: side } = await db.from(f.side!.table).select(`${f.side!.fk},${f.key}`);
      const map = new Map(((side as Row[]) ?? []).map((s) => [s[f.side!.fk], s[f.key]]));
      list = list.map((r) => ({ ...r, [f.key]: map.get(r.id) ?? null }));
    }
    setRows(list);
    setLoading(false);
  }, [db, R]);

  useEffect(() => { load(); setQ(""); setForm(null); }, [load]);

  // SEO tables: store name for the title, and ?edit=<id> (from the live page's SEO button) opens that row
  useEffect(() => {
    if (!R.seo) return;
    db.from("settings").select("value").eq("key", "store_name").maybeSingle().then(({ data }: { data: { value: string } | null }) => setSitename(data?.value || undefined));
  }, [db, R]);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("edit");
    const row = id && rows.find((r) => r.id === id);
    if (row) { openEdit(row); window.history.replaceState(null, "", window.location.pathname); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);
  const seoScore = (r: Row) => (R.seo ? analyze(entityInput(R.seo, r as SeoEntity, rows as SeoEntity[], sitename)).score : 0);

  // load dropdown options for related tables
  useEffect(() => {
    const rel = new Map<string, string>();
    R.fields.forEach((f) => f.relation && rel.set(f.relation.table, f.relation.label));
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

  const openNew = () => { setForm(defaults(R.fields)); setEditingId(null); setSlugTouched(false); };
  const openEdit = (r: Row) => {
    const f: Row = { ...defaults(R.fields), ...r };
    R.fields.forEach((fld) => {
      if (f[fld.key] === null || f[fld.key] === undefined) f[fld.key] = fld.type === "bool" ? false : fld.type === "images" ? [] : "";
      if (fld.type === "datetime") f[fld.key] = toLocal(r[fld.key]);
    });
    setForm(f); setEditingId(r.id); setSlugTouched(true);
  };

  const set = (f: Field, v: any) =>
    setForm((cur) => {
      if (!cur) return cur;
      const next = { ...cur, [f.key]: v };
      R.fields.forEach((s) => { if (s.type === "slug" && s.from === f.key && !slugTouched) next[s.key] = slugify(String(v)); });
      if (f.type === "slug") setSlugTouched(true);
      return next;
    });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    const payload: Row = {};
    const side: { f: Field; v: any }[] = [];
    for (const f of R.fields) {
      let v = form[f.key];
      if (f.type === "number") v = v === "" || v === null ? null : Number(v);
      else if (f.type === "datetime") v = v ? new Date(v).toISOString() : null;
      else if (f.type === "slug") v = slugify(String(v));
      else if (f.type === "bool" || f.type === "images") v = v ?? null;
      else if (v === "") v = null;
      if (f.required && (v === null || v === "")) return flash(false, `${f.label} is required.`);
      if (f.side) side.push({ f, v });
      else payload[f.key] = v;
    }
    if (R.table === "pages") payload.updated_at = new Date().toISOString();
    setSaving(true);
    const res = editingId
      ? await db.from(R.table).update(payload).eq("id", editingId).select("id").single()
      : await db.from(R.table).insert(payload).select("id").single();
    if (!res.error) {
      for (const { f, v } of side) {
        const r2 = await db.from(f.side!.table).upsert({ [f.side!.fk]: res.data.id, [f.key]: v });
        if (r2.error) { setSaving(false); return flash(false, `Saved, but ${f.label} failed: ${r2.error.message}`); }
      }
    }
    setSaving(false);
    if (res.error) return flash(false, res.error.message.includes("duplicate") ? "That web address (slug) is already used. Change it." : res.error.message);
    flash(true, editingId ? "Saved" : "Added");
    setForm(null);
    load();
  };

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
        <button onClick={openNew} className="flex items-center gap-2 rounded-full bg-hot px-6 py-3 font-bold text-white shadow transition hover:bg-hot-dark"><Plus size={18} />Add {R.singular}</button>
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
            {!loading && filtered.length === 0 && <tr><td colSpan={R.columns.length + 1} className="p-10 text-center text-muted">Nothing here yet. Click “Add {R.singular}”.</td></tr>}
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-line transition hover:bg-brand-50/60 dark:hover:bg-brand-900/40">
                {R.columns.map((c) => (
                  <td key={c.key} className="px-4 py-2.5">
                    {c.kind === "image" ? (
                      (Array.isArray(r[c.key]) ? r[c.key][0] : r[c.key]) ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={Array.isArray(r[c.key]) ? r[c.key][0] : r[c.key]} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-lg bg-soft text-xs text-muted">—</span>
                    ) : c.kind === "bool" ? (
                      <button onClick={() => toggle(r, c.key)} aria-label={`Toggle ${c.label}`} className={`h-6 w-11 rounded-full p-0.5 transition ${r[c.key] ? "bg-brand-600" : "bg-line"}`}><span className={`block h-5 w-5 rounded-full bg-white shadow transition ${r[c.key] ? "translate-x-5" : ""}`} /></button>
                    ) : c.kind === "money" ? `Rs. ${Number(r[c.key] ?? 0).toLocaleString("en-PK")}`
                      : c.kind === "relation" ? label(c.relation!.table, r[c.key]) || "—"
                      : <span className={c.key === R.searchKey ? "font-bold" : ""}>{String(r[c.key] ?? "—")}</span>}
                  </td>
                ))}
                {R.seo && (() => { const sc = seoScore(r), t = scoreTone(sc); return <td className="px-4 py-2.5"><button onClick={() => openEdit(r)} title={`SEO: ${t.label}`} className={`rounded-full px-2.5 py-1 text-xs font-bold ${t.bg} ${t.text}`}>{sc}</button></td>; })()}
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => openEdit(r)} className="mr-1 rounded-full p-2 text-brand-600 hover:bg-brand-50" aria-label="Edit"><Pencil size={16} /></button>
                  <button onClick={() => remove(r)} className="rounded-full p-2 text-hot hover:bg-hot/10" aria-label="Delete"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {form && (
          <motion.div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brand-900/60 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.form onSubmit={save} className={`my-6 w-full rounded-3xl bg-bg p-6 shadow-2xl ${R.seo ? "max-w-5xl" : "max-w-3xl"}`} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}>
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-3xl font-extrabold uppercase">{editingId ? "Edit" : "Add"} {R.singular}</h2>
                <button type="button" onClick={() => setForm(null)} className="rounded-full p-2 hover:bg-soft" aria-label="Close"><X /></button>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {R.fields.map((f) => {
                  const span = f.half ? "" : "md:col-span-2";
                  const v = form[f.key];
                  return (
                    <div key={f.key} className={span}>
                      {f.type === "bool" ? (
                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-line p-3 font-semibold">
                          <input type="checkbox" checked={!!v} onChange={(e) => set(f, e.target.checked)} className="h-5 w-5 accent-[#1d4fd8]" />{f.label}
                        </label>
                      ) : (
                        <>
                          <label className="mb-1 block text-sm font-bold">{f.label}{f.required && <span className="text-hot"> *</span>}</label>
                          {f.type === "textarea" ? <textarea rows={4} value={v ?? ""} onChange={(e) => set(f, e.target.value)} className={input} />
                            : f.type === "html" ? <HtmlEditor value={v ?? ""} onChange={(x) => set(f, x)} />
                            : f.type === "image" ? <ImageField value={v || null} onChange={(x) => set(f, x ?? "")} folder={R.table} />
                            : f.type === "images" ? <ImageField multiple value={v ?? []} onChange={(x) => set(f, x ?? [])} folder={R.table} />
                            : f.type === "select" ? (
                              <select value={v ?? ""} onChange={(e) => set(f, e.target.value)} className={input}>
                                <option value="">— none —</option>
                                {(f.options ?? opts[f.relation!.table] ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                            ) : <input type={f.type === "number" ? "number" : f.type === "datetime" ? "datetime-local" : "text"} step={f.type === "number" ? "any" : undefined} value={v ?? ""} onChange={(e) => set(f, e.target.value)} className={input} />}
                          {f.help && <p className="mt-1 text-xs text-muted">{f.help}</p>}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {R.seo && <div className="mt-6"><EntitySeoPanel kind={R.seo} form={form} rows={rows.filter((r) => r.id !== editingId)} sitename={sitename} /></div>}

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setForm(null)} className="rounded-full border-2 border-line px-6 py-2.5 font-bold">Cancel</button>
                <button disabled={saving} className="rounded-full bg-brand-600 px-8 py-2.5 font-bold text-white transition hover:bg-brand-700 disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

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
