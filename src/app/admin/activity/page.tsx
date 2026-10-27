"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ClipboardList, Download, Package, Search, UserRound, X } from "lucide-react";
import { PRESETS, presetRange, ymd, type Preset } from "@/components/admin/dashboard/range";
import { browserClient } from "@/lib/supabase";
import { download, toCsv } from "@/lib/csv";

type A = { id: number; at: string; actor_email: string | null; entity: string; entity_id: string | null; action: string; detail: string | null };
const PER = 100;
const tone = (a: string) => /deleted|cancel|returned|hidden|out of stock/i.test(a) ? "bg-hot/10 text-hot" : /placed|added|delivered|paid|shown/i.test(a) ? "bg-green-100 text-green-800" : /price/i.test(a) ? "bg-amber-100 text-amber-800" : "bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-white";

/** Activity log: who changed what and when (orders, products, stock, prices), with filters and CSV. */
export default function Activity() {
  const [rows, setRows] = useState<A[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [kind, setKind] = useState<"all" | "order" | "product">("all");
  const [who, setWho] = useState("");
  const [q, setQ] = useState("");
  const [preset, setPreset] = useState<Preset>("30d");
  const [shown, setShown] = useState(PER);

  useEffect(() => {
    browserClient().from("activity").select("*").order("at", { ascending: false }).limit(5000)
      .then(({ data }: { data: A[] | null }) => { setRows(data ?? []); setLoaded(true); });
  }, []);

  const range = useMemo(() => presetRange(preset), [preset]);
  const people = useMemo(() => [...new Set(rows.map((r) => r.actor_email ?? "website"))].sort(), [rows]);
  const list = useMemo(() => rows.filter((r) => {
    const t = new Date(r.at).getTime();
    return t >= range.from.getTime() && t < range.to.getTime() && (kind === "all" || r.entity === kind) && (!who || (r.actor_email ?? "website") === who) &&
      (!q || `${r.action} ${r.detail ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  }), [rows, range, kind, who, q]);

  // group by day
  const days = useMemo(() => {
    const m = new Map<string, A[]>();
    list.slice(0, shown).forEach((r) => { const d = ymd(new Date(r.at)); m.set(d, [...(m.get(d) ?? []), r]); });
    return [...m];
  }, [list, shown]);
  const dayLabel = (d: string) => { const t = ymd(new Date()), y = ymd(new Date(Date.now() - 86400000)); return d === t ? "Today" : d === y ? "Yesterday" : new Date(d).toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" }); };
  const link = (r: A) => (!r.entity_id ? null : r.entity === "order" ? `/admin/orders?open=${r.entity_id}` : r.entity === "product" && !/deleted/i.test(r.action) ? `/admin/products/${r.entity_id}` : null);

  const exportCsv = () => download(`activity-${ymd(new Date())}.csv`, toCsv([["When", "Who", "Type", "Action", "Details"], ...list.map((r) => [new Date(r.at).toLocaleString("en-PK"), r.actor_email ?? "website", r.entity, r.action, r.detail ?? ""])]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold uppercase leading-none text-brand-900 dark:text-white sm:text-4xl md:text-5xl">Activity log</h1>
          <p className="mt-1.5 text-muted">Every order, stock and price change, with who made it. Changes from the website show as “website”.</p>
        </div>
        <button onClick={exportCsv} disabled={!list.length} className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-5 py-2.5 text-sm font-bold transition hover:border-brand-500 disabled:opacity-50"><Download size={15} />Export CSV ({list.length})</button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.filter((p) => p.key !== "custom").map((p) => <button key={p.key} onClick={() => { setPreset(p.key); setShown(PER); }} className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${preset === p.key ? "bg-brand-900 text-white dark:bg-white dark:text-brand-900" : "bg-card text-muted ring-1 ring-line hover:text-fg"}`}>{p.label}</button>)}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-full bg-soft p-1">
          {([["all", "Everything", null], ["order", "Orders", ClipboardList], ["product", "Products", Package]] as const).map(([k, l, I]) => (
            <button key={k} onClick={() => setKind(k)} className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold transition ${kind === k ? "bg-card shadow-sm" : "text-muted hover:text-fg"}`}>{I && <I size={14} />}{l}</button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5 text-sm"><UserRound size={14} className="text-muted" />
          <select value={who} onChange={(e) => setWho(e.target.value)} className="bg-transparent font-semibold outline-none" aria-label="Person"><option value="">Everyone</option>{people.map((p) => <option key={p}>{p}</option>)}</select>
        </label>
        <label className="relative ml-auto flex min-w-56 items-center">
          <Search size={15} className="pointer-events-none absolute left-3.5 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search: a name, product, “price”…" className="w-full rounded-full border border-line bg-card py-2 pl-10 pr-8 text-sm outline-none focus:border-brand-500" />
          {q && <button onClick={() => setQ("")} aria-label="Clear" className="absolute right-3 text-muted"><X size={14} /></button>}
        </label>
      </div>

      {!loaded ? <p className="py-10 text-center text-muted">Loading…</p> : !list.length ? (
        <div className="rounded-2xl border border-dashed border-line py-16 text-center text-muted">Nothing in this period.</div>
      ) : (
        <div className="space-y-6">
          {days.map(([d, items]) => (
            <section key={d}>
              <h2 className="sticky top-0 z-10 mb-2 bg-bg/90 py-1 text-xs font-bold uppercase tracking-wider text-muted backdrop-blur">{dayLabel(d)} · {items.length}</h2>
              <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
                {items.map((r) => {
                  const href = link(r);
                  const body = (
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
                      <span className="w-12 shrink-0 font-mono text-xs text-muted">{new Date(r.at).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" })}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${tone(r.action)}`}>{r.action}</span>
                      <span className="min-w-0 flex-1 truncate">{r.detail}</span>
                      <span className="shrink-0 text-xs text-muted">{r.actor_email ?? "website"}</span>
                    </div>
                  );
                  return <li key={r.id}>{href ? <Link href={href} className="block transition hover:bg-soft/60">{body}</Link> : body}</li>;
                })}
              </ol>
            </section>
          ))}
          {list.length > shown && <button onClick={() => setShown(shown + PER)} className="w-full rounded-full border border-line py-3 font-bold transition hover:border-brand-500">Show more ({list.length - shown})</button>}
        </div>
      )}
    </div>
  );
}
