"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, ChevronDown, CircleAlert, XCircle } from "lucide-react";
import type { Check } from "@/lib/seo";

const GROUPS: Check["group"][] = ["Basic SEO", "Additional", "Title readability", "Content readability"];

/** Grouped pass / warn / fail list. Groups with problems open first. */
export default function Checklist({ checks }: { checks: Check[] }) {
  const [open, setOpen] = useState<string | null>(GROUPS.find((g) => checks.some((c) => c.group === g && !c.ok)) ?? GROUPS[0]);

  return (
    <div className="divide-y divide-line rounded-xl border border-line">
      {GROUPS.map((g) => {
        const list = checks.filter((c) => c.group === g);
        const errors = list.filter((c) => !c.ok && !c.warn).length;
        const warns = list.filter((c) => !c.ok && c.warn).length;
        const isOpen = open === g;
        return (
          <div key={g}>
            <button type="button" onClick={() => setOpen(isOpen ? null : g)} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold transition hover:bg-soft/60">
              <span className="min-w-0 flex-1 leading-snug">{g}</span>
              <span className="flex flex-wrap items-center justify-end gap-1.5">
                {errors > 0 && <span className="whitespace-nowrap rounded-full bg-hot/10 px-2.5 py-1 text-xs leading-none text-hot">{errors} error{errors > 1 ? "s" : ""}</span>}
                {warns > 0 && <span className="whitespace-nowrap rounded-full bg-amber-100 px-2.5 py-1 text-xs leading-none text-amber-800">{warns} to improve</span>}
                {!errors && !warns && <span className="whitespace-nowrap rounded-full bg-green-100 px-2.5 py-1 text-xs leading-none text-green-800">All good</span>}
              </span>
              <ChevronDown size={16} className={`shrink-0 text-muted transition ${isOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-4">
                  {list.map((c) => (
                    <li key={c.id} className="flex gap-2.5 pb-2.5 text-sm">
                      {c.ok ? <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-green-600" /> : c.warn ? <CircleAlert size={17} className="mt-0.5 shrink-0 text-amber-600" /> : <XCircle size={17} className="mt-0.5 shrink-0 text-hot" />}
                      <span className={c.ok ? "text-muted" : ""}>{c.text}</span>
                    </li>
                  ))}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
