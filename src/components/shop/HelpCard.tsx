import { Phone } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import type { Settings } from "@/lib/types";

/** Small sidebar card: ask a person when unsure which part fits. */
export default function HelpCard({ settings }: { settings: Settings }) {
  if (!settings.whatsapp && !settings.phone) return null;
  return (
    <div className="relative overflow-hidden rounded-2xl bg-brand-900 p-5 text-white">
      <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-brand-600),transparent_65%)]" />
      <div className="relative">
        <p className="font-display text-2xl font-extrabold uppercase leading-none">Not sure what fits?</p>
        <p className="mt-2 text-sm text-white/70">Send a photo or your bike model. We will find the right part for you.</p>
        <div className="mt-4 grid gap-2">
          {settings.whatsapp && (
            <a href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent("Hello, I need help finding a part.")}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] py-2.5 text-sm font-bold transition hover:bg-[#1ebe5b]">
              <WhatsAppIcon size={17} />Ask on WhatsApp
            </a>
          )}
          {settings.phone && (
            <a href={`tel:${settings.phone}`} className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 py-2.5 text-sm font-bold transition hover:bg-white hover:text-brand-900">
              <Phone size={15} />{settings.phone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
