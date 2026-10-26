"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Code2, Globe, Link2, Settings2, Share2 } from "lucide-react";
import { SCHEMA_TYPES } from "@/lib/blog";
import { SITE_URL, scoreTone, type Check } from "@/lib/seo";
import type { Post } from "@/lib/types";
import Checklist from "@/components/admin/products/seo/Checklist";
import KeywordInput from "@/components/admin/products/seo/KeywordInput";
import ScoreRing from "@/components/admin/products/seo/ScoreRing";
import SnippetPreview from "@/components/admin/products/seo/SnippetPreview";
import SocialPreview from "@/components/admin/products/seo/SocialPreview";
import { Count, Field, Toggle, input } from "@/components/admin/products/ui";

type Tab = "general" | "social" | "schema" | "advanced";
const TABS: { k: Tab; l: string; i: React.ElementType }[] = [
  { k: "general", l: "General", i: Globe }, { k: "social", l: "Social", i: Share2 },
  { k: "schema", l: "Schema", i: Code2 }, { k: "advanced", l: "Advanced", i: Settings2 },
];

/** Rank Math-style box for a blog post: focus keywords, Google snippet, social share, schema, robots + live score and checklist. */
export default function PostSeo({ p, set, result, sitename, onSlug }: {
  p: Post; set: (v: Partial<Post>) => void; result: { score: number; checks: Check[] }; sitename: string; onSlug: (s: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("general");
  const autoTitle = `${p.title || "Post title"} | ${sitename}`;
  const title = p.seo_title || autoTitle;
  const desc = p.seo_description || p.excerpt || "";
  const ogTitle = p.og_title || title, ogDesc = p.og_description || desc, ogImage = p.og_image || p.cover || "";
  const kw = (p.focus_keywords ?? "").split(",")[0]?.trim() ?? "";
  const body = `${p.title} ${(p.content_html ?? "").replace(/<[^>]+>/g, " ")}`.toLowerCase();
  const presence = (k: string) => (k ? body.split(k.toLowerCase()).length - 1 : 0);
  const t = scoreTone(result.score);
  const url = `${SITE_URL}/blog/${p.slug}`;
  const schema = {
    "@context": "https://schema.org", "@type": p.schema_type || "BlogPosting", headline: p.title, description: desc || undefined,
    image: p.cover ? [p.cover] : undefined, datePublished: p.published_at, dateModified: p.updated_at || p.published_at,
    author: p.author ? { "@type": "Person", name: p.author } : undefined, publisher: { "@type": "Organization", name: sitename },
    mainEntityOfPage: p.canonical_url || url, keywords: [kw, ...(p.tags ?? [])].filter(Boolean).join(", ") || undefined, articleSection: p.category || undefined,
  };

  return (
    <section id="seo" className="scroll-mt-24 rounded-2xl border border-line bg-card p-5 md:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">SEO</h2>
          <p className="text-sm text-muted">Rank Math-style checks. Get the score green before you publish.</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${t.bg} ${t.text}`}>{result.score}/100 · {t.label}</span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          <div className="mb-5 flex gap-1 overflow-x-auto border-b border-line scrollbar-none">
            {TABS.map(({ k, l, i: I }) => (
              <button key={k} type="button" onClick={() => setTab(k)} className={`relative flex shrink-0 items-center gap-1.5 px-4 pb-3 pt-1 text-sm font-bold transition-colors ${tab === k ? "text-brand-600" : "text-muted hover:text-fg"}`}>
                <I size={15} />{l}
                {tab === k && <motion.span layoutId="post-seo-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" />}
              </button>
            ))}
          </div>

          {tab === "general" && (
            <div className="space-y-4">
              <Field label="Focus keywords" help="First = main keyword (scored). Add 2–4 more that people also search, e.g. “cd 70 chain”, “chain sprocket price”.">
                <KeywordInput value={p.focus_keywords ?? ""} onChange={(v) => set({ focus_keywords: v })} presence={presence} />
              </Field>
              <Field label="SEO title" extra={<Count n={title.length} max={60} />}>
                <input value={p.seo_title ?? ""} onChange={(e) => set({ seo_title: e.target.value })} placeholder={autoTitle} className={input} />
              </Field>
              <Field label="Web address (slug)" help="Short, lowercase, with the focus keyword. Changing it after publishing breaks old links.">
                <input value={p.slug} onChange={(e) => onSlug(e.target.value)} className={`${input} font-mono`} />
              </Field>
              <Field label="Meta description" extra={<Count n={desc.length} max={160} />}>
                <textarea rows={3} value={p.seo_description ?? ""} onChange={(e) => set({ seo_description: e.target.value })} placeholder={p.excerpt || "120–160 characters: what the reader will learn, with the focus keyword."} className={`${input} resize-y`} />
              </Field>
              <div className="h-1.5 overflow-hidden rounded-full bg-line">
                <div className={`h-full rounded-full transition-all duration-500 ${desc.length >= 120 && desc.length <= 160 ? "bg-green-600" : desc.length > 160 ? "bg-hot" : "bg-amber-500"}`} style={{ width: `${Math.min(100, (desc.length / 160) * 100)}%` }} />
              </div>
              <SnippetPreview title={title} description={desc} slug={p.slug} keyword={kw} section="blog" />
            </div>
          )}

          {tab === "social" && (
            <div className="space-y-4">
              <p className="text-sm text-muted">What people see when this post is shared on Facebook, WhatsApp or X. Empty = uses the SEO title, description and cover picture.</p>
              <Field label="Share title" extra={<Count n={ogTitle.length} max={60} />}><input value={p.og_title ?? ""} onChange={(e) => set({ og_title: e.target.value })} placeholder={title} className={input} /></Field>
              <Field label="Share description" extra={<Count n={ogDesc.length} max={200} />}><textarea rows={2} value={p.og_description ?? ""} onChange={(e) => set({ og_description: e.target.value })} placeholder={desc} className={`${input} resize-y`} /></Field>
              <Field label="Share image" help="Best 1200 × 630 (JPG or PNG). Empty = the cover picture."><input value={p.og_image ?? ""} onChange={(e) => set({ og_image: e.target.value })} placeholder={p.cover || "https://…"} className={input} /></Field>
              <SocialPreview title={ogTitle} description={ogDesc} image={ogImage} />
            </div>
          )}

          {tab === "schema" && (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-3">
                {SCHEMA_TYPES.map((s) => (
                  <button key={s.v} type="button" onClick={() => set({ schema_type: s.v })} className={`rounded-xl border-2 p-3 text-left transition ${(p.schema_type || "BlogPosting") === s.v ? "border-brand-600 bg-brand-50 dark:bg-brand-900" : "border-line hover:border-brand-500/50"}`}>
                    <p className="font-bold">{s.l}</p><p className="text-xs text-muted">{s.d}</p>
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted">Added to the article page automatically with Breadcrumb schema, so Google understands the author, date and topic.</p>
              <pre className="max-h-72 overflow-auto rounded-xl bg-brand-900 p-4 text-xs leading-relaxed text-white/90">{JSON.stringify(schema, null, 2)}</pre>
            </div>
          )}

          {tab === "advanced" && (
            <div className="space-y-4">
              <Toggle on={!p.noindex} set={(v) => set({ noindex: !v })} label={p.noindex ? "No index" : "Index"} hint={p.noindex ? "Google will NOT show this post (left out of the sitemap)" : "Google can show this post"} />
              <Field label="Canonical URL" help="Only if this article was first published somewhere else. Empty = this page.">
                <div className="relative">
                  <Link2 size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input value={p.canonical_url ?? ""} onChange={(e) => set({ canonical_url: e.target.value })} placeholder={url} className={`${input} pl-10`} />
                </div>
              </Field>
            </div>
          )}
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="flex items-center gap-4 rounded-xl border border-line p-4">
            <ScoreRing score={result.score} />
            <div>
              <p className={`font-display text-2xl font-extrabold uppercase ${t.text}`}>{t.label}</p>
              <p className="text-xs text-muted">{result.checks.filter((c) => c.ok).length} of {result.checks.length} checks passed</p>
              {!kw && <p className="mt-1 text-xs font-semibold text-hot">Start by adding a focus keyword.</p>}
            </div>
          </div>
          <Checklist checks={result.checks} />
        </aside>
      </div>
    </section>
  );
}
