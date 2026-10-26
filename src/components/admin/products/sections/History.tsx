"use client";

import { useEffect, useState } from "react";
import { History as HistoryIcon, Package, Tag } from "lucide-react";
import { browserClient } from "@/lib/supabase";
import { Section } from "../ui";

type Row = { id: number; at: string; actor_email: string | null; action: string; detail: string | null };

/** Stock and price changes of this product (from the activity log the database keeps). */
export default function History({ id }: { id: string }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  useEffect(() => {
    browserClient().from("activity").select("id,at,actor_email,action,detail").eq("entity", "product").eq("entity_id", id).order("at", { ascending: false }).limit(100)
      .then(({ data }: { data: Row[] | null }) => setRows(data ?? []));
  }, [id]);
  return (
    <Section id="history" title="History" sub="Every stock and price change, newest first, with who made it.">
      {!rows ? <p className="text-sm text-muted">Loading…</p> : !rows.length ? <p className="text-sm text-muted">No changes recorded yet.</p> : (
        <ol className="relative space-y-3 border-l-2 border-line pl-5">
          {rows.map((r) => {
            const Icon = /stock/i.test(r.action) ? Package : /price/i.test(r.action) ? Tag : HistoryIcon;
            return (
              <li key={r.id} className="relative">
                <span className="absolute -left-[31px] top-0.5 grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-white"><Icon size={11} /></span>
                <p className="text-sm font-bold">{r.action}<span className="font-normal text-muted"> · {r.detail?.split(" · ").slice(1).join(" · ") || r.detail}</span></p>
                <p className="text-xs text-muted">{new Date(r.at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })} · {r.actor_email ?? "website / system"}</p>
              </li>
            );
          })}
        </ol>
      )}
    </Section>
  );
}
