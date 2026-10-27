import { Sparkles, Wrench } from "lucide-react";

// Hand-drawn, duotone part icons (24×24, currentColor). A category gets its icon from words in its
// name / web address, so a new category such as "Side Mirrors" or "Shock Absorbers" picks the right one by itself.

type P = { size?: number; className?: string };
const DUO = { fill: "currentColor", fillOpacity: 0.16 } as const;
const at = (r: number, deg: number, c = 12) => [c + r * Math.cos((deg * Math.PI) / 180), c + r * Math.sin((deg * Math.PI) / 180)] as const;
const ring = (n: number, from = 0) => Array.from({ length: n }, (_, i) => from + (360 / n) * i);

function Svg({ size = 24, className, children }: P & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {children}
    </svg>
  );
}

const Sprocket = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.4" strokeWidth="2.8" strokeDasharray="2.2 2.2" strokeLinecap="butt" />
    <circle cx="12" cy="12" r="6.6" {...DUO} />
    <circle cx="12" cy="12" r="2" />
    {ring(5, -90).map((d) => { const [x, y] = at(4.3, d); return <circle key={d} cx={x} cy={y} r="0.9" fill="currentColor" stroke="none" />; })}
  </Svg>
);

const Battery = (p: P) => (
  <Svg {...p}>
    <path d="M6 7.5V5h3v2.5M15 7.5V5h3v2.5" />
    <rect x="3" y="7.5" width="18" height="12.5" rx="2" {...DUO} />
    <path d="M6.5 13.7h3.4M8.2 12v3.4M14.2 13.7h3.4" />
  </Svg>
);

const OilCan = (p: P) => (
  <Svg {...p}>
    <rect x="2.5" y="11" width="11.5" height="8.5" rx="1.6" {...DUO} />
    <path d="M14 13 21 9v1.8l-7 4.6" />
    <path d="M6 11V9.2h4.4V11M8.2 9.2V7.6" />
    <path d="M20.6 13.4c.9 1.2 1.4 2.1 1.4 2.7a1.4 1.4 0 0 1-2.8 0c0-.6.5-1.5 1.4-2.7z" fill="currentColor" stroke="none" />
  </Svg>
);

const Headlight = (p: P) => (
  <Svg {...p}>
    <path d="M10.5 5C6.4 5 3.5 8.1 3.5 12s2.9 7 7 7c1.6 0 2.6-3.1 2.6-7s-1-7-2.6-7z" {...DUO} />
    <path d="M7.5 9.5c-.6.7-.9 1.5-.9 2.5" opacity=".6" />
    <path d="M16 7.8 21 6.8M16 12h5M16 16.2l5 1" />
  </Svg>
);

const BrakeDisc = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" {...DUO} />
    <circle cx="12" cy="12" r="3" />
    {ring(6, 30).map((d) => { const [x, y] = at(6, d); return <circle key={d} cx={x} cy={y} r="0.85" fill="currentColor" stroke="none" />; })}
    <path d="M14.8 2.4a9.8 9.8 0 0 1 6.8 6.8l-3 .9a6.7 6.7 0 0 0-4.7-4.7z" fill="currentColor" stroke="none" />
  </Svg>
);

const Tyre = (p: P) => (
  <Svg {...p}>
    <path d="M12 2.6a9.4 9.4 0 1 0 0 18.8 9.4 9.4 0 0 0 0-18.8zm0 4.2a5.2 5.2 0 1 1 0 10.4 5.2 5.2 0 0 1 0-10.4z" fillRule="evenodd" {...DUO} stroke="none" />
    <circle cx="12" cy="12" r="9.4" />
    <circle cx="12" cy="12" r="5.2" />
    <circle cx="12" cy="12" r="1.6" />
    {ring(10).map((d) => { const [x1, y1] = at(6.4, d), [x2, y2] = at(8.3, d + 12); return <path key={d} d={`M${x1} ${y1}L${x2} ${y2}`} strokeWidth="1.3" />; })}
  </Svg>
);

const Wheel = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.4" strokeWidth="2.2" />
    <circle cx="12" cy="12" r="7.2" {...DUO} strokeWidth="1" />
    <circle cx="12" cy="12" r="1.8" fill="currentColor" />
    {ring(8, 22.5).map((d) => { const [x, y] = at(7.2, d); return <path key={d} d={`M12 12L${x} ${y}`} strokeWidth="1.1" />; })}
  </Svg>
);

