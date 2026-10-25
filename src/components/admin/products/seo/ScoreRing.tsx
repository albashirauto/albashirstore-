import { scoreTone } from "@/lib/seo";

/** Rank Math-style score circle. */
export default function ScoreRing({ score, size = 112 }: { score: number; size?: number }) {
  const t = scoreTone(score);
  const r = 44, c = 2 * Math.PI * r;
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="-rotate-90" width={size} height={size} aria-hidden>
        <circle cx="50" cy="50" r={r} fill="none" stroke="var(--line)" strokeWidth="8" />
        <circle cx="50" cy="50" r={r} fill="none" stroke={t.ring} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} style={{ transition: "stroke-dashoffset .8s cubic-bezier(.22,1,.36,1), stroke .4s" }} />
      </svg>
      <div className="absolute text-center leading-none">
        <p className="font-display text-4xl font-extrabold" style={{ color: t.ring }}>{score}</p>
        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted">/ 100</p>
      </div>
    </div>
  );
}

export function ScorePill({ score }: { score: number }) {
  const t = scoreTone(score);
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${t.bg} ${t.text}`}>SEO {score}/100</span>;
}
