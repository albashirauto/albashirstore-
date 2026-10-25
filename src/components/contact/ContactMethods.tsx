import { Mail, MapPin, Phone } from "lucide-react";
import Reveal from "@/components/Reveal";
import { directionsUrl } from "@/lib/location";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import type { Settings } from "@/lib/types";

/** Four quick ways to reach the shop, overlapping the banner. Hidden when that setting is empty. */
export default function ContactMethods({ settings }: { settings: Settings }) {
  const items = [
    settings.phone && { icon: <Phone size={22} />, title: "Call us", value: settings.phone, href: `tel:${settings.phone}`, tone: "bg-brand-50 text-brand-600 group-hover:bg-brand-600 dark:bg-brand-900" },
    settings.whatsapp && { icon: <WhatsAppIcon size={22} />, title: "WhatsApp", value: "Chat now, quick reply", href: `https://wa.me/${settings.whatsapp}`, tone: "bg-green-600/10 text-green-700 group-hover:bg-green-600 dark:text-green-400" },
    settings.email && { icon: <Mail size={22} />, title: "Email", value: settings.email, href: `mailto:${settings.email}`, tone: "bg-brand-50 text-brand-600 group-hover:bg-brand-600 dark:bg-brand-900" },
    settings.address && { icon: <MapPin size={22} />, title: "Visit the shop", value: settings.open_hours || "See map below", href: directionsUrl(settings), tone: "bg-hot/10 text-hot group-hover:bg-hot" },
  ].filter(Boolean) as { icon: React.ReactNode; title: string; value: string; href: string; tone: string }[];

  return (
    <section className="relative z-10 mx-auto -mt-12 max-w-7xl px-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((m, i) => (
          <Reveal key={m.title} delay={i * 0.06} y={18} className="h-full">
            <a href={m.href} target={m.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer"
              className="group flex h-full items-center gap-4 rounded-2xl border border-line bg-card p-5 shadow-xl shadow-brand-900/[0.07] transition duration-300 hover:-translate-y-1 hover:border-brand-500/50">
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl transition duration-300 group-hover:text-white ${m.tone}`}>{m.icon}</span>
              <span className="min-w-0">
                <span className="block font-bold">{m.title}</span>
                <span className="block truncate text-sm text-muted">{m.value}</span>
              </span>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