const SparkPlug = (p: P) => (
  <Svg {...p}>
    <rect x="10.6" y="1.8" width="2.8" height="2.4" rx=".6" />
    <path d="M9.9 4.2h4.2l-.5 6h-3.2z" {...DUO} />
    <path d="M10.2 6.2h3.6M10.4 8.2h3.2" strokeWidth="1.1" />
    <rect x="7.8" y="10.2" width="8.4" height="3" rx=".7" fill="currentColor" fillOpacity=".35" />
    <path d="M9.6 13.2h4.8v5.3H9.6z" />
    <path d="M9.6 15l4.8-.9M9.6 16.9l4.8-.9" strokeWidth="1.1" />
    <path d="M12 18.5v1.7M14 18.5v3.3h-2" />
  </Svg>
);

const Speedometer = (p: P) => (
  <Svg {...p}>
    <path d="M3.2 17A8.8 8.8 0 0 1 20.8 17z" {...DUO} />
    <path d="M3.2 17a8.8 8.8 0 0 1 17.6 0" />
    {ring(7, 180).slice(0, 7).map((_, i) => { const d = 180 + i * 30; const [x1, y1] = at(6.4, d), [x2, y2] = at(7.8, d); return <path key={d} d={`M${x1} ${y1 + 5}L${x2} ${y2 + 5}`} strokeWidth="1.2" />; })}
    <path d="M12 17l4.6-4.4" strokeWidth="1.9" />
    <circle cx="12" cy="17" r="1.5" fill="currentColor" />
    <path d="M3 20.4h18" />
  </Svg>
);

const FuelTank = (p: P) => (
  <Svg {...p}>
    <path d="M2.8 15.2c0-4.3 3.3-8.2 9.4-8.2 4 0 7 1.5 9 4.2l-1.1 5.3c-.3 1.3-1.4 2.2-2.7 2.2H6c-1.8 0-3.2-1.5-3.2-3.5z" {...DUO} />
    <rect x="10" y="4.4" width="4" height="2.6" rx=".9" />
    <path d="M6.6 13c2.2-1.2 6.3-1.6 9.6-.6" opacity=".7" />
  </Svg>
);

const Silencer = (p: P) => (
  <Svg {...p}>
    <path d="M1.8 9h3.4c1.3 0 2.1.8 2.5 2" />
    <rect x="6.8" y="9.4" width="12.6" height="7.2" rx="3.6" {...DUO} />
    <path d="M10.6 9.6v6.8M14.4 9.6v6.8" strokeWidth="1" opacity=".55" />
    <path d="M19.4 12h2.6v2h-2.6" />
    <path d="M21.4 9.4c.8-.6.8-1.7 0-2.3M19.2 8.4c.6-.5.6-1.3 0-1.8" strokeWidth="1.2" opacity=".75" />
  </Svg>
);

const Rickshaw = (p: P) => (
  <Svg {...p}>
    <path d="M2.8 15.4V8.2c0-2.3 1.9-4.2 4.2-4.2h6.4c1.9 0 3.1 1 3.9 2.6l4 8.8z" {...DUO} />
    <path d="M8.4 15.4V8.2h5.4l2.8 7.2" />
    <path d="M1.8 15.4h20" />
    <circle cx="6.2" cy="18.2" r="2.3" />
    <circle cx="19" cy="18.4" r="2" />
  </Svg>
);

const Loader = (p: P) => (
  <Svg {...p}>
    <path d="M2 8.5v6.5h11V8.5" {...DUO} />
    <path d="M13 15V7.5h4.2l3.8 4.4V15z" {...DUO} />
    <path d="M15.2 7.5v4h5.4" />
    <path d="M1.5 15h20" />
    <circle cx="6" cy="17.8" r="2.2" />
    <circle cx="17" cy="17.8" r="2.2" />
  </Svg>
);

const Bicycle = (p: P) => (
  <Svg {...p}>
    <circle cx="5.5" cy="16" r="3.8" {...DUO} />
    <circle cx="18.5" cy="16" r="3.8" {...DUO} />
    <path d="M5.5 16 9 9.2l2.4 6.8zM9 9.2h7.2l-4.8 6.8M16.2 9.2l2.3 6.8" />
    <path d="M9 9.2 8.4 7.4M7 7.2h3M16.2 9.2l-.8-2.6h2.4" />
  </Svg>
);

const Motorcycle = (p: P) => (
  <Svg {...p}>
    <circle cx="5" cy="16.5" r="3.3" />
    <circle cx="19" cy="16.5" r="3.3" />
    <path d="M9.8 10.2h5l1.6 2.6H8.6z" {...DUO} />
    <path d="M5 16.5h4.2l2.6-3.7M16.4 12.8l2.6 3.7M15.6 8.2l2.4 5M14.8 8.2h2.4M4.5 12.6h4.6" />
  </Svg>
);

