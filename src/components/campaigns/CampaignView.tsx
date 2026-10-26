"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, Copy, X } from "lucide-react";
import { fontHref, fullDesign, isUrdu, type Campaign } from "@/lib/campaigns";
import { money } from "@/lib/format";
import type { Product } from "@/lib/types";

type Props = {
  c: Campaign; products?: Product[];
  onClose?: () => void; onClick?: () => void;
  /** admin preview: drawn inside a frame instead of over the page */
  frame?: boolean; mobile?: boolean;
};

const PATTERN: Record<string, string> = {
  dots: "radial-gradient(currentColor 1px, transparent 1.5px)",
  grid: "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
  stripes: "repeating-linear-gradient(135deg, currentColor 0 2px, transparent 2px 14px)",
  sparkles: "radial-gradient(currentColor 1.2px, transparent 1.6px), radial-gradient(currentColor 0.8px, transparent 1.2px)",
};
const PATTERN_SIZE: Record<string, string> = { dots: "18px 18px", grid: "28px 28px", stripes: "auto", sparkles: "34px 34px, 21px 21px" };
const WIDTH = { sm: 360, md: 460, lg: 600 };
// sparkle positions (fixed, so server and browser draw the same)
const STARS = [[8, 14, 0], [88, 10, 0.6], [16, 78, 1.2], [92, 70, 0.3], [50, 6, 1.8], [72, 88, 0.9], [4, 46, 2.1], [96, 40, 1.5], [30, 92, 0.4], [62, 22, 2.4]];

/** Extras behind the content: rotating glow border, floating blobs, twinkling sparkles. */
function Fx({ d }: { d: ReturnType<typeof fullDesign> }) {
  const fx = d.fx ?? {};
  return (
    <>
      {fx.blobs && <><span className="camp-blob -left-10 -top-10 h-40 w-40" style={{ background: d.accent }} /><span className="camp-blob -bottom-12 -right-8 h-44 w-44" style={{ background: d.button, animationDelay: "-3s" }} /></>}
      {fx.stars && STARS.map(([x, y, delay], i) => <span key={i} aria-hidden className="camp-star text-sm" style={{ left: `${x}%`, top: `${y}%`, color: d.accent, animationDelay: `${delay}s`, fontSize: i % 3 ? 10 : 15 }}>✦</span>)}
      {fx.ring && <span aria-hidden className="camp-ring" style={{ "--c1": d.accent, "--c2": d.button, "--c3": d.bg2 } as React.CSSProperties} />}
    </>
  );
}
/** Store logo badge that pops in and turns slowly. */
const Logo = ({ d }: { d: ReturnType<typeof fullDesign> }) => (
  <span className="camp-logo mx-auto mb-1 grid h-16 w-16 place-items-center rounded-full bg-white shadow-xl" style={{ boxShadow: `0 10px 30px -8px ${d.accent}` }}>
    <svg viewBox="0 0 64 64" width="44" height="44" aria-hidden><path fill="#1d4fd8" d="M27 4h10l2 7a21 21 0 0 1 5 2l7-4 7 7-4 7a21 21 0 0 1 2 5l7 2v10l-7 2a21 21 0 0 1-2 5l4 7-7 7-7-4a21 21 0 0 1-5 2l-2 7H27l-2-7a21 21 0 0 1-5-2l-7 4-7-7 4-7a21 21 0 0 1-2-5l-7-2V27l7-2a21 21 0 0 1 2-5l-4-7 7-7 7 4a21 21 0 0 1 5-2z" /><circle cx="32" cy="32" r="16" fill="#fff" /><text x="32" y="40" textAnchor="middle" fontSize="23" fontWeight="800" fontFamily="Arial" fill="#e11d2e">B</text></svg>
  </span>
);

/** Loads the Google Fonts a campaign uses (once per page). */
function useFonts(href: string | null) {
  useEffect(() => {
    if (!href || document.querySelector(`link[data-camp-font="${href}"]`)) return;
    const l = document.createElement("link");
    l.rel = "stylesheet"; l.href = href; l.dataset.campFont = href;
    document.head.appendChild(l);
  }, [href]);
}

