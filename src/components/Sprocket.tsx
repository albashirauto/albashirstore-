/** Decorative chain sprocket. Pure SVG with real cut-outs, rotate it with the animate-spin-* classes. */
export default function Sprocket({ size = 300, teeth = 18, className = "", fill = "currentColor", hole = true }: { size?: number; teeth?: number; className?: string; fill?: string; hole?: boolean }) {
  const r1 = 100, r2 = 88; // tooth tip / root radius
  const step = (Math.PI * 2) / teeth;
  const pt = (ang: number, r: number) => `${(Math.cos(ang) * r).toFixed(2)} ${(Math.sin(ang) * r).toFixed(2)}`;
  const outline: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    outline.push(pt(a - step * 0.3, r2), pt(a - step * 0.16, r1), pt(a + step * 0.16, r1), pt(a + step * 0.3, r2));
  }
  let d = `M${outline.join(" L")} Z`;
  const circle = (cx: number, cy: number, r: number) => ` M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
  if (hole) {
    d += circle(0, 0, 30); // centre cut-out
    d += circle(0, 0, 12); // hub (filled again by even-odd rule)
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      d += circle(Number((Math.cos(a) * 52).toFixed(2)), Number((Math.sin(a) * 52).toFixed(2)), 13);
    }
  }
  return (
    <svg width={size} height={size} viewBox="-105 -105 210 210" className={className} aria-hidden>
      <path d={d} fill={fill} fillRule="evenodd" />
    </svg>
  );
}
