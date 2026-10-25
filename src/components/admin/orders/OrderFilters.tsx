"use client";

import { motion } from "motion/react";
import { Download, Search, X } from "lucide-react";
import DateFilter from "@/components/admin/dashboard/DateFilter";
import type { Preset, Range } from "@/components/admin/dashboard/range";
import { PAYMENT, STATUS } from "@/components/admin/dashboard/types";
import { PAYMENTS } from "./types";
import { payLabel } from "@/lib/receipt";

export type Filters = { q: string; status: string; payment: string; method: string };

/** Search, status tabs (with counts), payment + method chips and the date range. */
export default function OrderFilters({ f, set, counts, methods, preset, setPreset, custom, setCustom, range, onExport, exportCount }: {
  f: Filters; set: (p: Partial<Filters>) => void;
  counts: Record<string, number>; methods: string[];
  preset: Preset; setPreset: (p: Preset) => void;
  custom: { from: string; to: string }; setCustom: (c: { from: string; to: string }) => void;
  range: Range; onExport: () => void; exportCount: number;
}) {
  const tabs = [{ key: "all", label: "All" }, ...STATUS.map((s) => ({ key: s.key as string, label: s.label }))];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-0 flex-1 basis-72 items-center gap-2 rounded-full border border-line bg-card px-4 transition focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10">
          <Search size={18} className="shrink-0 text-muted" />
          <input value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder="Search name, phone, order no., product or SKU"
            className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted" aria-label="Search orders" />
          {f.q && <button onClick={() => set({ q: "" })} aria-label="Clear search" className="text-muted hover:text-fg"><X size={16} /></button>}
        </label>
        <button onClick={onExport} disabled={!exportCount} className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-4 py-3 text-sm font-bold transition hover:border-brand-500 disabled:opacity-50">
          <Download size={16} />Export CSV ({exportCount})
        </button>
      </div>

      <DateFilter preset={preset} setPreset={setPreset} custom={custom} setCustom={setCustom} range={range} sticky={false}
        presets={[
          { key: "all", label: "All time" }, { key: "today", label: "Today" }, { key: "week", label: "This week" },
          { key: "month", label: "This month" }, { key: "30d", label: "Last 30 days" }, { key: "lastmonth", label: "Last month" }, { key: "custom", label: "Custom" },
        ]} />

      {/* status tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-line scrollbar-none">
        {tabs.map((t) => {
          const dot = STATUS.find((s) => s.key === t.key)?.dot;
          return (
            <button key={t.key} onClick={() => set({ status: t.key })} className={`relative flex shrink-0 items-center gap-2 px-4 pb-3 pt-1 text-sm font-bold transition-colors ${f.status === t.key ? "text-brand-600" : "text-muted hover:text-fg"}`}>
              {dot && <span className={`h-2 w-2 rounded-full ${dot}`} />}
              {t.label}
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${f.status === t.key ? "bg-brand-600 text-white" : "bg-soft"}`}>{counts[t.key] ?? 0}</span>
              {f.status === t.key && <motion.span layoutId="order-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-600" />}
            </button>
          );
        })}
      </div>

      {/* payment + method */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-muted">Payment:</span>
        {["all", ...PAYMENTS].map((p) => (
          <button key={p} onClick={() => set({ payment: p })} className={`rounded-full px-3 py-1 font-bold transition ${f.payment === p ? "bg-brand-900 text-white dark:bg-white dark:text-brand-900" : "bg-card text-muted ring-1 ring-line hover:text-fg"}`}>
            {p === "all" ? "All" : PAYMENT[p].label}
          </button>
        ))}
        {methods.length > 1 && (
          <>
            <span className="ml-3 font-semibold text-muted">Method:</span>
            {["all", ...methods].map((m) => (
              <button key={m} onClick={() => set({ method: m })} className={`rounded-full px-3 py-1 font-bold transition ${f.method === m ? "bg-brand-900 text-white dark:bg-white dark:text-brand-900" : "bg-card text-muted ring-1 ring-line hover:text-fg"}`}>
                {m === "all" ? "All" : payLabel(m)}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
