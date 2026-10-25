import { Gift } from "lucide-react";
import type { Product } from "@/lib/types";
import { hasScheme } from "@/lib/scheme";

/** Product page explainer: what the scheme is and an example. */
export default function SchemeBox({ p }: { p: Product }) {
  if (!hasScheme(p)) return null;
  const buy = p.scheme_buy!, free = p.scheme_free!;

  return (
    <div className="mt-6 flex max-w-xl gap-4 rounded-2xl border border-green-600/30 bg-green-600/[0.06] p-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-green-600 text-white"><Gift size={22} /></span>
      <div className="text-sm">
        <p className="font-display text-2xl font-extrabold uppercase leading-none text-green-700 dark:text-green-400">Buy {buy}, get {free} free</p>
        <p className="mt-1.5 text-muted">
          Order {buy} pieces and we send <b className="text-fg">{buy + free}</b>. Order {buy * 2}, get {free * 2} free.
          Free pieces are added automatically in your cart.
        </p>
      </div>
    </div>
  );
}
