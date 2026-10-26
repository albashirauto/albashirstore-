"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, ExternalLink, FilePlus2, Newspaper, Pencil, RotateCcw, Search, Star, Trash2 } from "lucide-react";
import { browserClient } from "@/lib/supabase";
import { analyze } from "@/lib/seo";
import { STATUS_STYLE, postSeoInput, postStatus, slugify, wordCount, type PostStatus } from "@/lib/blog";
import type { Post } from "@/lib/types";
import { ScorePill } from "@/components/admin/products/seo/ScoreRing";

type Tab = "all" | PostStatus;
const TABS: { k: Tab; l: string }[] = [{ k: "all", l: "All" }, { k: "published", l: "Published" }, { k: "scheduled", l: "Scheduled" }, { k: "draft", l: "Drafts" }, { k: "trash", l: "Trash" }];
const SAVED: Record<string, string> = { trashed: "Moved to the trash" };
const fmt = (iso: string) => new Date(iso).toLocaleString("en-PK", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

/** Blog (WordPress-style): status tabs, search, category filter, bulk actions, trash with restore. Editor: /admin/posts/<id>. */
export default function Posts() {
  const db = browserClient();
  const [rows, setRows] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [sitename, setSitename] = useState("Al Bashir Autos");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const flash = (ok: boolean, t: string) => { setMsg({ ok, t }); setTimeout(() => setMsg(null), 3500); };

  const load = useCallback(async () => {
    const [{ data, error }, { data: name }] = await Promise.all([
      db.from("posts").select("*").order("published_at", { ascending: false }),
      db.from("settings").select("value").eq("key", "store_name").maybeSingle(),
    ]);
    if (error) flash(false, error.message);
    setRows((data as Post[]) ?? []);
    if (name?.value) setSitename(name.value);
    setLoading(false);
    setSel(new Set());
  }, [db]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("saved");
    if (s && SAVED[s]) { flash(true, SAVED[s]); window.history.replaceState(null, "", window.location.pathname); }
  }, []);

  const [now] = useState(() => Date.now());
  const withStatus = useMemo(() => rows.map((p) => ({ p, s: postStatus(p, now) })), [rows, now]);
  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: 0, published: 0, scheduled: 0, draft: 0, trash: 0 };
    withStatus.forEach(({ s }) => { c[s]++; if (s !== "trash") c.all++; });
    return c;
  }, [withStatus]);
  const categories = useMemo(() => [...new Set(rows.map((p) => p.category).filter(Boolean) as string[])].sort(), [rows]);
  const scores = useMemo(() => new Map(rows.map((p) => [p.id, analyze(postSeoInput(p, rows.filter((o) => o.id !== p.id && !o.deleted_at), sitename)).score])), [rows, sitename]);

  const shown = withStatus.filter(({ p, s }) =>
    (tab === "all" ? s !== "trash" : s === tab) && (!cat || p.category === cat) &&
    (!q || `${p.title} ${p.category ?? ""} ${(p.tags ?? []).join(" ")} ${p.author ?? ""}`.toLowerCase().includes(q.toLowerCase())));

  const patch = async (ids: string[], v: Partial<Post>, done: string) => {
    if (!ids.length) return;
    const { error } = await db.from("posts").update(v).in("id", ids);
    if (error) return flash(false, error.message);
    flash(true, done); load();
  };
  const destroy = async (ids: string[]) => {
    if (!ids.length || !confirm(`Delete ${ids.length === 1 ? "this post" : `${ids.length} posts`} forever? This cannot be undone.`)) return;
    const { error } = await db.from("posts").delete().in("id", ids);
    if (error) return flash(false, error.message);
    flash(true, "Deleted forever"); load();
  };
  const duplicate = async (p: Post) => {
    const { id: _id, created_at: _c, ...rest } = p;
    void _id; void _c;
    let slug = `${p.slug}-copy`;
    for (let n = 2; rows.some((r) => r.slug === slug); n++) slug = `${slugify(p.slug)}-copy-${n}`;
    const { error } = await db.from("posts").insert({ ...rest, title: `${p.title} (copy)`, slug, active: false, featured: false, deleted_at: null, published_at: new Date().toISOString(), updated_at: new Date().toISOString() });
    if (error) return flash(false, error.message);
    flash(true, "Copied as a draft"); load();
  };

  const ids = [...sel];
  const allOn = shown.length > 0 && shown.every(({ p }) => sel.has(p.id));
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold uppercase leading-none text-brand-900 dark:text-white md:text-5xl">Blog</h1>
          <p className="mt-1.5 text-muted">Write guides and news. Each post gets its own page on Google, with Rank Math-style SEO checks.</p>
        </div>
        <Link href="/admin/posts/new" className="inline-flex items-center gap-2 rounded-full bg-hot px-6 py-3 font-bold text-white shadow-lg shadow-hot/25 transition hover:-translate-y-0.5 hover:bg-hot-dark"><FilePlus2 size={18} />Add new post</Link>
      </div>

      {/* tabs + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-full bg-soft p-1">
          {TABS.map(({ k, l }) => (
            <button key={k} onClick={() => { setTab(k); setSel(new Set()); }} className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${tab === k ? "bg-card shadow-sm" : "text-muted hover:text-fg"} ${k === "trash" && counts.trash ? "text-hot" : ""}`}>
              {l} <span className="text-xs opacity-70">({counts[k]})</span>
            </button>
          ))}
        </div>
        <select value={cat} onChange={(e) => setCat(e.target.value)} className="rounded-full border border-line bg-card px-4 py-2 text-sm font-semibold">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <div className="relative ml-auto min-w-56">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search posts…" className="w-full rounded-full border border-line bg-card py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-500" />
        </div>
      </div>

      {/* bulk actions */}
      <AnimatePresence>
        {ids.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-2 rounded-2xl bg-brand-900 px-4 py-3 text-sm text-white">
            <b>{ids.length} selected</b>
            {tab === "trash" ? (
              <>
                <button onClick={() => patch(ids, { deleted_at: null }, "Restored")} className="rounded-full bg-white/10 px-3 py-1.5 font-bold hover:bg-white/20">Restore</button>
                <button onClick={() => destroy(ids)} className="rounded-full bg-hot px-3 py-1.5 font-bold">Delete forever</button>
              </>
            ) : (
              <>
                <button onClick={() => patch(ids, { active: true }, "Published")} className="rounded-full bg-white/10 px-3 py-1.5 font-bold hover:bg-white/20">Publish</button>
                <button onClick={() => patch(ids, { active: false }, "Moved to drafts")} className="rounded-full bg-white/10 px-3 py-1.5 font-bold hover:bg-white/20">Move to drafts</button>
                <button onClick={() => patch(ids, { deleted_at: new Date().toISOString() }, "Moved to the trash")} className="rounded-full bg-hot px-3 py-1.5 font-bold">Move to trash</button>
              </>
            )}
            <button onClick={() => setSel(new Set())} className="ml-auto font-bold text-white/70 hover:text-white">Clear</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="border-b border-line bg-soft/60 text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="w-10 px-4 py-3"><input type="checkbox" aria-label="Select all" checked={allOn} onChange={() => setSel(allOn ? new Set() : new Set(shown.map(({ p }) => p.id)))} className="h-4 w-4 accent-brand-600" /></th>
              <th className="py-3 font-semibold">Title</th><th className="px-3 font-semibold">Category / tags</th><th className="px-3 font-semibold">SEO</th><th className="px-3 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {loading && <tr><td colSpan={5} className="p-10 text-center text-muted">Loading…</td></tr>}
            {!loading && !shown.length && (
              <tr><td colSpan={5} className="p-12 text-center">
                <Newspaper size={36} className="mx-auto text-brand-500/50" />
                <p className="mt-2 font-bold">{tab === "trash" ? "The trash is empty." : q || cat ? "No posts match." : "No posts yet."}</p>
                {tab !== "trash" && !q && !cat && <Link href="/admin/posts/new" className="mt-2 inline-block font-bold text-brand-600">Write your first post →</Link>}
              </td></tr>
            )}
            {shown.map(({ p, s }) => {
              const st = STATUS_STYLE[s];
              return (
                <tr key={p.id} className={`group transition hover:bg-soft/50 ${sel.has(p.id) ? "bg-brand-50/60 dark:bg-brand-900/30" : ""}`}>
                  <td className="px-4 py-3 align-top"><input type="checkbox" aria-label={`Select ${p.title}`} checked={sel.has(p.id)} onChange={() => toggle(p.id)} className="mt-1 h-4 w-4 accent-brand-600" /></td>
                  <td className="py-3 pr-3">
                    <div className="flex items-start gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.cover ? <img src={p.cover} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" /> : <span className="grid h-14 w-20 shrink-0 place-items-center rounded-lg bg-soft text-muted"><Newspaper size={18} /></span>}
                      <div className="min-w-0">
                        <Link href={`/admin/posts/${p.id}`} className="flex items-center gap-1.5 font-bold hover:text-brand-600">
                          {p.featured && <Star size={14} className="shrink-0 fill-amber-400 text-amber-400" />}
                          <span className="line-clamp-2">{p.title}</span>
                        </Link>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                          <span className={`rounded-full px-2 py-0.5 font-bold ${st.cls}`}>{st.label}</span>
                          {p.author && <span>{p.author}</span>}
                          <span>{wordCount(p.content_html ?? "")} words</span>
                        </p>
                        {/* WordPress-style row actions */}
                        <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs font-bold opacity-100 transition md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
                          {s === "trash" ? (
                            <>
                              <button onClick={() => patch([p.id], { deleted_at: null }, "Restored")} className="inline-flex items-center gap-1 text-brand-600"><RotateCcw size={12} />Restore</button>
                              <button onClick={() => destroy([p.id])} className="inline-flex items-center gap-1 text-hot"><Trash2 size={12} />Delete forever</button>
                            </>
                          ) : (
                            <>
                              <Link href={`/admin/posts/${p.id}`} className="inline-flex items-center gap-1 text-brand-600"><Pencil size={12} />Edit</Link>
                              {s === "published" && <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand-600"><ExternalLink size={12} />View</a>}
                              {s === "draft" ? <button onClick={() => patch([p.id], { active: true, published_at: new Date().toISOString() }, "Published")} className="text-green-700">Publish now</button>
                                : <button onClick={() => patch([p.id], { active: false }, "Moved to drafts")} className="text-muted hover:text-fg">Unpublish</button>}
                              <button onClick={() => patch([p.id], { featured: !p.featured }, p.featured ? "No longer featured" : "Featured")} className="inline-flex items-center gap-1 text-amber-600"><Star size={12} />{p.featured ? "Unfeature" : "Feature"}</button>
                              <button onClick={() => duplicate(p)} className="inline-flex items-center gap-1 text-muted hover:text-fg"><Copy size={12} />Duplicate</button>
                              <button onClick={() => patch([p.id], { deleted_at: new Date().toISOString() }, "Moved to the trash")} className="inline-flex items-center gap-1 text-hot"><Trash2 size={12} />Trash</button>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 align-top text-xs">
                    {p.category ? <span className="font-bold">{p.category}</span> : <span className="text-muted">—</span>}
                    {!!p.tags?.length && <span className="mt-1 block text-muted">{p.tags.slice(0, 4).map((t) => `#${t}`).join(" ")}</span>}
                  </td>
                  <td className="px-3 py-3 align-top"><Link href={`/admin/posts/${p.id}#seo`}><ScorePill score={scores.get(p.id) ?? 0} /></Link></td>
                  <td className="px-3 py-3 align-top text-xs">
                    <span className="font-semibold">{s === "scheduled" ? "Scheduled for" : s === "draft" ? "Last edited" : s === "trash" ? "Trashed" : "Published"}</span>
                    <span className="block text-muted">{fmt(s === "trash" ? p.deleted_at! : s === "draft" ? (p.updated_at ?? p.created_at ?? p.published_at) : p.published_at)}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {tab === "trash" && counts.trash > 0 && (
        <button onClick={() => destroy(withStatus.filter(({ s }) => s === "trash").map(({ p }) => p.id))} className="text-sm font-bold text-hot hover:underline">Empty trash ({counts.trash})</button>
      )}

      <AnimatePresence>
        {msg && (
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} role="status" className={`fixed bottom-6 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 font-bold text-white shadow-xl ${msg.ok ? "bg-green-600" : "bg-hot"}`}>
            {msg.ok && <Check size={18} />}{msg.t}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
