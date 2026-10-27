import Link from "next/link";
import { BadgeCheck, Headset, Phone, Truck } from "lucide-react";
import Logo from "@/components/Logo";
import { OpenBadge } from "@/components/OpenNow";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import Reveal from "@/components/Reveal";
import Sprocket from "@/components/Sprocket";
import type { Category, Page, Settings } from "@/lib/types";
import BackToTop from "./BackToTop";
import FooterMap from "./FooterMap";
import SocialLinks from "./SocialLinks";

const link = "group inline-flex items-center gap-2 text-white/70 transition hover:text-white";
const dash = <span className="h-px w-0 bg-hot transition-all duration-300 group-hover:w-3" />;

export default function Footer({ settings, categories, pages }: { settings: Settings; categories: Category[]; pages: Page[] }) {
  return (
    <footer className="relative mt-16 bg-brand-900 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 top-24 text-white/[0.03]"><Sprocket size={520} /></div>
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
      </div>

      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-hot via-brand-500 to-hot" />

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-14">
        {/* brand + links */}
        <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          <Reveal y={16}>
            <div className="inline-block rounded-2xl bg-white p-3"><Logo name={settings.store_name} size={42} src={settings.logo} /></div>
            <p className="mt-4 max-w-sm text-white/70">{settings.tagline}</p>
            <div className="mt-6"><SocialLinks settings={settings} /></div>
            {(settings.phone || settings.whatsapp) && (
              <div className="mt-6 max-w-sm rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Shop helpline</p>
                  <OpenBadge hours={settings.open_hours} light />
                </div>
                {settings.phone && (
                  <a href={`tel:${settings.phone}`} className="mt-2 flex items-center gap-2 font-display text-3xl font-bold tracking-wide transition hover:text-hot">
                    <Phone size={22} className="text-hot" />{settings.phone}
                  </a>
                )}
                {settings.whatsapp && (
                  <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="mt-3 flex items-center justify-center gap-2 rounded-full bg-[#25D366] py-2.5 text-sm font-bold transition hover:bg-[#1ebe5b]">
                    <WhatsAppIcon size={18} />Chat on WhatsApp
                  </a>
                )}
              </div>
            )}
          </Reveal>

          <Reveal y={16} delay={0.08}>
            <h3 className="text-xl font-bold uppercase">Shop</h3>
            <ul className="mt-4 grid gap-2.5">
              {categories.slice(0, 7).map((c) => <li key={c.id}><Link className={link} href={`/collections/${c.slug}`}>{dash}{c.name}</Link></li>)}
              <li><Link className={`${link} font-bold text-hot hover:text-white`} href="/categories">{dash}All categories →</Link></li>
            </ul>
          </Reveal>

          <Reveal y={16} delay={0.16}>
            <h3 className="text-xl font-bold uppercase">Help</h3>
            <ul className="mt-4 grid gap-2.5">
              {pages.filter((p) => p.show_in_footer !== false).map((p) => <li key={p.id}><Link className={link} href={`/pages/${p.slug}`}>{dash}{p.title}</Link></li>)}
              <li><Link className={link} href="/promotions">{dash}Deal zone</Link></li>
              <li><Link className={link} href="/blog">{dash}Blog: tips & guides</Link></li>
              <li><Link className={link} href="/vehicles">{dash}Shop by bike</Link></li>
              <li><Link className={link} href="/awards">{dash}Our awards</Link></li>
              <li><Link className={link} href="/track">{dash}Track my order</Link></li>
              <li><Link className={link} href="/cart">{dash}My cart</Link></li>
            </ul>
          </Reveal>
        </div>

        {/* location (owners' phones are on the About page) */}
        <div className="py-10">
          <FooterMap settings={settings} />
        </div>

        {/* bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-sm text-white/60 md:flex-row">
          <p>© {new Date().getFullYear()} {settings.store_name}. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {[{ icon: Headset, t: "Expert support" }, { icon: Truck, t: "Pakistan-wide delivery" }, { icon: BadgeCheck, t: "Genuine parts" }].map(({ icon: Icon, t }) => (
              <span key={t} className="inline-flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/75"><Icon size={14} className="text-hot" />{t}</span>
            ))}
          </div>
          <BackToTop />
        </div>
      </div>
    </footer>
  );
}
