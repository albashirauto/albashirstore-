"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Inbox, Plus } from "lucide-react";
import { inRange, presetRange, ymd, type Preset } from "@/components/admin/dashboard/range";
import NewOrder, { type PickProduct } from "@/components/admin/orders/NewOrder";
import OrderFilters, { type Filters } from "@/components/admin/orders/OrderFilters";
import OrderRow from "@/components/admin/orders/OrderRow";
import OrderSummary from "@/components/admin/orders/OrderSummary";
import StatusDialog, { type StatusChange } from "@/components/admin/orders/StatusDialog";
import { STATUSES, orderNo, pieces, type Order } from "@/components/admin/orders/types";
import { statusOf } from "@/components/admin/dashboard/types";
import { browserClient } from "@/lib/supabase";

const PER_PAGE = 20;

/** Orders: search, status / payment / date filters, breakdown, export. Sections in src/components/admin/orders/. */
export default function Orders() {
  const db = browserClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<PickProduct[]>([]);
  const [shipping, setShipping] = useState(400);
  const [storeName, setStoreName] = useState("Al Bashir Autos");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [asking, setAsking] = useState<StatusChange | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [f, setF] = useState<Filters>({ q: "", status: "all", payment: "all", method: "all" });
  const [preset, setPreset] = useState<Preset>("all");
  const [custom, setCustom] = useState(() => ({ from: ymd(new Date(Date.now() - 6 * 86400000)), to: ymd(new Date()) }));
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [o, p, s] = await Promise.all([
      db.from("orders").select("*").order("created_at", { ascending: false }).limit(5000),
      db.from("products").select("id,name,sku,price,stock,active,scheme_buy,scheme_free").order("name"),
      db.from("settings").select("key,value").in("key", ["shipping_flat", "store_name"]),
    ]);
    setOrders((o.data as Order[]) ?? []);
    setProducts((p.data as PickProduct[]) ?? []);
    const st = Object.fromEntries(((s.data as { key: string; value: string }[]) ?? []).map((r) => [r.key, r.value]));
    if (st.shipping_flat) setShipping(Number(st.shipping_flat) || 0);
    if (st.store_name) setStoreName(st.store_name);
    setLoaded(true);
  }, [db]);
  useEffect(() => { load(); }, [load]);

  // the dashboard links here with ?status=new etc.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const s = sp.get("status");
    if (s && (STATUSES as readonly string[]).includes(s)) setF((x) => ({ ...x, status: s }));
    if (sp.has("new")) setCreating(true);
    const q = sp.get("q");
    if (q) setF((x) => ({ ...x, q }));
  }, []);

  const set = (p: Partial<Filters>) => { setF((x) => ({ ...x, ...p })); setPage(1); };
  const setPresetReset = (p: Preset) => { setPreset(p); setPage(1); };

  const update = async (id: string, patch: Partial<Order>) => {
    setOrders((o) => o.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    const { error } = await db.from("orders").update(patch).eq("id", id);
    if (error) { alert(error.message.includes("column") ? "Run supabase/006_orders.sql first (adds reason, courier and tracking)." : `Could not save: ${error.message}`); load(); }
  };

  // cancel / return asks for a reason, shipped asks for courier + tracking
  const onStatus = (o: Order, status: string) => {
    if (["cancelled", "returned", "shipped"].includes(status)) setAsking({ order: o, status });
    else update(o.id, { status });
  };

  const remove = async (o: Order) => {
    if (!confirm(`Delete order #${orderNo(o)} for ${o.customer_name}? This cannot be undone.`)) return;
    const { error } = await db.from("orders").delete().eq("id", o.id);
    if (error) return alert(error.message);
    setOrders((x) => x.filter((y) => y.id !== o.id));
    setOpen(null);
  };

  const skus = useMemo(() => new Map(products.filter((x) => x.sku).map((x) => [x.id, x.sku!])), [products]);
  const range = useMemo(() => presetRange(preset, custom), [preset, custom]);
  const methods = useMemo(() => [...new Set(orders.map((o) => o.payment_method).filter(Boolean) as string[])], [orders]);

  // date + search + payment + method, then status counts, then the status tab
  const base = useMemo(() => {
    const q = f.q.trim().toLowerCase().replace(/^#/, "");
    return orders.filter((o) => {
      if (!inRange(o.created_at, range)) return false;
      if (f.payment !== "all" && (o.payment_status ?? "unpaid") !== f.payment) return false;
      if (f.method !== "all" && o.payment_method !== f.method) return false;
      if (!q) return true;
      const hay = [
        o.customer_name, o.phone, o.phone.replace(/\D/g, ""), o.city, o.email, orderNo(o), o.id, String(o.order_no ?? ""),
        ...(o.items ?? []).flatMap((i) => [i.name, i.id ? skus.get(i.id) : ""]),
      ].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [orders, range, f, skus]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: base.length };
    STATUSES.forEach((s) => { c[s] = base.filter((o) => o.status === s).length; });
    return c;
  }, [base]);
  const shown = f.status === "all" ? base : base.filter((o) => o.status === f.status);
  const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE));
  const pageItems = shown.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const exportCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const head = ["Order", "Date", "Customer", "Phone", "City", "Address", "Items", "Pieces", "Subtotal", "Delivery", "Total", "Status", "Payment"];
    const rows = shown.map((o) => [
      orderNo(o), new Date(o.created_at).toLocaleString("en-PK"), o.customer_name, o.phone, o.city, o.address,
      (o.items ?? []).map((i) => `${i.name} x${i.qty}${i.free ? ` +${i.free} free` : ""}`).join("; "), pieces(o),
      o.subtotal, o.shipping, o.total, statusOf(o.status).label, o.payment_status ?? "unpaid",
    ].map(esc).join(","));
    const blob = new Blob(["﻿" + [head.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `orders-${ymd(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold uppercase leading-none text-brand-900 dark:text-white md:text-5xl">Orders</h1>
          <p className="mt-1.5 text-muted">Find any order, update its status and payment, and see totals for any period.</p>
        </div>
        <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-bold text-white shadow-lg shadow-brand-600/25 transition hover:-translate-y-0.5 hover:bg-brand-700"><Plus size={18} />New order</button>
      </div>

      <NewOrder open={creating || !!editing} editing={editing} onClose={() => { setCreating(false); setEditing(null); }} products={products} orders={orders} shipping={shipping}
        onSaved={async (id) => { setCreating(false); setEditing(null); setF({ q: "", status: "all", payment: "all", method: "all" }); setPreset("all"); setPage(1); await load(); setOpen(id); }} />

      <OrderFilters f={f} set={set} counts={counts} methods={methods} preset={preset} setPreset={setPresetReset}
        custom={custom} setCustom={(c) => { setCustom(c); setPage(1); }} range={range} onExport={exportCsv} exportCount={shown.length} />

      <StatusDialog change={asking} onClose={() => setAsking(null)} onSave={(id, patch) => { setAsking(null); update(id, patch); }} />

      <OrderSummary orders={shown} range={range} />

      {!loaded ? (
        <p className="py-10 text-center text-muted">Loading orders…</p>
      ) : shown.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line py-16 text-center">
          <Inbox size={36} className="mx-auto text-muted" />
          <p className="mt-2 font-semibold">No orders match</p>
          <p className="text-sm text-muted">Try another date range, status or search word.</p>
        </div>
      ) : (
        <>
          <ul className="space-y-2.5">
            {pageItems.map((o) => (
              <OrderRow key={o.id} o={o} skus={skus} open={open === o.id} toggle={() => setOpen(open === o.id ? null : o.id)}
                onStatus={onStatus} setPayment={(id, payment_status) => update(id, { payment_status })} onEdit={setEditing} onDelete={remove} store={storeName} />
            ))}
          </ul>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-muted">Showing <b className="text-fg">{(page - 1) * PER_PAGE + 1}–{(page - 1) * PER_PAGE + pageItems.length}</b> of {shown.length}</p>
            {pages > 1 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page" className="grid h-9 w-9 place-items-center rounded-full border border-line transition hover:border-brand-600 disabled:opacity-40"><ChevronLeft size={16} /></button>
                <span className="font-semibold">Page {page} of {pages}</span>
                <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} aria-label="Next page" className="grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"><ChevronRight size={16} /></button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
