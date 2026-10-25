/**
 * Store logo. Uses the logo uploaded in Admin > Settings > Logo & favicon (and its dark-mode version);
 * without one, shows the built-in blue gear + store name.
 */
export default function Logo({ name = "Al Bashir Autos", size = 44, src, srcDark }: { name?: string; size?: number; src?: string | null; srcDark?: string | null }) {
  if (src)
    return (
      <span className="flex items-center" style={{ height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={name} style={{ height: size }} className={`w-auto max-w-[220px] object-contain ${srcDark ? "dark:hidden" : ""}`} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {srcDark && <img src={srcDark} alt={name} style={{ height: size }} className="hidden w-auto max-w-[220px] object-contain dark:block" />}
      </span>
    );
  return (
    <span className="flex items-center gap-2.5">
      <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
        <g>
          <path
            fill="#1d4fd8"
            d="M27 4h10l2 7a21 21 0 0 1 5 2l7-4 7 7-4 7a21 21 0 0 1 2 5l7 2v10l-7 2a21 21 0 0 1-2 5l4 7-7 7-7-4a21 21 0 0 1-5 2l-2 7H27l-2-7a21 21 0 0 1-5-2l-7 4-7-7 4-7a21 21 0 0 1-2-5l-7-2V27l7-2a21 21 0 0 1 2-5l-4-7 7-7 7 4a21 21 0 0 1 5-2z"
          />
        </g>
        <circle cx="32" cy="32" r="16" fill="#fff" />
        <text x="32" y="40" textAnchor="middle" fontSize="23" fontWeight="800" fontFamily="Barlow Condensed, Arial Narrow, sans-serif" fill="#e11d2e">B</text>
      </svg>
      <span className="leading-none">
        <span className="font-display block text-[1.7rem] font-extrabold uppercase tracking-wide text-brand-700 dark:text-white">{name.split(" ").slice(0, 2).join(" ")}</span>
        <span className="font-display block text-[0.95rem] font-semibold uppercase tracking-[0.32em] text-hot">{name.split(" ").slice(2).join(" ") || "Autos"}</span>
      </span>
    </span>
  );
}
