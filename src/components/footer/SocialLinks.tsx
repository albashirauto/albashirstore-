import { Facebook, Instagram, Youtube } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import type { Settings } from "@/lib/types";

function TikTok({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1 0-5.2c.27 0 .53.04.78.12V9.66a5.74 5.74 0 0 0-.78-.05 5.69 5.69 0 1 0 5.69 5.69V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.3 4.3 0 0 1-3.25-1.48Z" />
    </svg>
  );
}

export default function SocialLinks({ settings }: { settings: Settings }) {
  const links = [
    { href: settings.facebook, label: "Facebook", icon: <Facebook size={18} />, hover: "hover:bg-[#1877F2]" },
    { href: settings.instagram, label: "Instagram", icon: <Instagram size={18} />, hover: "hover:bg-gradient-to-br hover:from-[#f58529] hover:via-[#dd2a7b] hover:to-[#8134af]" },
    { href: settings.tiktok, label: "TikTok", icon: <TikTok />, hover: "hover:bg-black" },
    { href: settings.youtube, label: "YouTube", icon: <Youtube size={18} />, hover: "hover:bg-[#FF0000]" },
    { href: settings.x, label: "X (Twitter)", icon: <span className="font-display text-lg font-extrabold leading-none">X</span>, hover: "hover:bg-black" },
    { href: settings.whatsapp_channel || (settings.whatsapp && `https://wa.me/${settings.whatsapp}`), label: settings.whatsapp_channel ? "WhatsApp channel" : "WhatsApp", icon: <WhatsAppIcon size={20} />, hover: "hover:bg-[#25D366]" },
  ].filter((l) => l.href);

  if (!links.length) return null;
  return (
    <div>
      <p className="text-sm font-bold uppercase tracking-wider text-white/60">Follow us</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((l) => (
          <a key={l.label} href={l.href} target="_blank" rel="noreferrer" aria-label={l.label} title={l.label}
            className={`grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 transition duration-300 hover:-translate-y-1 hover:border-transparent hover:shadow-lg ${l.hover}`}>
            {l.icon}
          </a>
        ))}
      </div>
    </div>
  );
}
