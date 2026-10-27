import {
  mdiAirFilter, mdiAirHorn, mdiBicycle, mdiCarBattery, mdiCarClutch, mdiCarLightHigh, mdiCarShiftPattern, mdiCarTurbocharger,
  mdiCreation, mdiEngine, mdiKey, mdiLock, mdiMoped, mdiMotorbike, mdiNut, mdiOil, mdiPiston, mdiPowerPlug, mdiRacingHelmet,
  mdiRadiator, mdiRickshaw, mdiSpeedometer, mdiTire, mdiTools, mdiTruckFlatbed,
} from "@mdi/js";

// Solid part icons (24×24, currentColor). Material Design Icons where one matches the part exactly;
// the bike parts MDI lacks (spark plug, sprocket, silencer, shock…) are drawn here in the same solid style.
// A category gets its icon from words in its name / web address, so new categories pick the right one by themselves.

type P = { size?: number; className?: string };
type Icon = (p: P) => React.ReactElement;

const mdi = (d: string): Icon => ({ size = 24, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden><path fill="currentColor" d={d} /></svg>
);

function Svg({ size = 24, className, children }: P & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={0} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {children}
    </svg>
  );
}

/** circle as a sub-path, for punching holes with fillRule="evenodd" */
const circ = (cx: number, cy: number, r: number) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
const at = (r: number, deg: number) => [12 + r * Math.cos((deg * Math.PI) / 180), 12 + r * Math.sin((deg * Math.PI) / 180)] as const;
const every = (n: number, from = 0) => Array.from({ length: n }, (_, i) => from + (360 / n) * i);
const line = { fill: "none", strokeWidth: 2 } as const;

/** toothed wheel outline: n flat-topped teeth between radius r (root) and R (tip) */
function teeth(n: number, r: number, R: number) {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (360 / n) * i, w = 360 / n;
    for (const [rad, d] of [[r, a], [R, a + w * 0.18], [R, a + w * 0.45], [r, a + w * 0.63]] as const) {
      const [x, y] = at(rad, d);
      pts.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
    }
  }
  return `M${pts.join("L")}z`;
}

const Sprocket: Icon = (p) => (
  <Svg {...p}>
    <path fillRule="evenodd" d={teeth(14, 7.9, 10.2) + circ(12, 12, 2) + every(5, -90).map((d) => { const [x, y] = at(4.6, d); return circ(x, y, 1.15); }).join("")} />
  </Svg>
);

const SparkPlug: Icon = (p) => (
  <Svg {...p}>
    <rect x="10.4" y="1.2" width="3.2" height="2.6" rx=".7" />
    <path d="M9.5 4.6h5l-.6 5.4h-3.8z" />
    <rect x="7.4" y="10.6" width="9.2" height="3.2" rx=".7" />
    <rect x="9.3" y="14.4" width="5.4" height="1.7" rx=".3" />
    <rect x="9.3" y="16.7" width="5.4" height="1.7" rx=".3" />
    <path d="M12 18.6v1.8M14.3 18.6v3.4h-2.5" {...line} strokeWidth="1.7" />
  </Svg>
);

const BrakeDisc: Icon = (p) => (
  <Svg {...p}>
    <path fillRule="evenodd" d={circ(12, 12.6, 9) + circ(12, 12.6, 3) + every(6, 30).map((d) => { const [x, y] = at(6, d); return circ(x, y + 0.6, 0.95); }).join("")} />
    <path d="M14.6 1.6a10.8 10.8 0 0 1 7.6 7.4l-3.6 1.2a7 7 0 0 0-5-4.9z" />
  </Svg>
);

const FuelTank: Icon = (p) => (
  <Svg {...p}>
    <rect x="9.8" y="3.6" width="4.4" height="2.8" rx="1" />
    <path d="M2.4 15.4c0-4.6 3.6-8.6 9.8-8.6 4.2 0 7.3 1.6 9.4 4.4l-1.2 5.6c-.3 1.4-1.5 2.4-2.9 2.4H5.8c-1.9 0-3.4-1.7-3.4-3.8z" />
  </Svg>
);

