"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { browserClient } from "@/lib/supabase";
import { cutout as clean } from "@/lib/cutout";
import { compress, size, storageInfo } from "@/lib/storage";

/** Compresses the picture to the Settings limits, refuses it when storage is full, then uploads. */
export async function upload(original: File, folder: string): Promise<string> {
  const db = browserClient();
  const info = await storageInfo();
  const file = await compress(original, info.maxPx, info.maxUpload).catch(() => original);
  if (info.bytes + file.size > info.limit) throw new Error(`Storage is full: ${size(info.bytes)} of ${size(info.limit)} used. Delete unused pictures in Media, or raise the limit in Settings > Storage.`);
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await db.storage.from("media").upload(path, file, { cacheControl: "31536000", upsert: false });
  if (error) throw error;
  return db.storage.from("media").getPublicUrl(path).data.publicUrl;
}

/** `cutout`: offer (on by default) to remove a plain background and trim empty edges before upload. */
export default function ImageField({ value, onChange, folder, multiple = false, cutout = false }: { value: string | string[] | null | undefined; onChange: (v: string | string[] | null) => void; folder: string; multiple?: boolean; cutout?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [doClean, setDoClean] = useState(true);
  const list = multiple ? ((value as string[]) ?? []) : value ? [value as string] : [];

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setErr("");
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) urls.push(await upload(cutout && doClean ? await clean(f).catch(() => f) : f, folder));
      onChange(multiple ? [...list, ...urls] : urls[0]);
    } catch (e) {
      setErr((e as Error).message || "Upload failed");
    }
    setBusy(false);
    if (ref.current) ref.current.value = "";
  };

  const remove = (u: string) => onChange(multiple ? list.filter((x) => x !== u) : null);
  const makeMain = (u: string) => onChange([u, ...list.filter((x) => x !== u)]);

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {list.map((u, i) => (
          <div key={u} className={`group relative overflow-hidden rounded-xl border border-line ${cutout ? "h-32 w-32 bg-[repeating-conic-gradient(#e5e7eb_0_25%,#fff_0_50%)] bg-[length:16px_16px]" : "h-24 w-24"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className={`h-full w-full ${cutout ? "object-contain p-1" : "object-cover"}`} />
            <button type="button" onClick={() => remove(u)} aria-label="Remove image" className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-hot text-white"><X size={14} /></button>
            {multiple && i > 0 && <button type="button" onClick={() => makeMain(u)} className="absolute inset-x-0 bottom-0 bg-black/60 py-0.5 text-[11px] font-semibold text-white opacity-0 transition group-hover:opacity-100">Make main</button>}
            {multiple && i === 0 && <span className="absolute inset-x-0 bottom-0 bg-brand-600 py-0.5 text-center text-[11px] font-semibold text-white">Main</span>}
          </div>
        ))}
        {(multiple || list.length === 0) && (
          <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="grid h-24 w-24 place-items-center rounded-xl border-2 border-dashed border-line text-muted transition hover:border-brand-500 hover:text-brand-600">
            {busy ? <Loader2 className="animate-spin" /> : <span className="grid place-items-center gap-1 text-xs font-semibold"><ImagePlus size={22} />Upload</span>}
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple={multiple} className="hidden" onChange={(e) => pick(e.target.files)} />
      {cutout && (
        <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={doClean} onChange={(e) => setDoClean(e.target.checked)} className="h-4 w-4 accent-brand-600" />
          Remove plain background & trim empty edges on upload
        </label>
      )}
      {busy && cutout && doClean && <p className="mt-1 text-xs text-muted">Cleaning the picture…</p>}
      {err && <p className="mt-2 text-sm font-semibold text-hot">{err}</p>}
    </div>
  );
}
