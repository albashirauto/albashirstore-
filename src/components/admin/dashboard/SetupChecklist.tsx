import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

export type Step = { label: string; done: boolean; href: string };

/** Getting the store ready: hides itself once everything is done. */
export default function SetupChecklist({ steps }: { steps: Step[] }) {
  const done = steps.filter((s) => s.done).length;
  if (done === steps.length) return null;
  const pct = Math.round((done / steps.length) * 100);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand-900 p-5 text-white md:p-6">
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-brand-600),transparent_60%)]" />
      <div className="relative">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Finish setting up your store</h2>
            <p className="text-sm text-white/70">{done} of {steps.length} done</p>
          </div>
          <span className="font-display text-4xl font-extrabold leading-none">{pct}%</span>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
          <div className="h-full rounded-full bg-gradient-to-r from-hot to-white transition-all duration-1000" style={{ width: `${pct}%` }} />
        </div>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {steps.map((s) => (
            <li key={s.label}>
              <Link href={s.href} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${s.done ? "text-white/50" : "bg-white/10 font-semibold hover:bg-white/20"}`}>
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${s.done ? "border-green-400 bg-green-500 text-white" : "border-white/40"}`}>{s.done && <Check size={12} strokeWidth={3} />}</span>
                <span className={`flex-1 ${s.done ? "line-through" : ""}`}>{s.label}</span>
                {!s.done && <ArrowRight size={15} className="transition group-hover:translate-x-1" />}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
