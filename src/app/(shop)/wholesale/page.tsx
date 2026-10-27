import { BadgeCheck, Gift, Headphones, Phone, Store, Truck, Users, Warehouse, Wrench } from "lucide-react";
import BrandMark from "@/components/brands/BrandMark";
import PageHero from "@/components/PageHero";
import Reveal from "@/components/Reveal";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import WholesaleForm from "@/components/wholesale/WholesaleForm";
import { dealerBrands, getBrands, getOfferings, getSettings } from "@/lib/data";

export const metadata = {
  title: "Wholesale & dealers",
  description: "Bulk spare parts for parts shops, workshops, dealers and rickshaw fleets. Genuine stock from an authorised dealer, schemes and delivery across Pakistan from Al Bashir Autos.",
  alternates: { canonical: "/wholesale" },
};
export const revalidate = 60;

const WHO = [
  { icon: Store, t: "Parts shops", d: "Stock your shelves with fast-moving parts." },
  { icon: Wrench, t: "Workshops & mechanics", d: "The parts you fit every day, ready when you need them." },
  { icon: Warehouse, t: "Dealers & distributors", d: "Supply your area with the brands we deal in." },
  { icon: Users, t: "Fleet & rickshaw owners", d: "Keep loaders and rickshaws on the road." },
];

/** Wholesale / dealer enquiries: who it's for, why us, the brands we deal in, and the enquiry form. */
export default async function Wholesale() {
  const [settings, brands, offerings] = await Promise.all([getSettings(), getBrands(), getOfferings()]);
  const dealers = dealerBrands(brands);
  const why = [
    { icon: BadgeCheck, t: "Authorised dealer", d: dealers.length ? `Direct stock of ${dealers.map((b) => b.name).join(", ")}.` : "Genuine stock straight from the companies." },
    { icon: Gift, t: "Bulk schemes", d: "“Buy X, get Y free” on many parts. Ask us for bulk prices." },
    { icon: Truck, t: "Pakistan-wide delivery", d: "We pack and dispatch bulk orders to your city." },
    { icon: Headphones, t: "Fitment help", d: "Send a photo or part number and we find the right part." },
  ];

  return (
    <>
      <PageHero crumb="Wholesale" eyebrow="For shops, workshops & dealers" title="Wholesale & dealers" sub="Buying parts in bulk? Get bulk prices, schemes and steady supply of genuine parts from an authorised dealer." />

      <div className="relative z-10 mx-auto -mt-14 grid max-w-7xl gap-6 px-4 lg:grid-cols-[minmax(0,1fr)_400px] xl:gap-8">
        <div className="min-w-0 space-y-6">
          <section className="grid gap-3 sm:grid-cols-2">
            {why.map((w, i) => (
              <Reveal key={w.t} delay={i * 0.06} y={14}>
                <div className="flex h-full gap-4 rounded-2xl border border-line bg-card p-5 shadow-sm">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/25"><w.icon size={22} /></span>
                  <span>
                    <span className="block font-display text-xl font-bold uppercase leading-tight">{w.t}</span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">{w.d}</span>
                  </span>
                </div>
              </Reveal>
            ))}
          </section>

          {dealers.length > 0 && (
            <Reveal y={14}>
              <section className="rounded-2xl border border-line bg-card p-5 sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Authorised dealer of</p>
                <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                  {dealers.map((b) => (
                    <li key={b.id} className="flex flex-col items-center gap-2 rounded-xl bg-soft/70 p-3 text-center">
                      <BrandMark name={b.name} logo={b.logo} size={56} fit={b.logo_fit} />
                      <span className="text-sm font-bold leading-tight">{b.name}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          )}

          <Reveal y={14}>
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-hot"><span className="h-px w-6 bg-hot" />Who we supply</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {WHO.map((w) => (
                  <div key={w.t} className="flex items-start gap-3 rounded-2xl border border-line bg-card p-4">
                    <w.icon size={22} className="mt-0.5 shrink-0 text-brand-600" />
                    <span><span className="block font-bold">{w.t}</span><span className="block text-sm text-muted">{w.d}</span></span>
                  </div>
                ))}
              </div>
            </section>
          </Reveal>

          <Reveal y={14}>
            <section className="rounded-2xl bg-brand-900 p-6 text-white sm:p-8">
              <h2 className="font-display text-3xl font-bold uppercase leading-tight">How it works</h2>
              <ol className="mt-5 grid gap-4 sm:grid-cols-3">
                {["Send the enquiry form, or WhatsApp us your list.", "We call you with prices, stock and schemes.", "We pack and deliver your order to your city."].map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-hot font-display text-lg font-bold">{i + 1}</span>
                    <span className="text-sm leading-relaxed text-white/80">{s}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex flex-wrap gap-3">
                {settings.whatsapp && <a href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent("Assalam o Alaikum, I want to buy parts wholesale.")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#118043] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110"><WhatsAppIcon size={17} />WhatsApp your list</a>}
                {settings.phone && <a href={`tel:${settings.phone}`} className="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2.5 text-sm font-bold transition hover:bg-white/20"><Phone size={16} />{settings.phone}</a>}
              </div>
            </section>
          </Reveal>
        </div>

        <aside id="enquiry" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
          <WholesaleForm groups={offerings.map((o) => o.title)} whatsapp={settings.whatsapp} />
        </aside>
      </div>
    </>
  );
}
