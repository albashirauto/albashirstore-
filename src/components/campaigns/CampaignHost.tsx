"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { pageMatches, type Campaign } from "@/lib/campaigns";
import { browserClient } from "@/lib/supabase";
import type { Product } from "@/lib/types";
import CampaignView, { CampaignBadge } from "./CampaignView";

type Ctx = { campaigns: Campaign[]; products: Product[]; track: (id: string, kind: "view" | "click" | "close") => void; preview: string | null };
const C = createContext<Ctx>({ campaigns: [], products: [], track: () => {}, preview: null });

const store = (k: string, v?: string) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch {} return null; };
const sess = (k: string, v?: string) => { try { if (v === undefined) return sessionStorage.getItem(k); sessionStorage.setItem(k, v); } catch {} return null; };
/** Has this visitor already had this campaign as often as it may show? */
function seenEnough(c: Campaign) {
  const f = c.rules?.frequency ?? "day", k = `aba-camp-${c.id}`;
  if (f === "always") return false;
  if (f === "session") return !!sess(k);
  const at = Number(store(k) || 0);
  return f === "once" ? at > 0 : Date.now() - at < 86400000;
}
const markSeen = (c: Campaign) => { const k = `aba-camp-${c.id}`; sess(k, "1"); store(k, String(Date.now())); };

function useEligible(campaigns: Campaign[], kind: Campaign["kind"], preview: string | null = null) {
  const path = usePathname() || "/";
  const [mobile, setMobile] = useState(false);
  const [returning, setReturning] = useState<boolean | null>(null);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setMobile(mq.matches);
    const on = () => setMobile(mq.matches);
    mq.addEventListener("change", on);
    setReturning(!!store("aba-visited"));
    store("aba-visited", "1");
    return () => mq.removeEventListener("change", on);
  }, []);
  return useMemo(() => {
    if (returning === null) return { list: [] as Campaign[], mobile };
    // the campaign being previewed from the builder shows on any page and device
    const list = campaigns.filter((c) => c.kind === kind && (c.id === preview || (pageMatches(c.rules ?? {}, path) &&
      (c.rules?.devices ?? "all") !== (mobile ? "desktop" : "mobile") &&
      ((c.rules?.audience ?? "all") === "all" || (c.rules?.audience === "returning") === returning) &&
      // never interrupt the cart or checkout with a popup / badge
      (kind === "topbar" || kind === "hero" || !/^\/(cart|checkout)/.test(path)))));
    return { list: list.sort((a, b) => b.priority - a.priority), mobile };
  }, [campaigns, kind, path, mobile, returning, preview]);
}

/** Store side: wraps the shop, shows the top bar (where it is placed), the popup and the floating badge. */
export default function CampaignHost({ campaigns, products, children }: { campaigns: Campaign[]; products: Product[]; children: React.ReactNode }) {
  const viewed = useRef(new Set<string>());
  const track = useCallback((id: string, kind: "view" | "click" | "close") => {
    if (kind === "view") { if (viewed.current.has(id)) return; viewed.current.add(id); }
    browserClient().rpc("track_campaign", { p_id: id, p_kind: kind }).then(() => {}, () => {});
  }, []);
  // ?campaign_preview=<id>: an admin checks a campaign (even a draft) on the real store before publishing.
  // Drafts are readable only with an admin login, so customers can never see them.
  const [preview, setPreview] = useState<{ c: Campaign; products: Product[] } | null>(null);
  const [previewMsg, setPreviewMsg] = useState("");
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("campaign_preview");
    if (!id) return;
    (async () => {
      const db = browserClient();
      const { data } = await db.from("campaigns").select("*").eq("id", id).maybeSingle();
      if (!data) return setPreviewMsg("Preview: sign in to the admin in this browser to preview a campaign.");
      const c = data as Campaign;
      const ids = c.content?.products ?? [];
      const { data: ps } = ids.length ? await db.from("products").select("*").in("id", ids) : { data: [] };
      setPreview({ c: { ...c, priority: 1_000_000 }, products: (ps as Product[] | null) ?? [] });
    })();
  }, []);
  const noTrack = useCallback(() => {}, []);
  const value = useMemo(() => preview
    ? { campaigns: [preview.c, ...campaigns.filter((x) => x.id !== preview.c.id)], products: [...preview.products, ...products], track: noTrack, preview: preview.c.id }
    : { campaigns, products, track, preview: null }, [campaigns, products, track, preview, noTrack]);
  return (
    <C.Provider value={value}>
      <TopBar />
      {children}
      <Popup />
      <Badge />
      {(preview || previewMsg) && (
        <div className="fixed bottom-4 left-1/2 z-[100] flex max-w-[94vw] -translate-x-1/2 items-center gap-3 rounded-full bg-black/85 px-4 py-2 text-xs font-semibold text-white shadow-2xl backdrop-blur">
          <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-amber-400" />
          <span className="truncate">{preview ? `Preview mode: “${preview.c.name}” (${preview.c.status === "active" ? "live" : "not published"}). Only you can see this.` : previewMsg}</span>
          {preview && <button onClick={() => window.location.reload()} className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 hover:bg-white/25">Replay</button>}
          {preview && <a href={`/admin/campaigns/${preview.c.id}`} className="shrink-0 rounded-full bg-white px-2.5 py-1 text-black">Back to editor</a>}
        </div>
      )}
    </C.Provider>
  );
}

