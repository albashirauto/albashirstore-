"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Truck, X } from "lucide-react";
import { statusOf } from "@/components/admin/dashboard/types";
import { CANCEL_REASONS, COURIERS, RETURN_REASONS, type Order } from "./types";

const input = "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";

export type StatusChange = { order: Order; status: string };

/** Asks for the reason (cancel / return) or courier + tracking (shipped) before changing the status. */
export default function StatusDialog({ change, onClose, onSave }: { change: StatusChange | null; onClose: () => void; onSave: (id: string, patch: Partial<Order>) => void }) {
  const [reason, setReason] = useState("");
  const [courier, setCourier] = useState("");
  const [tracking, setTracking] = useState("");

  useEffect(() => {
    if (!change) return;
    setReason(change.order.status_reason ?? "");
    setCourier(change.order.courier ?? "");
    setTracking(change.order.tracking_no ?? "");
  }, [change]);

  if (!change) return <AnimatePresence />;
  const { order, status } = change;
  const shipping = status === "shipped";
  const reasons = status === "cancelled" ? CANCEL_REASONS : RETURN_REASONS;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const patch: Partial<Order> = { status };
    if (shipping) Object.assign(patch, { courier: courier || null, tracking_no: tracking.trim() || null, dispatched_at: order.dispatched_at ?? new Date().toISOString() });
    else Object.assign(patch, { status_reason: reason.trim() || null });
    onSave(order.id, patch);
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-brand-900/50 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.form onSubmit={save} onClick={(e) => e.stopPropagation()} initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-md rounded-2xl bg-bg p-6 shadow-2xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-2xl font-bold">{shipping ? "Dispatch order" : `Mark as ${statusOf(status).label.toLowerCase()}`}</h3>
              <p className="text-sm text-muted">{order.customer_name} · #{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-soft"><X size={18} /></button>
          </div>

          {shipping ? (
            <div className="mt-5 space-y-3">
              <p className="text-sm font-semibold">Courier</p>
              <div className="flex flex-wrap gap-2">
                {COURIERS.map((c) => (
                  <button key={c} type="button" onClick={() => setCourier(c)} className={`rounded-full px-3 py-1.5 text-sm font-bold transition ${courier === c ? "bg-purple-600 text-white" : "bg-soft text-muted hover:text-fg"}`}>{c}</button>
                ))}
              </div>
              <label className="block text-sm font-semibold">Tracking / consignment number
                <span className="relative mt-1.5 block">
                  <Truck size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input autoFocus value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="e.g. 1234567890" className={`${input} pl-10`} />
                </span>
              </label>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              <p className="text-sm font-semibold">Reason</p>
              <div className="flex flex-wrap gap-2">
                {reasons.map((r) => (
                  <button key={r} type="button" onClick={() => setReason(r)} className={`rounded-full px-3 py-1.5 text-sm font-bold transition ${reason === r ? "bg-hot text-white" : "bg-soft text-muted hover:text-fg"}`}>{r}</button>
                ))}
              </div>
              <textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Or write the reason" className={`${input} resize-y`} />
            </div>
          )}

          <div className="mt-6 flex gap-2">
            <button type="button" onClick={onClose} className="rounded-full border border-line px-5 py-2.5 text-sm font-bold hover:bg-soft">Cancel</button>
            <button className={`flex-1 rounded-full py-2.5 text-sm font-bold text-white transition ${shipping ? "bg-purple-600 hover:bg-purple-700" : "bg-hot hover:bg-hot-dark"}`}>
              {shipping ? "Mark as shipped" : `Mark as ${statusOf(status).label.toLowerCase()}`}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </AnimatePresence>
  );
}
