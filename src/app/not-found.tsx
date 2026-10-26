import Link from "next/link";
import { ArrowRight, Home, LayoutGrid, Search, Truck, Phone } from "lucide-react";
import RedirectCheck from "@/components/RedirectCheck";

/** 404 (stays a static page, so every other page can be cached): RedirectCheck follows a redirect if one exists
 *  (Admin > Redirects, or a changed web address), else logs the miss. The visitor gets search + helpful links. */
export default function NotFound() {

  const links = [
    { href: "/shop", label: "All parts", icon: LayoutGrid },
    { href: "/categories", label: "Categories", icon: LayoutGrid },
    { href: "/track", label: "Track my order", icon: Truck },
    { href: "/contact", label: "Contact us", icon: Phone },
  ];
  return (
    <div className="relative isolate grid min-h-dvh place-items-center overflow-hidden bg-bg px-4 py-16 text-center">
      <div className="absolute inset-0 -z-10 opacity-[0.05]" style={{ backgroundImage: "radial-gradient(var(--color-brand-600) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
      <RedirectCheck />
      <div className="w-full max-w-xl">
        <p className="font-display text-[8rem] font-extrabold leading-none text-brand-600 md:text-[10rem]">4<span className="text-hot">0</span>4</p>
        <h1 className="mt-2 text-3xl font-extrabold uppercase md:text-4xl">This page took a wrong turn</h1>
        <p className="mt-2 text-muted">The page you are looking for does not exist or was moved. Search for the part you need:</p>
        <form action="/shop" className="mx-auto mt-6 flex max-w-md items-center gap-2 rounded-full border border-line bg-card p-1.5 shadow-lg shadow-brand-900/5 focus-within:border-brand-500">
          <Search size={18} className="ml-3 shrink-0 text-muted" />
          <input name="q" placeholder="e.g. chain kit, CD 70 battery…" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" aria-label="Search parts" />
          <button className="rounded-full bg-brand-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-brand-700">Search</button>
        </form>
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {links.map(({ href, label, icon: I }) => (
            <Link key={href} href={href} className="group flex flex-col items-center gap-1.5 rounded-2xl border border-line bg-card p-3 text-sm font-bold transition hover:-translate-y-0.5 hover:border-brand-500 hover:text-brand-600">
              <I size={18} className="text-brand-600" />{label}
            </Link>
          ))}
        </div>
        <Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-600 px-8 py-3 font-bold text-white shadow-lg shadow-brand-600/25 transition hover:-translate-y-0.5 hover:bg-brand-700"><Home size={17} />Back to home<ArrowRight size={16} /></Link>
      </div>
    </div>
  );
}
