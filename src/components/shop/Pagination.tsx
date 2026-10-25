import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildHref, type SP } from "./url";

/** 1 … 4 5 [6] 7 8 … 12 */
function pagesToShow(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, total, current - 1, current, current + 1].filter((n) => n >= 1 && n <= total));
  const list = [...set].sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  list.forEach((n, i) => { if (i && n - list[i - 1] > 1) out.push("…"); out.push(n); });
  return out;
}

const btn = "grid h-11 min-w-11 place-items-center rounded-full px-3 text-sm font-bold transition";

export default function Pagination({ basePath, sp, page, pages, from, to, total }: { basePath: string; sp: SP; page: number; pages: number; from: number; to: number; total: number }) {
  const href = (n: number) => buildHref(basePath, sp, { page: String(n) });

  return (
    <nav aria-label="Pages" className="mt-12 flex flex-col items-center gap-4">
      <p className="text-sm text-muted">Showing <b className="text-fg">{from}–{to}</b> of {total} parts</p>
      {pages > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {page > 1
            ? <Link href={href(page - 1)} aria-label="Previous page" className={`${btn} gap-1 border border-line hover:border-brand-600 hover:text-brand-600`}><ChevronLeft size={17} /></Link>
            : <span className={`${btn} border border-line opacity-40`}><ChevronLeft size={17} /></span>}

          {pagesToShow(page, pages).map((n, i) =>
            n === "…"
              ? <span key={`gap${i}`} className="px-1 text-muted">…</span>
              : n === page
                ? <span key={n} aria-current="page" className={`${btn} bg-brand-600 text-white shadow-md shadow-brand-600/30`}>{n}</span>
                : <Link key={n} href={href(n)} className={`${btn} hover:bg-soft hover:text-brand-600`}>{n}</Link>,
          )}

          {page < pages
            ? <Link href={href(page + 1)} aria-label="Next page" className={`${btn} gap-1.5 bg-brand-600 pl-5 pr-4 text-white hover:bg-brand-700`}>Next <ChevronRight size={17} /></Link>
            : <span className={`${btn} border border-line opacity-40`}><ChevronRight size={17} /></span>}
        </div>
      )}
    </nav>
  );
}
