"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { pageMatches, type Campaign } from "@/lib/campaigns";
import { browserClient } from "@/lib/supabase";
import type { Product } from "@/lib/types";
import CampaignView, { CampaignBadge } from "./CampaignView";

type Ctx = { campaigns: Campaign[]; products: Product[]; track: (id: string, kind: "view" | "click" | "close") => void };
const C = createContext<Ctx>({ campaigns: [], products: [], track: () => {} });

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

function useEligible(campaigns: Campaign[], kind: Campaign["kind"]) {
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
    const list = campaigns.filter((c) => c.kind === kind && pageMatches(c.rules ?? {}, path) &&
      (c.rules?.devices ?? "all") !== (mobile ? "desktop" : "mobile") &&
      ((c.rules?.audience ?? "all") === "all" || (c.rules?.audience === "returning") === returning) &&
      // never interrupt the cart or checkout with a popup / badge
      (kind === "topbar" || kind === "hero" || !/^\/(cart|checkout)/.test(path)));
    return { list: list.sort((a, b) => b.priority - a.priority), mobile };
  }, [campaigns, kind, path, mobile, returning]);
}

/** Store side: wraps the shop, shows the top bar (where it is placed), the popup and the floating badge. */
export default function CampaignHost({ campaigns, products, children }: { campaigns: Campaign[]; products: Product[]; children: React.ReactNode }) {
  const viewed = useRef(new Set<string>());
  const track = useCallback((id: string, kind: "view" | "click" | "close") => {
    if (kind === "view") { if (viewed.current.has(id)) return; viewed.current.add(id); }
    browserClient().rpc("track_campaign", { p_id: id, p_kind: kind }).then(() => {}, () => {});
  }, []);
  const value = useMemo(() => ({ campaigns, products, track }), [campaigns, products, track]);
  return (
    <C.Provider value={value}>
      <TopBar />
      {children}
      <Popup />
      <Badge />
    </C.Provider>
  );
}

const pick = (c: Campaign, products: Product[]) => (c.content?.products ?? []).map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p);

function TopBar() {
  const { campaigns, products, track } = useContext(C);
  const { list, mobile } = useEligible(campaigns, "topbar");
  const [closed, setClosed] = useState<string[]>([]);
  // closed bars stay closed for this visit (unless the bar is set to show always)
  const c = list.find((x) => !closed.includes(x.id) && !(x.rules?.frequency !== "always" && sess(`aba-camp-closed-${x.id}`)));
  useEffect(() => { if (c) track(c.id, "view"); }, [c, track]);
  if (!c) return null;
  return <CampaignView c={c} products={pick(c, products)} mobile={mobile} onClick={() => track(c.id, "click")} onClose={() => { setClosed((x) => [...x, c.id]); sess(`aba-camp-closed-${c.id}`, "1"); markSeen(c); track(c.id, "close"); }} />;
}

function Popup() {
  const { campaigns, products, track } = useContext(C);
  const { list, mobile } = useEligible(campaigns, "popup");
  const [open, setOpen] = useState<Campaign | null>(null);
  const done = useRef(false);
  // only one popup ever: the highest priority one this visitor has not had too often
  const c = list.find((x) => !seenEnough(x));
  useEffect(() => {
    if (!c || done.current) return;
    const r = c.rules ?? {}, show = () => { if (done.current) return; done.current = true; setOpen(c); markSeen(c); track(c.id, "view"); };
    const trigger = r.trigger ?? "delay";
    if (trigger === "load") { show(); return; }
    if (trigger === "delay") { const t = setTimeout(show, Math.max(0, r.delay ?? 3) * 1000); return () => clearTimeout(t); }
    if (trigger === "scroll") {
      const on = () => { const h = document.documentElement; if ((h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) * 100 >= (r.scroll ?? 40)) show(); };
      window.addEventListener("scroll", on, { passive: true }); return () => window.removeEventListener("scroll", on);
    }
    // exit intent: mouse leaving the top on desktop; on phones fall back to a delay
    if (mobile) { const t = setTimeout(show, 12000); return () => clearTimeout(t); }
    const on = (e: MouseEvent) => { if (e.clientY <= 0) show(); };
    document.addEventListener("mouseout", on); return () => document.removeEventListener("mouseout", on);
  }, [c, mobile, track]);
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
  const { campaigns, products, track } = useContext(C);
  const { list } = useEligible(campaigns, "badge");
  const [gone, setGone] = useState(false);
  const c = list[0];
  useEffect(() => { if (c && !gone) track(c.id, "view"); }, [c, gone, track]);
  if (!c || gone) return null;
  return <CampaignBadge c={c} products={pick(c, products)} onClick={() => track(c.id, "click")} onClose={() => { if (c.rules?.frequency !== "always") setGone(true); track(c.id, "close"); }} />;
}

/** Home page: hero banner campaigns, above the main banner. */
export function CampaignHero() {
  const { campaigns, products, track } = useContext(C);
  const { list, mobile } = useEligible(campaigns, "hero");
  const [closed, setClosed] = useState<string[]>([]);
  const shown = useMemo(() => list.filter((c) => !closed.includes(c.id)).slice(0, 1), [list, closed]);
  useEffect(() => { shown.forEach((c) => track(c.id, "view")); }, [shown, track]);
  return <>{shown.map((c) => <CampaignView key={c.id} c={c} products={pick(c, products)} mobile={mobile} onClick={() => track(c.id, "click")} onClose={() => { setClosed((x) => [...x, c.id]); track(c.id, "close"); }} />)}</>;
}
