import { Lock } from "lucide-react";

export const input = "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";

/** One editor section: anchored card the side menu scrolls to. */
export function Section({ id, title, sub, priv, children }: { id: string; title: string; sub?: string; priv?: boolean; children: React.ReactNode }) {
  return (
    <section id={id} data-section className="scroll-mt-24 rounded-2xl border border-line bg-card p-5 md:p-7">
      <div className="mb-5">
        <h2 className="flex items-center gap-2 text-2xl font-bold">
          {title}
          {priv && <span className="inline-flex items-center gap-1 rounded-full bg-soft px-2.5 py-0.5 text-xs font-bold text-muted"><Lock size={11} />Private, admins only</span>}
        </h2>
        {sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

export function Field({ label, help, children, wide, extra }: { label: string; help?: string; children: React.ReactNode; wide?: boolean; extra?: React.ReactNode }) {
  return (
    <label className={`block text-sm font-semibold ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 flex items-center justify-between gap-2">{label}{extra}</span>
      {children}
      {help && <span className="mt-1 block text-xs font-normal text-muted">{help}</span>}
    </label>
  );
}

/** iOS-style on/off switch with a label and hint. */
export function Toggle({ on, set, label, hint }: { on: boolean; set: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button type="button" onClick={() => set(!on)} className="flex w-full items-center gap-3 rounded-xl border border-line p-3.5 text-left transition hover:border-brand-500/50">
      <span className={`relative h-6 w-11 shrink-0 rounded-full transition ${on ? "bg-brand-600" : "bg-line"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </span>
      <span className="text-sm">
        <span className="block font-semibold">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </button>
  );
}

export function Count({ n, max }: { n: number; max: number }) {
  return <span className={`text-xs font-normal ${n > max ? "text-hot" : "text-muted"}`}>{n}/{max}</span>;
}
