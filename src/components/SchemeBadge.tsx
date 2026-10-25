import { Gift } from "lucide-react";
import { hasScheme, schemeLabel } from "@/lib/scheme";

/** "Buy 20 Get 5 Free" tag for product cards and the product page. */
export default function SchemeBadge({ p, className = "" }: { p: { scheme_buy?: number | null; scheme_free?: number | null }; className?: string }) {
  if (!hasScheme(p)) return null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-green-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow ${className}`}>
      <Gift size={12} />{schemeLabel(p)}
    </span>
  );
}
