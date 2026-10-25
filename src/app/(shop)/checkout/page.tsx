import Checkout from "@/components/checkout/Checkout";
import { getSettings } from "@/lib/data";

export const metadata = { title: "Checkout", robots: { index: false } };
export const revalidate = 60;

/** Settings (delivery charge, payment accounts, WhatsApp) come from the server; the form is a client component. */
export default async function CheckoutPage() {
  return <Checkout s={await getSettings()} />;
}
