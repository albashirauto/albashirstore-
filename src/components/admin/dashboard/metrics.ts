import { inRange, type Range } from "./range";
import type { DOrder } from "./types";

/** Orders that count as sales (not cancelled, not returned). */
export const isSale = (o: DOrder) => o.status !== "cancelled" && o.status !== "returned";

export type Metrics = {
  revenue: number;      // product sales (subtotal), excl. delivery
  profit: number;       // revenue minus cost of every piece sent (free scheme pieces included)
  coverage: number;     // share of sold lines that had a cost price (0–1)
  orders: number;       // all orders placed
  sales: number;        // orders that count as sales
  aov: number;          // average sale value
  customers: number;    // unique phone numbers with a sale
  newCustomers: number; // of those, first-ever order in this range
  units: number;        // pieces sent incl. free
  cancelled: number; cancelledValue: number;
  returned: number; returnedValue: number;
};

/**
 * All dashboard numbers for one date range, from the same order list.
 * `firstOrder` = earliest order date per phone (for new vs returning customers).
 */
export function metrics(all: DOrder[], r: Range, costs: Map<string, number>, firstOrder: Map<string, number>): Metrics {
  const list = all.filter((o) => inRange(o.created_at, r));
  const sales = list.filter(isSale);
  let profit = 0, lines = 0, withCost = 0, units = 0;
  for (const o of sales) {
    for (const i of o.items ?? []) {
      const sent = i.qty + (i.free ?? 0);
      units += sent;
      lines++;
      const c = i.id ? costs.get(i.id) : undefined;
      if (c !== undefined) { withCost++; profit += i.price * i.qty - c * sent; }
    }
  }
  const revenue = sales.reduce((n, o) => n + Number(o.subtotal ?? o.total), 0);
  const phones = new Set(sales.map((o) => o.phone));
  const newCustomers = [...phones].filter((p) => (firstOrder.get(p) ?? 0) >= r.from.getTime()).length;
  const cancelled = list.filter((o) => o.status === "cancelled");
  const returned = list.filter((o) => o.status === "returned");
  const sum = (l: DOrder[]) => l.reduce((n, o) => n + Number(o.subtotal ?? o.total), 0);

  return {
    revenue, profit, coverage: lines ? withCost / lines : 0,
    orders: list.length, sales: sales.length, aov: sales.length ? revenue / sales.length : 0,
    customers: phones.size, newCustomers, units,
    cancelled: cancelled.length, cancelledValue: sum(cancelled),
    returned: returned.length, returnedValue: sum(returned),
  };
}