function Countdown({ to, color, compact }: { to: string; color: string; compact?: boolean }) {
  const [left, setLeft] = useState(() => new Date(to).getTime() - Date.now());
  useEffect(() => { const t = setInterval(() => setLeft(new Date(to).getTime() - Date.now()), 1000); return () => clearInterval(t); }, [to]);
  if (left <= 0) return null;
  const s = Math.floor(left / 1000), parts = [["d", Math.floor(s / 86400)], ["h", Math.floor(s / 3600) % 24], ["m", Math.floor(s / 60) % 60], ["s", s % 60]] as const;
  const shown = parts[0][1] ? parts : parts.slice(1);
  return (
    <span className={`inline-flex items-center ${compact ? "gap-1" : "gap-1.5"}`} aria-label="Time left">
      {shown.map(([u, v]) => (
        <span key={u} className={`grid place-items-center rounded-lg font-bold tabular-nums ${compact ? "min-w-7 px-1 py-0.5 text-xs" : "min-w-11 px-1.5 py-1 text-lg"}`} style={{ background: `${color}22`, color }}>
          <span>{String(v).padStart(2, "0")}</span>{!compact && <span className="text-[9px] font-semibold uppercase opacity-70">{u}</span>}
        </span>
      ))}
    </span>
  );
}

function CodeChip({ code, d }: { code: string; d: ReturnType<typeof fullDesign> }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" onClick={async (e) => { e.stopPropagation(); try { await navigator.clipboard.writeText(code); setOk(true); setTimeout(() => setOk(false), 1500); } catch {} }}
      className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed px-3 py-1.5 font-mono text-sm font-bold tracking-wider" style={{ borderColor: d.accent, color: d.text }}>
      {code}{ok ? <Check size={14} /> : <Copy size={14} className="opacity-70" />}
    </button>
  );
}

