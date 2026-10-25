import Link from "next/link";
import { Check, ChevronDown } from "lucide-react";
import { PRICES, buildHref, type SP } from "./url";

export type Option = { slug: string; name: string; count: number };
type Key = "category" | "brand" | "vehicle";

function Section({ title, children, open = true }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group/s border-b border-line py-4 last:border-0">
      <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold uppercase tracking-wider [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown size={16} className="text-muted transition duration-300 group-open/s:rotate-180" />
      </summary>
      <div className="mt-3 grid gap-0.5">{children}</div>
    </details>
  );
}

function Row({ href, on, label, count, square = false }: { href: string; on: boolean; label: string; count?: number; square?: boolean }) {
  return (
    <Link href={href} scroll={false} className={`group flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm transition ${on ? "font-bold text-brand-600" : "text-fg/80 hover:bg-soft hover:text-fg"}`}>
      <span className={`grid h-4 w-4 shrink-0 place-items-center border transition ${square ? "rounded" : "rounded-full"} ${on ? "border-brand-600 bg-brand-600 text-white" : "border-line group-hover:border-brand-500"}`}>
        {on && <Check size={11} strokeWidth={3} />}
      </span>
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${on ? "bg-brand-600/10" : "bg-soft text-muted"}`}>{count}</span>}
    </Link>
  );
}

/** Filter list. Plain links, so it works without JavaScript and every filter has its own shareable URL. */
export default function FilterPanel({ basePath, sp, fixed, groups }: {
  basePath: string; sp: SP; fixed: Partial<Record<Key, string>> & { scheme?: boolean };
  groups: { key: Key; title: string; options: Option[] }[];
}) {
  const href = (patch: Partial<SP>) => buildHref(basePath, sp, patch);

  return (
    <div>
      {groups.filter((g) => !fixed[g.key] && g.options.length > 0).map((g) => (
        <Section key={g.key} title={g.title} open={g.key !== "vehicle" || Boolean(sp.vehicle)}>
          {g.options.map((o) => {
            const on = sp[g.key] === o.slug;
            return <Row key={o.slug} href={href({ [g.key]: on ? undefined : o.slug })} on={on} label={o.name} count={o.count} />;
          })}
        </Section>
      ))}

      <Section title="Price">
        {PRICES.map((p) => {
          const on = sp.price === p.v;
          return <Row key={p.v} href={href({ price: on ? undefined : p.v })} on={on} label={p.l} />;
        })}
      </Section>

      <Section title="Availability">
        <Row href={href({ stock: sp.stock ? undefined : "1" })} on={Boolean(sp.stock)} label="In stock only" square />
        <Row href={href({ sale: sp.sale ? undefined : "1" })} on={Boolean(sp.sale)} label="On sale" square />
        {!fixed.scheme && <Row href={href({ scheme: sp.scheme ? undefined : "1" })} on={Boolean(sp.scheme)} label="Free-piece scheme" square />}
      </Section>
    </div>
  );
}
