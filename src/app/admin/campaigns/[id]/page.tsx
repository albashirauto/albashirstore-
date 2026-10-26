"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, RotateCcw, Search, X } from "lucide-react";
import ImageField from "@/components/admin/ImageField";
import CampaignView, { CampaignBadge } from "@/components/campaigns/CampaignView";
import { browserClient } from "@/lib/supabase";
import { money } from "@/lib/format";
import { FONTS, FONT_PRESETS, PRESETS, TEMPLATES, fullDesign, type Campaign, type Content, type Design, type Kind, type Rules } from "@/lib/campaigns";
import type { Product } from "@/lib/types";

const TABS = ["Template & Type", "Content", "Products & Prices", "Images", "Design", "Size & Text", "Typography", "Animation", "Mobile", "Show / Hide", "Countdown", "Schedule", "Discount code"] as const;
type Tab = (typeof TABS)[number];
const KINDS: { k: Kind; l: string; d: string }[] = [
  { k: "popup", l: "Popup", d: "Centered card over the page (bottom sheet on phones)" },
  { k: "topbar", l: "Top bar", d: "Slim announcement strip above the header" },
  { k: "hero", l: "Hero banner", d: "Wide banner on the home page, above the main banner" },
  { k: "badge", l: "Floating badge", d: "Small corner button that opens the offer" },
];
const ICON: Record<string, string> = { welcome: "👋", offer: "%", "1111": "11.11", "1212": "12.12", flash: "⚡", eid: "🌙", ramadan: "☪", delivery: "🚚", new: "✨", badge: "🏷", custom: "Aa" };
const DEVICES = [{ l: "Phone 360", w: 360 }, { l: "390", w: 390 }, { l: "430", w: 430 }, { l: "Tablet 768", w: 768 }, { l: "Desktop", w: 1280 }];
const input = "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";
const toLocal = (iso?: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);
const fresh = (): Campaign => {
  const t = TEMPLATES[0];
  return { id: "", name: "New campaign", kind: t.kind, template: t.key, status: "draft", priority: 10, starts_at: null, ends_at: null, content: { ...t.content }, design: { ...t.design }, rules: { pages: "all", frequency: "day", ...t.rules } };
};

