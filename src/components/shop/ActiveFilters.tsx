import Link from "next/link";
import { X } from "lucide-react";
import { PRICES, buildHref, type SP } from "./url";

/** Chips for every filter in use, each removable, plus "Clear all". */
export default function ActiveFilters({ basePath, sp, names }: { basePath: string; sp: SP; names: Record<string, string> }) {
  const chips: { label: string; patch: Partial<SP> }[] = [];
  if (sp.q) chips.push({ label: `“${sp.q}”`, patch: { q: undefined } });
  if (sp.category) chips.push({ label: names[`category:${sp.category}`] ?? sp.category, patch: { category: undefined } });
  if (sp.brand) chips.push({ label: names[`brand:${sp.brand}`] ?? sp.brand, patch: { brand: undefined } });
  if (sp.vehicle) chips.push({ label: names[`vehicle:${sp.vehicle}`] ?? sp.vehicle, patch: { vehicle: undefined } });
  if (sp.price) chips.push({ label: PRICES.find((p) => p.v === sp.price)?.l ?? sp.price, patch: { price: undefined } });
  if (sp.stock) chips.push({ label: "In stock", patch: { stock: undefined } });
  if (sp.sale) chips.push({ label: "On sale", patch: { sale: undefined } });
  if (sp.scheme) chips.push({ label: "Free-piece scheme", patch: { scheme: undefined } });
  if (!chips.length) return null;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <Link key={c.label} href={buildHref(basePath, sp, c.patch)} scroll={false} className="group inline-flex items-center gap-1.5 rounded-full bg-brand-50 py-1.5 pl-3.5 pr-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-600 hover:text-white dark:bg-brand-900 dark:text-white">
          {c.label}
          <span className="grid h-5 w-5 place-items-center rounded-full bg-white/70 text-brand-700 transition group-hover:bg-white/20 group-hover:text-white dark:bg-white/10 dark:text-white"><X size={12} strokeWidth={3} /></span>
        </Link>
      ))}
      <Link href={buildHref(basePath, { sort: sp.sort }, {})} scroll={false} className="ml-1 text-sm font-bold text-hot hover:underline">Clear all</Link>
    </div>
  );
}
