"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Code2, Globe, Link2, Settings2, Share2 } from "lucide-react";
import { VARIABLES, fillVars, productJsonLd, scoreTone, type Check, type VarCtx } from "@/lib/seo";
import type { P } from "../model";
import Checklist from "../seo/Checklist";
import KeywordInput from "../seo/KeywordInput";
import ScoreRing from "../seo/ScoreRing";
import SnippetPreview from "../seo/SnippetPreview";
import SocialPreview from "../seo/SocialPreview";
import { Count, Field, Section, Toggle, input } from "../ui";

type Tab = "general" | "social" | "schema" | "advanced";
const TABS: { k: Tab; l: string; i: React.ElementType }[] = [
  { k: "general", l: "General", i: Globe }, { k: "social", l: "Social", i: Share2 },
  { k: "schema", l: "Schema", i: Code2 }, { k: "advanced", l: "Advanced", i: Settings2 },
];

/** Rank Math-style SEO box: keywords, snippet editor with variables, social, schema, robots + live score. */
export default function Seo({ p, set, ctx, tpl, result, inStock }: {
  p: P; set: (v: Partial<P>) => void; ctx: VarCtx; tpl: { title: string; desc: string };
  result: { score: number; checks: Check[] }; inStock: boolean;
}) {
  const [tab, setTab] = useState<Tab>("general");
  const title = fillVars(p.seo_title || tpl.title, ctx);
  const desc = fillVars(p.seo_description || p.description || tpl.desc, ctx);
  const ogTitle = p.og_title || title, ogDesc = p.og_description || desc, ogImage = p.og_image || p.images[0] || "";
  const kw = p.focus_keywords.split(",")[0]?.trim() ?? "";
  const body = `${p.description} ${p.details_html.replace(/<[^>]+>/g, " ")}`.toLowerCase();
  const presence = (k: string) => (k ? body.split(k.toLowerCase()).length - 1 : 0);
  const t = scoreTone(result.score);
  const schema = productJsonLd({ name: p.name, slug: p.slug, description: desc, images: p.images, sku: p.sku, price: Number(p.price) || 0, brand: ctx.brand, category: ctx.category, condition: p.condition, outOfStock: !inStock });

  return (
    <Section id="seo" title="SEO" sub="Rank Math-style checks. Green score = easier to find on Google.">
      <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
        <div className="min-w-0">
          {/* tabs */}
          <div className="mb-5 flex gap-1 overflow-x-auto border-b border-line scrollbar-none">
            {TABS.map(({ k, l, i: I }) => (
              <button key={k} type="button" onClick={() => setTab(k)} className={`relative flex shrink-0 items-center gap-1.5 px-4 pb-3 pt-1 text-sm font-bold transition-colors ${tab === k ? "text-brand-600" : "text-muted hover:text-fg"}`}>
                <I size={15} />{l}
                {tab === k && <motion.span layoutId="seo-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" />}
              </button>
            ))}
          </div>

          {tab === "general" && (
            <div className="space-y-4">
              <Field label="Focus keywords" help="First = main keyword (scored). Add extra keywords people also search, e.g. “cd 70 chain”, “honda chain sprocket”.">
                <KeywordInput value={p.focus_keywords} onChange={(v) => set({ focus_keywords: v })} presence={presence} />
              </Field>

              <Field label="SEO title" extra={<Count n={title.length} max={60} />}>
                <input value={p.seo_title} onChange={(e) => set({ seo_title: e.target.value })} placeholder={tpl.title} className={input} />
              </Field>
              <div className="-mt-2 flex flex-wrap gap-1">
                {VARIABLES.map((v) => (
                  <button key={v.v} type="button" title={v.d} onClick={() => set({ seo_title: `${(p.seo_title || tpl.title).trimEnd()} ${v.v}` })} className="rounded-md bg-soft px-2 py-0.5 font-mono text-[11px] text-muted transition hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900">{v.v}</button>
                ))}
              </div>

              <Field label="Meta description" extra={<Count n={desc.length} max={160} />}>
                <textarea rows={3} value={p.seo_description} onChange={(e) => set({ seo_description: e.target.value })} placeholder={desc} className={`${input} resize-y`} />
              </Field>
              <div className="h-1.5 overflow-hidden rounded-full bg-line">
                <div className={`h-full rounded-full transition-all duration-500 ${desc.length >= 120 && desc.length <= 160 ? "bg-green-600" : desc.length > 160 ? "bg-hot" : "bg-amber-500"}`} style={{ width: `${Math.min(100, (desc.length / 160) * 100)}%` }} />
              </div>

              <SnippetPreview title={title} description={desc} slug={p.slug} keyword={kw} price={p.price ? `Rs. ${Number(p.price).toLocaleString("en-PK")}` : ""} inStock={inStock} brand={ctx.brand} />
            </div>
          )}

          {tab === "social" && (
            <div className="space-y-4">
              <p className="text-sm text-muted">What people see when this product is shared on Facebook, WhatsApp or X. Empty = uses the SEO title, description and first photo.</p>
              <Field label="Share title" extra={<Count n={ogTitle.length} max={60} />}><input value={p.og_title} onChange={(e) => set({ og_title: e.target.value })} placeholder={title} className={input} /></Field>
              <Field label="Share description" extra={<Count n={ogDesc.length} max={200} />}><textarea rows={2} value={p.og_description} onChange={(e) => set({ og_description: e.target.value })} placeholder={desc} className={`${input} resize-y`} /></Field>
              <Field label="Share image" help="Best size 1200 × 630. Pick one of the product photos or paste a link.">
                <div className="flex flex-wrap gap-2">
                  {p.images.slice(0, 6).map((u) => (
                    <button key={u} type="button" onClick={() => set({ og_image: u === p.og_image ? "" : u })} className={`h-14 w-14 overflow-hidden rounded-lg border-2 transition ${ogImage === u ? "border-brand-600" : "border-line hover:border-brand-500"}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                  <input value={p.og_image} onChange={(e) => set({ og_image: e.target.value })} placeholder="https://… (optional)" className={`${input} min-w-48 flex-1`} />
                </div>
              </Field>
              <SocialPreview title={ogTitle} description={ogDesc} image={ogImage} />
            </div>
          )}

          {tab === "schema" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  { l: "Schema type", v: "Product" },
                  { l: "Price", v: p.price ? `PKR ${Math.round(Number(p.price))}` : "missing", bad: !p.price },
                  { l: "Availability", v: inStock ? "In stock" : "Out of stock" },
                  { l: "Brand", v: ctx.brand || "missing", bad: !ctx.brand },
                  { l: "SKU", v: p.sku || "missing", bad: !p.sku },
                  { l: "Images", v: p.images.length ? `${p.images.length}` : "missing", bad: !p.images.length },
                ].map((x) => (
                  <div key={x.l} className={`rounded-xl border p-3 ${x.bad ? "border-amber-500/40 bg-amber-500/5" : "border-line"}`}>
                    <p className="text-xs font-semibold text-muted">{x.l}</p>
                    <p className={`font-bold ${x.bad ? "text-amber-700" : ""}`}>{x.v}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted">Added to the product page automatically, together with Breadcrumb schema. It helps Google show price and stock under your result.</p>
              <pre className="max-h-72 overflow-auto rounded-xl bg-brand-900 p-4 text-xs leading-relaxed text-white/90">{JSON.stringify(schema, null, 2)}</pre>
            </div>
          )}

          {tab === "advanced" && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Toggle on={!p.robots_noindex} set={(v) => set({ robots_noindex: !v })} label={p.robots_noindex ? "No index" : "Index"} hint={p.robots_noindex ? "Google will NOT show this product" : "Google can show this product"} />
                <Toggle on={!p.robots_nofollow} set={(v) => set({ robots_nofollow: !v })} label={p.robots_nofollow ? "No follow" : "Follow links"} hint="Let Google follow links on this page" />
              </div>
              <Field label="Canonical URL" help="Only if the same product lives at another address. Empty = this page.">
                <div className="relative">
                  <Link2 size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input value={p.canonical_url} onChange={(e) => set({ canonical_url: e.target.value })} placeholder="https://…" className={`${input} pl-10`} />
                </div>
              </Field>
              {p.robots_noindex && <p className="rounded-xl bg-hot/10 p-3 text-sm font-semibold text-hot">This product is hidden from Google and left out of the sitemap.</p>}
            </div>
          )}
        </div>

        {/* score */}
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
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
    </Section>
  );
}
