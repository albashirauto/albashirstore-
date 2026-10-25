// Code 128 (set B) barcode as SVG: letters, digits and symbols. No library needed.
// Each pattern = widths of bar, space, bar, space, bar, space (in modules); 11 modules per symbol, stop = 13.
export const PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112",
];
const START_B = 104, STOP = 106;

/** Values for "text" in Code 128-B, with start, checksum and stop. Characters outside ASCII 32–126 are dropped. */
export function encode128(text: string): number[] {
  const vals = [...text].map((c) => c.charCodeAt(0) - 32).filter((v) => v >= 0 && v <= 94);
  const sum = vals.reduce((n, v, i) => n + v * (i + 1), START_B);
  return [START_B, ...vals, sum % 103, STOP];
}

export default function Barcode({ value, height = 48, className }: { value: string; height?: number; className?: string }) {
  const codes = encode128(value);
  const bars: { x: number; w: number }[] = [];
  let x = 10; // quiet zone
  for (const c of codes) {
    [...PATTERNS[c]].forEach((d, i) => {
      const w = Number(d);
      if (i % 2 === 0) bars.push({ x, w });
      x += w;
    });
  }
  const width = x + 10;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className={className} role="img" aria-label={`Barcode ${value}`} shapeRendering="crispEdges">
      <rect width={width} height={height} fill="#fff" />
      {bars.map((b, i) => <rect key={i} x={b.x} y={0} width={b.w} height={height} fill="#000" />)}
    </svg>
  );
}
