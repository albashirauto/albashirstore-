import { Gift } from "lucide-react";
import type { CartItem } from "@/lib/types";
import { freeQty, hasScheme, schemeLabel, toNextFree } from "@/lib/scheme";

/** Under a cart line: "+5 free" when earned, and how many more to buy for the next free pieces. */
export default function SchemeNote({ item }: { item: CartItem }) {
  if (!hasScheme(item)) return null;
  const free = freeQty(item.qty, item);
  const need = toNextFree(item.qty, item);

  return (
    <div className="mt-1.5 space-y-1 text-xs">
      {free > 0 && (
        <p className="inline-flex items-center gap-1.5 rounded-full bg-green-600/10 px-2.5 py-1 font-bold text-green-700 dark:text-green-400">
          <Gift size={13} />+{free} free {free === 1 ? "piece" : "pieces"} (you get {item.qty + free})
        </p>
      )}
      <p className="text-muted">
        {schemeLabel(item)}. Add <b className="text-hot">{need}</b> more for {item.scheme_free} more free.
      </p>
    </div>
  );
}
