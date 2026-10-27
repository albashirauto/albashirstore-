"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BellRing, ChartColumn, History, Image, Route, Sparkles, MessageSquareText, ShoppingCart, TicketPercent, Bike, Boxes, CircleHelp, ClipboardList, Cog, ExternalLink, FileText, Images, LayoutDashboard, Layers, LogOut, Mail, Megaphone, Menu, Newspaper, Settings, ShieldCheck, Star, Tag, Trophy, PackageOpen, Users, X, Lock, UserCog } from "lucide-react";

const ICONS: Record<string, React.ElementType> = {
  "/admin": LayoutDashboard, "/admin/orders": ClipboardList, "/admin/products": Boxes, "/admin/categories": Layers,
  "/admin/brands": Tag, "/admin/vehicles": Bike, "/admin/promotions": Megaphone, "/admin/banners": Images,
  "/admin/pages": FileText, "/admin/testimonials": Star, "/admin/features": ShieldCheck, "/admin/settings": Settings,
  "/admin/customers": Users, "/admin/posts": Newspaper, "/admin/faqs": CircleHelp, "/admin/newsletter": Mail, "/admin/team": UserCog, "/admin/notifications": BellRing, "/admin/reviews": MessageSquareText, "/admin/coupons": TicketPercent, "/admin/carts": ShoppingCart, "/admin/reports": ChartColumn, "/admin/activity": History, "/admin/redirects": Route, "/admin/media": Image, "/admin/campaigns": Sparkles, "/admin/awards": Trophy, "/admin/offerings": PackageOpen,
};
import { NAV_GROUPS } from "@/lib/admin-config";
import { browserClient, hasSupabase } from "@/lib/supabase";
import LoginScreen from "./LoginScreen";
import ResetPassword from "./ResetPassword";