const Mirror = (p: P) => (
  <Svg {...p}>
    <ellipse cx="14.5" cy="8" rx="6.5" ry="4.6" transform="rotate(-18 14.5 8)" {...DUO} />
    <path d="M12.2 5.8l3.4-1" opacity=".7" />
    <path d="M10.6 12.2 5.4 20M3.6 20h3.6" />
  </Svg>
);

const Horn = (p: P) => (
  <Svg {...p}>
    <path d="M3 9.5h3.5L13 5.5v13l-6.5-4H3z" {...DUO} />
    <path d="M16 9.2a4 4 0 0 1 0 5.6M18.6 6.6a7.7 7.7 0 0 1 0 10.8" />
  </Svg>
);

const Cable = (p: P) => (
  <Svg {...p}>
    <path d="M5 19c0-6 3.5-6.4 7-7.6S19 9 19 5" />
    <rect x="2.6" y="18.4" width="4.8" height="3" rx="1" {...DUO} />
    <rect x="16.6" y="2.6" width="4.8" height="3" rx="1" {...DUO} />
  </Svg>
);

const Electrical = (p: P) => (
  <Svg {...p}>
    <path d="M9 2.5v4M15 2.5v4" />
    <path d="M6 6.5h12v3.8a6 6 0 0 1-12 0z" {...DUO} />
    <path d="M12.8 9 11 12h2l-1.8 3" strokeWidth="1.3" />
    <path d="M12 16.3V21.5" />
  </Svg>
);

const Shock = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="3.4" r="1.6" />
    <circle cx="12" cy="20.6" r="1.6" />
    <path d="M12 5v1.4M12 17.6V19" />
    <path d="M8 6.4h8L8 8.6l8 2.2-8 2.2 8 2.2-8 2.2h8" />
    <rect x="10.2" y="8.6" width="3.6" height="8.6" rx=".8" {...DUO} stroke="none" />
  </Svg>
);

const Piston = (p: P) => (
  <Svg {...p}>
    <path d="M6.5 4.5c0-1 .8-1.8 1.8-1.8h7.4c1 0 1.8.8 1.8 1.8V12h-11z" {...DUO} />
    <path d="M6.5 5.8h11M6.5 7.8h11" strokeWidth="1.1" />
    <circle cx="12" cy="10" r="1.1" />
    <path d="M11 12l-.6 5.4M13 12l.6 5.4" />
    <circle cx="12" cy="19.2" r="2.4" />
  </Svg>
);

const Filter = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.2" {...DUO} />
    <path d="M6 8.5l1.5 7 1.5-7 1.5 7 1.5-7 1.5 7 1.5-7 1.5 7 1.5-7" strokeWidth="1.2" />
  </Svg>
);

const Bearing = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.2" {...DUO} />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="12" cy="12" r="2.2" />
    {ring(8).map((d) => { const [x, y] = at(6.7, d); return <circle key={d} cx={x} cy={y} r="1.35" fill="currentColor" stroke="none" />; })}
  </Svg>
);

const Clutch = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9.2" />
    <circle cx="12" cy="12" r="7.4" strokeWidth="2.6" strokeDasharray="3.2 1.6" strokeLinecap="butt" opacity=".55" />
    <circle cx="12" cy="12" r="3.4" {...DUO} />
    <circle cx="12" cy="12" r="3.4" strokeDasharray="1.2 1" />
  </Svg>
);

const Seat = (p: P) => (
  <Svg {...p}>
    <path d="M2.8 13.4c1.8-3.2 5.8-4.2 10-3.3l8-2.1c.7 1.8.3 3.4-1.1 4.6l-7.4 3.6H5c-1.5 0-2.6-1.4-2.2-2.8z" {...DUO} />
    <path d="M6 16.2v3.3M15.6 14.6v4.9M4.5 19.5h13" />
  </Svg>
);

const Handlebar = (p: P) => (
  <Svg {...p}>
    <path d="M5.5 9.5c2.6 0 3.8 2.6 6.5 2.6s3.9-2.6 6.5-2.6" />
    <path d="M2.4 9.5h3.1M18.5 9.5h3.1" strokeWidth="3.2" />
    <path d="M12 12.1v7.4M9 19.5h6" />
    <path d="M17.5 11.2 20.6 13" opacity=".7" />
  </Svg>
);

const Helmet = (p: P) => (
  <Svg {...p}>
    <path d="M3.6 17.2c0-6.8 4-11.7 9.6-11.7 4.4 0 7.2 3.3 7.2 7.9v3.8z" {...DUO} />
    <path d="M11 10.4h9.3v3.6h-6.8c-1.4 0-2.5-1.6-2.5-3.6z" fill="currentColor" fillOpacity=".4" />
    <path d="M3.4 17.2h17.2" />
  </Svg>
);

