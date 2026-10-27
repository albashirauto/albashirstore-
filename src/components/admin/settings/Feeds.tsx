"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Copy, ExternalLink, Rss } from "lucide-react";
import { browserClient } from "@/lib/supabase";
import { feedSkip } from "@/lib/feed-rules";
import type { Product } from "@/lib/types";

const STEPS = [
  { name: "Google Merchant Center", link: "https://merchants.google.com/", how: "Products › Add products › Add from a file › Enter a link to your file, paste the feed link, choose daily." },
  { name: "Facebook & Instagram shop", link: "https://business.facebook.com/commerce/", how: "Commerce Manager › Catalog › Data sources › Add items › Data feed › Scheduled feed, paste the feed link, choose daily." },
];

/** Product feed link + which products are in it (Settings > SEO & site files). */
export default function Feeds() {
  const [rows, setRows] = useState<Product[] | null>(null);
  const [copied, setCopied] = useState(false);
  const url = typeof window === "undefined" ? "/feeds/products.xml" : `${window.location.origin}/feeds/products.xml`;

  useEffect(() => {
    browserClient().from("products").select("id,name,price,images,active").order("name").then(({ data }: { data: Product[] | null }) => setRows(data ?? []));
  }, []);

  const live = rows?.filter((p) => p.active) ?? [];
  const left = live.map((p) => ({ p, why: feedSkip(p) })).filter((x) => x.why);
  const copy = async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {} };

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="flex items-center gap-3 border-b border-line p-5 md:px-6">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/10 text-brand-600"><Rss size={20} /></span>
        <div>
          <h2 className="font-bold">Google & Facebook product feed</h2>
          <p className="text-sm text-muted">Your products on Google Shopping and in your Facebook & Instagram shop. Updates itself every hour.</p>
        </div>
      </div>
      <div className="space-y-5 p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-xl bg-soft px-4 py-2.5 text-sm">{url}</code>
          <button type="button" onClick={copy} className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700">{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? "Copied" : "Copy link"}</button>
          <a href="/feeds/products.xml" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-sm font-bold transition hover:bg-soft"><ExternalLink size={15} />Open</a>
        </div>

        {rows && (
          <div className="grid gap-3 sm:grid-cols-3">
            {[["Live products", live.length, "text-fg"], ["In the feed", live.length - left.length, "text-green-600"], ["Left out", left.length, left.length ? "text-amber-600" : "text-fg"]].map(([l, n, c]) => (
              <div key={l as string} className="rounded-xl bg-soft p-4"><p className="text-xs font-semibold text-muted">{l}</p><p className={`font-display text-3xl font-bold ${c}`}>{n}</p></div>
            ))}
          </div>
        )}
        {left.length > 0 && (
          <div className="rounded-xl border border-amber-400/50 bg-amber-50 p-4 text-sm dark:bg-amber-500/10">
            <p className="font-bold text-amber-900 dark:text-amber-200">Google and Facebook need a photo and a price. Fix these to add them:</p>
            <ul className="mt-2 space-y-1">
              {left.slice(0, 8).map(({ p, why }) => <li key={p.id}><Link href={`/admin/products/${p.id}`} className="font-semibold text-brand-600 hover:underline">{p.name}</Link> <span className="text-muted">· {why}</span></li>)}
              {left.length > 8 && <li className="text-muted">…and {left.length - 8} more</li>}
            </ul>
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          {STEPS.map((s) => (
            <div key={s.name} className="rounded-xl border border-line p-4">
              <a href={s.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-bold text-brand-600 hover:underline">{s.name}<ExternalLink size={13} /></a>
              <p className="mt-1 text-sm text-muted">{s.how}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted">Set your delivery charges and return policy in Merchant Center too. Hidden products, and products without a photo or price, are never sent.</p>
      </div>
    </section>
  );
}
