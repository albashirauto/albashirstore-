import { MapPin } from "lucide-react";
import Reveal from "@/components/Reveal";
import Sprocket from "@/components/Sprocket";
import type { Settings } from "@/lib/types";

const FALLBACK = `<p>We are a spare parts shop serving riders, rickshaw drivers and workshops with motorcycle, cycle, rickshaw and loader parts.</p><p>We deal in trusted brands and check every part before it leaves the shop, so you get the right part the first time.</p>`;

/** Our story: owner-written text from Admin > Pages > About (headings stripped), beside a branded shop card. */
export default function AboutStory({ html, settings }: { html?: string | null; settings: Settings }) {
  const body = (html || FALLBACK).replace(/<h[1-3][^>]*>.*?<\/h[1-3]>/gi, "");

  return (
    <section className="relative z-10 mx-auto -mt-12 max-w-7xl px-4">
      <div className="grid gap-6 rounded-2xl border border-line bg-card p-6 shadow-xl shadow-brand-900/[0.07] md:p-10 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
        <Reveal y={16}>
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-hot"><span className="h-px w-6 bg-hot" />Our story</p>
          <h2 className="text-4xl font-extrabold uppercase leading-none text-brand-900 dark:text-white md:text-5xl">Parts you can trust,<br />people you can call</h2>
          {/* written by the shop owner in the admin panel */}
          <div className="prose-cms mt-5 text-lg [&_p]:mt-3" dangerouslySetInnerHTML={{ __html: body }} />
        </Reveal>

        <Reveal y={16} delay={0.1}>
          <div className="relative flex h-full min-h-[280px] flex-col justify-end overflow-hidden rounded-2xl bg-brand-900 p-7 text-white">
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--color-brand-600),transparent_65%)]" />
            <Sprocket size={240} className="absolute -right-12 -top-12 text-white/[0.08] [animation:spin-slow_60s_linear_infinite]" />
            <div className="relative">
              <p className="font-display text-4xl font-extrabold uppercase leading-none">{settings.store_name}</p>
              {settings.tagline && <p className="mt-2 text-white/70">{settings.tagline}</p>}
              {settings.address && (
                <p className="mt-6 flex gap-2.5 border-t border-white/15 pt-5 text-sm text-white/85"><MapPin size={18} className="mt-0.5 shrink-0 text-hot" />{settings.address}</p>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