type State = "loading" | "setup" | "login" | "denied" | "disabled" | "ok";
type Access = { role: "owner" | "staff"; permissions: string[]; name: string | null };

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [state, setState] = useState<State>("loading");
  const [open, setOpen] = useState(false);
  const [newOrders, setNewOrders] = useState(0);
  const [newReviews, setNewReviews] = useState(0);
  const [access, setAccess] = useState<Access>({ role: "owner", permissions: [], name: null });

  const check = async () => {
    if (!hasSupabase) return setState("setup");
    const db = browserClient();
    const { data } = await db.auth.getUser();
    if (!data.user) return setState("login");
    // select("*") keeps working even before the team columns exist
    const { data: row } = await db.from("admins").select("*").eq("user_id", data.user.id).maybeSingle();
    if (row && (row.status ?? "active") !== "active") return setState("disabled");
    if (row) setAccess({ role: row.role === "staff" ? "staff" : "owner", permissions: row.permissions ?? [], name: row.name ?? null });
    setState(row ? "ok" : "denied");
    if (row && (row.role !== "staff" || (row.permissions ?? []).includes("/admin/orders"))) {
      const { count } = await db.from("orders").select("id", { count: "exact", head: true }).eq("status", "new");
      setNewOrders(count ?? 0);
    }
    if (row && (row.role !== "staff" || (row.permissions ?? []).includes("/admin/reviews"))) {
      const { count } = await db.from("product_reviews").select("id", { count: "exact", head: true }).eq("status", "pending");
      setNewReviews(count ?? 0);
    }
  };
  useEffect(() => { check(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  useEffect(() => setOpen(false), [path]);

  const logout = async () => { await browserClient().auth.signOut(); setState("login"); };

  if (path === "/admin/reset") return <ResetPassword />;

  if (state === "loading") return <div className="grid min-h-dvh place-items-center"><Cog className="animate-spin-slow text-brand-500" size={44} /></div>;

  if (state === "setup")
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-4xl font-extrabold uppercase text-brand-700">Connect Supabase first</h1>
        <p className="mt-3 text-muted">The admin panel needs your database. Follow these steps (full details are in README.md):</p>
        <ol className="mt-5 list-decimal space-y-2 pl-6">
          <li>Create a free project at supabase.com.</li>
          <li>Open <b>SQL Editor</b>, paste the file <code>supabase/schema.sql</code> and run it.</li>
          <li>Copy <code>.env.example</code> to <code>.env.local</code> and paste your Project URL and anon key.</li>
          <li>Create your admin user in Supabase (Authentication → Users), then run the one-line SQL at the bottom of <code>schema.sql</code>.</li>
          <li>Restart <code>npm run dev</code> and open this page again.</li>
        </ol>
        <Link href="/" className="mt-8 inline-block font-bold text-brand-600 underline">Back to the store</Link>
      </div>
    );

  if (state === "login" || state === "denied")
    return <LoginScreen denied={state === "denied"} onSignedIn={check} onSignOut={logout} />;

  if (state === "disabled")
    return (
      <div className="grid min-h-dvh place-items-center bg-soft px-4 text-center">
        <div className="max-w-sm rounded-3xl border border-line bg-card p-8">
          <Lock className="mx-auto text-hot" size={36} />
          <h1 className="mt-3 text-3xl font-extrabold uppercase">Access turned off</h1>
          <p className="mt-2 text-muted">Your admin account has been disabled by the owner. Ask them to turn it back on.</p>
          <button onClick={logout} className="mt-5 rounded-full bg-brand-600 px-6 py-2.5 font-bold text-white">Sign out</button>
        </div>
      </div>
    );

  // what this person may open: owners everything; staff only what the owner ticked (never owner-only pages)
  const owner = access.role === "owner";
  const allowed = (href: string) => owner || (!NAV_GROUPS.some((g) => g.items.some((i) => i.href === href && i.ownerOnly)) && access.permissions.includes(href));
  const navFor = NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => allowed(i.href)) })).filter((g) => g.items.length);
  // the section this URL belongs to (longest matching href)
  const section = NAV_GROUPS.flatMap((g) => g.items).map((i) => i.href).filter((h) => (h === "/admin" ? path === "/admin" : path === h || path.startsWith(h + "/"))).sort((a, b) => b.length - a.length)[0];
  const blocked = !owner && section !== undefined && !allowed(section);
  const firstAllowed = navFor[0]?.items[0]?.href;

  const sidebar = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-6 pb-4 pt-6 text-brand-700 dark:text-white">
        <Cog className="animate-spin-slow" size={26} />
        <span className="font-display text-2xl font-extrabold uppercase leading-none">Al Bashir<br /><span className="text-base tracking-[0.2em] text-hot">Admin</span></span>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 scrollbar-none">
        {navFor.map((g) => (
          <div key={g.title}>
            <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-muted/70">{g.title}</p>
            <div className="space-y-0.5">
              {g.items.map((n) => {
                const on = n.href === "/admin" ? path === "/admin" : path.startsWith(n.href);
                const Icon = ICONS[n.href] ?? Cog;
                return (
                  <Link key={n.href} href={n.href}
                    className={`relative flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-[15px] font-semibold transition ${on ? "bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-white" : "text-fg/75 hover:bg-soft hover:text-fg"}`}>
                    {on && <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-brand-600" />}
                    <Icon size={19} strokeWidth={1.8} className={on ? "text-brand-600 dark:text-white" : "text-muted"} />
                    <span className="flex-1">{n.label}</span>
                    {n.href === "/admin/orders" && newOrders > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-hot px-1.5 text-[11px] font-bold text-white">{newOrders}</span>}
                    {n.href === "/admin/reviews" && newReviews > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">{newReviews}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-0.5 border-t border-line p-3">
        <Link href="/" target="_blank" className="flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-[15px] font-semibold text-fg/75 transition hover:bg-soft hover:text-fg"><ExternalLink size={19} strokeWidth={1.8} className="text-muted" />View store</Link>
        <button onClick={logout} className="flex w-full items-center gap-3.5 rounded-xl px-3 py-2.5 text-[15px] font-bold text-hot transition hover:bg-hot/10"><LogOut size={19} strokeWidth={1.8} />Log out</button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-dvh bg-soft">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-bg lg:block">{sidebar}</aside>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-bg transition-transform lg:hidden ${open ? "translate-x-0" : "-translate-x-full"}`}>{sidebar}</aside>
      <div className="lg:pl-64">
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-bg px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
          <span className="font-display text-xl font-extrabold uppercase text-brand-700">Store admin</span>
        </div>
        {/* builders (campaigns) use the whole screen so the live preview is big enough to read */}
        <main className={`mx-auto p-4 md:p-8 ${path.startsWith("/admin/campaigns/") ? "max-w-[1700px]" : "max-w-6xl"}`}>
          {blocked ? (
            <div className="mx-auto max-w-md rounded-3xl border border-line bg-card p-8 text-center">
              <Lock className="mx-auto text-amber-600" size={34} />
              <h1 className="mt-3 text-3xl font-extrabold uppercase">No access</h1>
              <p className="mt-2 text-muted">{access.name ? `${access.name}, this` : "This"} section is not part of your role. Ask the owner if you need it.</p>
              {firstAllowed && <Link href={firstAllowed} className="mt-5 inline-block rounded-full bg-brand-600 px-6 py-2.5 font-bold text-white">Go to my sections</Link>}
            </div>
          ) : children}
        </main>
      </div>
    </div>
  );
}
