"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { submitPartRequest } from "@/app/actions";
import WhatsAppIcon from "@/components/WhatsAppIcon";

const input = "w-full rounded-xl border border-line bg-bg px-4 py-3 outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";

/** Saved to Admin > Part requests (and emailed to the shop); then offers WhatsApp to send a photo of the part. */
export default function PartRequestForm({ initialPart = "", bikes, whatsapp }: { initialPart?: string; bikes: string[]; whatsapp?: string }) {
  const [f, setF] = useState({ part: initialPart, vehicle: "", details: "", name: "", phone: "", city: "" });
  const [err, setErr] = useState("");
  const [done, setDone] = useState("");
  const [pending, start] = useTransition();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const send = (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    start(async () => {
      const r = await submitPartRequest(f);
      if (r.ok) setDone(r.message); else setErr(r.message);
    });
  };
  const waText = ["Assalam o Alaikum, I requested a part on your website.", `Part: ${f.part}`, f.vehicle && `Bike: ${f.vehicle}`, `Name: ${f.name}`, "Here is a photo of the part:"].filter(Boolean).join("\n");

  return (
    <div className="rounded-3xl border border-line bg-card p-5 shadow-sm sm:p-8">
      <AnimatePresence mode="wait">
        {done ? (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
            <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-500/10 text-green-600"><CheckCircle2 size={36} /></span>
            <h2 className="mt-4 text-3xl font-extrabold uppercase text-brand-900 dark:text-white">Request sent</h2>
            <p className="mx-auto mt-2 max-w-md text-muted">{done}</p>
            {whatsapp && (
              <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(waText)}`} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#25d366] px-6 py-3 font-bold text-white shadow-lg shadow-[#25d366]/25 transition hover:-translate-y-0.5">
                <WhatsAppIcon size={19} />Send a photo on WhatsApp
              </a>
            )}
            <button type="button" onClick={() => { setDone(""); setF({ ...f, part: "", details: "" }); }} className="mt-4 block w-full text-sm font-bold text-brand-600 hover:underline">Request another part</button>
          </motion.div>
        ) : (
          <motion.form key="form" onSubmit={send} exit={{ opacity: 0 }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">Which part do you need? *
                <input required minLength={2} value={f.part} onChange={set("part")} placeholder="e.g. clutch plate, CG 125 headlight, RP speedometer" className={input} />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">Bike / vehicle
                <select value={f.vehicle} onChange={set("vehicle")} className={input}>
                  <option value="">Choose (optional)</option>
                  {bikes.map((b) => <option key={b}>{b}</option>)}
                  <option>Other</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">City<input value={f.city} onChange={set("city")} placeholder="e.g. Okara" autoComplete="address-level2" className={input} /></label>
              <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">Part number, quantity or notes
                <textarea value={f.details} onChange={set("details")} rows={3} placeholder="e.g. part number 22201-KRS, need 2 pieces, model year 2019" className={`${input} resize-y`} />
              </label>
              <label className="grid gap-1.5 text-sm font-semibold">Your name *<input required minLength={2} value={f.name} onChange={set("name")} placeholder="e.g. Ahmed" autoComplete="name" className={input} /></label>
              <label className="grid gap-1.5 text-sm font-semibold">Phone / WhatsApp *<input required value={f.phone} onChange={set("phone")} inputMode="tel" placeholder="03xx xxxxxxx" autoComplete="tel" className={input} /></label>
            </div>
            {err && <p role="alert" className="mt-4 rounded-xl bg-hot/10 p-3 text-sm font-semibold text-hot">{err}</p>}
            <button disabled={pending} className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-hot px-8 py-4 text-lg font-bold text-white shadow-lg shadow-hot/25 transition hover:-translate-y-0.5 hover:bg-hot-dark disabled:opacity-60">
              {pending ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} className="transition group-hover:translate-x-1" />}
              {pending ? "Sending…" : "Request this part"}
            </button>
            <p className="mt-3 text-center text-xs text-muted">We only use your number to call you about this part. See our <a href="/pages/privacy-policy" className="font-semibold text-brand-600 hover:underline">Privacy policy</a>.</p>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