function Field({ label, help, children, wide }: { label: string; help?: string; children: React.ReactNode; wide?: boolean }) {
  return <label className={`block text-sm font-semibold ${wide ? "sm:col-span-2" : ""}`}><span className="mb-1.5 block">{label}</span>{children}{help && <span className="mt-1 block text-xs font-normal text-muted">{help}</span>}</label>;
}
function Choice<T extends string>({ value, set, options }: { value: T; set: (v: T) => void; options: [T, string][] }) {
  return <div className="flex flex-wrap gap-1 rounded-xl bg-soft p-1">{options.map(([k, l]) => <button key={k} type="button" onClick={() => set(k)} className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-bold transition ${value === k ? "bg-card shadow-sm" : "text-muted hover:text-fg"}`}>{l}</button>)}</div>;
}

/** Campaign builder: live preview (devices, light / dark, replay) + settings tabs. */
export default function CampaignEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();
  const db = browserClient();
  const [c, setC] = useState<Campaign>(fresh);
  const [state, setState] = useState<"loading" | "ok" | "missing">(isNew ? "ok" : "loading");
  const [tab, setTab] = useState<Tab>("Template & Type");
  const [device, setDevice] = useState(1280);
  const [dark, setDark] = useState(false);
  const [replay, setReplay] = useState(0);
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<{ code: string; description: string | null }[]>([]);
  const [find, setFind] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const frameBox = useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(700);

  useEffect(() => {
    (async () => {
      const [{ data: ps }, { data: cs }] = await Promise.all([
        db.from("products").select("id,name,slug,sku,price,compare_price,images,active").eq("active", true).order("name"),
        db.from("coupons").select("code,description").eq("active", true).order("created_at", { ascending: false }),
      ]);
      setProducts((ps as Product[]) ?? []); setCoupons((cs as { code: string; description: string | null }[]) ?? []);
      if (isNew) return;
      const { data } = await db.from("campaigns").select("*").eq("id", id).maybeSingle();
      if (!data) return setState("missing");
      setC(data as Campaign); setState("ok");
    })();
  }, [db, id, isNew]);
  useEffect(() => {
    const el = frameBox.current; if (!el) return;
    const ro = new ResizeObserver(() => setBoxW(el.clientWidth)); ro.observe(el); setBoxW(el.clientWidth);
    return () => ro.disconnect();
  }, [state]);

  const setT = (v: Partial<Content>) => setC((x) => ({ ...x, content: { ...x.content, ...v } }));
  const setD = (v: Partial<Design>) => setC((x) => ({ ...x, design: { ...x.design, ...v } }));
  const setR = (v: Partial<Rules>) => setC((x) => ({ ...x, rules: { ...x.rules, ...v } }));
  const d = fullDesign(c.design ?? {});
  const t = c.content ?? {}, r = c.rules ?? {};
  const picked = (t.products ?? []).map((pid) => products.find((p) => p.id === pid)).filter((p): p is Product => !!p);
  const hits = useMemo(() => { const q = find.trim().toLowerCase(); return q ? products.filter((p) => `${p.name} ${p.sku ?? ""}`.toLowerCase().includes(q) && !(t.products ?? []).includes(p.id)).slice(0, 8) : []; }, [find, products, t.products]);

  const applyTemplate = (key: string) => {
    const tp = TEMPLATES.find((x) => x.key === key)!;
    if (c.content?.headline && c.template !== key && !confirm(`Use the “${tp.label}” template? Your text and design are replaced (schedule and name stay).`)) return;
    setC((x) => ({ ...x, template: tp.key, kind: tp.kind, content: { ...tp.content }, design: { ...tp.design }, rules: { ...x.rules, countdown_to: null, ...tp.rules }, name: x.name === "New campaign" || !x.name ? tp.label : x.name }));
    setReplay((n) => n + 1);
  };

  const save = async (status?: Campaign["status"]) => {
    setErr("");
    if (!c.name.trim()) return setErr("Give the campaign a name.");
    if (!t.headline?.trim()) { setTab("Content"); return setErr("Add a headline."); }
    if (c.starts_at && c.ends_at && c.ends_at <= c.starts_at) { setTab("Schedule"); return setErr("The end is before the start."); }
    setBusy(status ?? "save");
    const row = { name: c.name.trim(), kind: c.kind, template: c.template, status: status ?? c.status, priority: c.priority, starts_at: c.starts_at, ends_at: c.ends_at, content: c.content, design: c.design, rules: c.rules, updated_at: new Date().toISOString() };
    const res = isNew ? await db.from("campaigns").insert(row).select("id").single() : await db.from("campaigns").update(row).eq("id", id).select("id").single();
    setBusy("");
    if (res.error) return setErr(res.error.message);
    router.push(`/admin/campaigns?saved=${status === "active" ? "published" : "saved"}`);
  };
  /** Save (keeping the status) and open the real store with this campaign showing, even as a draft (only for admins). */
  const previewOnStore = async () => {
    setErr("");
    if (!t.headline?.trim()) { setTab("Content"); return setErr("Add a headline first."); }
    const win = window.open("about:blank", "_blank"); // opened now, so the browser does not block it
    setBusy("preview");
    const row = { name: c.name.trim() || "Untitled", kind: c.kind, template: c.template, status: c.status, priority: c.priority, starts_at: c.starts_at, ends_at: c.ends_at, content: c.content, design: c.design, rules: c.rules, updated_at: new Date().toISOString() };
    const res = isNew ? await db.from("campaigns").insert(row).select("id").single() : await db.from("campaigns").update(row).eq("id", id).select("id").single();
    setBusy("");
    if (res.error) { win?.close(); return setErr(res.error.message); }
    const cid = (res.data as { id: string }).id;
    const page = c.kind === "hero" ? "/" : c.rules?.pages === "products" ? "/shop" : "/";
    if (win) win.location.href = `${page}?campaign_preview=${cid}`;
    if (isNew) router.replace(`/admin/campaigns/${cid}`);
  };
  const duplicate = async () => {
    const { id: _i, views: _v, clicks: _c, closes: _x, created_at: _a, updated_at: _u, ...rest } = c;
    void _i; void _v; void _c; void _x; void _a; void _u;
    const { data } = await db.from("campaigns").insert({ ...rest, name: `${c.name} (copy)`, status: "draft" }).select("id").single();
    if (data) router.push(`/admin/campaigns/${(data as { id: string }).id}`);
  };

  if (state === "loading") return <p className="grid place-items-center p-16 text-muted"><Loader2 className="animate-spin" /></p>;
  if (state === "missing") return <div className="p-10 text-center"><p className="font-bold">Campaign not found.</p><Link href="/admin/campaigns" className="mt-3 inline-block font-bold text-brand-600">← Campaigns</Link></div>;

  const scale = Math.min(1, boxW / device);
  const mobile = device < 768;
  const frameH = c.kind === "topbar" ? 260 : mobile ? 720 : 760;
  const status = c.status === "active" ? (c.ends_at && new Date(c.ends_at) < new Date() ? "Expired" : c.starts_at && new Date(c.starts_at) > new Date() ? "Scheduled" : "Active") : c.status === "paused" ? "Paused" : "Draft";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <Link href="/admin/campaigns" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted transition hover:text-brand-600"><ArrowLeft size={16} />Campaigns</Link>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} aria-label="Campaign name" className="min-w-0 max-w-full bg-transparent text-3xl font-extrabold outline-none md:text-4xl" style={{ fieldSizing: "content" } as React.CSSProperties} />
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${status === "Active" ? "bg-green-100 text-green-800" : status === "Draft" ? "bg-soft text-muted" : "bg-amber-100 text-amber-800"}`}>{status}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={!!busy} onClick={previewOnStore} className="rounded-full border-2 border-brand-600 px-4 py-2.5 text-sm font-bold text-brand-600 transition hover:bg-brand-600 hover:text-white disabled:opacity-60">{busy === "preview" ? "Opening…" : "Preview on store ↗"}</button>
          {!isNew && <button type="button" onClick={duplicate} className="rounded-full border border-line px-4 py-2.5 text-sm font-bold transition hover:border-brand-500">Duplicate</button>}
          <button type="button" disabled={!!busy} onClick={() => save(c.status === "active" ? "active" : "draft")} className="rounded-full border border-line px-4 py-2.5 text-sm font-bold transition hover:border-brand-500 disabled:opacity-60">{busy === "save" || busy === "draft" ? "Saving…" : c.status === "active" ? "Save" : "Save draft"}</button>
          <button type="button" disabled={!!busy} onClick={() => save("active")} className="rounded-full bg-gradient-to-r from-brand-600 to-purple-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 disabled:opacity-60">{busy === "active" ? "Publishing…" : c.status === "active" ? "Update live" : "Publish"}</button>
        </div>
      </div>
      {err && <p role="alert" className="rounded-xl bg-hot/10 px-4 py-2.5 text-sm font-semibold text-hot">{err}</p>}

      <div className="grid items-start gap-5 xl:grid-cols-[1.35fr_1fr]">
        {/* ---------------- preview */}
        <div className="min-w-0 rounded-3xl border border-line bg-card p-4 xl:sticky xl:top-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-0.5 rounded-xl border border-line p-1">{DEVICES.map((x) => <button key={x.w} type="button" onClick={() => { setDevice(x.w); setReplay((n) => n + 1); }} className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${device === x.w ? "bg-brand-600 text-white" : "text-muted hover:text-fg"}`}>{x.l}</button>)}</div>
            <div className="flex gap-0.5 rounded-xl border border-line p-1">{[["Light", false], ["Dark", true]].map(([l, v]) => <button key={l as string} type="button" onClick={() => setDark(v as boolean)} className={`rounded-lg px-2.5 py-1 text-xs font-bold ${dark === v ? "bg-brand-600 text-white" : "text-muted"}`}>{l as string}</button>)}</div>
            <button type="button" onClick={() => setReplay((n) => n + 1)} className="inline-flex items-center gap-1 rounded-xl border border-line px-3 py-1.5 text-xs font-bold"><RotateCcw size={13} />Replay animation</button>
          </div>
          <div ref={frameBox} className="mt-3 overflow-hidden rounded-2xl border border-line" style={{ height: frameH * scale }}>
            <div className="relative origin-top-left overflow-hidden" style={{ width: device, height: frameH, marginLeft: Math.max(0, (boxW - device * scale) / 2), transform: `scale(${scale})`, background: dark ? "#0b1220" : "#f6f8fc" }}
              onClickCapture={(e) => { if ((e.target as HTMLElement).closest("a")) e.preventDefault(); }}>
              {/* a pretend store page behind the campaign */}
              {c.kind === "topbar" && <CampaignView key={`tb${replay}`} c={c} products={picked} frame mobile={mobile} onClose={() => {}} />}
              <div className="flex items-center justify-between px-5 py-4" style={{ background: dark ? "#111a2e" : "#fff", borderBottom: `1px solid ${dark ? "#1f2a44" : "#e5e9f2"}` }}>
                <span className="font-display text-xl font-extrabold" style={{ color: dark ? "#fff" : "#0a1f66" }}>AL BASHIR <span className="text-hot">AUTOS</span></span>
                <span className="h-8 w-40 rounded-full" style={{ background: dark ? "#1f2a44" : "#eef1f7" }} />
              </div>
              {c.kind === "hero" && <CampaignView key={`h${replay}`} c={c} products={picked} frame mobile={mobile} onClose={() => {}} />}
              <div className="grid gap-3 p-5" style={{ gridTemplateColumns: `repeat(${mobile ? 2 : 4}, 1fr)` }}>
                {Array.from({ length: mobile ? 4 : 8 }, (_, i) => <div key={i} className="aspect-[3/4] rounded-xl" style={{ background: dark ? "#16213a" : "#ffffff", border: `1px solid ${dark ? "#1f2a44" : "#e5e9f2"}` }} />)}
              </div>
              {c.kind === "popup" && <CampaignView key={`p${replay}`} c={c} products={picked} frame mobile={mobile} onClose={() => {}} />}
              {c.kind === "badge" && <CampaignBadge key={`b${replay}`} c={c} products={picked} frame />}
            </div>
          </div>
          <p className="mt-2 text-xs text-muted">Preview at {device}px{scale < 1 ? ` (shown at ${Math.round(scale * 100)}%)` : ""}, {dark ? "dark" : "light"} page. {c.kind === "popup" && mobile ? (r.mobile === "sheet" ? "On phones it opens as a bottom sheet you can swipe down to close." : "On phones and tablets it opens in the middle of the screen.") : c.kind === "badge" ? "Tap the badge to open the offer." : ""}</p>
        </div>

        {/* ---------------- settings */}
        <div className="min-w-0 rounded-3xl border border-line bg-card">
          <div className="flex flex-wrap gap-1 border-b border-line p-2">
            {TABS.map((x) => <button key={x} type="button" onClick={() => setTab(x)} className={`shrink-0 rounded-xl px-3 py-2 text-sm font-bold transition ${tab === x ? "bg-brand-600 text-white" : "text-muted hover:bg-soft hover:text-fg"}`}>{x}</button>)}
          </div>
          <div className="space-y-5 p-5">
            {tab === "Template & Type" && (<>
              <div>
                <p className="font-bold">Display type</p><p className="text-sm text-muted">Where and how the campaign appears on the store.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">{KINDS.map((k) => <button key={k.k} type="button" onClick={() => { setC({ ...c, kind: k.k }); setReplay((n) => n + 1); }} className={`rounded-2xl border-2 p-3 text-left transition ${c.kind === k.k ? "border-brand-600 bg-brand-50 dark:bg-brand-900" : "border-line hover:border-brand-500/50"}`}><b>{k.l}</b><span className="block text-xs text-muted">{k.d}</span></button>)}</div>
              </div>
              <div>
                <p className="font-bold">Template</p><p className="text-sm text-muted">Pick a starting design. You can change every part afterwards.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {TEMPLATES.map((tp) => { const dd = fullDesign(tp.design); return (
                    <button key={tp.key} type="button" onClick={() => applyTemplate(tp.key)} className={`flex items-center gap-3 rounded-2xl border-2 p-2.5 text-left transition ${c.template === tp.key ? "border-brand-600" : "border-line hover:border-brand-500/50"}`}>
                      <span className="grid h-12 w-14 shrink-0 place-items-center rounded-xl text-sm font-extrabold" style={{ background: `linear-gradient(135deg, ${dd.bg}, ${dd.bg2})`, color: dd.text }}>{ICON[tp.key] ?? "Aa"}</span>
                      <span className="min-w-0"><b className="block truncate">{tp.label}</b><span className="text-xs text-muted">{tp.group} · {KINDS.find((k) => k.k === tp.kind)?.l}</span></span>
                    </button>
                  ); })}
                </div>
              </div>
            </>)}

            {tab === "Content" && (<div className="grid gap-4 sm:grid-cols-2">
              <Field label="Badge" help="Small label on top, e.g. 11.11, LIMITED, عید مبارک"><input value={t.badge ?? ""} onChange={(e) => setT({ badge: e.target.value })} className={input} /></Field>
              <Field label="Headline *"><input value={t.headline ?? ""} onChange={(e) => setT({ headline: e.target.value })} className={input} dir="auto" /></Field>
              <Field label="Sub-headline" wide><textarea rows={2} value={t.sub ?? ""} onChange={(e) => setT({ sub: e.target.value })} className={`${input} resize-y`} dir="auto" /></Field>
              <Field label="Button text"><input value={t.button ?? ""} onChange={(e) => setT({ button: e.target.value })} className={input} dir="auto" /></Field>
              <Field label="Button link" help="/shop, /shop?sale=1, /collections/chain-kits…"><input value={t.link ?? ""} onChange={(e) => setT({ link: e.target.value })} className={input} /></Field>
              <Field label="Second button (optional)"><input value={t.button2 ?? ""} onChange={(e) => setT({ button2: e.target.value })} className={input} dir="auto" /></Field>
              <Field label="Second button link"><input value={t.link2 ?? ""} onChange={(e) => setT({ link2: e.target.value })} className={input} /></Field>
              <Field label="Small print (optional)" wide><input value={t.note ?? ""} onChange={(e) => setT({ note: e.target.value })} placeholder="e.g. While stock lasts. Not valid with other offers." className={input} dir="auto" /></Field>
              <p className="text-xs text-muted sm:col-span-2">Write in English or Urdu: Urdu text automatically uses the Urdu font and right-to-left.</p>
            </div>)}

            {tab === "Products & Prices" && (<div>
              <p className="text-sm text-muted">Show up to 4 products with their live price inside the popup or banner.</p>
              <div className="relative mt-3"><Search size={16} className="pointer-events-none absolute left-3.5 top-3 text-muted" /><input value={find} onChange={(e) => setFind(e.target.value)} disabled={(t.products ?? []).length >= 4} placeholder={(t.products ?? []).length >= 4 ? "4 products chosen" : "Search product name or SKU"} className={`${input} pl-10`} />
                {hits.length > 0 && <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-line bg-card shadow-xl">{hits.map((p) => <li key={p.id}><button type="button" onClick={() => { setT({ products: [...(t.products ?? []), p.id] }); setFind(""); }} className="flex w-full justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-soft"><span className="truncate font-semibold">{p.name}</span><span>{money(p.price)}</span></button></li>)}</ul>}
              </div>
              <ul className="mt-3 grid gap-2">{picked.map((p) => <li key={p.id} className="flex items-center gap-3 rounded-xl border border-line p-2">{/* eslint-disable-next-line @next/next/no-img-element */}{p.images?.[0] ? <img src={p.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="h-10 w-10 rounded-lg bg-soft" />}<span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.name}</span><span className="text-sm">{money(p.price)}</span><button type="button" onClick={() => setT({ products: (t.products ?? []).filter((x) => x !== p.id) })} aria-label="Remove" className="rounded-full p-1.5 text-muted hover:text-hot"><X size={15} /></button></li>)}</ul>
            </div>)}

            {tab === "Images" && (<div className="grid gap-5">
              <Field label="Picture" help="Shown on top of the popup, or beside the text in a hero banner."><ImageField value={t.image || null} onChange={(v) => setT({ image: (v as string) ?? "" })} folder="campaigns" /></Field>
              <Field label="Background picture" help="Behind everything, tinted with the theme colours so the text stays readable."><ImageField value={t.bg_image || null} onChange={(v) => setT({ bg_image: (v as string) ?? "" })} folder="campaigns" /></Field>
              {c.kind === "hero" && <Field label="Picture side"><Choice value={d.imageSide} set={(v) => setD({ imageSide: v })} options={[["left", "Left"], ["right", "Right"]]} /></Field>}
            </div>)}

            {tab === "Design" && (<div className="space-y-5">
              <div><p className="mb-2 text-sm font-semibold">Colour theme</p><div className="grid grid-cols-2 gap-2 sm:grid-cols-3">{Object.entries(PRESETS).map(([k, p]) => <button key={k} type="button" onClick={() => setD({ preset: k, bg: undefined, bg2: undefined, text: undefined, accent: undefined, button: undefined, buttonText: undefined, pattern: undefined })} className={`overflow-hidden rounded-xl border-2 text-left transition ${(c.design.preset ?? "brand") === k ? "border-brand-600" : "border-line hover:border-brand-500/50"}`}><span className="block h-10" style={{ background: `linear-gradient(135deg, ${p.d.bg}, ${p.d.bg2})` }} /><span className="block px-2 py-1 text-xs font-bold">{p.label}</span></button>)}</div></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {([["bg", "Background"], ["bg2", "Background 2 (gradient)"], ["text", "Text"], ["accent", "Accent / badge"], ["button", "Button"], ["buttonText", "Button text"]] as const).map(([k, l]) => (
                  <label key={k} className="text-xs font-semibold"><span className="mb-1 block">{l}</span><span className="flex items-center gap-2 rounded-xl border border-line p-1.5"><input type="color" value={d[k] as string} onChange={(e) => setD({ [k]: e.target.value })} className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent" /><span className="font-mono text-[11px] text-muted">{d[k]}</span></span></label>
                ))}
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">Effects <span className="font-normal text-muted">(mix as you like)</span></p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {([["ring", "Glowing animated border"], ["blobs", "Soft floating lights"], ["stars", "Twinkling sparkles"], ["logo", "Store logo on top"], ["stagger", "Lines appear one by one"], ["shine", "Shine across the button"]] as const).map(([k, l]) => (
                    <label key={k} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-2 p-2.5 text-sm font-semibold transition ${d.fx?.[k] ? "border-brand-600 bg-brand-50 dark:bg-brand-900" : "border-line"}`}>
                      <input type="checkbox" checked={!!d.fx?.[k]} onChange={(e) => { setD({ fx: { ...(c.design.fx ?? {}), [k]: e.target.checked } }); setReplay((n) => n + 1); }} className="h-4 w-4 accent-brand-600" />{l}
                    </label>
                  ))}
                </div>
              </div>
              <Field label="Pattern"><Choice value={d.pattern} set={(v) => setD({ pattern: v })} options={[["none", "None"], ["dots", "Dots"], ["sparkles", "Sparkles"], ["grid", "Grid"], ["stripes", "Stripes"]]} /></Field>
              <Field label={`Corners: ${d.radius}px`}><input type="range" min={0} max={40} value={d.radius} onChange={(e) => setD({ radius: Number(e.target.value) })} className="w-full accent-brand-600" /></Field>
              {(c.kind === "popup") && <Field label={`Page dimming behind the popup: ${d.overlay}%`}><input type="range" min={0} max={90} value={d.overlay} onChange={(e) => setD({ overlay: Number(e.target.value) })} className="w-full accent-brand-600" /></Field>}
            </div>)}

            {tab === "Size & Text" && (<div className="grid gap-4">
              <Field label="Size"><Choice value={d.size} set={(v) => setD({ size: v })} options={[["sm", "Small"], ["md", "Medium"], ["lg", "Large"]]} /></Field>
              <Field label="Text alignment"><Choice value={d.align} set={(v) => setD({ align: v })} options={[["center", "Centre"], ["left", "Left"]]} /></Field>
              <Field label={`Headline size: ${d.headSize || "automatic"}`} help="0 = automatic for the size"><input type="range" min={0} max={72} value={d.headSize ?? 0} onChange={(e) => setD({ headSize: Number(e.target.value) || undefined })} className="w-full accent-brand-600" /></Field>
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={!!d.uppercase} onChange={(e) => setD({ uppercase: e.target.checked })} className="h-4 w-4 accent-brand-600" />Headline in CAPITALS (English only)</label>
            </div>)}

            {tab === "Typography" && (<div className="space-y-5">
              <div><p className="font-bold">Presets</p><p className="text-sm text-muted">One click sets fonts for every element.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">{Object.entries(FONT_PRESETS).map(([k, f]) => <button key={k} type="button" onClick={() => setD({ fonts: k, headFont: undefined, bodyFont: undefined, urduFont: undefined, uppercase: undefined })} className={`rounded-2xl border-2 p-3 text-left transition ${(c.design.fonts ?? "store") === k ? "border-brand-600" : "border-line hover:border-brand-500/50"}`}><b>{f.label}</b><span className="block text-xs text-muted">{f.d}</span></button>)}</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Headline font"><select value={d.headFont} onChange={(e) => setD({ headFont: e.target.value })} className={input}>{FONTS.english.map((f) => <option key={f}>{f}</option>)}</select></Field>
                <Field label="Text font"><select value={d.bodyFont} onChange={(e) => setD({ bodyFont: e.target.value })} className={input}>{FONTS.english.map((f) => <option key={f}>{f}</option>)}</select></Field>
                <Field label="Urdu font"><select value={d.urduFont} onChange={(e) => setD({ urduFont: e.target.value })} className={input}>{FONTS.urdu.map((f) => <option key={f}>{f}</option>)}</select></Field>
              </div>
              <p className="text-xs text-muted">Urdu text never gets letter spacing or capitals (they break the joined letters).</p>
            </div>)}

            {tab === "Animation" && (<div className="space-y-3">
              <Choice value={d.animation} set={(v) => { setD({ animation: v }); setReplay((n) => n + 1); }} options={[["zoom", "Zoom"], ["fade", "Fade"], ["slide", "Slide up"], ["bounce", "Bounce"], ["none", "None"]]} />
              <button type="button" onClick={() => setReplay((n) => n + 1)} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm font-bold"><RotateCcw size={14} />Replay</button>
            </div>)}

            {tab === "Mobile" && (<div className="grid gap-4">
              {c.kind === "popup" && <Field label="On phones show the popup as" help="Middle of the screen = like on a computer. A bottom sheet slides up and can be swiped down."><Choice value={r.mobile ?? "center"} set={(v) => setR({ mobile: v })} options={[["center", "Middle of the screen"], ["sheet", "Bottom sheet"]]} /></Field>}
              <Field label="Show on"><Choice value={r.devices ?? "all"} set={(v) => setR({ devices: v })} options={[["all", "Phones + computers"], ["mobile", "Phones only"], ["desktop", "Computers only"]]} /></Field>
              <button type="button" onClick={() => { setDevice(390); setReplay((n) => n + 1); }} className="w-fit rounded-full border border-line px-4 py-2 text-sm font-bold">Preview on a phone</button>
            </div>)}

            {tab === "Show / Hide" && (<div className="grid gap-4 sm:grid-cols-2">
              <Field label="Pages" wide><Choice value={r.pages ?? "all"} set={(v) => setR({ pages: v })} options={[["all", "All pages"], ["home", "Home"], ["shop", "Shop & categories"], ["products", "Product pages"], ["custom", "Custom"]]} /></Field>
              {r.pages === "custom" && <Field label="Page addresses" help="One per line. End with * for a whole section, e.g. /collections/*" wide><textarea rows={3} value={r.paths ?? ""} onChange={(e) => setR({ paths: e.target.value })} className={`${input} font-mono`} /></Field>}
              {(c.kind === "popup") && <>
                <Field label="Open"><select value={r.trigger ?? "delay"} onChange={(e) => setR({ trigger: e.target.value as Rules["trigger"] })} className={input}><option value="load">As soon as the page opens</option><option value="delay">After a few seconds</option><option value="scroll">After scrolling down</option><option value="exit">When leaving the page (exit intent)</option></select></Field>
                {r.trigger === "scroll" ? <Field label={`After scrolling ${r.scroll ?? 40}%`}><input type="range" min={10} max={90} value={r.scroll ?? 40} onChange={(e) => setR({ scroll: Number(e.target.value) })} className="w-full accent-brand-600" /></Field>
                  : (r.trigger ?? "delay") === "delay" && <Field label="Seconds to wait"><input type="number" min={0} max={120} value={r.delay ?? 3} onChange={(e) => setR({ delay: Number(e.target.value) })} className={input} /></Field>}
              </>}
              <Field label="How often per visitor"><select value={r.frequency ?? "day"} onChange={(e) => setR({ frequency: e.target.value as Rules["frequency"] })} className={input}><option value="always">Every page view</option><option value="session">Once per visit</option><option value="day">Once a day</option><option value="once">Only once, ever</option></select></Field>
              <Field label="Who sees it"><select value={r.audience ?? "all"} onChange={(e) => setR({ audience: e.target.value as Rules["audience"] })} className={input}><option value="all">Everyone</option><option value="new">New visitors (first visit)</option><option value="returning">Returning visitors</option></select></Field>
              {c.kind === "badge" && <Field label="Corner"><Choice value={r.badge_corner ?? "left"} set={(v) => setR({ badge_corner: v })} options={[["left", "Bottom left"], ["right", "Bottom right"]]} /></Field>}
              <p className="text-xs text-muted sm:col-span-2">Popups and badges never show on the cart or checkout, so they never interrupt an order.</p>
            </div>)}

            {tab === "Countdown" && (<div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={!!r.countdown_to} onChange={(e) => setR({ countdown_to: e.target.checked ? (c.ends_at ?? new Date(Date.now() + 86400000).toISOString()) : null })} className="h-4 w-4 accent-brand-600" />Show a countdown timer</label>
              {r.countdown_to && <>
                <Field label="Counts down to"><input type="datetime-local" value={toLocal(r.countdown_to)} onChange={(e) => setR({ countdown_to: fromLocal(e.target.value) })} className={input} /></Field>
                <div className="flex flex-wrap gap-2">{[["+1 hour", 1], ["+6 hours", 6], ["+24 hours", 24], ["+3 days", 72]].map(([l, h]) => <button key={l} type="button" onClick={() => setR({ countdown_to: new Date(Date.now() + (h as number) * 3600000).toISOString() })} className="rounded-full border border-line px-3 py-1.5 text-xs font-bold">{l}</button>)}{c.ends_at && <button type="button" onClick={() => setR({ countdown_to: c.ends_at })} className="rounded-full border border-line px-3 py-1.5 text-xs font-bold">Until the campaign ends</button>}</div>
                <p className="text-xs text-muted">The timer hides itself when it reaches zero. Use a real end time: fake timers lose customers&apos; trust.</p>
              </>}
            </div>)}

            {tab === "Schedule" && (<div className="grid gap-4 sm:grid-cols-2">
              <Field label="Starts" help="Empty = as soon as it is published"><input type="datetime-local" value={toLocal(c.starts_at)} onChange={(e) => setC({ ...c, starts_at: fromLocal(e.target.value) })} className={input} /></Field>
              <Field label="Ends" help="Empty = until you switch it off"><input type="datetime-local" value={toLocal(c.ends_at)} onChange={(e) => setC({ ...c, ends_at: fromLocal(e.target.value) })} className={input} /></Field>
              <Field label="Priority" help="Higher wins when several popups / bars could show." wide><input type="number" value={c.priority} onChange={(e) => setC({ ...c, priority: Number(e.target.value) || 0 })} className={input} /></Field>
            </div>)}

            {tab === "Discount code" && (<div className="space-y-3">
              <p className="text-sm text-muted">Show a code customers can copy. The button also applies it at checkout automatically.</p>
              <Field label="Coupon code"><input value={t.code ?? ""} onChange={(e) => setT({ code: e.target.value.toUpperCase().replace(/\s+/g, "") })} placeholder="e.g. EID10" className={`${input} font-mono uppercase`} /></Field>
              {coupons.length > 0 && <div className="flex flex-wrap gap-2">{coupons.map((x) => <button key={x.code} type="button" onClick={() => setT({ code: x.code })} title={x.description ?? ""} className={`rounded-full border px-3 py-1.5 font-mono text-xs font-bold transition ${t.code === x.code ? "border-brand-600 bg-brand-600 text-white" : "border-line hover:border-brand-500"}`}>{x.code}</button>)}</div>}
              {t.code && !coupons.some((x) => x.code === t.code) && <p className="text-xs font-semibold text-amber-700">This code is not an active coupon. Create it in Admin → Coupons, or customers will see “not valid”.</p>}
              <Link href="/admin/coupons/new" target="_blank" className="inline-block text-sm font-bold text-brand-600">+ Create a coupon</Link>
            </div>)}
          </div>
        </div>
      </div>
    </div>
  );
}
