"use client";

import { useState } from "react";
import { Crown, X } from "lucide-react";

/** Focus keywords as chips. First chip = main keyword (scored); others are extra keywords. Enter or comma adds. */
export default function KeywordInput({ value, onChange, presence }: { value: string; onChange: (v: string) => void; presence: (kw: string) => number }) {
  const [draft, setDraft] = useState("");
  const list = value.split(",").map((k) => k.trim()).filter(Boolean);
  const save = (l: string[]) => onChange([...new Set(l)].join(", "));
  const add = () => { const k = draft.trim().replace(/,$/, ""); if (k) save([...list, k]); setDraft(""); };

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-bg p-2 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10">
      {list.map((k, i) => (
        <span key={k} className={`inline-flex items-center gap-1 rounded-full py-1 pl-2.5 pr-1 text-sm font-semibold ${i === 0 ? "bg-brand-600 text-white" : "bg-soft"}`}>
          {i === 0 && <Crown size={12} />}
          {k}
          <span className={`rounded-full px-1.5 text-[10px] ${i === 0 ? "bg-white/20" : "bg-card text-muted"}`} title="Times used in the description">{presence(k)}×</span>
          {i > 0 && <button type="button" onClick={() => save([k, ...list.filter((x) => x !== k)])} title="Make main keyword" className="rounded-full px-1 text-[10px] font-bold text-brand-600 hover:bg-card">main</button>}
          <button type="button" aria-label={`Remove ${k}`} onClick={() => save(list.filter((x) => x !== k))} className="grid h-5 w-5 place-items-center rounded-full hover:bg-black/10"><X size={12} /></button>
        </span>
      ))}
      <input value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={add}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } if (e.key === "Backspace" && !draft && list.length) save(list.slice(0, -1)); }}
        placeholder={list.length ? "Add another keyword…" : "e.g. cd 70 chain kit (press Enter)"} className="min-w-40 flex-1 bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-muted" />
    </div>
  );
}
