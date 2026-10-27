"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Check, Copy, Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { browserClient } from "@/lib/supabase";
import { TEMPLATES, fullDesign, isLive, type Campaign } from "@/lib/campaigns";

type Stat = { campaign_id: string; day: string; views: number; clicks: number; closes: number };
type State = "active" | "scheduled" | "expired" | "paused" | "draft";
const KIND: Record<string, string> = { popup: "Popup", topbar: "Top bar", hero: "Hero banner", badge: "Floating badge" };
const STYLE: Record<State, string> = { active: "bg-green-100 text-green-800", scheduled: "bg-blue-100 text-blue-800", expired: "bg-hot/10 text-hot", paused: "bg-amber-100 text-amber-800", draft: "bg-soft text-muted" };
const stateOf = (c: Campaign, now: number): State =>
  c.status === "draft" ? "draft" : c.status === "paused" ? "paused" : c.ends_at && new Date(c.ends_at).getTime() <= now ? "expired" : c.starts_at && new Date(c.starts_at).getTime() > now ? "scheduled" : "active";
const ctr = (v = 0, c = 0) => (v ? `${((c / v) * 100).toFixed(1)}%` : "—");

/** Campaigns: popups, top bars, home hero banners and floating badges. Only one popup ever shows at a time. */
export default function Campaigns() {
  const db = browserClient();
  const [rows, setRows] = useState<Campaign[]>([]);
  const [stats, setStats] = useState<Stat[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [f, setF] = useState({ status: "", kind: "", template: "" });
  const [open, setOpen] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [now] = useState(() => Date.now());

  const load = useCallback(async () => {
    const [{ data, error }, { data: st }] = await Promise.all([
      db.from("campaigns").select("*").order("priority", { ascending: false }).order("created_at", { ascending: false }),
      db.from("campaign_stats").select("*").gte("day", new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)),
    ]);
    if (error) setMsg(error.message.includes("campaigns") ? "Run supabase/027_campaigns.sql first." : error.message);
    setRows((data as Campaign[]) ?? []); setStats((st as Stat[]) ?? []); setLoaded(true);
  }, [db]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("saved");
    const t: Record<string, string> = { saved: "Campaign saved", published: "Published: it's live", deleted: "Campaign deleted" };
    if (s && t[s]) { setMsg(t[s]); setTimeout(() => setMsg(""), 3000); window.history.replaceState(null, "", window.location.pathname); }
  }, []);

  const week = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const clicksWeek = stats.filter((s) => s.day >= week).reduce((n, s) => n + s.clicks, 0);
  const shown = rows.filter((c) => (!f.status || stateOf(c, now) === f.status) && (!f.kind || c.kind === f.kind) && (!f.template || c.template === f.template));
  const count = (s: State) => rows.filter((c) => stateOf(c, now) === s).length;
  const daily = useMemo(() => (id: string) => {
    const days = Array.from({ length: 14 }, (_, i) => new Date(Date.now() - (13 - i) * 86400000).toISOString().slice(0, 10));
    return days.map((d) => ({ d, ...(stats.find((s) => s.campaign_id === id && s.day === d) ?? { views: 0, clicks: 0, closes: 0 }) }));
  }, [stats]);

  const toggle = async (c: Campaign) => {
    const status = c.status === "active" ? "paused" : "active";
    setRows((r) => r.map((x) => (x.id === c.id ? { ...x, status } : x)));
    await db.from("campaigns").update({ status, updated_at: new Date().toISOString() }).eq("id", c.id);
  };
  const duplicate = async (c: Campaign) => {
    const { id: _i, views: _v, clicks: _c, closes: _x, created_at: _a, updated_at: _u, ...rest } = c;
    void _i; void _v; void _c; void _x; void _a; void _u;
    await db.from("campaigns").insert({ ...rest, name: `${c.name} (copy)`, status: "draft" });
    setMsg("Copied as a draft"); setTimeout(() => setMsg(""), 2500); load();
  };
  const remove = async (c: Campaign) => { if (!confirm(`Delete “${c.name}”?`)) return; await db.from("campaigns").delete().eq("id", c.id); load(); };

  const sel = "rounded-xl border border-line bg-card px-3 py-2 text-sm font-semibold outline-none focus:border-brand-500";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold uppercase leading-none text-brand-900 dark:text-white sm:text-4xl md:text-5xl">Campaigns</h1>
          <p className="mt-1.5 text-muted">Popups, top bars, home banners and floating badges: welcome messages, 11.11 / 12.12 sales, Eid offers… Only one popup ever shows at a time.</p>
        </div>
        <Link href="/admin/campaigns/new" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-purple-600 px-6 py-3 font-bold text-white shadow-lg shadow-brand-600/25 transition hover:-translate-y-0.5"><Plus size={18} />New campaign</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Active now", count("active"), "text-green-700"], ["Scheduled", count("scheduled"), "text-blue-700"], ["Expired", count("expired"), "text-hot"], ["Clicks this week", clicksWeek, ""]].map(([l, v, cls]) => (
          <div key={l as string} className="rounded-2xl border border-line bg-card p-4"><p className="text-xs font-bold uppercase tracking-wider text-muted">{l}</p><p className={`mt-1 font-display text-3xl font-extrabold ${cls}`}>{v}</p></div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-line bg-card p-4">
        <label className="text-xs font-bold">Status<select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={`${sel} mt-1 block`}><option value="">All</option>{(["active", "scheduled", "expired", "paused", "draft"] as State[]).map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}</select></label>
        <label className="text-xs font-bold">Type<select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })} className={`${sel} mt-1 block`}><option value="">All</option>{Object.entries(KIND).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
        <label className="text-xs font-bold">Template<select value={f.template} onChange={(e) => setF({ ...f, template: e.target.value })} className={`${sel} mt-1 block`}><option value="">All</option>{TEMPLATES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}</select></label>
        {(f.status || f.kind || f.template) && <button onClick={() => setF({ status: "", kind: "", template: "" })} className="text-sm font-bold text-brand-600">Clear</button>}
      </div>

      {!loaded ? <p className="py-10 text-center text-muted">Loading…</p> : !shown.length ? (
        <div className="rounded-2xl border border-dashed border-line py-16 text-center">
          <Megaphone size={36} className="mx-auto text-brand-500/50" />
          <p className="mt-2 font-bold">{rows.length ? "No campaigns match." : "No campaigns yet."}</p>
          <Link href="/admin/campaigns/new" className="mt-2 inline-block font-bold text-brand-600">Create a welcome popup or a sale banner →</Link>
        </div>
      ) : (
        <ul className="grid gap-3">
          {shown.map((c) => {
            const st = stateOf(c, now), d = fullDesign(c.design ?? {}), tpl = TEMPLATES.find((t) => t.key === c.template);
            const days = open === c.id ? daily(c.id) : [];
            const peak = Math.max(1, ...days.map((x) => x.views));
            return (
              <li key={c.id} className="rounded-2xl border border-line bg-card">
                <div className="flex flex-wrap items-center gap-4 p-4">
                  <Link href={`/admin/campaigns/${c.id}`} className="grid h-16 w-28 shrink-0 place-items-center overflow-hidden rounded-xl px-2 text-center text-[11px] font-extrabold leading-tight shadow-inner" style={{ background: `linear-gradient(135deg, ${d.bg}, ${d.bg2})`, color: d.text }}>
                    <span className="line-clamp-3" dir="auto">{c.content?.headline || c.name}</span>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/campaigns/${c.id}`} className="block truncate text-lg font-bold hover:text-brand-600">{c.name}</Link>
                    <p className="text-sm text-muted">{KIND[c.kind]} · {tpl?.label ?? "Custom"} · priority {c.priority}</p>
                    <p className="text-xs text-muted">{c.starts_at || c.ends_at ? `${c.starts_at ? new Date(c.starts_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" }) : "now"} → ${c.ends_at ? new Date(c.ends_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" }) : "no end"}` : "No schedule (runs while on)"}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${STYLE[st]}`}>{st}</span>
                  <div className="flex gap-4 text-center text-xs"><div><p className="text-muted">Views</p><b>{c.views ?? 0}</b></div><div><p className="text-muted">Clicks</p><b>{c.clicks ?? 0}</b></div><div><p className="text-muted">CTR</p><b>{ctr(c.views, c.clicks)}</b></div></div>
                  <button onClick={() => toggle(c)} disabled={c.status === "draft"} title={c.status === "draft" ? "Publish it first" : c.status === "active" ? "Pause" : "Turn on"} aria-label="On / off" className={`h-7 w-12 shrink-0 rounded-full p-0.5 transition disabled:opacity-40 ${c.status === "active" ? "bg-green-600" : "bg-line"}`}><span className={`block h-6 w-6 rounded-full bg-white shadow transition ${c.status === "active" ? "translate-x-5" : ""}`} /></button>
                  <div className="flex flex-wrap gap-1 text-sm font-bold">
                    <Link href={`/admin/campaigns/${c.id}`} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900"><Pencil size={14} />Edit</Link>
                    <button onClick={() => setOpen(open === c.id ? null : c.id)} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 hover:bg-soft"><BarChart3 size={14} />Stats</button>
                    <button onClick={() => duplicate(c)} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 hover:bg-soft"><Copy size={14} />Duplicate</button>
                    <button onClick={() => remove(c)} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-hot hover:bg-hot/10"><Trash2 size={14} />Delete</button>
                  </div>
                </div>
                {open === c.id && (
                  <div className="border-t border-line p-4">
                    <p className="text-sm font-bold">Views per day, last 14 days <span className="font-normal text-muted">· {c.closes ?? 0} closed in total</span></p>
                    <div className="mt-3 flex h-28 items-end gap-1">
                      {days.map((x) => (
                        <div key={x.d} className="group relative flex h-full flex-1 flex-col justify-end" title={`${x.d}: ${x.views} views, ${x.clicks} clicks`}>
                          <div className="rounded-t-sm bg-brand-600" style={{ height: `${(x.views / peak) * 100}%`, minHeight: x.views ? 3 : 0 }} />
                          <span className="mt-1 text-center text-[9px] text-muted">{x.d.slice(8)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {msg && <div role="status" className="fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full bg-green-600 px-5 py-3 font-bold text-white shadow-xl"><Check size={18} />{msg}</div>}
    </div>
  );
}