/** One campaign, drawn the same way on the store and in the builder preview. */
export default function CampaignView({ c, products = [], onClose, onClick, frame, mobile }: Props) {
  const d = fullDesign(c.design ?? {});
  useFonts(fontHref(d));
  const t = c.content ?? {};
  const sheet = mobile && c.kind === "popup" && c.rules?.mobile === "sheet";
  const dragY = useRef<number | null>(null);
  const [drag, setDrag] = useState(0);

  const text = (s?: string) => ({ dir: isUrdu(s) ? "rtl" as const : "auto" as const, style: isUrdu(s) ? { fontFamily: `"${d.urduFont}", serif`, lineHeight: 1.9, letterSpacing: 0, textTransform: "none" as const } : undefined });
  const head = (s?: string, size = d.headSize || ({ sm: 26, md: 34, lg: 46 }[d.size] ?? 34)) => ({
    dir: isUrdu(s) ? "rtl" as const : "auto" as const,
    style: isUrdu(s) ? { fontFamily: `"${d.urduFont}", serif`, fontSize: size * 0.85, lineHeight: 1.7 } : { fontFamily: `"${d.headFont}", sans-serif`, fontSize: size, lineHeight: 1.05, textTransform: d.uppercase ? "uppercase" as const : "none" as const },
  });
  const bgStyle: React.CSSProperties = {
    background: t.bg_image ? `linear-gradient(135deg, ${d.bg}e6, ${d.bg2}d9), url(${t.bg_image}) center/cover` : `linear-gradient(135deg, ${d.bg}, ${d.bg2})`,
    color: d.text, fontFamily: `"${d.bodyFont}", sans-serif`, borderRadius: d.radius,
  };
  const pattern = d.pattern !== "none" && (
    <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ color: d.text, backgroundImage: PATTERN[d.pattern], backgroundSize: PATTERN_SIZE[d.pattern], backgroundPosition: d.pattern === "sparkles" ? "0 0, 10px 14px" : undefined, borderRadius: d.radius }} />
  );
  const anim = d.animation === "none" ? "" : `camp-${d.animation}`;
  const cta = t.button && (
    <Link href={t.code ? `${t.link || "/checkout"}${(t.link || "").includes("?") ? "&" : "?"}coupon=${encodeURIComponent(t.code)}` : t.link || "/shop"} onClick={onClick}
      className={`inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-bold shadow-lg transition hover:-translate-y-0.5 hover:brightness-110 ${d.fx?.shine ? "camp-shine" : ""}`} style={{ background: d.button, color: d.buttonText }}>
      <span {...text(t.button)}>{t.button}</span>
    </Link>
  );
  const cta2 = t.button2 && <Link href={t.link2 || "/"} onClick={onClick} className="inline-flex items-center justify-center rounded-full border-2 px-5 py-2.5 text-sm font-bold transition hover:bg-white/10" style={{ borderColor: d.text, color: d.text }}>{t.button2}</Link>;
  const badge = t.badge && <span className="inline-block rounded-full px-3 py-1 text-xs font-bold" style={{ background: d.accent, color: d.bg, ...text(t.badge).style }} dir={text(t.badge).dir}>{t.badge}</span>;
  const close = onClose && (
    <button type="button" onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-full transition hover:scale-110" style={{ background: `${d.text}26`, color: d.text }}><X size={16} /></button>
  );
  const picks = products.slice(0, 4);
  const productRow = picks.length > 0 && (
    <div className={`mt-4 grid gap-2 ${picks.length > 2 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2"}`}>
      {picks.map((p) => (
        <Link key={p.id} href={`/products/${p.slug}`} onClick={onClick} className="overflow-hidden rounded-xl bg-white text-left text-slate-900 shadow transition hover:-translate-y-0.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {p.images?.[0] ? <img src={p.images[0]} alt="" className="aspect-square w-full object-cover" /> : <span className="block aspect-square bg-slate-100" />}
          <span className="block truncate px-2 pt-1 text-[11px] font-semibold">{p.name}</span>
          <span className="block px-2 pb-1.5 text-xs font-bold">{money(p.price)}{p.compare_price && p.compare_price > p.price ? <s className="ml-1 font-normal text-slate-400">{money(p.compare_price)}</s> : null}</span>
        </Link>
      ))}
    </div>
  );
  const countdown = c.rules?.countdown_to && <Countdown to={c.rules.countdown_to} color={d.accent} compact={c.kind === "topbar" || c.kind === "badge"} />;
  const pos = frame ? "absolute" : "fixed";
  /** lines appear one after another when "stagger" is on */
  let step = 0;
  const rise = () => (d.fx?.stagger ? { className: "camp-item", style: { animationDelay: `${0.15 + step++ * 0.09}s` } } : {});

  // ---------------- top bar
  if (c.kind === "topbar") {
    return (
      <div className={`relative z-[45] w-full ${anim}`} style={{ ...bgStyle, borderRadius: 0 }}>
        {pattern}
        <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-10 py-2 text-center text-sm">
          {badge}<b {...text(t.headline)}>{t.headline}</b>{countdown}
          {t.code && <CodeChip code={t.code} d={d} />}
          {t.button && <Link href={t.link || "/shop"} onClick={onClick} className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: d.button, color: d.buttonText }}>{t.button} →</Link>}
        </div>
        {onClose && <button type="button" onClick={onClose} aria-label="Close" className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full" style={{ color: d.text }}><X size={15} /></button>}
      </div>
    );
  }

  // ---------------- home hero banner
  if (c.kind === "hero") {
    return (
      <section className={`relative mx-auto mt-6 max-w-7xl px-4 ${anim}`}>
        <div className="relative overflow-hidden shadow-xl" style={bgStyle}>
          {pattern}<Fx d={d} />{close}
          <div className={`relative grid items-center gap-6 p-6 md:p-10 ${t.image ? "md:grid-cols-2" : ""}`}>
            <div className={d.align === "center" && !t.image ? "text-center" : ""}>
              {badge}
              <h2 className="mt-3 font-extrabold" {...head(t.headline, d.headSize || (mobile ? 30 : 46))}>{t.headline}</h2>
              {t.sub && <p className="mt-3 max-w-xl text-base opacity-85" {...text(t.sub)}>{t.sub}</p>}
              {countdown && <div className="mt-4">{countdown}</div>}
              <div className={`mt-5 flex flex-wrap items-center gap-3 ${d.align === "center" && !t.image ? "justify-center" : ""}`}>{cta}{cta2}{t.code && <CodeChip code={t.code} d={d} />}</div>
              {productRow}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {t.image && <img src={t.image} alt="" className={`max-h-72 w-full rounded-2xl object-cover ${d.imageSide === "left" ? "md:order-first" : ""}`} />}
          </div>
        </div>
      </section>
    );
  }

  // ---------------- popup (also the expanded floating badge)
  const width = WIDTH[d.size] ?? 460;
  const card = (
    <div role="dialog" aria-modal="true" aria-label={t.headline || c.name}
      className={`relative w-full overflow-hidden text-center shadow-2xl ${sheet ? "" : anim}`}
      style={{ ...bgStyle, maxWidth: sheet ? "100%" : width, borderRadius: sheet ? `${d.radius}px ${d.radius}px 0 0` : d.radius, transform: drag ? `translateY(${drag}px)` : undefined }}
      onTouchStart={sheet ? (e) => { dragY.current = e.touches[0].clientY; } : undefined}
      onTouchMove={sheet ? (e) => { if (dragY.current !== null) setDrag(Math.max(0, e.touches[0].clientY - dragY.current)); } : undefined}
      onTouchEnd={sheet ? () => { if (drag > 90) onClose?.(); setDrag(0); dragY.current = null; } : undefined}
      onClick={(e) => e.stopPropagation()}>
      {pattern}<Fx d={d} />{close}
      {sheet && <span className="relative mx-auto mt-2 block h-1.5 w-12 rounded-full" style={{ background: `${d.text}40` }} />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {t.image && <img src={t.image} alt="" className="relative max-h-56 w-full object-cover" />}
      <div className={`relative ${d.size === "sm" ? "p-5" : "p-6 md:p-8"} ${d.align === "left" ? "text-left" : ""}`}>
        {d.fx?.logo && <div {...rise()}><Logo d={d} /></div>}
        {badge && <div {...rise()}>{badge}</div>}
        <div {...rise()}><h2 className="mt-3 font-extrabold" {...head(t.headline)}>{t.headline}</h2></div>
        {t.sub && <div {...rise()}><p className="mx-auto mt-2 max-w-md text-sm opacity-85 md:text-base" {...text(t.sub)}>{t.sub}</p></div>}
        {countdown && <div {...rise()}><div className="mt-4 flex justify-center">{countdown}</div></div>}
        {t.code && <div {...rise()}><div className="mt-4 flex flex-col items-center gap-1"><span className="text-xs opacity-75">Use code</span><CodeChip code={t.code} d={d} /></div></div>}
        {productRow && <div {...rise()}>{productRow}</div>}
        <div {...rise()}><div className={`mt-5 flex flex-wrap gap-2 ${d.align === "left" ? "" : "justify-center"}`}>{cta}{cta2}</div></div>
        {t.note && <div {...rise()}><p className="mt-3 text-[11px] opacity-60" {...text(t.note)}>{t.note}</p></div>}
      </div>
    </div>
  );

  if (c.kind === "badge") return card;
  return (
    <div className={`${pos} inset-0 z-[90] flex ${sheet ? "items-end" : "items-center justify-center p-4"} camp-fade`} style={{ background: `rgba(2,6,23,${(d.overlay ?? 55) / 100})` }} onClick={onClose}>
      {sheet ? <div className="camp-sheet w-full">{card}</div> : card}
    </div>
  );
}

