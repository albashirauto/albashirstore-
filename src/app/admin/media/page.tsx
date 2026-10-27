"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Copy, FolderOpen, ImagePlus, Loader2, Search, Trash2, X } from "lucide-react";
import { browserClient } from "@/lib/supabase";
import { upload } from "@/components/admin/ImageField";
import StorageMeter from "@/components/admin/StorageMeter";

type F = { path: string; folder: string; name: string; url: string; size: number; at: string; type: string };
const BUCKET = "media";
const TABLES = ["products", "posts", "categories", "brands", "vehicles", "promotions", "banners", "pages", "testimonials", "awards", "offerings", "settings", "admins"];
const kb = (n: number) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Media library: every uploaded picture, by folder, with where it is used; upload, copy link, safe delete. */
export default function Media() {
  const db = browserClient();
  const [files, setFiles] = useState<F[]>([]);
  const [used, setUsed] = useState<Map<string, string[]>>(new Map());
  const [loaded, setLoaded] = useState(false);
  const [folder, setFolder] = useState("");
  const [q, setQ] = useState("");
  const [only, setOnly] = useState<"all" | "unused">("all");
  const [pick, setPick] = useState<F | null>(null);
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [msg, setMsg] = useState("");
  const [tick, setTick] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 2500); };

  const load = useCallback(async () => {
    const st = db.storage.from(BUCKET);
    const { data: top } = await st.list("", { limit: 1000 });
    const folders = (top ?? []).filter((x: { id: string | null }) => !x.id).map((x: { name: string }) => x.name);
    const lists = await Promise.all(["", ...folders].map(async (fo) => {
      const { data } = await st.list(fo, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
      return ((data ?? []) as { id: string | null; name: string; created_at: string; metadata?: { size?: number; mimetype?: string } }[])
        .filter((x) => x.id && x.name !== ".emptyFolderPlaceholder")
        .map((x) => { const path = fo ? `${fo}/${x.name}` : x.name; return { path, folder: fo || "(main)", name: x.name, url: st.getPublicUrl(path).data.publicUrl, size: x.metadata?.size ?? 0, at: x.created_at, type: x.metadata?.mimetype ?? "" }; });
    }));
    const all = lists.flat().sort((a, b) => b.at.localeCompare(a.at));
    setFiles(all);
    // where each file is used: search every content table for its path
    const rows = await Promise.all(TABLES.map(async (t) => ({ t, rows: ((await db.from(t).select("*").limit(5000)).data ?? []) as Record<string, unknown>[] })));
    const m = new Map<string, string[]>();
    for (const f of all) {
      const hits: string[] = [];
      for (const { t, rows: rs } of rows) for (const r of rs) if (JSON.stringify(r).includes(f.path)) hits.push(`${t}: ${String(r.name ?? r.title ?? r.key ?? r.id ?? "")}`.slice(0, 60));
      m.set(f.path, hits);
    }
    setUsed(m); setLoaded(true); setTick((t) => t + 1);
  }, [db]);
  useEffect(() => { load(); }, [load]);

  const folders = useMemo(() => [...new Set(files.map((f) => f.folder))].sort(), [files]);
  const shown = files.filter((f) => (!folder || f.folder === folder) && (!q || f.name.toLowerCase().includes(q.toLowerCase())) && (only === "all" || !(used.get(f.path)?.length)));
  const total = files.reduce((n, f) => n + f.size, 0), unusedFiles = files.filter((f) => !(used.get(f.path)?.length)), unused = unusedFiles.length;
  const unusedBytes = unusedFiles.reduce((n, f) => n + f.size, 0);

  const add = async (list: FileList | File[] | null) => {
    const imgs = Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return;
    setBusy(true);
    try { for (const f of imgs) await upload(f, folder && folder !== "(main)" ? folder : "library"); flash(`${imgs.length} uploaded`); }
    catch (e) { flash(`Upload failed: ${(e as Error).message}`); }
    setBusy(false); load();
  };
  const copy = async (u: string) => { try { await navigator.clipboard.writeText(u); flash("Link copied"); } catch {} };
  const remove = async (f: F) => {
    const where = used.get(f.path) ?? [];
    if (!confirm(where.length ? `This picture is still used in ${where.length} place(s):\n${where.slice(0, 5).join("\n")}\n\nDelete anyway? Those places will show a broken picture.` : `Delete ${f.name}?`)) return;
    const { error } = await db.storage.from(BUCKET).remove([f.path]);
    if (error) return flash(error.message);
    setPick(null); flash("Deleted"); load();
  };

  return (
    <div className="space-y-6" onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={(e) => { if (e.currentTarget === e.target) setDrag(false); }} onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold uppercase leading-none text-brand-900 dark:text-white md:text-5xl">Media library</h1>
          <p className="mt-1.5 text-muted">{files.length} pictures · {kb(total)} · {unused} not used anywhere. Drag pictures onto this page to upload.</p>
        </div>
        <button onClick={() => input.current?.click()} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-hot px-6 py-3 font-bold text-white shadow-lg shadow-hot/25 transition hover:-translate-y-0.5 hover:bg-hot-dark disabled:opacity-60">{busy ? <Loader2 size={18} className="animate-spin" /> : <ImagePlus size={18} />}Upload</button>
        <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
      </div>

      <StorageMeter refresh={tick}>
        {loaded && unused > 0 && (
          <button onClick={() => { setOnly("unused"); setFolder(""); }} className="mt-3 text-sm font-bold text-brand-600 hover:underline">
            Free up {kb(unusedBytes)}: show the {unused} picture{unused === 1 ? "" : "s"} not used anywhere
          </button>
        )}
      </StorageMeter>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setFolder("")} className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold transition ${!folder ? "bg-brand-900 text-white dark:bg-white dark:text-brand-900" : "bg-card text-muted ring-1 ring-line"}`}><FolderOpen size={14} />All</button>
        {folders.map((f) => <button key={f} onClick={() => setFolder(f)} className={`rounded-full px-3.5 py-1.5 text-sm font-bold capitalize transition ${folder === f ? "bg-brand-900 text-white dark:bg-white dark:text-brand-900" : "bg-card text-muted ring-1 ring-line"}`}>{f} <span className="text-xs opacity-70">({files.filter((x) => x.folder === f).length})</span></button>)}
        <span className="mx-1 h-6 w-px bg-line" />
        <button onClick={() => setOnly(only === "all" ? "unused" : "all")} className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition ${only === "unused" ? "bg-amber-400 text-amber-950" : "bg-card text-muted ring-1 ring-line"}`}>Not used ({unused})</button>
        <label className="relative ml-auto flex min-w-52 items-center"><Search size={15} className="pointer-events-none absolute left-3.5 text-muted" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search file names…" className="w-full rounded-full border border-line bg-card py-2 pl-10 pr-4 text-sm outline-none focus:border-brand-500" /></label>
      </div>

      {drag && <div className="pointer-events-none fixed inset-4 z-[60] grid place-items-center rounded-3xl border-4 border-dashed border-brand-500 bg-brand-500/10 text-2xl font-extrabold uppercase text-brand-700">Drop to upload</div>}

      {!loaded ? <p className="grid place-items-center py-16 text-muted"><Loader2 className="animate-spin" /></p> : !shown.length ? (
        <div className="rounded-2xl border border-dashed border-line py-16 text-center text-muted">{files.length ? "No pictures match." : "No pictures yet. Upload some, or add photos to products."}</div>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {shown.map((f) => {
            const n = used.get(f.path)?.length ?? 0;
            return (
              <li key={f.path}>
                <button onClick={() => setPick(f)} className="group block w-full overflow-hidden rounded-2xl border border-line bg-card text-left transition hover:-translate-y-0.5 hover:border-brand-500">
                  <span className="relative block aspect-square bg-soft">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={f.url} alt={f.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <span className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${n ? "bg-green-600 text-white" : "bg-amber-400 text-amber-950"}`}>{n ? `Used ${n}×` : "Not used"}</span>
                  </span>
                  <span className="block truncate px-2.5 pt-2 text-xs font-semibold">{f.name}</span>
                  <span className="block px-2.5 pb-2 text-[11px] text-muted">{f.folder} · {kb(f.size)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {pick && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-brand-900/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setPick(null)}>
          <div role="dialog" aria-label="Picture details" onClick={(e) => e.stopPropagation()} className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-bg shadow-2xl sm:rounded-3xl">
            <div className="grid md:grid-cols-[1.3fr_1fr]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pick.url} alt={pick.name} className="max-h-[60dvh] w-full bg-soft object-contain md:max-h-none md:rounded-l-3xl" />
              <div className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2"><p className="break-all font-bold">{pick.name}</p><button onClick={() => setPick(null)} aria-label="Close" className="rounded-full p-1.5 hover:bg-soft"><X size={18} /></button></div>
                <p className="text-sm text-muted">{pick.folder} · {kb(pick.size)} · {new Date(pick.at).toLocaleDateString("en-PK", { dateStyle: "medium" })}</p>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted">Used in</p>
                  {(used.get(pick.path) ?? []).length ? <ul className="mt-1 space-y-0.5 text-sm">{used.get(pick.path)!.map((u, i) => <li key={i} className="truncate">{u}</li>)}</ul> : <p className="mt-1 text-sm text-muted">Not used anywhere.</p>}
                </div>
                <button onClick={() => copy(pick.url)} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-2.5 text-sm font-bold text-white"><Copy size={15} />Copy link</button>
                <a href={pick.url} target="_blank" rel="noreferrer" className="block text-center text-sm font-bold text-brand-600 hover:underline">Open full size</a>
                <button onClick={() => remove(pick)} className="inline-flex w-full items-center justify-center gap-1.5 rounded-full py-2 text-sm font-bold text-hot hover:bg-hot/10"><Trash2 size={14} />Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {msg && <div role="status" className="fixed bottom-6 left-1/2 z-[80] flex -translate-x-1/2 items-center gap-2 rounded-full bg-green-600 px-5 py-3 font-bold text-white shadow-xl"><Check size={18} />{msg}</div>}
    </div>
  );
}
