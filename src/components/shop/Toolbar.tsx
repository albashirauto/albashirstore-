"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpDown, Search, SlidersHorizontal, X } from "lucide-react";
import { SORTS, buildHref, type SP } from "./url";

/** Search within results, result count, sort and (on phones) the filter drawer. */
export default function Toolbar({ basePath, sp, total, active, filters }: { basePath: string; sp: SP; total: number; active: number; filters: React.ReactNode }) {
  const router = useRouter();
  const [q, setQ] = useState(sp.q ?? "");
  const [open, setOpen] = useState(false);

  useEffect(() => setQ(sp.q ?? ""), [sp.q]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const go = (patch: Partial<SP>) => router.push(buildHref(basePath, sp, patch), { scroll: false });

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-card p-3 shadow-xl shadow-brand-900/[0.07]">
        <button onClick={() => setOpen(true)} className="relative inline-flex items-center gap-2 rounded-full border border-line px-4 py-2.5 text-sm font-bold transition hover:border-brand-500 lg:hidden">
          <SlidersHorizontal size={16} />Filters
          {active > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-hot px-1 text-[11px] text-white">{active}</span>}
        </button>

        <form onSubmit={(e) => { e.preventDefault(); go({ q: q.trim() || undefined }); }} className="flex min-w-0 flex-1 basis-60 items-center gap-2 rounded-full bg-soft px-4 transition focus-within:bg-card focus-within:ring-2 focus-within:ring-brand-500/40">
          <Search size={17} className="shrink-0 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search in these parts" aria-label="Search in these parts" className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-muted" />
          {q && <button type="button" onClick={() => { setQ(""); go({ q: undefined }); }} aria-label="Clear search" className="text-muted hover:text-fg"><X size={16} /></button>}
        </form>

        <p className="hidden px-2 text-sm text-muted md:block"><b className="text-fg">{total}</b> {total === 1 ? "part" : "parts"}</p>

        <label className="relative inline-flex items-center">
          <ArrowUpDown size={15} className="pointer-events-none absolute left-3.5 text-muted" />
          <select value={sp.sort ?? "newest"} onChange={(e) => go({ sort: e.target.value === "newest" ? undefined : e.target.value })} aria-label="Sort by"
            className="cursor-pointer appearance-none rounded-full border border-line bg-card py-2.5 pl-9 pr-5 text-sm font-semibold outline-none transition hover:border-brand-500 focus:border-brand-500">
            {SORTS.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
        </label>
      </div>

      {/* phone filter drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-[60] bg-brand-900/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              className="fixed inset-x-0 bottom-0 z-[61] flex max-h-[85dvh] flex-col rounded-t-3xl bg-bg shadow-2xl"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 32, stiffness: 320 }}
              onClickCapture={(e) => { if ((e.target as HTMLElement).closest("a")) setOpen(false); }}
            >
              <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line" />
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <h2 className="text-2xl font-bold">Filters</h2>
                <button onClick={() => setOpen(false)} aria-label="Close filters" className="rounded-full p-2 hover:bg-soft"><X size={20} /></button>
              </div>
              <div className="overflow-y-auto px-5 pb-4">{filters}</div>
              <div className="border-t border-line p-4">
                <button onClick={() => setOpen(false)} className="w-full rounded-full bg-brand-600 py-3 font-bold text-white">Show {total} {total === 1 ? "part" : "parts"}</button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
