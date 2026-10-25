"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Link2, Loader2, Star, Trash2, Youtube } from "lucide-react";
import { upload } from "@/components/admin/ImageField";
import { youtubeId } from "@/lib/video";
import type { P } from "../model";
import { Field, Section, input } from "../ui";


export default function Media({ p, set }: { p: P; set: (v: Partial<P>) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [link, setLink] = useState("");
  const [drag, setDrag] = useState<number | null>(null);
  const imgs = p.images;

  const addFiles = async (files: FileList | File[] | null) => {
    if (!files || !files.length) return;
    setBusy(true); setErr("");
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        if (!f.type.startsWith("image/")) continue;
        if (f.size > 5 * 1024 * 1024) { setErr(`${f.name} is over 5 MB. Please use a smaller photo.`); continue; }
        urls.push(await upload(f, "products"));
      }
      set({ images: [...imgs, ...urls] });
    } catch (e) { setErr((e as Error).message || "Upload failed"); }
    setBusy(false);
    if (ref.current) ref.current.value = "";
  };
  const move = (from: number, to: number) => {
    if (to < 0 || to >= imgs.length) return;
    const next = [...imgs]; const [x] = next.splice(from, 1); next.splice(to, 0, x);
    set({ images: next });
  };
  const yt = youtubeId(p.video_url);

  return (
    <Section id="media" title="Images & video" sub="First photo is the main one. Drag to reorder. JPG or PNG, up to 5 MB each.">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); if (drag === null) addFiles(e.dataTransfer.files); }}
        className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5"
      >
        {imgs.map((u, i) => (
          <div key={u} draggable onDragStart={() => setDrag(i)} onDragEnd={() => setDrag(null)}
            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (drag !== null) move(drag, i); setDrag(null); }}
            className={`group relative aspect-square cursor-grab overflow-hidden rounded-xl border-2 bg-soft transition ${i === 0 ? "border-brand-600" : "border-line"} ${drag === i ? "opacity-40" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt="" className="h-full w-full object-cover" />
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">Main</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
              <button type="button" title="Move left" onClick={() => move(i, i - 1)} className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-fg"><ArrowLeft size={13} /></button>
              {i > 0 && <button type="button" title="Make main photo" onClick={() => move(i, 0)} className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-amber-600"><Star size={13} /></button>}
              <button type="button" title="Move right" onClick={() => move(i, i + 1)} className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-fg"><ArrowRight size={13} /></button>
              <button type="button" title="Remove" onClick={() => set({ images: imgs.filter((x) => x !== u) })} className="grid h-7 w-7 place-items-center rounded-full bg-hot text-white"><Trash2 size={13} /></button>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => ref.current?.click()} disabled={busy}
          className="grid aspect-square place-items-center rounded-xl border-2 border-dashed border-line text-muted transition hover:border-brand-500 hover:bg-brand-50/50 hover:text-brand-600 dark:hover:bg-brand-900/30">
          {busy ? <Loader2 className="animate-spin" /> : <span className="grid place-items-center gap-1 px-2 text-center text-xs font-semibold"><ImagePlus size={24} />Upload or drop photos</span>}
        </button>
      </div>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
      {err && <p className="mt-2 text-sm font-semibold text-hot">{err}</p>}

      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Link2 size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="Or paste an image link (https://…)" className={`${input} pl-10`} />
        </div>
        <button type="button" disabled={!/^https?:\/\//.test(link)} onClick={() => { set({ images: [...imgs, link.trim()] }); setLink(""); }} className="rounded-xl border border-line px-4 text-sm font-bold transition hover:border-brand-500 disabled:opacity-40">Add</button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Product video (YouTube link)" help="Shows under the photos on the product page.">
          <div className="relative">
            <Youtube size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-hot" />
            <input value={p.video_url} onChange={(e) => set({ video_url: e.target.value })} placeholder="https://youtu.be/…" className={`${input} pl-10`} />
          </div>
          {p.video_url && !yt && <span className="mt-1 block text-xs font-semibold text-hot">That does not look like a YouTube link.</span>}
        </Field>
        {yt && (
          <div className="aspect-video overflow-hidden rounded-xl border border-line">
            <iframe title="Video preview" src={`https://www.youtube-nocookie.com/embed/${yt}`} className="h-full w-full" allowFullScreen />
          </div>
        )}
      </div>
    </Section>
  );
}