const pick = (c: Campaign, products: Product[]) => (c.content?.products ?? []).map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p);

function TopBar() {
  const { campaigns, products, track, preview } = useContext(C);
  const { list, mobile } = useEligible(campaigns, "topbar", preview);
  const [closed, setClosed] = useState<string[]>([]);
  // closed bars stay closed for this visit (unless the bar is set to show always)
  const c = list.find((x) => !closed.includes(x.id) && (x.id === preview || !(x.rules?.frequency !== "always" && sess(`aba-camp-closed-${x.id}`))));
  useEffect(() => { if (c) track(c.id, "view"); }, [c, track]);
  if (!c) return null;
  return <CampaignView c={c} products={pick(c, products)} mobile={mobile} onClick={() => track(c.id, "click")} onClose={() => { setClosed((x) => [...x, c.id]); sess(`aba-camp-closed-${c.id}`, "1"); markSeen(c); track(c.id, "close"); }} />;
}

function Popup() {
  const { campaigns, products, track, preview } = useContext(C);
  const { list, mobile } = useEligible(campaigns, "popup", preview);
  const [open, setOpen] = useState<Campaign | null>(null);
  const done = useRef(false);
  const born = useRef(0);
  // popups wait for the visitor's first scroll / tap / key: the page content paints first (fast LCP),
  // and Google does not count it as an intrusive pop-up on landing
  const [engaged, setEngaged] = useState(false);
  useEffect(() => {
    born.current = Date.now();
    const on = () => setEngaged(true), opts = { once: true, passive: true } as const;
    const events = ["scroll", "pointerdown", "keydown", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, on, opts));
    return () => events.forEach((e) => window.removeEventListener(e, on));
  }, []);
  // only one popup ever: the highest priority one this visitor has not had too often
  const c = list.find((x) => x.id === preview || !seenEnough(x));
  useEffect(() => {
    if (!c || done.current) return;
    const r = c.rules ?? {}, show = () => { if (done.current) return; done.current = true; setOpen(c); if (c.id !== preview) markSeen(c); track(c.id, "view"); };
    // preview: open straight away, whatever the trigger
    if (c.id === preview) { const t = setTimeout(show, 600); return () => clearTimeout(t); }
    const trigger = r.trigger ?? "delay";
    if ((trigger === "load" || trigger === "delay") && !engaged) return;
    if (trigger === "load") { show(); return; }
    // the delay counts from page load; if it has already passed, open on the first scroll / tap
    if (trigger === "delay") { const t = setTimeout(show, Math.max(0, (r.delay ?? 3) * 1000 - (Date.now() - born.current))); return () => clearTimeout(t); }
    if (trigger === "scroll") {
      const on = () => { const h = document.documentElement; if ((h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) * 100 >= (r.scroll ?? 40)) show(); };
      window.addEventListener("scroll", on, { passive: true }); return () => window.removeEventListener("scroll", on);
    }
    // exit intent: mouse leaving the top on desktop; on phones fall back to a delay
    if (mobile) { const t = setTimeout(show, 12000); return () => clearTimeout(t); }
    const on = (e: MouseEvent) => { if (e.clientY <= 0) show(); };
    document.addEventListener("mouseout", on); return () => document.removeEventListener("mouseout", on);
  }, [c, mobile, track, preview, engaged]);
  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(null); track(open.id, "close"); } };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, track]);
  if (!open) return null;
  return <CampaignView c={open} products={pick(open, products)} mobile={mobile} onClick={() => track(open.id, "click")} onClose={() => { setOpen(null); track(open.id, "close"); }} />;
}

function Badge() {
  const { campaigns, products, track, preview } = useContext(C);
  const { list } = useEligible(campaigns, "badge", preview);
  const [gone, setGone] = useState(false);
  const c = list[0];
  useEffect(() => { if (c && !gone) track(c.id, "view"); }, [c, gone, track]);
  if (!c || gone) return null;
  return <CampaignBadge c={c} products={pick(c, products)} onClick={() => track(c.id, "click")} onClose={() => { if (c.rules?.frequency !== "always") setGone(true); track(c.id, "close"); }} />;
}

/** Home page: hero banner campaigns, above the main banner. */
export function CampaignHero() {
  const { campaigns, products, track, preview } = useContext(C);
  const { list, mobile } = useEligible(campaigns, "hero", preview);
  const [closed, setClosed] = useState<string[]>([]);
  const shown = useMemo(() => list.filter((c) => !closed.includes(c.id)).slice(0, 1), [list, closed]);
  useEffect(() => { shown.forEach((c) => track(c.id, "view")); }, [shown, track]);
  return <>{shown.map((c) => <CampaignView key={c.id} c={c} products={pick(c, products)} mobile={mobile} onClick={() => track(c.id, "click")} onClose={() => { setClosed((x) => [...x, c.id]); track(c.id, "close"); }} />)}</>;
}