const Exhaust: Icon = (p) => (
  <Svg {...p}>
    <path d="M1.6 8.6h3.6c1.4 0 2.2.8 2.6 2.2" {...line} />
    <path fillRule="evenodd" d="M10.4 8.8h5.4a3.9 3.9 0 0 1 0 7.8h-5.4a3.9 3.9 0 0 1 0-7.8zm2 1.4v5h.9v-5zm3 0v5h.9v-5z" />
    <rect x="19.2" y="11.4" width="3.2" height="2.6" rx=".6" />
    <path d="M21.6 8.8c.9-.7.9-1.8 0-2.5M19.3 7.6c.6-.5.6-1.3 0-1.8" {...line} strokeWidth="1.5" />
  </Svg>
);

const Shock: Icon = (p) => (
  <Svg {...p}>
    <path fillRule="evenodd" d={circ(12, 3.2, 2.2) + circ(12, 3.2, 1) + circ(12, 20.8, 2.2) + circ(12, 20.8, 1)} />
    <rect x="9.9" y="8.4" width="4.2" height="9.2" rx="1" />
    <path d="M12 5.4v1.2M12 17.6v1" {...line} />
    <path d="M7.6 6.6h8.8L7.6 9l8.8 2.4L7.6 13.8l8.8 2.4" {...line} strokeWidth="1.7" />
  </Svg>
);

const Bearing: Icon = (p) => (
  <Svg {...p}>
    <path fillRule="evenodd" d={circ(12, 12, 10) + circ(12, 12, 8.3) + circ(12, 12, 4.6) + circ(12, 12, 2.6)} />
    {every(8).map((d) => { const [x, y] = at(6.45, d); return <circle key={d} cx={x} cy={y} r="1.45" />; })}
  </Svg>
);

const Wheel: Icon = (p) => (
  <Svg {...p}>
    <path fillRule="evenodd" d={circ(12, 12, 10) + circ(12, 12, 7.6)} />
    <circle cx="12" cy="12" r="2.2" />
    {every(8, 22.5).map((d) => { const [x, y] = at(7.8, d); return <path key={d} d={`M12 12L${x} ${y}`} {...line} strokeWidth="1.3" />; })}
  </Svg>
);

const Mirror: Icon = (p) => (
  <Svg {...p}>
    <ellipse cx="14.6" cy="7.8" rx="6.8" ry="4.9" transform="rotate(-18 14.6 7.8)" />
    <path d="M10.6 12.2 5.2 20.2M3.4 20.6h3.8" {...line} strokeWidth="2.2" />
  </Svg>
);

const Handlebar: Icon = (p) => (
  <Svg {...p}>
    <path d="M5.6 9.4c2.6 0 3.8 2.8 6.4 2.8s3.8-2.8 6.4-2.8" {...line} strokeWidth="2.2" />
    <rect x="1.4" y="7.6" width="4.6" height="3.6" rx="1.4" />
    <rect x="18" y="7.6" width="4.6" height="3.6" rx="1.4" />
    <path d="M12 12.2v6.6M8.6 19.6h6.8" {...line} strokeWidth="2.2" />
  </Svg>
);

const Cable: Icon = (p) => (
  <Svg {...p}>
    <path d="M5.2 18.4c0-5.6 3.4-6.2 6.8-7.4s6.8-1.8 6.8-7.2" {...line} />
    <rect x="2.4" y="18" width="5.6" height="3.6" rx="1.1" />
    <rect x="16" y="2.4" width="5.6" height="3.6" rx="1.1" />
  </Svg>
);

