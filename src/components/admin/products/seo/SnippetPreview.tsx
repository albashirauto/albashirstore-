"use client";

import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { SITE_URL } from "@/lib/seo";

/** Google result preview (desktop / mobile) with the price / stock line Product schema can earn (no stars: there are no reviews). */
export default function SnippetPreview({ title, description, slug, keyword, price, inStock, brand, section = "products" }: {
  title: string; description: string; slug: string; keyword: string; price?: string; inStock?: boolean; brand?: string;
  /** first URL folder: products, collections or brands */
  section?: string;
}) {
  const [mode, setMode] = useState<"desktop" | "mobile">("desktop");
  const host = SITE_URL.replace(/^https?:\/\//, "");
  const maxT = mode === "desktop" ? 60 : 75, maxD = mode === "desktop" ? 160 : 120;
  const t = title.length > maxT ? `${title.slice(0, maxT).trimEnd()}…` : title;
  const d = description.length > maxD ? `${description.slice(0, maxD).trimEnd()}…` : description;
  // bold the focus keyword like Google does
  const bold = (s: string) => {
    if (!keyword) return s;
    const parts = s.split(new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig"));
    return parts.map((x, i) => (x.toLowerCase() === keyword.toLowerCase() ? <b key={i}>{x}</b> : x));
  };

  return (
    <div className="rounded-xl border border-line bg-bg">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Google preview</p>
        <div className="flex gap-1 rounded-full bg-soft p-0.5">
          {([["desktop", Monitor], ["mobile", Smartphone]] as const).map(([m, I]) => (
            <button key={m} type="button" onClick={() => setMode(m)} aria-label={m} className={`grid h-7 w-8 place-items-center rounded-full transition ${mode === m ? "bg-card text-fg shadow-sm" : "text-muted"}`}><I size={14} /></button>
          ))}
        </div>
      </div>
      <div className={`p-4 font-[arial,sans-serif] ${mode === "mobile" ? "mx-auto max-w-[360px]" : ""}`}>
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-soft text-xs font-bold text-brand-600">B</span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm text-fg">Al Bashir Autos</p>
            <p className="truncate text-xs text-muted">{host} › {section} › {slug || "…"}</p>
          </div>
        </div>
        <p className={`mt-1.5 text-[#1a0dab] hover:underline dark:text-[#8ab4f8] ${mode === "mobile" ? "text-base" : "text-xl"}`}>{t || "Product title"}</p>
        <p className="mt-0.5 text-sm leading-snug text-[#4d5156] dark:text-[#bdc1c6]">{bold(d) || "Write a meta description so people know what they will find."}</p>
        {inStock !== undefined && (
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-[#4d5156] dark:text-[#bdc1c6]">
            {price && <span>{price}</span>}
            <span className={inStock ? "text-green-700" : "text-hot"}>· {inStock ? "In stock" : "Out of stock"}</span>
            {brand && <span>· {brand}</span>}
          </p>
        )}
      </div>
    </div>
  );
}
