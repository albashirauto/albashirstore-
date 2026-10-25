"use client";

import { motion } from "motion/react";
import { CalendarRange } from "lucide-react";
import { PRESETS, rangeLabel, ymd, type Preset, type Range } from "./range";

/** One row of date controls that drives every number and chart on the dashboard. */
export default function DateFilter({ preset, setPreset, custom, setCustom, range, presets = PRESETS.filter((p) => p.key !== "all"), sticky = true }: {
  preset: Preset; setPreset: (p: Preset) => void; presets?: readonly { key: Preset; label: string }[]; sticky?: boolean;
  custom: { from: string; to: string }; setCustom: (c: { from: string; to: string }) => void;
  range: Range;
}) {
  return (
    <div className={sticky ? "sticky top-0 z-20 -mx-4 border-b border-line bg-soft/90 px-4 py-3 backdrop-blur md:-mx-8 md:px-8" : ""}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 overflow-x-auto rounded-full border border-line bg-card p-1 scrollbar-none">
          {presets.map((p) => (
            <button key={p.key} onClick={() => setPreset(p.key)} className={`relative shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${preset === p.key ? "text-white" : "text-muted hover:text-fg"}`}>
              {preset === p.key && <motion.span layoutId="dash-range" className="absolute inset-0 rounded-full bg-brand-600" transition={{ type: "spring", stiffness: 450, damping: 36 }} />}
              <span className="relative">{p.label}</span>
            </button>
          ))}
        </div>

        {preset === "custom" && (
          <div className="flex items-center gap-2 text-sm">
            <input type="date" value={custom.from} max={custom.to || ymd(new Date())} onChange={(e) => setCustom({ ...custom, from: e.target.value })} className="rounded-full border border-line bg-card px-3 py-1.5 font-semibold outline-none focus:border-brand-500" aria-label="From date" />
            <span className="text-muted">to</span>
            <input type="date" value={custom.to} min={custom.from} max={ymd(new Date())} onChange={(e) => setCustom({ ...custom, to: e.target.value })} className="rounded-full border border-line bg-card px-3 py-1.5 font-semibold outline-none focus:border-brand-500" aria-label="To date" />
          </div>
        )}

        <p className="ml-auto flex items-center gap-2 text-sm font-semibold text-muted"><CalendarRange size={16} />{rangeLabel(range)}</p>
      </div>
    </div>
  );
}
