"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy, Landmark, Smartphone } from "lucide-react";
import { PAY_METHODS, type PayMethod } from "@/lib/receipt";
import type { Settings } from "@/lib/types";

const BRAND: Record<PayMethod, { dot: string; ring: string; icon: React.ElementType }> = {
  jazzcash: { dot: "bg-[#d71f26]", ring: "border-[#d71f26]", icon: Smartphone },
  easypaisa: { dot: "bg-[#3bb54a]", ring: "border-[#3bb54a]", icon: Smartphone },
  bank: { dot: "bg-brand-600", ring: "border-brand-600", icon: Landmark },
};

function CopyRow({ label, value }: { label: string; value: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-bg px-3 py-2">
      <span className="text-xs text-muted">{label}</span>
      <span className="flex items-center gap-2 font-mono text-sm font-bold">
        {value}
        <button type="button" onClick={() => { navigator.clipboard?.writeText(value.replace(/\s/g, "")); setDone(true); setTimeout(() => setDone(false), 1500); }} aria-label={`Copy ${label}`} className="rounded p-1 text-muted hover:text-brand-600">
          {done ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
        </button>
      </span>
    </div>
  );
}

/** JazzCash / Easypaisa / Bank transfer: account details to send money to + optional transaction id. */
export default function PaymentPicker({ s, method, setMethod, ref_, setRef, total }: {
  s: Settings; method: PayMethod | ""; setMethod: (m: PayMethod) => void; ref_: string; setRef: (v: string) => void; total: string;
}) {
  const details: Record<PayMethod, { label: string; value?: string }[]> = {
    jazzcash: [{ label: "JazzCash number", value: s.jazzcash_number }, { label: "Account name", value: s.jazzcash_name }],
    easypaisa: [{ label: "Easypaisa number", value: s.easypaisa_number }, { label: "Account name", value: s.easypaisa_name }],
    bank: [{ label: "Bank", value: s.bank_name }, { label: "Account title", value: s.bank_title }, { label: "IBAN / account", value: s.bank_iban }],
  };

  return (
    <div>
      <div className="grid gap-2 sm:grid-cols-3">
        {PAY_METHODS.map((m) => {
          const on = method === m.key, b = BRAND[m.key];
          return (
            <button key={m.key} type="button" onClick={() => setMethod(m.key)} aria-pressed={on}
              className={`flex items-center gap-3 rounded-xl border-2 p-3.5 text-left font-bold transition ${on ? `${b.ring} bg-card shadow-md` : "border-line hover:border-brand-500/50"}`}>
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white ${b.dot}`}><b.icon size={17} /></span>
              <span className="flex-1">{m.label}</span>
              <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${on ? `${b.ring} ${b.dot}` : "border-line"}`}>{on && <Check size={11} strokeWidth={4} className="text-white" />}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {method && (
          <motion.div key={method} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 rounded-xl border border-line bg-soft p-4">
            <p className="text-sm">Send <b>{total}</b> to:</p>
            <div className="mt-2 space-y-1.5">
              {details[method].filter((d) => d.value).map((d) => <CopyRow key={d.label} label={d.label} value={d.value!} />)}
              {!details[method].some((d) => d.value) && <p className="rounded-lg bg-bg px-3 py-2 text-sm text-muted">We will send you the account details on WhatsApp right after you place the order.</p>}
            </div>
            <label className="mt-4 block text-sm font-semibold">Transaction ID (TID) <span className="font-normal text-muted">(optional, if you already paid)</span>
              <input value={ref_} onChange={(e) => setRef(e.target.value)} placeholder="e.g. 123456789012" className="mt-1 w-full rounded-xl border border-line bg-bg px-4 py-3 font-mono outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10" />
            </label>
            <p className="mt-2 text-xs text-muted">You can also pay after ordering and send the screenshot on WhatsApp. We confirm every payment before dispatch.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
