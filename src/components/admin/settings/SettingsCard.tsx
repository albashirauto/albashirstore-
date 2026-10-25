"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Loader2 } from "lucide-react";
import { browserClient } from "@/lib/supabase";

export type Vals = Record<string, string>;
export type CardProps = { v: Vals; set: (k: string, val: string) => void; saved: Vals; onSaved: (keys: string[]) => void };

export const input = "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";

export function Field({ label, help, children, wide }: { label: string; help?: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block text-sm font-semibold ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block">{label}</span>
      {children}
      {help && <span className="mt-1 block text-xs font-normal text-muted">{help}</span>}
    </label>
  );
}

/** A settings card that saves only its own keys. Shows "unsaved changes" until saved. */
export default function SettingsCard({ title, sub, icon: Icon, keys, v, saved, onSaved, children }: {
  title: string; sub?: string; icon: React.ElementType; keys: string[]; children: React.ReactNode;
} & Pick<CardProps, "v" | "saved" | "onSaved">) {
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [err, setErr] = useState("");
  const dirty = keys.some((k) => (v[k] ?? "") !== (saved[k] ?? ""));

  const save = async () => {
    setState("saving"); setErr("");
    const { error } = await browserClient().from("settings").upsert(keys.map((key) => ({ key, value: (v[key] ?? "").trim() })));
    if (error) { setState("error"); setErr(error.message); return; }
    onSaved(keys);
    setState("done");
    setTimeout(() => setState("idle"), 2200);
  };

  return (
    <section className="rounded-2xl border border-line bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 md:px-6">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900"><Icon size={19} /></span>
          <div>
            <h2 className="text-lg font-bold leading-tight">{title}</h2>
            {sub && <p className="text-sm text-muted">{sub}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AnimatePresence mode="wait">
            {state === "done" ? <motion.span key="d" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1 text-sm font-bold text-green-600"><Check size={16} />Saved</motion.span>
              : dirty ? <motion.span key="u" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs font-semibold text-amber-600">Unsaved changes</motion.span> : null}
          </AnimatePresence>
          <button type="button" onClick={save} disabled={!dirty || state === "saving"} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-40">
            {state === "saving" && <Loader2 size={14} className="animate-spin" />}Save
          </button>
        </div>
      </div>
      <div className="p-5 md:p-6">{children}</div>
      {state === "error" && <p className="border-t border-line px-6 py-3 text-sm font-semibold text-hot">Could not save: {err}</p>}
    </section>
  );
}
