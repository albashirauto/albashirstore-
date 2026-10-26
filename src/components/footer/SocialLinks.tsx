import SocialIcon from "@/components/SocialIcon";
import { NETWORKS, networkFor, parseCustom, type Network } from "@/lib/social";
import { siWhatsapp } from "simple-icons";
import type { Settings } from "@/lib/types";

const WHATSAPP: Network = { key: "_wa", label: "WhatsApp", ph: "", color: "#25D366", icon: siWhatsapp };

/** Footer "Follow us": every network filled in Settings > Social media plus custom links, as animated brand icons. */
export default function SocialLinks({ settings }: { settings: Settings }) {
  const links: { href: string; label: string; net: Network }[] = [
    ...NETWORKS.filter((n) => settings[n.key]).map((n) => ({ href: settings[n.key], label: n.label, net: n })),
    ...parseCustom(settings.social_custom).map((c) => ({ href: c.url, label: c.label || networkFor(c.url).label, net: networkFor(c.url) })),
  ];
  // no channel? link the shop's WhatsApp chat
  if (!settings.whatsapp_channel && settings.whatsapp) links.push({ href: `https://wa.me/${settings.whatsapp}`, label: "WhatsApp", net: WHATSAPP });
  if (!links.length) return null;

  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-wider text-white/60">Follow us</p>
      <ul className="mt-3 flex flex-wrap gap-2.5">
        {links.map((l, i) => (
          <li key={`${l.href}-${i}`} className="social-pop" style={{ animationDelay: `${i * 70}ms` }}>
            <span className="social-bob" style={{ animationDelay: `${1 + i * 0.45}s` }}>
              <a href={l.href} target="_blank" rel="noreferrer" aria-label={l.label} title={l.label}
                className="social-btn group relative grid h-11 w-11 place-items-center overflow-hidden rounded-full border border-white/15 bg-white/5 text-white"
                style={{ "--brand": l.net.color } as React.CSSProperties}>
                <span className="social-fill absolute inset-0 rounded-full" />
                <span className="relative group-hover:animate-[icon-wiggle_0.6s_ease]"><SocialIcon net={l.net} size={19} /></span>
              </a>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
