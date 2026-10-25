import { Box, History, Receipt } from "lucide-react";
import { ago, type DActivity } from "./types";

/** Admin changes, stock adjustments and order updates, written by database triggers. */
export default function RecentActivity({ items, ready }: { items: DActivity[]; ready: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5 md:p-6">
      <h3 className="flex items-center gap-2 text-xl font-bold"><History size={19} className="text-muted" />Recent activity</h3>
      {!ready ? (
        <p className="mt-4 text-sm text-muted">Run <code>supabase/002_dashboard.sql</code> to start recording activity.</p>
      ) : items.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Nothing yet. Orders, stock and price changes will appear here.</p>
      ) : (
        <ol className="relative mt-4 space-y-4 border-l border-line pl-5">
          {items.map((a) => {
            const Icon = a.entity === "order" ? Receipt : Box;
            return (
              <li key={a.id} className="relative text-sm">
                <span className={`absolute -left-[31px] grid h-5 w-5 place-items-center rounded-full ring-4 ring-card ${a.entity === "order" ? "bg-brand-600" : "bg-amber-500"} text-white`}><Icon size={11} /></span>
                <p><b>{a.action}</b>{a.detail && <span className="text-muted"> · {a.detail}</span>}</p>
                <p className="text-xs text-muted">{a.actor_email ? a.actor_email.split("@")[0] : "Customer"} · {ago(a.at)}</p>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
