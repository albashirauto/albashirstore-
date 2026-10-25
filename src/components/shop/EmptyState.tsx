import Link from "next/link";
import { ArrowRight, PackageSearch } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";

/** No results: explain, offer a reset, popular categories and WhatsApp. */
export default function EmptyState({ clearHref, q, whatsapp, popular }: { clearHref: string; q?: string; whatsapp?: string; popular: { name: string; slug: string }[] }) {
  return (
    <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900"><PackageSearch size={30} /></span>
      <h2 className="mt-5 text-3xl font-extrabold uppercase">No parts found{q ? ` for “${q}”` : ""}</h2>
      <p className="mx-auto mt-2 max-w-md text-muted">Try removing a filter or using a shorter word. You can also ask us, we stock more than what is online.</p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href={clearHref} className="rounded-full bg-brand-600 px-6 py-2.5 font-bold text-white transition hover:bg-brand-700">Clear filters</Link>
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hello, do you have ${q || "this part"}?`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-2.5 font-bold text-white transition hover:bg-[#1ebe5b]">
            <WhatsAppIcon size={17} />Ask on WhatsApp
          </a>
        )}
      </div>

      {popular.length > 0 && (
        <div className="mt-10">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Popular categories</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {popular.map((c) => (
              <Link key={c.slug} href={`/collections/${c.slug}`} className="group inline-flex items-center gap-1 rounded-full border border-line px-3.5 py-1.5 text-sm font-semibold transition hover:border-brand-500 hover:text-brand-600">
                {c.name}<ArrowRight size={13} className="transition group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
