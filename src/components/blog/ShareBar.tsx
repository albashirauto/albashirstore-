"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";
import { siFacebook, siWhatsapp, siX } from "simple-icons";

const Mark = ({ path }: { path: string }) => <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d={path} /></svg>;

/** Share the article: WhatsApp, Facebook, X, or copy the link. */
export default function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const btn = "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5";
  return (
    <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-line pt-6">
      <span className="mr-1 text-sm font-bold text-muted">Share:</span>
      <a href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`} target="_blank" rel="noreferrer" className={`${btn} bg-[#25D366] text-white`}><Mark path={siWhatsapp.path} />WhatsApp</a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" className={`${btn} bg-[#1877F2] text-white`}><Mark path={siFacebook.path} />Facebook</a>
      <a href={`https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`} target="_blank" rel="noreferrer" className={`${btn} bg-black text-white`}><Mark path={siX.path} />Post</a>
      <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} }} className={`${btn} border border-line`}>
        {copied ? <Check size={16} className="text-green-600" /> : <Link2 size={16} />}{copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
