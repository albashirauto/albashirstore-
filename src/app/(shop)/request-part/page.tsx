import { Camera, PackageSearch, PhoneCall, Truck } from "lucide-react";
import PageHero from "@/components/PageHero";
import PartRequestForm from "@/components/request/PartRequestForm";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { getSettings, getVehicles } from "@/lib/data";

export const metadata = {
  title: "Request a part",
  description: "Can't find a spare part on the website? Tell us the part and your bike, and Al Bashir Autos will call you with stock and price.",
  alternates: { canonical: "/request-part" },
};

const STEPS = [
  { icon: PackageSearch, t: "Tell us the part", d: "Name, part number or your bike model." },
  { icon: PhoneCall, t: "We call you", d: "With stock, price and delivery time." },
  { icon: Truck, t: "We deliver", d: "Order on the call, delivered to your city." },
];

/** Request a part that is not on the website (search with no results links here with ?part=). */
export default async function RequestPart({ searchParams }: { searchParams: Promise<{ part?: string }> }) {
  const [{ part }, settings, vehicles] = await Promise.all([searchParams, getSettings(), getVehicles()]);

  return (
    <>
      <PageHero crumb="Request a part" eyebrow="Can't find it?" title="Request a part" sub="We have many more parts in the shop than online. Tell us what you need and we will call you with stock and price." />

      <div className="relative z-10 mx-auto -mt-14 grid max-w-7xl gap-6 px-4 lg:grid-cols-[minmax(0,1fr)_340px] xl:gap-8">
        <div className="min-w-0"><PartRequestForm initialPart={String(part ?? "").slice(0, 120)} bikes={vehicles.map((v) => v.name)} whatsapp={settings.whatsapp} /></div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-line bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">How it works</p>
            <ol className="mt-4 space-y-4">
              {STEPS.map((s, i) => (
                <li key={s.t} className="flex gap-3">
                  <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white"><s.icon size={18} /><span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-hot text-[11px] font-bold">{i + 1}</span></span>
                  <span><span className="block font-bold">{s.t}</span><span className="block text-sm text-muted">{s.d}</span></span>
                </li>
              ))}
            </ol>
          </div>
          {settings.whatsapp && (
            <div className="rounded-2xl bg-brand-900 p-5 text-white">
              <p className="flex items-center gap-2 font-display text-2xl font-bold uppercase leading-tight"><Camera size={22} />Have a photo?</p>
              <p className="mt-1 text-sm text-white/70">A photo of the old part is the fastest way to find the right one.</p>
              <a href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent("Assalam o Alaikum, I need this part:")}`} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-2 rounded-full bg-[#118043] py-2.5 text-sm font-bold text-white transition hover:brightness-110"><WhatsAppIcon size={17} />Send it on WhatsApp</a>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