/** Floating corner badge; opens the offer card when tapped. */
export function CampaignBadge({ c, products, onClose, onClick, onOpen, frame }: Props & { onOpen?: () => void }) {
  const d = fullDesign(c.design ?? {});
  const [open, setOpen] = useState(false);
  const left = (c.rules?.badge_corner ?? "left") === "left";
  const pos = frame ? "absolute" : "fixed";
  return (
    <>
      <button type="button" onClick={() => { setOpen(true); onOpen?.(); }} aria-label={c.content.headline || "Offer"}
        className={`${pos} bottom-5 z-[60] grid h-16 w-16 place-items-center rounded-full font-display text-xl font-extrabold shadow-2xl transition hover:scale-110 ${left ? "left-5" : "right-24"} camp-bounce`}
        style={{ background: `linear-gradient(135deg, ${d.bg}, ${d.bg2})`, color: d.text }}>
        <span className="absolute inset-0 animate-ping rounded-full opacity-25" style={{ background: d.accent }} />
        <span className="relative">{c.content.badge || "%"}</span>
      </button>
      {open && (
        <div className={`${pos} inset-0 z-[90] flex items-center justify-center p-4 camp-fade`} style={{ background: "rgba(2,6,23,0.5)" }} onClick={() => setOpen(false)}>
          <CampaignView c={{ ...c, kind: "badge", design: { ...c.design, size: "sm" } }} products={products} onClick={onClick} onClose={() => { setOpen(false); onClose?.(); }} frame={frame} />
        </div>
      )}
    </>
  );
}
