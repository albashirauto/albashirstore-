import PageHero from "@/components/PageHero";
import TrackOrder from "@/components/track/TrackOrder";
import { getSettings } from "@/lib/data";

export const metadata = { title: "Track my order", description: "Check your order status, courier and tracking number." };

/** Track my order. ?no= (and optionally ?phone=) pre-fill the form, e.g. from the order confirmation or a WhatsApp link. */
export default async function Track({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const [sp, settings] = await Promise.all([searchParams, getSettings()]);
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  return (
    <>
      <PageHero crumb="Track my order" eyebrow="Where is my parcel?" title="Track my order" sub="Enter your order number and phone number to see where your order is." />
      <TrackOrder initialNo={one(sp.no)} initialPhone={one(sp.phone)} whatsapp={settings.whatsapp} />
    </>
  );
}
