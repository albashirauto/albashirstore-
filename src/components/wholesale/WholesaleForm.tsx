"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, CheckCircle2, Loader2, Send } from "lucide-react";
import { submitWholesale } from "@/app/actions";
import WhatsAppIcon from "@/components/WhatsAppIcon";

const input = "w-full rounded-xl border border-line bg-bg px-4 py-3 outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";
const TYPES = [["shop", "Parts shop"], ["workshop", "Workshop / mechanic"], ["dealer", "Dealer / distributor"], ["fleet", "Fleet / rickshaw owner"], ["other", "Other"]];
const VOLUMES = ["Under Rs. 50,000", "Rs. 50,000 – 2 lakh", "Rs. 2 – 5 lakh", "Over Rs. 5 lakh", "Not sure yet"];

/** Saved to Admin > Wholesale enquiries (and emailed to the shop); then offers WhatsApp for a faster reply. */
export default function WholesaleForm({ groups, whatsapp }: { groups: string[]; whatsapp?: string }) {
  const [f, setF] = useState({ name: "", business: "", phone: "", city: "", type: "", volume: "", message: "" });
  const [want, setWant] = useState<string[]>([]);
  const [err, setErr] = useState("");
  const [done, setDone] = useState("");
  const [pending, start] = useTransition();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const toggle = (g: string) => setWant((w) => (w.includes(g) ? w.filter((x) => x !== g) : [...w, g]));

  const send = (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    start(async () => {
      const r = await submitWholesale({ ...f, interests: want });
      if (r.ok) setDone(r.message); else setErr(r.message);
    });
  };

  const waText = [
    "Assalam o Alaikum, I sent a wholesale enquiry on your website.",
    `Name: ${f.name}`, f.business && `Business: ${f.business}`, f.city && `City: ${f.city}`,
    want.length && `Interested in: ${want.join(", ")}`, f.volume && `Monthly order: ${f.volume}`,
  ].filter(Boolean).join("\n");

  return (
    <div className="rounded-3xl border border-line bg-card p-5 shadow-sm sm:p-8">
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-500/10 text-green-600"><CheckCircle2 size={36} /></span>
            <h3 className="mt-4 text-3xl font-extrabold uppercase text-brand-900 dark:text-white">Enquiry sent</h3>
            <p className="mx-auto mt-2 max-w-md text-muted">{done}</p>
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#118043] px-6 py-3 font-bold text-white shadow-lg shadow-[#25d366]/25 transition hover:-translate-y-0.5">
                <WhatsAppIcon size={19} />Faster reply on WhatsApp
              </a>
            )}
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={send} exit={{ opacity: 0 }}>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-hot"><span className="h-px w-6 bg-hot" />Wholesale enquiry</p>
            <h2 className="text-3xl font-extrabold uppercase leading-none text-brand-900 dark:text-white sm:text-4xl">Tell us about your business</h2>
            <p className="mt-2 text-muted">Takes one minute. We call you back with prices and schemes.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-semibold">Your name *<input required minLength={2} value={f.name} onChange={set("name")} placeholder="e.g. Muhammad Asif" autoComplete="name" className={input} /></label>
              <label className="grid gap-1.5 text-sm font-semibold">Phone / WhatsApp *<input required value={f.phone} onChange={set("phone")} inputMode="tel" placeholder="03xx xxxxxxx" autoComplete="tel" className={input} /></label>
              <label className="grid gap-1.5 text-sm font-semibold">Business name<input value={f.business} onChange={set("business")} placeholder="e.g. Asif Autos" autoComplete="organization" className={input} /></label>
              <label className="grid gap-1.5 text-sm font-semibold">City<input value={f.city} onChange={set("city")} placeholder="e.g. Depalpur" autoComplete="address-level2" className={input} /></label>
              <label className="grid gap-1.5 text-sm font-semibold">Type of business
                <select value={f.type} onChange={set("type")} className={input}>
                  <option value="">Optional</option>
                  {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">Monthly order size
                <select value={f.volume} onChange={set("volume")} className={input}>
                  <option value="">Optional</option>
                  {VOLUMES.map((v) => <option key={v}>{v}</option>)}
                </select>
              </label>
            </div>

            {groups.length > 0 && (
              <fieldset className="mt-5">
                <legend className="text-sm font-semibold">What do you want to buy?</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {groups.map((g) => {
                    const on = want.includes(g);
                    return (
                      <button type="button" key={g} onClick={() => toggle(g)} aria-pressed={on}
                        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${on ? "bg-brand-600 text-white shadow-md shadow-brand-600/25" : "bg-soft text-fg/75 ring-1 ring-line hover:text-brand-600"}`}>
                        {on && <Check size={14} />}{g}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <label className="mt-5 grid gap-1.5 text-sm font-semibold">Message
              <textarea value={f.message} onChange={set("message")} rows={4} placeholder="Parts and quantities you need, brands you sell, or any question." className={`${input} resize-y`} />
            </label>

            {err && <p role="alert" className="mt-4 rounded-xl bg-hot/10 p-3 text-sm font-semibold text-hot">{err}</p>}
            <button disabled={pending} className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-hot px-8 py-4 text-lg font-bold text-white shadow-lg shadow-hot/25 transition hover:-translate-y-0.5 hover:bg-hot-dark disabled:opacity-60">
              {pending ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} className="transition group-hover:translate-x-1" />}
              {pending ? "Sending…" : "Send enquiry"}
            </button>
            <p className="mt-3 text-center text-xs text-muted">Your details are only used to contact you about wholesale. See our <a href="/pages/privacy-policy" className="font-semibold text-brand-600 hover:underline">Privacy policy</a>.</p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
