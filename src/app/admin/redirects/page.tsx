"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Check, ExternalLink, Plus, Search, Trash2, TriangleAlert } from "lucide-react";
import { ago } from "@/components/admin/dashboard/types";
import { browserClient } from "@/lib/supabase";

type R = { id: string; from_path: string; to_path: string; auto: boolean; hits: number; last_hit: string | null; created_at: string };
type N = { id: string; path: string; referrer: string | null; hits: number; first_seen: string; last_seen: string };
const input = "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 font-mono text-sm outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";
/** "/products/x", from a full link or a path */
const clean = (v: string) => { let s = v.trim(); try { if (/^https?:\/\//.test(s)) { const u = new URL(s); s = u.pathname; } } catch {} return s ? (s.startsWith("/") ? s : `/${s}`).replace(/\/+$/, "") || "/" : ""; };

/** Redirects (old link -> new page) and the 404 monitor (links people hit that do not exist). */
export default function Redirects() {
  const db = browserClient();
  const [tab, setTab] = useState<"redirects" | "404">("redirects");
  const [rows, setRows] = useState<R[]>([]);
  const [misses, setMisses] = useState<N[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [f, setF] = useState({ from: "", to: "" });
  const [editing, setEditing] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const flash = (ok: boolean, t: string) => { setMsg({ ok, t }); setTimeout(() => setMsg(null), 3000); };

  const load = useCallback(async () => {
    const [{ data: r, error }, { data: n }] = await Promise.all([
      db.from("redirects").select("*").order("created_at", { ascending: false }),
      db.from("not_found_log").select("*").order("hits", { ascending: false }).limit(500),
    ]);
    if (error) flash(false, error.message.includes("redirects") ? "Run supabase/023_redirects.sql first." : error.message);
    setRows((r as R[]) ?? []); setMisses((n as N[]) ?? []); setLoaded(true);
  }, [db]);
  useEffect(() => { load(); }, [load]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const from = clean(f.from), to = /^https?:\/\//.test(f.to.trim()) ? f.to.trim() : clean(f.to);
    if (!from || from === "/") return flash(false, "Enter the old address, e.g. /products/old-name");
    if (!to) return flash(false, "Enter where it should go.");
    if (from.toLowerCase() === to.toLowerCase()) return flash(false, "Old and new address are the same.");
    if (rows.some((r) => r.id !== editing && r.from_path.toLowerCase() === to.toLowerCase() && r.to_path.toLowerCase() === from.toLowerCase())) return flash(false, "That would make a loop (the new address already redirects back).");
    const res = editing ? await db.from("redirects").update({ from_path: from, to_path: to, auto: false }).eq("id", editing) : await db.from("redirects").insert({ from_path: from, to_path: to });
    if (res.error) return flash(false, res.error.message.includes("duplicate") ? `${from} already has a redirect.` : res.error.message);
    await db.from("not_found_log").delete().ilike("path", from);
    setF({ from: "", to: "" }); setEditing(null); flash(true, "Redirect saved"); load();
  };
  const remove = async (r: R) => { if (!confirm(`Remove the redirect from ${r.from_path}?`)) return; await db.from("redirects").delete().eq("id", r.id); load(); };
  const fix = (n: N) => { setTab("redirects"); setEditing(null); setF({ from: n.path, to: "" }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const clearMiss = async (ids: string[]) => { await db.from("not_found_log").delete().in("id", ids); load(); };

  const shownR = rows.filter((r) => !q || `${r.from_path} ${r.to_path}`.toLowerCase().includes(q.toLowerCase()));
  const shownN = misses.filter((n) => !q || `${n.path} ${n.referrer ?? ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-extrabold uppercase leading-none text-brand-900 dark:text-white md:text-5xl">Redirects</h1>
        <p className="mt-1.5 text-muted">Send old links to the right page, so Google and customers never land on “page not found”. Changing a product, category, brand or post web address adds one automatically.</p>
      </div>

      <form onSubmit={save} className="rounded-2xl border border-line bg-card p-5">
        <p className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">{editing ? "Edit redirect" : "Add a redirect"}</p>
        <div className="grid items-center gap-2 md:grid-cols-[1fr_auto_1fr_auto]">
          <input value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} placeholder="Old address, e.g. /products/old-chain-kit" className={input} aria-label="Old address" />
          <ArrowRight size={18} className="mx-auto rotate-90 text-muted md:rotate-0" />
          <input value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} placeholder="New address, e.g. /products/cd-70-chain-kit" className={input} aria-label="New address" />
          <div className="flex gap-2">
            <button className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white"><Plus size={15} />{editing ? "Save" : "Add"}</button>
            {editing && <button type="button" onClick={() => { setEditing(null); setF({ from: "", to: "" }); }} className="rounded-xl border border-line px-4 text-sm font-bold">Cancel</button>}
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">You can paste full links: only the part after the domain is kept. The new address can also be another website.</p>
      </form>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-full bg-soft p-1">
          <button onClick={() => setTab("redirects")} className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${tab === "redirects" ? "bg-card shadow-sm" : "text-muted"}`}>Redirects <span className="text-xs opacity-70">({rows.length})</span></button>
          <button onClick={() => setTab("404")} className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${tab === "404" ? "bg-card shadow-sm" : "text-muted"}`}>404 errors <span className={`text-xs ${misses.length ? "text-hot" : "opacity-70"}`}>({misses.length})</span></button>
        </div>
        <label className="relative ml-auto flex min-w-56 items-center"><Search size={15} className="pointer-events-none absolute left-3.5 text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search addresses…" className="w-full rounded-full border border-line bg-card py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-500" /></label>
      </div>

      {!loaded ? <p className="py-10 text-center text-muted">Loading…</p> : tab === "redirects" ? (
        !shownR.length ? <div className="rounded-2xl border border-dashed border-line py-14 text-center text-muted">No redirects yet. They appear here when you change a web address, or add one above.</div> : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
            {shownR.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
                <span className="min-w-0 basis-full truncate font-mono text-muted line-through decoration-hot/60 md:basis-auto md:flex-1">{r.from_path}</span>
                <ArrowRight size={14} className="hidden shrink-0 text-muted md:block" />
                <a href={r.to_path} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-mono font-semibold text-brand-600 hover:underline">{r.to_path}</a>
                {r.auto && <span className="rounded-full bg-soft px-2 py-0.5 text-[11px] font-bold text-muted">auto</span>}
                <span className="w-24 shrink-0 text-right text-xs text-muted">{r.hits} hit{r.hits === 1 ? "" : "s"}{r.last_hit ? ` · ${ago(r.last_hit)}` : ""}</span>
                <span className="flex gap-1">
                  <button onClick={() => { setEditing(r.id); setF({ from: r.from_path, to: r.to_path }); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-full px-2.5 py-1 text-xs font-bold text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900">Edit</button>
                  <button onClick={() => remove(r)} aria-label="Remove" className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-hot/10 hover:text-hot"><Trash2 size={14} /></button>
                </span>
              </li>
            ))}
          </ul>
        )
      ) : (
        !shownN.length ? <div className="rounded-2xl border border-dashed border-line py-14 text-center text-muted">No broken links found. 🎉 Missing pages visitors open will be listed here.</div> : (
          <>
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
              {shownN.map((n) => (
                <li key={n.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
                  <TriangleAlert size={15} className="shrink-0 text-hot" />
                  <span className="min-w-0 flex-1">
                    <a href={n.path} target="_blank" rel="noreferrer" className="inline-flex max-w-full items-center gap-1 truncate font-mono font-semibold hover:text-brand-600">{n.path}<ExternalLink size={11} className="shrink-0" /></a>
                    {n.referrer && <span className="block truncate text-xs text-muted">from {n.referrer}</span>}
                  </span>
                  <span className="w-28 shrink-0 text-right text-xs text-muted"><b className="text-fg">{n.hits}×</b> · {ago(n.last_seen)}</span>
                  <button onClick={() => fix(n)} className="rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">Redirect it</button>
                  <button onClick={() => clearMiss([n.id])} aria-label="Ignore" className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-soft"><Check size={14} /></button>
                </li>
              ))}
            </ul>
            <button onClick={() => confirm("Clear the whole 404 list?") && clearMiss(misses.map((n) => n.id))} className="text-sm font-bold text-muted hover:text-hot">Clear list</button>
          </>
        )
      )}
      {msg && <div role="status" className={`fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full px-5 py-3 font-bold text-white shadow-xl ${msg.ok ? "bg-green-600" : "bg-hot"}`}>{msg.t}</div>}
    </div>
  );
}
