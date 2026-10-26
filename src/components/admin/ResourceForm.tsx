"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { browserClient } from "@/lib/supabase";
import type { Field, Resource } from "@/lib/admin-config";
import ImageField from "./ImageField";
import HtmlEditor from "./HtmlEditor";
import EntitySeoPanel from "./EntitySeoPanel";

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

/** Add / edit one row of any table in RESOURCES, on its own page: /admin/<resource>/new or /admin/<resource>/<id>. */
export default function ResourceForm({ resource: R, slug, id }: { resource: Resource; slug: string; id: string }) {
  const isNew = id === "new";
  const router = useRouter();
  const db = browserClient();
  const back = `/admin/${slug}`;
  const [form, setForm] = useState<Row | null>(null);
  const [missing, setMissing] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [opts, setOpts] = useState<Opts>({});
  const [sitename, setSitename] = useState<string | undefined>();
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const flash = (ok: boolean, text: string) => { setMsg({ ok, text }); setTimeout(() => setMsg(null), 3500); };

  useEffect(() => {
    (async () => {
      if (isNew) { setForm(defaults(R.fields)); return; }
      const { data } = await db.from(R.table).select("*").eq("id", id).maybeSingle();
      if (!data) return setMissing(true);
      const f: Row = { ...defaults(R.fields), ...data };
      // values that live in side tables (e.g. private cost price)
      for (const fld of R.fields.filter((x) => x.side)) {
        const { data: side } = await db.from(fld.side!.table).select(fld.key).eq(fld.side!.fk, id).maybeSingle();
        f[fld.key] = (side as Row | null)?.[fld.key] ?? "";
      }
      R.fields.forEach((fld) => {
        if (f[fld.key] === null || f[fld.key] === undefined) f[fld.key] = fld.type === "bool" ? false : fld.type === "images" ? [] : "";
        if (fld.type === "datetime") f[fld.key] = toLocal((data as Row)[fld.key]);
      });
      setForm(f);
    })();
  }, [db, R, id, isNew]);

  // dropdown options for related tables
  useEffect(() => {
    const rel = new Map<string, string>();
    R.fields.forEach((f) => f.relation && rel.set(f.relation.table, f.relation.label));
    (async () => {
      const out: Opts = {};
      for (const [table, label] of rel) {
        const { data } = await db.from(table).select(`id,${label}`).order(label, { ascending: true });
        out[table] = ((data as any[]) ?? []).map((d) => ({ value: d.id, label: d[label] }));
      }
      setOpts(out);
    })();
  }, [db, R]);

  // SEO tables: the other rows (duplicate checks) and the store name for the title
  useEffect(() => {
    if (!R.seo) return;
    db.from(R.table).select("*").then(({ data }: { data: Row[] | null }) => setRows((data ?? []).filter((r) => r.id !== id)));
    db.from("settings").select("value").eq("key", "store_name").maybeSingle().then(({ data }: { data: { value: string } | null }) => setSitename(data?.value || undefined));
  }, [db, R, id]);

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
    const res = isNew
      ? await db.from(R.table).insert(payload).select("id").single()
      : await db.from(R.table).update(payload).eq("id", id).select("id").single();
    if (!res.error) {
      for (const { f, v } of side) {
        const r2 = await db.from(f.side!.table).upsert({ [f.side!.fk]: res.data.id, [f.key]: v });
        if (r2.error) { setSaving(false); return flash(false, `Saved, but ${f.label} failed: ${r2.error.message}`); }
      }
    }
    if (res.error) { setSaving(false); return flash(false, res.error.message.includes("duplicate") ? "That web address (slug) is already used. Change it." : res.error.message); }
    router.push(`${back}?saved=${isNew ? "added" : "saved"}`);
  };

  const remove = async () => {
    if (!form || !confirm(`Delete "${form[R.searchKey]}"? This cannot be undone.`)) return;
    const { error } = await db.from(R.table).delete().eq("id", id);
    if (error) return flash(false, error.message);
    router.push(`${back}?saved=deleted`);
  };

  const input = "w-full rounded-xl border-2 border-line bg-card px-4 py-2.5 outline-none transition focus:border-brand-500";

  if (missing) return (
    <div className="p-10 text-center">
      <p className="font-bold">This {R.singular} was not found. It may have been deleted.</p>
      <Link href={back} className="mt-4 inline-block font-bold text-brand-600">← Back to {R.title.toLowerCase()}</Link>
    </div>
  );
  if (!form) return <p className="p-10 text-center text-muted">Loading…</p>;

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href={back} className="inline-flex items-center gap-1.5 text-sm font-bold text-muted transition hover:text-brand-600"><ArrowLeft size={16} />{R.title}</Link>
          <h1 className="mt-2 text-4xl font-extrabold uppercase leading-none text-brand-900 dark:text-white md:text-5xl">
            {isNew ? `Add ${R.singular}` : String(form[R.searchKey] || `Edit ${R.singular}`)}
          </h1>
          <p className="mt-1.5 max-w-2xl text-muted">{isNew ? R.description : `Edit this ${R.singular}. Changes show on the website within about a minute.`}</p>
        </div>
        <div className="flex gap-2">
          {!isNew && <button type="button" onClick={remove} className="inline-flex items-center gap-1.5 rounded-full border border-line px-5 py-3 font-bold text-hot transition hover:bg-hot/10"><Trash2 size={16} />Delete</button>}
          <button disabled={saving} className="rounded-full bg-brand-600 px-8 py-3 font-bold text-white shadow-lg shadow-brand-600/25 transition hover:-translate-y-0.5 hover:bg-brand-700 disabled:opacity-60">{saving ? "Saving…" : isNew ? `Add ${R.singular}` : "Save changes"}</button>
        </div>
      </div>

      <div className={`grid items-start gap-6 ${R.seo ? "xl:grid-cols-[1fr_420px]" : ""}`}>
        <div className="grid gap-4 rounded-2xl border border-line bg-card p-5 md:grid-cols-2 md:p-6">
          {R.fields.map((f) => {
            const v = form[f.key];
            return (
              <div key={f.key} className={f.half ? "" : "md:col-span-2"}>
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
        {R.seo && <div className="xl:sticky xl:top-6"><EntitySeoPanel kind={R.seo} form={form} rows={rows} sitename={sitename} /></div>}
      </div>

      <div className="flex justify-end gap-3">
        <Link href={back} className="rounded-full border-2 border-line px-6 py-2.5 font-bold">Cancel</Link>
        <button disabled={saving} className="rounded-full bg-brand-600 px-8 py-2.5 font-bold text-white transition hover:bg-brand-700 disabled:opacity-60">{saving ? "Saving…" : isNew ? `Add ${R.singular}` : "Save changes"}</button>
      </div>

      <AnimatePresence>
        {msg && (
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} role="status" className={`fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 font-bold text-white shadow-xl ${msg.ok ? "bg-green-600" : "bg-hot"}`}>
            {msg.ok && <Check size={18} />}{msg.text}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
