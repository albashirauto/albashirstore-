import { Clock, Mail, MapPin, Navigation } from "lucide-react";
import OpeningHours from "@/components/OpenNow";
import Reveal from "@/components/Reveal";
import { directionsUrl, mapEmbed } from "@/lib/location";
import type { Settings } from "@/lib/types";

/** Shop location: live Google map (no API key needed), address, hours and a directions button. */
export default function FooterMap({ settings }: { settings: Settings }) {
  if (!settings.address) return null;
  const directions = directionsUrl(settings);

  return (
    <Reveal y={16} className="h-full">
      <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/5">
        <div className="relative h-48 overflow-hidden bg-brand-700">
          <iframe
            title="Shop location map" src={mapEmbed(settings)}
            loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            className="absolute inset-0 h-full w-full border-0 grayscale-[35%] transition duration-500 hover:grayscale-0"
          />
          <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-hot px-3 py-1 text-xs font-bold shadow-lg">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />Visit our shop
          </span>
        </div>
        <ul className="flex-1 space-y-3 p-5 text-sm text-white/80">
          <li className="flex gap-3"><MapPin className="mt-0.5 shrink-0 text-hot" size={18} />{settings.address}</li>
          {settings.open_hours && <li className="flex gap-3"><Clock className="mt-0.5 shrink-0 text-hot" size={18} /><OpeningHours hours={settings.open_hours} light /></li>}
          {settings.email && <li className="flex gap-3"><Mail className="mt-0.5 shrink-0 text-hot" size={18} /><a href={`mailto:${settings.email}`} className="transition hover:text-white">{settings.email}</a></li>}
        </ul>
        <a href={directions} target="_blank" rel="noreferrer" className="group mx-5 mb-5 inline-flex items-center justify-center gap-2 rounded-full bg-white py-3 font-bold text-brand-900 transition hover:bg-hot hover:text-white">
          <Navigation size={17} className="transition group-hover:rotate-12" />Get directions
        </a>
      </div>
    </Reveal>
  );
}
