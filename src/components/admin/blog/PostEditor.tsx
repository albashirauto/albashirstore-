"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, CalendarClock, Check, Eye, FolderOpen, History, Loader2, Send, Star, Tags, Trash2, UserRound, X } from "lucide-react";
import { browserClient } from "@/lib/supabase";
import { analyze, scoreTone } from "@/lib/seo";
import { STATUS_STYLE, postSeoInput, postStatus, readingMinutes, slugify, wordCount } from "@/lib/blog";
import type { Post } from "@/lib/types";
import ImageField from "@/components/admin/ImageField";
import { ScorePill } from "@/components/admin/products/seo/ScoreRing";
import { input } from "@/components/admin/products/ui";
import ArticleView from "@/components/blog/ArticleView";
import PostSeo from "./PostSeo";
import RichEditor from "./RichEditor";

const BLANK: Post = {
  id: "", title: "", slug: "", cover: "", cover_alt: "", excerpt: "", content_html: "", author: "", published_at: new Date().toISOString(),
  seo_title: "", seo_description: "", focus_keywords: "", active: false, category: "", tags: [], featured: false, deleted_at: null,
  schema_type: "BlogPosting", noindex: false, canonical_url: "", og_title: "", og_description: "", og_image: "",
};
const FIELDS = Object.keys(BLANK).filter((k) => k !== "id") as (keyof Post)[];
const toLocal = (iso: string) => new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const card = "rounded-2xl border border-line bg-card p-5";
const boxTitle = "mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted";

