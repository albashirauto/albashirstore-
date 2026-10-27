"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check, ChevronDown, Rocket } from "lucide-react";
import { browserClient } from "@/lib/supabase";

/** `manual`: can't be checked automatically, so the owner ticks it (saved in settings.launch_ticks). */
export type Step = { id: string; label: string; why?: string; done: boolean; href: string; manual?: boolean };
export type StepGroup = { title: string; steps: Step[] };

/** Launch checklist: everything still missing before customers arrive, grouped, each with a fix link. Hides itself once all done. */
export default function SetupChecklist({ groups, ticks }: { groups: StepGroup[]; ticks: string[] }) {
  const [ticked, setTicked] = useState(ticks);
  const [open, setOpen] = useState<string | null>(null);
  const all = groups.flatMap((g) => g.steps.map((s) => ({ ...s, done: s.done || (!!s.manual && ticked.includes(s.id)) })));
  const done = all.filter((s) => s.done).length;
  if (done === all.length) return null;
  const pct = Math.round((done / all.length) * 100);
  const first = groups.find((g) => g.steps.some((s) => !(s.done || (s.manual && ticked.includes(s.id)))))?.title;
  const shown = open ?? first;

  const tick = async (id: string) => {
    const next = ticked.includes(id) ? ticked.filter((t) => t !== id) : [...ticked, id];
    setTicked(next);
    await browserClient().from("settings").upsert({ key: "launch_ticks", value: next.join(",") });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand-900 p-5 text-white md:p-6">
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-brand-600),transparent_60%)]" />
      <div className="relative">
        <div className="flex items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10"><Rocket size={22} /></span>
            <div>
              <h2 className="text-xl font-bold">Launch checklist</h2>
              <p className="text-sm text-white/70">{done} of {all.length} done · {all.length - done} left before your store is ready</p>
            </div>
          </div>
          <span className="font-display text-4xl font-extrabold leading-none">{pct}%</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-hot to-white" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: "easeOut" }} />
        </div>

        <div className="mt-5 space-y-2">
          {groups.map((g) => {
            const steps = g.steps.map((s) => ({ ...s, done: s.done || (!!s.manual && ticked.includes(s.id)) }));
            const left = steps.filter((s) => !s.done).length, isOpen = shown === g.title;
            return (
              <div key={g.title} className="overflow-hidden rounded-xl bg-white/5 ring-1 ring-white/10">
                <button type="button" onClick={() => setOpen(isOpen ? "" : g.title)} aria-expanded={isOpen} className="flex w-full items-center gap-3 px-4 py-3 text-left">
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${left ? "bg-white/15" : "bg-green-500"}`}>{left ? left : <Check size={13} strokeWidth={3} />}</span>
                  <span className="flex-1 font-bold">{g.title}</span>
                  <span className="text-xs text-white/60">{steps.length - left}/{steps.length}</span>
                  <ChevronDown size={18} className={`transition ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-1.5 px-2 pb-2">
                      {steps.map((s) => (
                        <li key={s.id} className={`flex items-start gap-3 rounded-lg px-2.5 py-2.5 ${s.done ? "text-white/45" : "bg-white/5"}`}>
                          {s.manual ? (
                            <button type="button" onClick={() => tick(s.id)} aria-label={s.done ? `Untick ${s.label}` : `Mark ${s.label} as done`} className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition ${s.done ? "border-green-400 bg-green-500" : "border-white/50 hover:border-white"}`}>{s.done && <Check size={12} strokeWidth={3} />}</button>
                          ) : (
                            <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border ${s.done ? "border-green-400 bg-green-500" : "border-white/40"}`}>{s.done && <Check size={12} strokeWidth={3} />}</span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className={`block text-sm font-semibold ${s.done ? "line-through" : ""}`}>{s.label}</span>
                            {!s.done && s.why && <span className="mt-0.5 block text-xs text-white/60">{s.why}{s.manual ? " Tick it when done." : ""}</span>}
                          </span>
                          {!s.done && <Link href={s.href} className="group inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-bold transition hover:bg-white/20">Fix<ArrowRight size={13} className="transition group-hover:translate-x-0.5" /></Link>}
                        </li>
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
