import type { Feature } from "@/lib/types";
import FeatureIcon from "@/components/FeatureIcon";
import Reveal from "@/components/Reveal";

/** One white card with the store promises, overlapping the hero's bottom edge. */
export default function TrustBar({ features }: { features: Feature[] }) {
  if (!features.length) return null;
  return (
    <section className="relative z-10 mx-auto -mt-14 max-w-7xl px-4">
      <Reveal y={20}>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-xl shadow-brand-900/[0.07] sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div key={f.id} className="group flex items-start gap-4 bg-card p-6">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 transition duration-300 group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-900">
                <FeatureIcon name={f.icon} size={22} />
              </span>
              <div>
                <h3 className="text-lg font-bold leading-tight">{f.title}</h3>
                {f.body && <p className="mt-1 text-sm leading-relaxed text-muted">{f.body}</p>}
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
