"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Download, Mail, Search, Trash2, X } from "lucide-react";
import { ago } from "@/components/admin/dashboard/types";
import { browserClient } from "@/lib/supabase";

type Sub = { id: string; email: string; created_at: string };

/** Newsletter subscribers (from the sign-up form). Search, copy all, export, remove. */
export default function Newsletter() {
  const db = browserClient();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    db.from("newsletter").select("id,email,created_at").order("created_at", { ascending: false })
      .then(({ data }: { data: Sub[] | null }) => { setSubs(data ?? []); setLoaded(true); });
  }, [db]);

  const shown = useMemo(() => subs.filter((s) => !q.trim() || s.email.includes(q.trim().toLowerCase())), [subs, q]);
  const month = subs.filter((s) => Date.now() - +new Date(s.created_at) < 30 * 86400000).length;

  const remove = async (s: Sub) => {
    if (!confirm(`Remove ${s.email}?`)) return;
    const { error } = await db.from("newsletter").delete().eq("id", s.id);
    if (error) return alert(error.message);
    setSubs((x) => x.filter((y) => y.id !== s.id));
  };
  const copyAll = () => { navigator.clipboard?.writeText(shown.map((s) => s.email).join(", ")); setCopied(true); setTimeout(() => setCopied(false), 1500); };
  const exportCsv = () => {
    const blob = new Blob(["﻿" + ["Email,Subscribed", ...shown.map((s) => `"${s.email}","${new Date(s.created_at).toLocaleDateString("en-PK")}"`)].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "newsletter.csv"; a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold uppercase leading-none text-brand-900 dark:text-white sm:text-4xl md:text-5xl">Newsletter</h1>
          <p className="mt-1.5 text-muted">People who signed up for deal alerts by email.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={copyAll} disabled={!shown.length} className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-3 text-sm font-bold transition hover:border-brand-500 disabled:opacity-50">{copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}Copy emails</button>
          <button onClick={exportCsv} disabled={!shown.length} className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-3 text-sm font-bold transition hover:border-brand-500 disabled:opacity-50"><Download size={16} />Export CSV</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="rounded-2xl border border-line bg-card p-4"><p className="text-sm font-semibold text-muted">Subscribers</p><p className="mt-1 font-display text-3xl font-extrabold">{subs.length}</p></div>
        <div className="rounded-2xl border border-line bg-card p-4"><p className="text-sm font-semibold text-muted">Last 30 days</p><p className="mt-1 font-display text-3xl font-extrabold">+{month}</p></div>
      </div>

      <label className="flex max-w-md items-center gap-2 rounded-full border border-line bg-card px-4 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10">
        <Search size={18} className="shrink-0 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email" className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted" />
        {q && <button onClick={() => setQ("")} aria-label="Clear" className="text-muted hover:text-fg"><X size={16} /></button>}
      </label>

      {!loaded ? <p className="py-10 text-center text-muted">Loading…</p> : !shown.length ? (
        <div className="rounded-2xl border border-dashed border-line py-16 text-center text-muted"><Mail className="mx-auto mb-2" />{subs.length ? "No email matches." : "No subscribers yet."}</div>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line bg-card">
          {shown.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900"><Mail size={16} /></span>
              <a href={`mailto:${s.email}`} className="min-w-0 flex-1 truncate font-semibold hover:text-brand-600">{s.email}</a>
              <span className="text-xs text-muted">{ago(s.created_at)}</span>
              <button onClick={() => remove(s)} aria-label={`Remove ${s.email}`} className="rounded-full p-2 text-muted transition hover:bg-hot/10 hover:text-hot"><Trash2 size={15} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
