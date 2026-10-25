import AboutVisit from "@/components/about/AboutVisit";
import ContactFaq from "@/components/contact/ContactFaq";
import ContactMethods from "@/components/contact/ContactMethods";
import EnquiryForm from "@/components/contact/EnquiryForm";
import PageHero from "@/components/PageHero";
import { getFaqs, getSettings, getVehicles } from "@/lib/data";
import { coords, teamOf } from "@/lib/location";
import { SITE_URL } from "@/lib/seo";

export const metadata = { title: "Contact us" };
export const revalidate = 60;

/** Contact us. Sections live in src/components/contact/; team + map is shared with About. */
export default async function Contact() {
  const [settings, vehicles, faqs] = await Promise.all([getSettings(), getVehicles(), getFaqs()]);

  const c = coords(settings);
  const business = {
    "@context": "https://schema.org", "@type": "AutoPartsStore", name: settings.store_name || "Al Bashir Autos", url: SITE_URL,
    image: settings.logo || undefined, telephone: settings.phone || undefined, email: settings.email || undefined,
    address: settings.address ? { "@type": "PostalAddress", streetAddress: settings.address, addressCountry: "PK" } : undefined,
    geo: c ? { "@type": "GeoCoordinates", latitude: c.lat, longitude: c.lng } : undefined,
    hasMap: settings.map_link || undefined,
    contactPoint: teamOf(settings).map((p) => ({ "@type": "ContactPoint", name: p.name, contactType: p.role || "sales", telephone: p.phone })),
    sameAs: [settings.facebook, settings.instagram, settings.tiktok, settings.youtube, settings.x].filter(Boolean),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(business).replace(/</g, String.fromCharCode(92) + "u003c") }} />
      <PageHero crumb="Contact us" eyebrow="We are here to help" title="Contact us" sub="Call, message or visit. Ask about price, stock or which part fits your bike." />
      <ContactMethods settings={settings} />
      <section className="mx-auto mt-16 grid max-w-7xl gap-6 px-4 lg:grid-cols-[1.2fr_1fr]">
        <EnquiryForm whatsapp={settings.whatsapp} bikes={vehicles.map((v) => v.name)} />
        <ContactFaq items={faqs} />
      </section>
      <AboutVisit settings={settings} />
    </>
  );
}
