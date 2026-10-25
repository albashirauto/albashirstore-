"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import Reveal from "@/components/Reveal";
import WhatsAppIcon from "@/components/WhatsAppIcon";

const input = "w-full rounded-xl border border-line bg-bg px-4 py-3 outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";

/** Part enquiry: builds a tidy WhatsApp message so the request lands straight on the shop's phone. No database needed. */
export default function EnquiryForm({ whatsapp, bikes }: { whatsapp?: string; bikes: string[] }) {
  const [f, setF] = useState({ name: "", phone: "", bike: "", part: "", message: "" });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    const text = [
      "Assalam o Alaikum, I have a question.",
      `Name: ${f.name}`,
      f.phone && `Phone: ${f.phone}`,
      f.bike && `Bike: ${f.bike}`,
      f.part && `Part needed: ${f.part}`,
      f.message && `Message: ${f.message}`,
    ].filter(Boolean).join("\n");
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  };

  if (!whatsapp) return null;
  return (
    <Reveal y={18}>
      <form onSubmit={send} className="rounded-2xl border border-line bg-card p-6 md:p-8">
        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-hot"><span className="h-px w-6 bg-hot" />Part enquiry</p>
        <h2 className="text-4xl font-extrabold uppercase leading-none text-brand-900 dark:text-white">Tell us what you need</h2>
        <p className="mt-2 text-muted">Fill this in and press send. It opens WhatsApp with your message ready, so we can reply with price and stock.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold">Your name *<input required value={f.name} onChange={set("name")} placeholder="e.g. Ahmed" className={input} /></label>
          <label className="grid gap-1.5 text-sm font-semibold">Phone<input value={f.phone} onChange={set("phone")} inputMode="tel" placeholder="03xx xxxxxxx" className={input} /></label>
          <label className="grid gap-1.5 text-sm font-semibold">Your bike / vehicle
            <select value={f.bike} onChange={set("bike")} className={input}>
              <option value="">Choose (optional)</option>
              {bikes.map((b) => <option key={b}>{b}</option>)}
              <option>Other</option>
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">Part needed<input value={f.part} onChange={set("part")} placeholder="e.g. brake shoe, chain kit" className={input} /></label>
          <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">Message *
            <textarea required value={f.message} onChange={set("message")} rows={4} placeholder="Part number, quantity, or anything else. You can send a photo in WhatsApp after this." className={`${input} resize-y`} />
          </label>
        </div>

        <button className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-8 py-3.5 text-lg font-bold text-white shadow-lg shadow-[#25D366]/25 transition hover:-translate-y-0.5 hover:bg-[#1ebe5b] sm:w-auto">
          <WhatsAppIcon size={20} />Send on WhatsApp<Send size={16} className="transition group-hover:translate-x-1" />
        </button>
      </form>
    </Reveal>
  );
}