const Lock = (p: P) => (
  <Svg {...p}>
    <path d="M8 10.2V7.2a4 4 0 0 1 8 0v3" />
    <rect x="5" y="10.2" width="14" height="10.3" rx="2.2" {...DUO} />
    <circle cx="12" cy="14.6" r="1.3" fill="currentColor" />
    <path d="M12 15.8v2.2" />
  </Svg>
);

const Key = (p: P) => (
  <Svg {...p}>
    <circle cx="7" cy="12" r="3.8" {...DUO} />
    <circle cx="7" cy="12" r="1.2" />
    <path d="M10.8 12H21M17.4 12v3M20.4 12v2.4" />
  </Svg>
);

const BodyPanel = (p: P) => (
  <Svg {...p}>
    <path d="M2.8 14.6a9.2 9.2 0 0 1 18.4 0h-3a6.2 6.2 0 0 0-12.4 0z" {...DUO} />
    <circle cx="12" cy="16.4" r="4" />
    <circle cx="12" cy="16.4" r="1.2" fill="currentColor" />
  </Svg>
);

const Gear = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" strokeWidth="3" strokeDasharray="2.5 1.7" strokeLinecap="butt" />
    <circle cx="12" cy="12" r="6.3" {...DUO} />
    <circle cx="12" cy="12" r="2.4" />
  </Svg>
);

/** Fallback: a hex nut, the universal "spare part". */
const Nut = (p: P) => (
  <Svg {...p}>
    <path d="M12 2.6l8.1 4.7v9.4L12 21.4l-8.1-4.7V7.3z" {...DUO} />
    <circle cx="12" cy="12" r="3.4" />
  </Svg>
);

type Icon = (p: P) => React.ReactElement;
const lucide = (I: typeof Wrench): Icon => (p) => <I size={p.size} className={p.className} strokeWidth={1.6} />;

// first match wins; tested against "<name> <slug>" in lower case
const RULES: [RegExp, Icon][] = [
  [/rickshaw|chingchi|qingqi|tuk.?tuk/, Rickshaw],
  [/loader|cargo|truck/, Loader],
  [/\bcycles?\b|bicycle|bmx|cycle-parts/, Bicycle],
  [/chain|sprocket/, Sprocket],
  [/batter/, Battery],
  [/\boil|lubric|grease|coolant|fluid/, OilCan],
  [/spark|\bplugs?\b/, SparkPlug],
  [/speedo|meter|gauge|dashboard|cluster/, Speedometer],
  [/fuel|tank|petrol/, FuelTank],
  [/silenc|exhaust|muffler/, Silencer],
  [/brake|disc|caliper/, BrakeDisc],
  [/clutch/, Clutch],
  [/tyre|tire|\btubes?\b/, Tyre],
  [/\brims?\b|wheel|spoke|alloy/, Wheel],
  [/light|lamp|indicator|bulb|\bled\b|blinker|reflector/, Headlight],
  [/mirror/, Mirror],
  [/horn/, Horn],
  [/wiring|electric|switch|\bcdi\b|relay|fuse|regulator|rectifier|coil|starter|harness/, Electrical],
  [/cable|\bwires?\b/, Cable],
  [/shock|suspension|absorber|\bforks?\b|spring/, Shock],
  [/bearing/, Bearing],
  [/piston|engine|cylinder|gasket|valve|carb|\brings?\b|crank/, Piston],
  [/filter/, Filter],
  [/seat|cushion|saddle/, Seat],
  [/handle|grip|lever|throttle/, Handlebar],
  [/helmet|safety|glove/, Helmet],
  [/\block|security|alarm/, Lock],
  [/\bkeys?\b|ignition/, Key],
  [/body|panel|cover|mudguard|fender|fairing|visor|guard/, BodyPanel],
  [/gear|transmission/, Gear],
  [/tool|wrench|spanner/, lucide(Wrench)],
  [/accessor|sticker|decor|styling/, lucide(Sparkles)],
  [/motorcycle|motorbike|\bbikes?\b|honda|yamaha|suzuki/, Motorcycle],
];

export function iconFor(name = "", slug = ""): Icon {
  const key = `${name} ${slug}`.toLowerCase();
  return RULES.find(([re]) => re.test(key))?.[1] ?? Nut;
}

export default function CategoryIcon({ slug, name, size = 34, className }: { slug: string; name?: string; size?: number; className?: string }) {
  const I = iconFor(name, slug);
  return <I size={size} className={className} />;
}
