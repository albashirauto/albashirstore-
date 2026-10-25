import Reveal from "@/components/Reveal";
import SectionTitle from "@/components/SectionTitle";
import { adminClient, hasServiceKey } from "@/lib/supabaseAdmin";

type Person = { name: string | null; title: string | null; avatar: string | null };

/** "Meet our team": members the owner ticked "Show on About". Only photo, name and job title are read. */
export default async function AboutTeam() {
  if (!hasServiceKey()) return null;
  let people: Person[] = [];
  try {
    const { data } = await adminClient().from("admins").select("name,title,avatar").eq("show_on_about", true).eq("status", "active").order("created_at");
    people = ((data as Person[]) ?? []).filter((p) => p.name);
  } catch { return null; }
  if (!people.length) return null;

  return (
    <section className="mx-auto mt-24 max-w-7xl px-4">
      <SectionTitle eyebrow="The people" title="Meet our team" sub="The faces behind your parts: we check, pack and answer every order ourselves." />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {people.map((p, i) => (
          <Reveal key={`${p.name}-${i}`} delay={(i % 4) * 0.06} y={16}>
            <figure className="group h-full rounded-2xl border border-line bg-card p-5 text-center transition duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.avatar ? <img src={p.avatar} alt={p.name ?? ""} className="mx-auto h-24 w-24 rounded-full object-cover ring-4 ring-brand-50 transition group-hover:ring-brand-500/30 dark:ring-brand-900" />
                : <span className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display text-4xl font-bold text-white">{(p.name ?? "?").charAt(0)}</span>}
              <figcaption className="mt-4">
                <span className="block font-display text-xl font-bold">{p.name}</span>
                {p.title && <span className="text-sm text-muted">{p.title}</span>}
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
