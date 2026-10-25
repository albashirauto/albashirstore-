"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { Printer } from "lucide-react";
import Receipt, { PAPERS, type Paper } from "@/components/admin/print/Receipt";
import ShippingLabel from "@/components/admin/print/ShippingLabel";
import type { Order } from "@/components/admin/orders/types";
import { browserClient } from "@/lib/supabase";

/** Print view for one order. Needs an admin session (orders are admin-only). Remembers the last paper size. */
export default function PrintOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [o, setO] = useState<Order | null>(null);
  const [s, setS] = useState<Record<string, string>>({});
  const [skus, setSkus] = useState<Map<string, string>>(new Map());
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  const [paper, setPaper] = useState<Paper>("a4");

  useEffect(() => {
    // ?paper=label46 from the "Print label" button wins over the remembered size
    const want = new URLSearchParams(window.location.search).get("paper") as Paper | null;
    let saved: Paper | null = null;
    try { saved = localStorage.getItem(want?.startsWith("label") ? "aba-label" : "aba-paper") as Paper | null; } catch {}
    const pick = want?.startsWith("label") ? (saved?.startsWith("label") ? saved : want) : want ?? saved;
    if (pick && PAPERS.some((x) => x.key === pick)) setPaper(pick);
    const db = browserClient();
    (async () => {
      const [o, s, p] = await Promise.all([
        db.from("orders").select("*").eq("id", id).maybeSingle(),
        db.from("settings").select("key,value"),
        db.from("products").select("id,sku"),
      ]);
      if (!o.data) return setState("missing");
      setO(o.data as Order);
      setS(Object.fromEntries(((s.data as { key: string; value: string }[]) ?? []).map((r) => [r.key, r.value ?? ""])));
      setSkus(new Map(((p.data as { id: string; sku: string | null }[]) ?? []).filter((x) => x.sku).map((x) => [x.id, x.sku!])));
      setState("ok");
    })();
  }, [id]);

  const choose = (p: Paper) => { setPaper(p); try { localStorage.setItem(p.startsWith("label") ? "aba-label" : "aba-paper", p); } catch {} };
  const P = PAPERS.find((x) => x.key === paper)!;

  if (state === "loading") return <p className="p-10 text-center text-neutral-500">Loading receipt…</p>;
  if (state === "missing")
    return (
      <div className="p-10 text-center">
        <p className="font-bold">Order not found, or you are not signed in.</p>
        <Link href="/admin" className="mt-2 inline-block font-bold text-brand-600 underline">Sign in to the admin panel</Link>
      </div>
    );

  return (
    <div className="min-h-dvh bg-neutral-200 print:bg-white">
      <style>{`@page { size: ${P.page}; margin: ${P.thermal ? "0" : "0"}; } @media print { html, body { background: #fff !important; } }`}</style>

      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-neutral-300 bg-white px-4 py-3 print:hidden">
        <span className="mr-1 text-sm font-bold text-neutral-600">Paper:</span>
        {PAPERS.map((x) => (
          <button key={x.key} onClick={() => choose(x.key)} className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${paper === x.key ? "bg-[#0a1f66] text-white" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"}`}>{x.label}</button>
        ))}
        <button onClick={() => window.print()} className="ml-auto inline-flex items-center gap-2 rounded-full bg-[#1d4fd8] px-6 py-2 text-sm font-bold text-white hover:bg-[#153eb0]"><Printer size={16} />Print</button>
      </div>

      <div className="flex justify-center p-6 print:block print:p-0">
        <div className="shadow-xl print:shadow-none">
          {o && (P.isLabel ? <ShippingLabel o={o} s={s} width={P.width} height={P.height!} /> : <Receipt o={o} s={s} skus={skus} paper={paper} />)}
        </div>
      </div>
      <p className="pb-6 text-center text-xs text-neutral-500 print:hidden">In the print window, set margins to “None” and turn off “Headers and footers” for a clean receipt.</p>
    </div>
  );
}
