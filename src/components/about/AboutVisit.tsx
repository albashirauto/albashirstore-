import { Clock, Mail, MapPin, Navigation, Phone } from "lucide-react";
import OpeningHours from "@/components/OpenNow";
import Reveal from "@/components/Reveal";
import SectionTitle from "@/components/SectionTitle";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { directionsUrl, mapEmbed } from "@/lib/location";
import type { Settings } from "@/lib/types";

/** Shop helpline and the shop location with a live map (exact pin when set). The owners have their own section on About. */
export default function AboutVisit({ settings }: { settings: Settings }) {
  const directions = directionsUrl(settings);

  return (
    <section className="mx-auto mt-24 max-w-7xl px-4">
      <SectionTitle eyebrow="Visit or call" title="Come say salam" sub="Walk in, call or message. A real person will help you find the right part." />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="grid content-start gap-3">
          {settings.phone && (
            <Reveal y={14}>
              <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-card p-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white"><Phone size={20} /></span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block text-sm text-muted">Shop helpline</span>
                  <a href={`tel:${settings.phone}`} className="font-display text-2xl font-bold tracking-wide hover:text-brand-600">{settings.phone}</a>
                </span>
                {settings.whatsapp && (
                  <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1ebe5b]">
                    <WhatsAppIcon size={18} />WhatsApp
                  </a>
                )}
              </div>
            </Reveal>
          )}
          <Reveal y={14} delay={0.2}>
            <ul className="grid gap-3 rounded-2xl bg-soft p-5 text-sm">
              {settings.address && <li className="flex gap-3"><MapPin size={18} className="mt-0.5 shrink-0 text-hot" />{settings.address}</li>}
              {settings.open_hours && <li className="flex gap-3"><Clock size={18} className="mt-0.5 shrink-0 text-hot" /><OpeningHours hours={settings.open_hours} /></li>}
              {settings.email && <li className="flex gap-3"><Mail size={18} className="mt-0.5 shrink-0 text-hot" /><a href={`mailto:${settings.email}`} className="hover:text-brand-600">{settings.email}</a></li>}
            </ul>
          </Reveal>
        </div>

        {settings.address && (
          <Reveal y={16} className="h-full">
            <div className="relative h-full min-h-[360px] overflow-hidden rounded-2xl border border-line">
              <iframe title="Shop location map" src={mapEmbed(settings)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0 h-full w-full border-0" />
              <a href={directions} target="_blank" rel="noreferrer" className="group absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-3 text-sm font-bold text-white shadow-xl transition hover:bg-brand-700">
                <Navigation size={16} className="transition group-hover:rotate-12" />Get directions
              </a>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
