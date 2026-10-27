import { mdiMotorbike, mdiRickshaw, mdiTools } from "@mdi/js";
import Reveal from "@/components/Reveal";
import SectionTitle from "@/components/SectionTitle";

const Mdi = ({ d }: { d: string }) => <svg width={28} height={28} viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d={d} /></svg>;

const WHO = [
  { icon: mdiMotorbike, title: "Riders", body: "Daily commuters and families keeping their CD 70, CG 125 or CB 150F on the road." },
  { icon: mdiRickshaw, title: "Rickshaw & loader drivers", body: "Parts for working vehicles that cannot afford a day off." },
  { icon: mdiTools, title: "Workshops & mechanics", body: "Reliable stock and quick answers for the people who fix bikes every day." },
];

export default function AboutServe() {
  return (
    <section className="mx-auto mt-24 max-w-7xl px-4">
      <SectionTitle eyebrow="Who we serve" title="Built for the road" sub="From one part for your own bike to regular orders for a workshop." />
      <div className="grid gap-4 md:grid-cols-3">
        {WHO.map(({ icon, title, body }, i) => (
          <Reveal key={title} delay={i * 0.08} y={18}>
            <div className="group h-full rounded-2xl border border-line bg-card p-7 transition duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10">
              <span className="grid h-14 w-14 place-items-center rounded-xl bg-brand-50 text-brand-600 transition duration-300 group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-900"><Mdi d={icon} /></span>
              <h3 className="mt-5 text-2xl font-bold">{title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
