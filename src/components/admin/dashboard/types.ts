export type DItem = { id?: string; name: string; price: number; qty: number; free?: number };

export type DOrder = {
  id: string; customer_name: string; phone: string; city: string | null;
  subtotal: number; shipping: number; total: number;
  status: string; payment_status?: string | null; created_at: string;
  items: DItem[];
};

export type DProduct = {
  id: string; name: string; slug: string; sku?: string | null; price: number; stock: number | null; images: string[] | null; active: boolean;
  vehicle_id: string | null; fitment_verified?: boolean | null; scheme_buy: number | null; scheme_free: number | null;
};

export type DActivity = { id: number; at: string; actor_email: string | null; entity: string; action: string; detail: string | null };

/**
 * Fulfilment statuses. "new" shows as Pending, "confirmed" as Processing.
 * Order + colours checked with the dataviz palette validator (light and dark): returned sits
 * between delivered and cancelled so red never touches green in the stacked bar.
 */
export const STATUS = [
  { key: "new", label: "Pending", dot: "bg-brand-600 dark:bg-brand-500", pill: "bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-white" },
  { key: "confirmed", label: "Processing", dot: "bg-amber-600", pill: "bg-amber-100 text-amber-800" },
  { key: "shipped", label: "Shipped", dot: "bg-purple-600", pill: "bg-purple-100 text-purple-800" },
  { key: "delivered", label: "Delivered", dot: "bg-green-600", pill: "bg-green-100 text-green-800" },
  { key: "returned", label: "Returned", dot: "bg-cyan-600", pill: "bg-cyan-100 text-cyan-800" },
  { key: "cancelled", label: "Cancelled", dot: "bg-hot", pill: "bg-hot/10 text-hot" },
] as const;

export const PAYMENT: Record<string, { label: string; pill: string }> = {
  unpaid: { label: "Unpaid", pill: "bg-amber-100 text-amber-800" },
  paid: { label: "Paid", pill: "bg-green-100 text-green-800" },
  refunded: { label: "Refunded", pill: "bg-soft text-muted" },
};

export const statusOf = (k: string) => STATUS.find((s) => s.key === k) ?? STATUS[0];

/** "5 min ago", "3 h ago", "2 days ago" */
export const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} h ago`;
  const d = Math.round(m / 1440);
  return d === 1 ? "yesterday" : `${d} days ago`;
};
