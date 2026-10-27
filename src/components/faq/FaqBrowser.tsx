"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Plus, Search, X } from "lucide-react";
import { FAQ_TOPICS, topicLabel } from "@/lib/faq";
import type { Faq } from "@/lib/types";

/** Search box + topic chips over the questions, grouped by topic. */
export default function FaqBrowser({ items }: { items: Faq[] }) {
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("");

  const topics = useMemo(() => {
    const keys = [...new Set(items.map((f) => f.topic || "other"))];
    const order = FAQ_TOPICS.map((t) => t.key as string);
    return keys.sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
  }, [items]);

  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const match = (f: Faq) => (!topic || (f.topic || "other") === topic) && words.every((w) => `${f.question} ${f.answer}`.toLowerCase().includes(w));
  const groups = topics.map((t) => ({ t, list: items.filter((f) => (f.topic || "other") === t && match(f)) })).filter((g) => g.list.length);
  const total = groups.reduce((n, g) => n + g.list.length, 0);

  const chip = (on: boolean) => `shrink-0 rounded-full px-4 py-2 text-sm font-bold transition ${on ? "bg-brand-600 text-white shadow-md shadow-brand-600/25" : "bg-card text-fg/75 ring-1 ring-line hover:text-brand-600 hover:ring-brand-500/50"}`;

  return (
    <div>
      <div className="rounded-3xl border border-line bg-card p-3 shadow-sm sm:p-4">
        <label className="relative flex items-center">
          <Search size={19} className="pointer-events-none absolute left-4 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search questions, e.g. delivery, payment, warranty" aria-label="Search questions"
            className="w-full rounded-2xl border-2 border-line bg-bg py-3.5 pl-12 pr-11 outline-none transition placeholder:text-muted focus:border-brand-500" />
          {q && <button onClick={() => setQ("")} aria-label="Clear search" className="absolute right-3 grid h-7 w-7 place-items-center rounded-full bg-soft text-muted hover:text-fg"><X size={15} /></button>}
        </label>
        <div className="-mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
          <button onClick={() => setTopic("")} className={chip(!topic)}>All topics</button>
          {topics.map((t) => <button key={t} onClick={() => setTopic(t)} className={chip(topic === t)}>{topicLabel(t)}</button>)}
        </div>
      </div>

      {(q || topic) && <p className="mt-4 text-sm text-muted">{total} question{total === 1 ? "" : "s"} found</p>}

      <div className="mt-6 space-y-8">
        {/* initial={false}: visible straight from the server HTML; only search/topic changes animate */}
        <AnimatePresence mode="popLayout" initial={false}>
          {groups.map((g) => (
            <motion.section key={g.t} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-hot"><span className="h-px w-6 bg-hot" />{topicLabel(g.t)}</h2>
              <div className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-card">
                {g.list.map((f) => (
                  <details key={f.id} name="faq" open={words.length > 0} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 font-bold transition hover:bg-soft/60 sm:px-6 [&::-webkit-details-marker]:hidden">
                      {f.question}
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-soft text-brand-600 transition duration-300 group-open:rotate-45 group-open:bg-brand-600 group-open:text-white"><Plus size={16} /></span>
                    </summary>
                    <p className="whitespace-pre-line px-4 pb-5 leading-relaxed text-muted sm:px-6 sm:pr-16">{f.answer}</p>
                  </details>
                ))}
              </div>
            </motion.section>
          ))}
        </AnimatePresence>
        {!groups.length && (
          <div className="rounded-2xl border border-dashed border-line py-14 text-center">
            <p className="font-bold">No question matches “{q}”.</p>
            <p className="mt-1 text-sm text-muted">Try another word, or ask us directly below.</p>
          </div>
        )}
      </div>
    </div>
  );
}
