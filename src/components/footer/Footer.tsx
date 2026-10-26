import Link from "next/link";
import { BadgeCheck, Headset, Truck } from "lucide-react";
import Logo from "@/components/Logo";
import Reveal from "@/components/Reveal";
import Sprocket from "@/components/Sprocket";
import type { Category, Page, Settings } from "@/lib/types";
import BackToTop from "./BackToTop";
import FooterContacts from "./FooterContacts";
import FooterMap from "./FooterMap";
import SocialLinks from "./SocialLinks";

const link = "group inline-flex items-center gap-2 text-white/70 transition hover:text-white";
const dash = <span className="h-px w-0 bg-hot transition-all duration-300 group-hover:w-3" />;

export default function Footer({ settings, categories, pages }: { settings: Settings; categories: Category[]; pages: Page[] }) {
  return (
    <footer className="relative mt-24 bg-brand-900 text-white">
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
              <li><Link className={link} href="/track">{dash}Track my order</Link></li>
              <li><Link className={link} href="/cart">{dash}My cart</Link></li>
            </ul>
          </Reveal>
        </div>

        {/* team phones + location */}
        <div className="grid gap-8 py-10">
          <FooterContacts settings={settings} />
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
