import { Phone } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";
import { teamOf } from "@/lib/location";
import type { Settings } from "@/lib/types";

/** "03001234567" or "+92 300 1234567" -> "923001234567" for wa.me links */
const waNumber = (phone: string) => phone.replace(/\D/g, "").replace(/^0/, "92");

/** Up to 4 people to call: the owners (Admin > Settings > Team & phones). */
export default function FooterContacts({ settings }: { settings: Settings }) {
  let people = teamOf(settings);
  if (!people.length && settings.phone) people = [{ name: settings.store_name, role: "Shop counter", phone: settings.phone, whatsapp: true }];
  if (!people.length) return null;

  return (
    <div>
      <h3 className="text-2xl font-extrabold uppercase">Talk to the owners</h3>
      <p className="mt-1 text-sm text-white/60">Call the owners directly about price, stock or fitment.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        {people.map((p, i) => (
          <Reveal key={i} delay={i * 0.08} y={16}>
            <div className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/10">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-hot to-hot-dark font-display text-lg font-bold">{(p.name || "?").charAt(0)}</span>
                <span className="min-w-0 leading-tight">
                  <span className="block truncate font-bold">{p.name}</span>
                  {p.role && <span className="block truncate text-xs text-white/60">{p.role}</span>}
                </span>
              </div>
              <a href={`tel:${p.phone}`} className="mt-3 font-display text-xl font-bold tracking-wide transition hover:text-hot">{p.phone}</a>
              <div className="mt-3 flex gap-2">
                <a href={`tel:${p.phone}`} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white py-2 text-sm font-bold text-brand-900 transition hover:bg-hot hover:text-white"><Phone size={15} />Call</a>
                {p.whatsapp && <a href={`https://wa.me/${waNumber(p.phone)}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${p.name}`} className="grid w-10 place-items-center rounded-full bg-[#25D366] transition hover:scale-110"><WhatsAppIcon size={20} /></a>}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