/** WordPress-style post editor: /admin/posts/new or /admin/posts/<id>. */
export default function PostEditor({ id }: { id: string }) {
  const isNew = id === "new";
  const router = useRouter();
  const db = browserClient();
  const [p, setP] = useState<Post>(BLANK);
  const [saved, setSaved] = useState<Post>(BLANK);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  const [others, setOthers] = useState<Post[]>([]);
  const [sitename, setSitename] = useState("Al Bashir Autos");
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [when, setWhen] = useState<"now" | "date">(isNew ? "now" : "date");
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [preview, setPreview] = useState(false);
  const [backup, setBackup] = useState<Post | null>(null);
  const [tagText, setTagText] = useState("");
  const backupKey = `post-backup-${id}`;

  const flash = (ok: boolean, t: string) => { setMsg({ ok, t }); setTimeout(() => setMsg(null), 3500); };
  // functional update: RichEditor keeps the first onChange it was given
  const set = useCallback((v: Partial<Post>) => setP((cur) => ({ ...cur, ...v })), []);
  const setHtml = useCallback((content_html: string) => set({ content_html }), [set]);

  useEffect(() => {
    (async () => {
      const [{ data: all }, { data: me }, { data: name }] = await Promise.all([
        db.from("posts").select("id,title,slug,focus_keywords,category,tags").is("deleted_at", null),
        db.auth.getUser().then(async ({ data }: { data: { user: { id: string } | null } }) => data.user ? db.from("admins").select("name").eq("user_id", data.user.id).maybeSingle() : { data: null }),
        db.from("settings").select("value").eq("key", "store_name").maybeSingle(),
      ]);
      setOthers(((all as Post[]) ?? []).filter((x) => x.id !== id));
      if (name?.value) setSitename(name.value);
      let row: Post;
      if (isNew) row = { ...BLANK, author: (me as { name?: string } | null)?.name ?? "" };
      else {
        const { data } = await db.from("posts").select("*").eq("id", id).maybeSingle();
        if (!data) return setState("missing");
        row = Object.fromEntries(FIELDS.map((k) => [k, (data as Post)[k] ?? BLANK[k]])) as Post;
        row.id = id; row.updated_at = (data as Post).updated_at;
      }
      setP(row); setSaved(row); setState("ok");
      try {
        const b = JSON.parse(localStorage.getItem(backupKey) ?? "null") as (Post & { _at: number }) | null;
        if (b && b.content_html !== row.content_html && b._at > new Date(row.updated_at ?? 0).getTime()) setBackup(b);
      } catch {}
    })();
  }, [db, id, isNew, backupKey]);

  const dirty = useMemo(() => FIELDS.some((k) => JSON.stringify(p[k] ?? "") !== JSON.stringify(saved[k] ?? "")), [p, saved]);

  // local backup of unsaved work + warning before leaving
  useEffect(() => {
    if (!dirty || state !== "ok") return;
    const t = setTimeout(() => { try { localStorage.setItem(backupKey, JSON.stringify({ ...p, _at: Date.now() })); } catch {} }, 1500);
    return () => clearTimeout(t);
  }, [p, dirty, state, backupKey]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const status = isNew && !p.active ? "draft" : postStatus(p);
  const future = when === "date" && new Date(p.published_at).getTime() > Date.now() + 60000;
  const seo = useMemo(() => analyze(postSeoInput(p, others, sitename)), [p, others, sitename]);
  const categories = useMemo(() => [...new Set(others.map((o) => o.category).filter(Boolean) as string[])].sort(), [others]);
  const allTags = useMemo(() => [...new Set(others.flatMap((o) => o.tags ?? []))].sort(), [others]);
  const words = wordCount(p.content_html ?? "");

  const setTitle = (title: string) => set({ title, ...(slugTouched ? {} : { slug: slugify(title) }) });
  const setSlug = (s: string) => { setSlugTouched(true); set({ slug: slugify(s) }); };

  /** mode: draft = save as draft · publish = publish now or schedule · update = keep the current status */
  const save = async (mode: "draft" | "publish" | "update") => {
    if (!p.title.trim()) return flash(false, "Add a title first.");
    const slug = p.slug || slugify(p.title);
    if (!slug) return flash(false, "Add a web address (slug).");
    setBusy(mode);
    const active = mode === "draft" ? false : mode === "publish" ? true : !!p.active;
    const published_at = mode === "publish" && when === "now" ? new Date().toISOString() : new Date(p.published_at).toISOString();
    const row = {
      ...Object.fromEntries(FIELDS.map((k) => [k, p[k] === "" ? null : p[k]])),
      title: p.title.trim(), slug, active, published_at, tags: p.tags ?? [], updated_at: new Date().toISOString(),
      schema_type: p.schema_type || "BlogPosting", featured: !!p.featured, noindex: !!p.noindex, deleted_at: null,
    };
    const res = isNew ? await db.from("posts").insert(row).select("id").single() : await db.from("posts").update(row).eq("id", id).select("id").single();
    setBusy("");
    if (res.error) return flash(false, res.error.message.includes("duplicate") ? "Another post already uses this web address. Change the slug." : res.error.message);
    const next = { ...p, slug, active, published_at, updated_at: row.updated_at };
    setP(next); setSaved(next);
    try { localStorage.removeItem(backupKey); } catch {}
    const st = postStatus(next);
    flash(true, st === "draft" ? "Draft saved" : st === "scheduled" ? `Scheduled for ${new Date(published_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}` : mode === "publish" ? "Published! It's live on the blog." : "Updated");
    if (isNew) router.replace(`/admin/posts/${res.data.id}`);
  };

  const trash = async () => {
    if (isNew || !confirm("Move this post to the trash? You can restore it from Blog → Trash.")) return;
    const { error } = await db.from("posts").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) return flash(false, error.message);
    setSaved(p); // nothing to warn about
    router.push("/admin/posts?saved=trashed");
  };

  // Ctrl+S
  const saveRef = useRef(save);
  saveRef.current = save;
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); saveRef.current(status === "draft" ? "draft" : "update"); } };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [status]);

  const addTag = (raw: string) => {
    const t = raw.trim().toLowerCase().replace(/^#/, "");
    if (t && !(p.tags ?? []).includes(t)) set({ tags: [...(p.tags ?? []), t] });
    setTagText("");
  };

  if (state === "loading") return <p className="grid place-items-center p-16 text-muted"><Loader2 className="animate-spin" /></p>;
  if (state === "missing") return (
    <div className="p-10 text-center">
      <p className="font-bold">This post was not found. It may have been deleted.</p>
      <Link href="/admin/posts" className="mt-4 inline-block font-bold text-brand-600">← Back to the blog</Link>
    </div>
  );

  const st = STATUS_STYLE[status];
  const t = scoreTone(seo.score);
  const primary = status === "published" || status === "scheduled"
    ? { mode: "update" as const, label: future && status !== "scheduled" ? "Schedule" : "Update" }
    : { mode: "publish" as const, label: future ? "Schedule" : "Publish" };

  return (
    <div className="space-y-6">
      {/* top bar */}
      <div className="z-30 -mx-4 flex lg:sticky lg:top-0 flex-wrap items-center gap-3 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur md:-mx-8 md:px-8">
        <Link href="/admin/posts" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted transition hover:text-brand-600"><ArrowLeft size={16} />Blog</Link>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${st.cls}`}>{st.label}</span>
        <span className="text-xs text-muted">{dirty ? "Unsaved changes" : p.updated_at ? `Saved ${new Date(p.updated_at).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" })}` : ""}</span>
        <a href="#seo" title="SEO score" className="ml-auto"><ScorePill score={seo.score} /></a>
        <button type="button" onClick={() => setPreview(true)} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-bold transition hover:border-brand-500"><Eye size={15} />Preview</button>
        {status !== "published" && status !== "scheduled" && (
          <button type="button" disabled={!!busy} onClick={() => save("draft")} className="rounded-full border border-line px-4 py-2 text-sm font-bold transition hover:border-brand-500 disabled:opacity-60">{busy === "draft" ? "Saving…" : "Save draft"}</button>
        )}
        <button type="button" disabled={!!busy} onClick={() => save(primary.mode)} className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60">
          {busy && busy !== "draft" ? <Loader2 size={15} className="animate-spin" /> : future ? <CalendarClock size={15} /> : <Send size={15} />}{primary.label}
        </button>
      </div>

      {backup && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <History size={18} className="text-amber-700" />
          <span className="flex-1">Unsaved changes from {new Date((backup as Post & { _at: number })._at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })} were found on this computer.</span>
          <button type="button" onClick={() => { const { _at, ...rest } = backup as Post & { _at: number }; void _at; setP({ ...rest, id: p.id }); setBackup(null); }} className="rounded-full bg-amber-600 px-4 py-1.5 font-bold text-white">Restore</button>
          <button type="button" onClick={() => { setBackup(null); try { localStorage.removeItem(backupKey); } catch {} }} className="font-bold text-muted">Discard</button>
        </div>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[1fr_340px]">
        {/* main column */}
        <div className="min-w-0 space-y-6">
          <div>
            <textarea value={p.title} onChange={(e) => setTitle(e.target.value.replace(/\n/g, " "))} rows={1} placeholder="Add title"
              className="w-full resize-none bg-transparent font-display text-4xl font-extrabold uppercase leading-tight outline-none placeholder:text-muted/60 md:text-5xl"
              style={{ fieldSizing: "content" } as React.CSSProperties} />
            <p className="mt-1 flex flex-wrap items-center gap-1 text-sm text-muted">
              Permalink: <span className="font-mono">/blog/</span>
              <input value={p.slug} onChange={(e) => setSlug(e.target.value)} placeholder="web-address" className="min-w-40 rounded-md border border-transparent bg-transparent px-1 font-mono text-brand-600 outline-none hover:border-line focus:border-brand-500" />
              {status === "published" && <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="font-bold text-brand-600 hover:underline">View post ↗</a>}
            </p>
          </div>

          <RichEditor value={p.content_html ?? ""} onChange={setHtml} />

          <div className={card}>
            <p className={boxTitle}>Excerpt</p>
            <textarea rows={3} value={p.excerpt ?? ""} onChange={(e) => set({ excerpt: e.target.value })} placeholder="1–2 sentences: shown under the title, on the blog list and (if no meta description) in Google." className={`${input} resize-y`} />
          </div>

          <PostSeo p={p} set={set} result={seo} sitename={sitename} onSlug={setSlug} />
        </div>

        {/* sidebar */}
        <aside className="space-y-4 xl:sticky xl:top-20">
          <div className={card}>
            <p className={boxTitle}><Send size={15} />Publish</p>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Status</dt><dd className="font-bold">{st.label}</dd></div>
              <div className="flex justify-between"><dt className="text-muted">Words</dt><dd className="font-bold">{words} · {readingMinutes(p.content_html ?? "")} min read</dd></div>
              <div className="flex justify-between"><dt className="text-muted">SEO</dt><dd className={`font-bold ${t.text}`}>{seo.score}/100 {t.label}</dd></div>
            </dl>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold">Publish date</p>
              <div className="flex gap-1 rounded-full bg-soft p-1 text-xs font-bold">
                {([["now", "Immediately"], ["date", "Pick date & time"]] as const).map(([k, l]) => (
                  <button key={k} type="button" onClick={() => setWhen(k)} className={`flex-1 rounded-full px-3 py-1.5 transition ${when === k ? "bg-card shadow-sm" : "text-muted"}`}>{l}</button>
                ))}
              </div>
              {when === "date" && <input type="datetime-local" value={toLocal(p.published_at)} onChange={(e) => e.target.value && set({ published_at: new Date(e.target.value).toISOString() })} className={input} />}
              {future && <p className="rounded-lg bg-purple-100 px-3 py-2 text-xs font-semibold text-purple-800">Future date: it goes live automatically on {new Date(p.published_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })}.</p>}
            </div>
            <label className="mt-4 flex cursor-pointer items-center gap-2.5 rounded-xl border border-line p-3 text-sm font-semibold">
              <input type="checkbox" checked={!!p.featured} onChange={(e) => set({ featured: e.target.checked })} className="h-4 w-4 accent-brand-600" />
              <Star size={15} className="text-amber-500" />Featured post (shown big at the top of the blog)
            </label>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
              {!isNew ? <button type="button" onClick={trash} className="inline-flex items-center gap-1.5 text-sm font-bold text-hot hover:underline"><Trash2 size={14} />Move to trash</button> : <span />}
              {(status === "published" || status === "scheduled") && <button type="button" disabled={!!busy} onClick={() => save("draft")} className="text-sm font-bold text-muted hover:text-fg">Switch to draft</button>}
            </div>
          </div>

          <div className={card}>
            <p className={boxTitle}><FolderOpen size={15} />Category</p>
            <input list="post-cats" value={p.category ?? ""} onChange={(e) => set({ category: e.target.value })} placeholder="e.g. Maintenance tips" className={input} />
            <datalist id="post-cats">{categories.map((c) => <option key={c} value={c} />)}</datalist>
            {categories.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {categories.map((c) => <button key={c} type="button" onClick={() => set({ category: c })} className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${p.category === c ? "bg-brand-600 text-white" : "bg-soft text-muted hover:text-fg"}`}>{c}</button>)}
              </div>
            )}
          </div>

          <div className={card}>
            <p className={boxTitle}><Tags size={15} />Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {(p.tags ?? []).map((tg) => (
                <span key={tg} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 dark:bg-brand-900 dark:text-white">
                  #{tg}<button type="button" aria-label={`Remove ${tg}`} onClick={() => set({ tags: (p.tags ?? []).filter((x) => x !== tg) })}><X size={12} /></button>
                </span>
              ))}
            </div>
            <input list="post-tags" value={tagText} onChange={(e) => (e.target.value.endsWith(",") ? addTag(e.target.value.slice(0, -1)) : setTagText(e.target.value))}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tagText); } }} onBlur={() => tagText && addTag(tagText)}
              placeholder="Type a tag, press Enter" className={`${input} mt-2`} />
            <datalist id="post-tags">{allTags.filter((x) => !(p.tags ?? []).includes(x)).map((x) => <option key={x} value={x} />)}</datalist>
          </div>

          <div className={card}>
            <p className={boxTitle}>Featured image</p>
            <ImageField value={p.cover || null} onChange={(x) => set({ cover: (x as string) ?? "" })} folder="blog" />
            <input value={p.cover_alt ?? ""} onChange={(e) => set({ cover_alt: e.target.value })} placeholder="Alt text: describe the picture (use the focus keyword)" className={`${input} mt-3`} />
            <p className="mt-1 text-xs text-muted">Wide picture, about 1200 × 630.</p>
          </div>

          <div className={card}>
            <p className={boxTitle}><UserRound size={15} />Author</p>
            <input value={p.author ?? ""} onChange={(e) => set({ author: e.target.value })} placeholder="Name shown on the article" className={input} />
          </div>
        </aside>
      </div>

      {/* preview */}
      <AnimatePresence>
        {preview && (
          <motion.div className="fixed inset-0 z-[80] overflow-y-auto bg-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-bg/90 px-4 py-3 backdrop-blur">
              <p className="text-sm font-bold">Preview <span className="font-normal text-muted">· how the article will look</span></p>
              <button type="button" onClick={() => setPreview(false)} className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white"><X size={15} />Close preview</button>
            </div>
            <article className="mx-auto max-w-3xl px-4 py-10"><ArticleView p={{ ...p, title: p.title || "Untitled post" }} /></article>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {msg && (
          <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} role="status" className={`fixed bottom-6 left-1/2 z-[90] flex -translate-x-1/2 items-center gap-2 rounded-full px-5 py-3 font-bold text-white shadow-xl ${msg.ok ? "bg-green-600" : "bg-hot"}`}>
            {msg.ok && <Check size={18} />}{msg.t}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
