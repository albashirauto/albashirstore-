import Link from "next/link";
import { AlertTriangle, BadgeCheck, Bike, CircleDollarSign, ImageOff, PackageX } from "lucide-react";
import type { DProduct } from "./types";

/** Catalog problems, worst first. Fitment gets its own highlighted alert: wrong fitment = returns. */
export default function InventoryAlerts({ products, costs }: { products: DProduct[]; costs: Map<string, number> }) {
  const live = products.filter((p) => p.active);
  const out = live.filter((p) => (p.stock ?? 0) <= 0);
  const low = live.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= 5).sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
  const noFit = live.filter((p) => !p.vehicle_id);
  const unverified = live.filter((p) => p.vehicle_id && !p.fitment_verified);
  const noCost = live.filter((p) => !costs.has(p.id));
  const noPhoto = live.filter((p) => !p.images?.length);
  const fitIssues = noFit.length + unverified.length;

  const rows = [
    { n: out.length, label: "Out of stock", icon: PackageX, tone: "text-hot" },
    { n: low.length, label: "Low stock (5 or less)", icon: AlertTriangle, tone: "text-amber-600" },
    { n: noCost.length, label: "No cost price (profit unknown)", icon: CircleDollarSign, tone: "text-muted" },
    { n: noPhoto.length, label: "No photo", icon: ImageOff, tone: "text-muted" },
  ];

  return (
    <div className="rounded-2xl border border-line bg-card p-5 md:p-6">
      <h3 className="text-xl font-bold">Inventory alerts</h3>

      {fitIssues > 0 ? (
        <Link href="/admin/products" className="group mt-4 flex gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 transition hover:border-amber-500">
          <Bike size={20} className="mt-0.5 shrink-0 text-amber-700" />
          <span className="text-sm">
            <b className="block text-amber-800 dark:text-amber-400">Fitment needs checking</b>
            <span className="text-muted">{noFit.length} without a bike, {unverified.length} not verified. Wrong fitment is the top reason for returns.</span>
          </span>
        </Link>
      ) : live.length > 0 && (
        <p className="mt-4 flex items-center gap-2 rounded-xl bg-green-600/10 p-3 text-sm font-semibold text-green-700"><BadgeCheck size={17} />Fitment checked on every live product</p>
      )}

      <ul className="mt-3 divide-y divide-line">
        {rows.map((r) => (
          <li key={r.label}>
            <Link href="/admin/products" className="flex items-center gap-3 py-2.5 text-sm transition hover:text-brand-600">
              <r.icon size={17} className={r.tone} />
              <span className="flex-1 font-semibold">{r.label}</span>
              <span className={`font-display text-xl font-bold ${r.n ? "" : "text-muted"}`}>{r.n}</span>
            </Link>
          </li>
        ))}
      </ul>

      {(out.length > 0 || low.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[...out, ...low].slice(0, 6).map((p) => (
            <span key={p.id} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${(p.stock ?? 0) <= 0 ? "bg-hot/10 text-hot" : "bg-amber-100 text-amber-800"}`}>
              {p.name.length > 22 ? `${p.name.slice(0, 22)}…` : p.name} · {(p.stock ?? 0) <= 0 ? "0" : p.stock}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
