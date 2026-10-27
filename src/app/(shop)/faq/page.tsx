import Link from "next/link";
import { FileText, Phone, Truck } from "lucide-react";
import FaqBrowser from "@/components/faq/FaqBrowser";
import PageHero from "@/components/PageHero";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { getFaqs, getSettings } from "@/lib/data";
import { faqsFor } from "@/lib/payments";

export const metadata = { title: "FAQ: common questions", description: "Answers about ordering, payment, delivery, fitment, returns and warranty at Al Bashir Autos.", alternates: { canonical: "/faq" } };
export const revalidate = 60;

/** All questions (Admin > FAQs), searchable and grouped by topic. */
export default async function FaqPage() {
  const [all, settings] = await Promise.all([getFaqs(), getSettings()]);
  const faqs = faqsFor(all, settings);
  const schema = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
  };

  return (
    <>
      {faqs.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, String.fromCharCode(92) + "u003c") }} />}
      <PageHero crumb="FAQ" eyebrow="Help centre" title="Common questions" sub="Ordering, payment, delivery, fitment, returns and warranty. Quick answers to what customers ask us most." stats={[{ label: "Answers", value: faqs.length }]} />

      <div className="relative z-10 mx-auto -mt-14 grid max-w-7xl gap-6 px-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-8">
        <div className="min-w-0"><FaqBrowser items={faqs} /></div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl bg-brand-900 p-5 text-white">
            <p className="font-display text-2xl font-bold uppercase leading-tight">Still need help?</p>
            <p className="mt-1 text-sm text-white/70">Send a photo of the part or your bike model. We tell you what fits.</p>
            <div className="mt-4 space-y-2">
              {settings.whatsapp && <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-full bg-[#25d366] py-2.5 text-sm font-bold text-white transition hover:brightness-110"><WhatsAppIcon size={17} />WhatsApp us</a>}
              {settings.phone && <a href={`tel:${settings.phone}`} className="flex items-center justify-center gap-2 rounded-full bg-white/10 py-2.5 text-sm font-bold transition hover:bg-white/20"><Phone size={16} />{settings.phone}</a>}
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">Useful links</p>
            <ul className="mt-3 space-y-1 text-sm font-semibold">
              {[["/track", "Track my order", Truck], ["/pages/delivery", "Delivery information", FileText], ["/pages/refund-policy", "Refund & exchange policy", FileText], ["/pages/terms", "Terms & conditions", FileText]].map(([href, l, Icon]) => {
                const I = Icon as React.ElementType;
                return <li key={href as string}><Link href={href as string} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-fg/75 transition hover:bg-soft hover:text-brand-600"><I size={15} className="shrink-0 text-muted" />{l as string}</Link></li>;
              })}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
