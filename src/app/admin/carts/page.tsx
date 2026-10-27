"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Clock3, Phone, RotateCcw, ShoppingCart, Trash2 } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { ago } from "@/components/admin/dashboard/types";
import { browserClient } from "@/lib/supabase";
import { money } from "@/lib/format";

type Item = { id: string; slug?: string; name: string; qty: number; price: number };
type Cart = { id: string; phone: string; name: string | null; city: string | null; items: Item[]; subtotal: number; status: "open" | "contacted" | "recovered" | "dismissed"; contacted_at: string | null; recovered_order: string | null; created_at: string; updated_at: string };
type Tab = "open" | "recovered" | "dismissed";
const wa = (p: string) => p.replace(/\D/g, "").replace(/^0/, "92");
const STALE = 30 * 60000; // still typing for the first half hour

/** Abandoned carts: people who typed their phone at checkout but did not order. Remind them on WhatsApp. */
export default function Carts() {
  const db = browserClient();
  const [rows, setRows] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("open");
  const [store, setStore] = useState("Al Bashir Autos");
  const [msg, setMsg] = useState("");
  const [now] = useState(() => Date.now());

  const load = useCallback(async () => {
    const [{ data, error }, { data: s }] = await Promise.all([
      db.from("abandoned_carts").select("*").order("updated_at", { ascending: false }).limit(1000),
      db.from("settings").select("value").eq("key", "store_name").maybeSingle(),
    ]);
    if (error) setMsg(error.message.includes("abandoned_carts") ? "Run supabase/021_abandoned_carts.sql first." : error.message);
    setRows((data as Cart[]) ?? []); if (s?.value) setStore(s.value); setLoading(false);
  }, [db]);
  useEffect(() => { load(); }, [load]);

  const open = rows.filter((c) => (c.status === "open" || c.status === "contacted") && now - new Date(c.updated_at).getTime() > STALE);
  const typing = rows.filter((c) => (c.status === "open" || c.status === "contacted") && now - new Date(c.updated_at).getTime() <= STALE).length;
  const recovered = rows.filter((c) => c.status === "recovered");
  const shown = tab === "open" ? open : rows.filter((c) => c.status === tab);
  const value = useMemo(() => ({ open: open.reduce((n, c) => n + Number(c.subtotal), 0), recovered: recovered.reduce((n, c) => n + Number(c.subtotal), 0) }), [open, recovered]);
  const rate = open.length + recovered.length ? Math.round((recovered.length / (open.length + recovered.length)) * 100) : 0;

  const message = (c: Cart) => {
    const list = c.items.slice(0, 6).map((i) => `• ${i.name} × ${i.qty}`).join("\n");
    return `Assalam o Alaikum${c.name ? ` ${c.name.split(" ")[0]}` : ""}! This is ${store}. You left these parts in your cart:\n${list}\n\nTotal ${money(Number(c.subtotal))}. Shall we book your order? You can also finish it here: ${window.location.origin}/checkout\nAny question about fitment, just reply here.`;
  };
  const remind = async (c: Cart) => {
    window.open(`https://wa.me/${wa(c.phone)}?text=${encodeURIComponent(message(c))}`, "_blank", "noopener");
    await db.from("abandoned_carts").update({ status: "contacted", contacted_at: new Date().toISOString() }).eq("id", c.id);
    load();
  };
  const setStatus = async (c: Cart, status: Cart["status"]) => { await db.from("abandoned_carts").update({ status }).eq("id", c.id); load(); };
  const remove = async (c: Cart) => { if (!confirm("Delete this cart?")) return; await db.from("abandoned_carts").delete().eq("id", c.id); load(); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold uppercase leading-none text-brand-900 dark:text-white sm:text-4xl md:text-5xl">Abandoned carts</h1>
        <p className="mt-1.5 text-muted">People who typed their phone at checkout but did not order. A friendly WhatsApp often brings them back.</p>
      </div>
      {msg && <p className="rounded-2xl bg-hot/10 p-4 text-sm font-semibold text-hot">{msg}</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { l: "Waiting for follow-up", v: String(open.length), hot: open.length > 0 },
          { l: "Value left in carts", v: money(value.open) },
          { l: "Recovered sales", v: money(value.recovered) },
          { l: "Recovery rate", v: `${rate}%` },
        ].map((x) => (
          <div key={x.l} className={`rounded-2xl border bg-card p-4 ${x.hot ? "border-amber-500/50" : "border-line"}`}>
            <p className="text-sm font-semibold text-muted">{x.l}</p>
            <p className={`mt-1 truncate font-display text-3xl font-extrabold ${x.hot ? "text-amber-600" : ""}`}>{x.v}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 rounded-full bg-soft p-1">
          {([["open", "To follow up", open.length], ["recovered", "Recovered", recovered.length], ["dismissed", "Dismissed", rows.filter((c) => c.status === "dismissed").length]] as const).map(([k, l, n]) => (
            <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${tab === k ? "bg-card shadow-sm" : "text-muted hover:text-fg"}`}>{l} <span className="text-xs opacity-70">({n})</span></button>
          ))}
        </div>
        {typing > 0 && <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted"><Clock3 size={13} />{typing} checking out right now (shown after 30 min)</span>}
      </div>

      {loading ? <p className="py-10 text-center text-muted">Loading…</p> : !shown.length ? (
        <div className="rounded-2xl border border-dashed border-line py-16 text-center">
          <ShoppingCart size={36} className="mx-auto text-brand-500/50" />
          <p className="mt-2 font-bold">{tab === "open" ? "No carts to follow up." : "Nothing here."}</p>
          <p className="text-sm text-muted">Carts appear when someone enters their phone at checkout and leaves without ordering.</p>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {shown.map((c) => (
            <li key={c.id} className="flex flex-col rounded-2xl border border-line bg-card p-5">
              <div className="flex flex-wrap items-start gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display text-lg font-bold text-white">{(c.name || "?").charAt(0).toUpperCase()}</span>
                <div className="min-w-0 flex-1 leading-tight">
                  <p className="font-bold">{c.name || "No name yet"}{c.city && <span className="font-normal text-muted"> · {c.city}</span>}</p>
                  <p className="text-sm text-muted">{c.phone}</p>
                  <p className="mt-0.5 text-xs text-muted">Left {ago(c.updated_at)}{c.status === "contacted" && c.contacted_at ? ` · reminded ${ago(c.contacted_at)}` : ""}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-extrabold">{money(Number(c.subtotal))}</p>
                  {c.status === "contacted" && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800">Reminded</span>}
                  {c.status === "recovered" && <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-bold text-green-800">Ordered</span>}
                </div>
              </div>
              <ul className="mt-3 flex-1 space-y-1 rounded-xl bg-soft p-3 text-sm">
                {c.items.slice(0, 5).map((i, k) => (
                  <li key={k} className="flex justify-between gap-3">
                    {i.slug ? <Link href={`/products/${i.slug}`} target="_blank" className="truncate hover:text-brand-600">{i.name}</Link> : <span className="truncate">{i.name}</span>}
                    <span className="shrink-0 text-muted">× {i.qty} · {money(i.price * i.qty)}</span>
                  </li>
                ))}
                {c.items.length > 5 && <li className="text-xs text-muted">+ {c.items.length - 5} more</li>}
              </ul>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {c.status !== "recovered" && <button onClick={() => remind(c)} className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#1ebe5b]"><WhatsAppIcon size={16} />{c.status === "contacted" ? "Remind again" : "Send reminder"}</button>}
                <a href={`tel:${c.phone}`} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-bold transition hover:border-brand-600"><Phone size={14} />Call</a>
                {c.status === "recovered" && c.recovered_order && <Link href={`/admin/orders?open=${c.recovered_order}`} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-bold transition hover:border-brand-600"><Check size={14} />View order</Link>}
                <span className="ml-auto" />
                {c.status === "dismissed" ? <button onClick={() => setStatus(c, "open")} title="Back to follow-up" className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-soft"><RotateCcw size={15} /></button>
                  : c.status !== "recovered" && <button onClick={() => setStatus(c, "dismissed")} className="text-xs font-bold text-muted hover:text-fg">Dismiss</button>}
                <button onClick={() => remove(c)} title="Delete" className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-hot/10 hover:text-hot"><Trash2 size={15} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
