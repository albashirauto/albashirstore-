"use client";

import { useEffect, useState } from "react";
import { openStatus } from "@/lib/hours";

/** "Open now · Closes 8 pm" / "Closed · Opens 8 am tomorrow", worked out in the visitor's browser on Pakistan time
 *  (pages are cached, so the server can't know the current time). Renders nothing until then, or if the hours can't be read. */
export function OpenBadge({ hours, className = "", light = false }: { hours?: string; className?: string; light?: boolean }) {
  const [s, setS] = useState<ReturnType<typeof openStatus>>(null);
  useEffect(() => {
    const tick = () => setS(openStatus(hours));
    tick();
    const t = setInterval(tick, 60_000);
    return () => clearInterval(t);
  }, [hours]);
  if (!s) return null;
  // light = on the dark footer
  const tone = s.open
    ? (s.soon ? `bg-amber-500/15 ${light ? "text-amber-300" : "text-amber-700 dark:text-amber-400"}` : `bg-green-600/15 ${light ? "text-green-300" : "text-green-700 dark:text-green-400"}`)
    : `bg-hot/15 ${light ? "text-red-300" : "text-hot"}`;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${tone} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.open ? (s.soon ? "bg-amber-500" : "animate-pulse bg-green-500") : "bg-hot"}`} />
      {s.open ? "Open now" : "Closed now"}{s.text && <span className="font-semibold opacity-80">· {s.text}</span>}
    </span>
  );
}

/** Opening hours as typed in Store settings (one line per day group) with the live badge on top. */
export default function OpeningHours({ hours, className = "", light = false }: { hours?: string; className?: string; light?: boolean }) {
  if (!hours) return null;
  return (
    <span className={`grid gap-1 ${className}`}>
      <OpenBadge hours={hours} light={light} className="justify-self-start" />
      {hours.split(/\r?\n/).filter((l) => l.trim()).map((l, i) => <span key={i}>{l}</span>)}
    </span>
  );
}
