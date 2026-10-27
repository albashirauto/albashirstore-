import { browserClient } from "@/lib/supabase";

export type StorageInfo = { bytes: number; files: number; limit: number; warnPct: number; maxUpload: number; maxPx: number };

const MB = 1048576;
const num = (v: string | undefined, d: number) => { const n = Number(v); return v && Number.isFinite(n) && n > 0 ? n : d; };
export const size = (n: number) => (n >= 1073741824 ? `${(n / 1073741824).toFixed(2)} GB` : n >= MB ? `${(n / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Space used (all buckets) and the limits from Settings. */
export async function storageInfo(): Promise<StorageInfo> {
  const db = browserClient();
  const [{ data: use }, { data: rows }] = await Promise.all([
    db.rpc("storage_usage"),
    db.from("settings").select("key,value").in("key", ["storage_limit_mb", "storage_warn_pct", "upload_max_mb", "image_max_px"]),
  ]);
  const s = Object.fromEntries(((rows ?? []) as { key: string; value: string }[]).map((r) => [r.key, r.value]));
  const u = (use ?? {}) as { bytes?: number; files?: number };
  return {
    bytes: Number(u.bytes ?? 0), files: Number(u.files ?? 0),
    limit: num(s.storage_limit_mb, 1024) * MB, warnPct: num(s.storage_warn_pct, 80),
    maxUpload: num(s.upload_max_mb, 1) * MB, maxPx: num(s.image_max_px, 1600),
  };
}

const load = (file: File) => new Promise<HTMLImageElement>((ok, no) => {
  const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => { URL.revokeObjectURL(url); ok(img); };
  img.onerror = () => { URL.revokeObjectURL(url); no(new Error("Can't read this picture")); };
  img.src = url;
});

/**
 * Shrink a picture to fit `maxPx` and `maxBytes` (WebP, keeps transparency).
 * SVG, GIF and icons are left as they are; the original is kept when it is already smaller.
 */
export async function compress(file: File, maxPx: number, maxBytes: number): Promise<File> {
  if (!/^image\/(jpeg|png|webp|bmp|avif)$/.test(file.type)) return file;
  const img = await load(file);
  let scale = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
  if (scale === 1 && file.size <= maxBytes && file.type === "image/webp") return file;
  const canvas = document.createElement("canvas"), ctx = canvas.getContext("2d")!;
  let best: Blob | null = null;
  for (let round = 0; round < 4; round++) {
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    for (const q of [0.86, 0.76, 0.64, 0.5]) {
      const b = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/webp", q));
      if (!b) return file;
      best = b;
      if (b.size <= maxBytes) break;
    }
    if (best && best.size <= maxBytes) break;
    scale *= 0.75;
  }
  if (!best || (best.size >= file.size && scale === 1 && file.size <= maxBytes)) return file;
  return new File([best], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
}