const Seat: Icon = (p) => (
  <Svg {...p}>
    <path d="M2.4 13.6c1.9-3.4 6-4.4 10.4-3.5l8.4-2.2c.8 1.9.3 3.6-1.2 4.9l-7.8 3.8H4.8c-1.6 0-2.8-1.5-2.4-3z" />
    <path d="M6.2 16.8v3M15.8 15.2v4.6M4.4 20.2h13.2" {...line} strokeWidth="1.8" />
  </Svg>
);

const Mudguard: Icon = (p) => (
  <Svg {...p}>
    <path d="M2.2 14.4a9.8 9.8 0 0 1 19.6 0h-3.4a6.4 6.4 0 0 0-12.8 0z" />
    <path fillRule="evenodd" d={circ(12, 16.6, 4.4) + circ(12, 16.6, 1.4)} />
  </Svg>
);

// first match wins; tested against "<name> <slug>" in lower case
const RULES: [RegExp, Icon][] = [
  [/rickshaw|chingchi|qingqi|tuk.?tuk/, mdi(mdiRickshaw)],
  [/loader|cargo|truck/, mdi(mdiTruckFlatbed)],
  [/scooter|moped|scooty/, mdi(mdiMoped)],
  [/\bcycles?\b|bicycle|bmx|cycle-parts/, mdi(mdiBicycle)],
  [/chain|sprocket/, Sprocket],
  [/batter/, mdi(mdiCarBattery)],
  [/\boil|lubric|grease/, mdi(mdiOil)],
  [/coolant|radiator/, mdi(mdiRadiator)],
  [/spark|\bplugs?\b/, SparkPlug],
  [/speedo|meter|gauge|dashboard|cluster/, mdi(mdiSpeedometer)],
  [/fuel|tank|petrol/, FuelTank],
  [/silenc|exhaust|muffler/, Exhaust],
  [/brake|disc|caliper/, BrakeDisc],
  [/clutch/, mdi(mdiCarClutch)],
  [/tyre|tire|\btubes?\b/, mdi(mdiTire)],
  [/\brims?\b|wheel|spoke|alloy/, Wheel],
  [/light|lamp|indicator|bulb|\bled\b|blinker|reflector/, mdi(mdiCarLightHigh)],
  [/mirror/, Mirror],
  [/horn/, mdi(mdiAirHorn)],
  [/wiring|electric|switch|\bcdi\b|relay|fuse|regulator|rectifier|coil|harness/, mdi(mdiPowerPlug)],
  [/cable|\bwires?\b/, Cable],
  [/shock|suspension|absorber|\bforks?\b|spring/, Shock],
  [/bearing/, Bearing],
  [/turbo/, mdi(mdiCarTurbocharger)],
  [/piston|\brings?\b|gasket|valve|crank/, mdi(mdiPiston)],
  [/engine|cylinder|carb|motor\b/, mdi(mdiEngine)],
  [/filter/, mdi(mdiAirFilter)],
  [/seat|cushion|saddle/, Seat],
  [/handle|grip|lever|throttle/, Handlebar],
  [/helmet|safety|glove/, mdi(mdiRacingHelmet)],
  [/\block|security|alarm/, mdi(mdiLock)],
  [/\bkeys?\b|ignition/, mdi(mdiKey)],
  [/body|panel|cover|mudguard|fender|fairing|visor|guard/, Mudguard],
  [/gear|transmission/, mdi(mdiCarShiftPattern)],
  [/tool|wrench|spanner/, mdi(mdiTools)],
  [/accessor|sticker|decor|styling/, mdi(mdiCreation)],
  [/motorcycle|motorbike|\bbikes?\b|honda|yamaha|suzuki/, mdi(mdiMotorbike)],
];
const Fallback = mdi(mdiNut);

export function iconFor(name = "", slug = ""): Icon {
  const key = `${name} ${slug}`.toLowerCase();
  return RULES.find(([re]) => re.test(key))?.[1] ?? Fallback;
}

export default function CategoryIcon({ slug, name, size = 34, className }: { slug: string; name?: string; size?: number; className?: string }) {
  const I = iconFor(name, slug);
  return <I size={size} className={className} />;
}
