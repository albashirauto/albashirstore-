import FeatureIcon from "@/components/FeatureIcon";
import Reveal from "@/components/Reveal";
import SectionTitle from "@/components/SectionTitle";
import type { Feature } from "@/lib/types";

/** Our promises: the same items as the home page trust bar (Admin > Trust bar), shown as a numbered list. */
export default function AboutValues({ features }: { features: Feature[] }) {
  if (!features.length) return null;
  return (
    <section className="mt-24 bg-soft py-20">
      <div className="mx-auto max-w-7xl px-4">
        <SectionTitle eyebrow="Our promise" title="What you can expect" />
        <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          {features.map((f, i) => (
            <Reveal key={f.id} delay={(i % 2) * 0.08} y={16}>
              <div className="group flex gap-5 border-t border-line pt-6">
                <span className="font-display text-4xl font-extrabold leading-none text-brand-500/30 transition group-hover:text-hot">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <h3 className="flex items-center gap-2.5 text-2xl font-bold"><span className="text-brand-600"><FeatureIcon name={f.icon} size={22} /></span>{f.title}</h3>
                  {f.body && <p className="mt-2 leading-relaxed text-muted">{f.body}</p>}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
