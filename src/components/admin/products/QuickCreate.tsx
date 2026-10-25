"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X as Close } from "lucide-react";
import { browserClient } from "@/lib/supabase";
import { slugify, type Opt } from "./model";
import { input } from "./ui";

export type QuickKind = "category" | "subcategory" | "brand" | "vehicle" | "promotion";

const META: Record<QuickKind, { table: string; title: string; label: string }> = {
  category: { table: "categories", title: "New category", label: "name" },
  subcategory: { table: "categories", title: "New sub-category", label: "name" },
  brand: { table: "brands", title: "New brand", label: "name" },
  vehicle: { table: "vehicles", title: "New bike / vehicle", label: "name" },
  promotion: { table: "promotions", title: "New promotion", label: "title" },
};

/** Small pop-up to add a category / brand / bike / promotion without leaving the product. */
export default function QuickCreate({ kind, parents, defaultParent, onClose, onCreated }: {
  kind: QuickKind | null; parents: Opt[]; defaultParent?: string;
  onClose: () => void; onCreated: (kind: QuickKind, row: Opt) => void;
}) {
  const [name, setName] = useState("");
  const [parent, setParent] = useState(defaultParent ?? "");
  const [type, setType] = useState("motorcycle");
  const [company, setCompany] = useState("");
  const [badge, setBadge] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kind || !name.trim()) return;
    if (kind === "subcategory" && !parent) return setErr("Choose the main category.");
    const m = META[kind];
    const row: Record<string, unknown> = { [m.label]: name.trim(), slug: slugify(name), active: true };
    if (kind === "subcategory") row.parent_id = parent;
    if (kind === "vehicle") { row.type = type; row.company = company.trim() || null; }
    if (kind === "promotion") row.badge = badge.trim() || null;
    setBusy(true); setErr("");
    const { data, error } = await browserClient().from(m.table).insert(row).select(`id,${m.label}${kind === "subcategory" || kind === "category" ? ",parent_id" : ""}`).single();
    setBusy(false);
    if (error) return setErr(error.message.includes("duplicate") ? "That name is already used." : error.message);
    const d = data as Record<string, any>;
    onCreated(kind, { id: d.id, name: d[m.label], parent_id: d.parent_id ?? null, type: kind === "vehicle" ? type : null });
    setName(""); setBadge(""); setCompany("");
  };

  return (
    <AnimatePresence>
      {kind && (
        <motion.div className="fixed inset-0 z-[70] grid place-items-center bg-brand-900/50 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.form onSubmit={save} onClick={(e) => e.stopPropagation()} initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
            className="w-full max-w-sm rounded-2xl bg-bg p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold">{META[kind].title}</h3>
              <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 hover:bg-soft"><Close size={18} /></button>
            </div>
            <div className="mt-4 space-y-3">
              {kind === "subcategory" && (
                <select value={parent} onChange={(e) => setParent(e.target.value)} className={input} aria-label="Main category">
                  <option value="">Main category…</option>
                  {parents.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              )}
              <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className={input} />
              {kind === "vehicle" && (
                <div className="grid grid-cols-2 gap-2">
                  <select value={type} onChange={(e) => setType(e.target.value)} className={input} aria-label="Type">
                    {["motorcycle", "rickshaw", "loader", "cycle", "other"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company (Honda…)" className={input} />
                </div>
              )}
              {kind === "promotion" && <input value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="Badge, e.g. 30% OFF" className={input} />}
              {err && <p className="text-sm font-semibold text-hot">{err}</p>}
              <button disabled={busy} className="w-full rounded-full bg-brand-600 py-3 font-bold text-white transition hover:bg-brand-700 disabled:opacity-60">{busy ? "Adding…" : "Add and select"}</button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
