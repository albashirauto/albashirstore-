"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { AlertTriangle, HardDrive } from "lucide-react";
import { size, storageInfo, type StorageInfo } from "@/lib/storage";

/** Space used vs the limit in Settings. Green, amber from the warning %, red when full. `refresh` reloads it. */
export default function StorageMeter({ refresh = 0, children }: { refresh?: string | number; children?: React.ReactNode }) {
  const [info, setInfo] = useState<StorageInfo | null>(null);
  useEffect(() => { storageInfo().then(setInfo).catch(() => {}); }, [refresh]);

  const pct = info ? Math.min(100, (info.bytes / info.limit) * 100) : 0;
  const full = pct >= 100, warn = info ? pct >= info.warnPct : false;
  const tone = full ? "bg-hot" : warn ? "bg-amber-500" : "bg-gradient-to-r from-brand-500 to-brand-600";

  return (
    <div className={`rounded-2xl border bg-card p-4 md:p-5 ${full ? "border-hot/50" : warn ? "border-amber-400/60" : "border-line"}`}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${full ? "bg-hot/10 text-hot" : warn ? "bg-amber-400/15 text-amber-600" : "bg-brand-500/10 text-brand-600"}`}>
          {warn ? <AlertTriangle size={20} /> : <HardDrive size={20} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">
            {info ? <>{size(info.bytes)} <span className="font-semibold text-muted">of {size(info.limit)} used</span></> : "Checking storage…"}
          </p>
          <p className="text-xs text-muted">
            {info && (full ? "Storage is full. New uploads are blocked until you delete pictures or raise the limit."
              : warn ? `Over ${info.warnPct}% used. Delete unused pictures to free space.`
              : `${size(Math.max(0, info.limit - info.bytes))} free · ${info.files} files · uploads are compressed to ${size(info.maxUpload)} max`)}
          </p>
        </div>
        <span className={`text-2xl font-extrabold tabular-nums ${full ? "text-hot" : warn ? "text-amber-600" : "text-brand-600"}`}>{info ? `${pct < 1 && pct > 0 ? pct.toFixed(1) : Math.round(pct)}%` : ""}</span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-soft" role="progressbar" aria-label="Storage used" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <motion.div className={`h-full rounded-full ${tone}`} initial={{ width: 0 }} animate={{ width: `${Math.max(pct, info?.bytes ? 1 : 0)}%` }} transition={{ duration: 0.9, ease: "easeOut" }} />
      </div>
      {children}
    </div>
  );
}
