// BROWSER ONLY. Cleans up product-style photos before upload:
// 1) if the photo sits on a plain background (white, grey, any flat colour) that background is made transparent,
//    flood-filling in from the edges so light parts inside the item are kept;
// 2) empty margins / side bezels are trimmed so the item fills the picture.
// Busy photo backgrounds are left exactly as they are.

const MAX = 1200;      // longest side after resize
const TOL = 38;        // colour distance still counted as background
const SOFT = 26;       // extra distance faded out for smooth edges
const PAD = 0.04;      // margin kept around the item after trimming

const load = (file: File) => new Promise<HTMLImageElement>((ok, fail) => {
  const img = new Image();
  img.onload = () => ok(img);
  img.onerror = () => fail(new Error("Could not read that picture."));
  img.src = URL.createObjectURL(file);
});

export async function cutout(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml" || file.type === "image/gif") return file;
  const img = await load(file);
  const scale = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const ctx = cv.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(img.src);
  const im = ctx.getImageData(0, 0, w, h), px = im.data;

  // background colour = average of the border pixels; it only counts if the border is mostly that colour
  const edge: number[] = [];
  for (let x = 0; x < w; x++) edge.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) edge.push(y * w, y * w + w - 1);
  const opaque = edge.filter((i) => px[i * 4 + 3] > 200);
  const already = opaque.length < edge.length * 0.5; // border already transparent: just trim
  let bg = [255, 255, 255];
  if (!already) {
    const sum = [0, 0, 0];
    opaque.forEach((i) => { sum[0] += px[i * 4]; sum[1] += px[i * 4 + 1]; sum[2] += px[i * 4 + 2]; });
    bg = sum.map((s) => s / opaque.length);
  }
  const dist = (i: number) => Math.hypot(px[i * 4] - bg[0], px[i * 4 + 1] - bg[1], px[i * 4 + 2] - bg[2]);
  const flat = !already && opaque.filter((i) => dist(i) < TOL).length > opaque.length * 0.8;

  if (!flat && !already) return file;

  if (flat) {
    // flood fill from every border pixel through background-coloured pixels
    const seen = new Uint8Array(w * h);
    const stack: number[] = [];
    edge.forEach((i) => { if (!seen[i] && dist(i) < TOL + SOFT) { seen[i] = 1; stack.push(i); } });
    while (stack.length) {
      const i = stack.pop()!;
      const d = dist(i);
      px[i * 4 + 3] = d < TOL ? 0 : Math.min(px[i * 4 + 3], Math.round(((d - TOL) / SOFT) * 255));
      if (d >= TOL) continue; // soft edge pixel: fade it but don't spread past it
      const x = i % w, y = (i / w) | 0;
      for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) {
        if (n >= 0 && !seen[n] && dist(n) < TOL + SOFT) { seen[n] = 1; stack.push(n); }
      }
    }
    ctx.putImageData(im, 0, 0);
  }

  // trim to the visible pixels
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (px[(y * w + x) * 4 + 3] > 16) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) { x0 = 0; y0 = 0; x1 = w - 1; y1 = h - 1; }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, pad = Math.round(Math.max(bw, bh) * PAD);
  const side = Math.max(bw, bh) + pad * 2; // square output keeps tiles even
  const out = document.createElement("canvas");
  out.width = side; out.height = side;
  out.getContext("2d")!.drawImage(cv, x0, y0, bw, bh, Math.round((side - bw) / 2), Math.round((side - bh) / 2), bw, bh);

  const blob = await new Promise<Blob | null>((ok) => out.toBlob(ok, "image/png"));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".png", { type: "image/png" });
}
