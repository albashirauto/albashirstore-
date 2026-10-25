"use client";

import { analyze, entityInput, entitySeo, scoreTone, type SeoEntity } from "@/lib/seo";
import Checklist from "./products/seo/Checklist";
import ScoreRing from "./products/seo/ScoreRing";
import SnippetPreview from "./products/seo/SnippetPreview";

/** Live SEO score + checklist + Google preview inside the category / brand form. */
export default function EntitySeoPanel({ kind, form, rows, sitename }: { kind: "category" | "brand"; form: Record<string, unknown>; rows: Record<string, unknown>[]; sitename?: string }) {
  const e = form as unknown as SeoEntity;
  if (!e.name) return <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">Type a name to see the SEO score.</p>;
  const { score, checks } = analyze(entityInput(kind, e, rows as unknown as SeoEntity[], sitename));
  const seo = entitySeo(kind, e, sitename);
  const t = scoreTone(score);
  const kw = (e.focus_keywords ?? "").split(",")[0]?.trim() ?? "";

  return (
    <section className="rounded-2xl border border-line bg-card p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-4">
        <ScoreRing score={score} size={96} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">SEO score for this {kind} page</p>
          <p className={`font-display text-2xl font-extrabold uppercase ${t.text}`}>{t.label}</p>
          <p className="text-xs text-muted">{checks.filter((c) => c.ok).length} of {checks.length} checks passed{!kw ? " · start by adding focus keywords" : ""}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SnippetPreview title={seo.title} description={seo.description} slug={e.slug} keyword={kw} section={kind === "category" ? "collections" : "brands"} />
        <Checklist checks={checks} />
      </div>
    </section>
  );
}
