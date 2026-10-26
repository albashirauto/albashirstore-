export type OItem = { id?: string; name: string; qty: number; price: number; free?: number };

export type Order = {
  id: string; order_no?: number; customer_name: string; phone: string; email: string | null; city: string | null; district?: string | null; province?: string | null; address: string; note: string | null;
  items: OItem[]; subtotal: number; shipping: number; total: number;
  status: string; payment_status?: string | null; payment_method?: string | null; created_at: string;
  payment_ref?: string | null;
  coupon_code?: string | null; discount?: number | null;
  /** delivery | pickup (collect from shop) */
  delivery_method?: string | null;
  status_reason?: string | null; courier?: string | null; tracking_no?: string | null; dispatched_at?: string | null;
};

export const STATUSES = ["new", "confirmed", "shipped", "delivered", "returned", "cancelled"] as const;
export const PAYMENTS = ["unpaid", "paid", "refunded"] as const;

export const orderNo = (o: Order) => o.id.slice(0, 8).toUpperCase();
export const pieces = (o: Order) => (o.items ?? []).reduce((n, i) => n + i.qty + (i.free ?? 0), 0);
export const methodLabel = (m: string) => m.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export const COURIERS = ["TCS", "Leopards", "M&P", "PostEx", "Trax", "BlueEx", "Call Courier", "Pakistan Post", "Own rider", "Other"];
export const CANCEL_REASONS = ["Customer changed mind", "Not reachable on phone", "Out of stock", "Wrong part ordered", "Duplicate order", "Fake order", "Price issue"];
export const RETURN_REASONS = ["Wrong fitment", "Damaged in transit", "Wrong part sent", "Delivery refused", "Defective part", "Customer changed mind"];
