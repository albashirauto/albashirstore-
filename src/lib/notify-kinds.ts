// Kinds of notification emails. Shared by the admin page (browser) and src/lib/notify.ts (server).
// Keys match notify_recipients.events and the events sent by supabase/014_notifications.sql.
export const KINDS = [
  { key: "new_order", label: "New orders", hint: "Every order from the website (and ones you add in admin)" },
  { key: "order_status", label: "Order updates", hint: "Confirmed, dispatched (with courier + tracking), delivered, cancelled, returned" },
  { key: "payment", label: "Payments", hint: "When an order is marked paid" },
  { key: "stock", label: "Stock alerts", hint: "A product falls to its low stock level, or runs out" },
  { key: "review", label: "New reviews", hint: "A customer reviews a product (waiting for your approval)" },
  { key: "wholesale", label: "Wholesale enquiries", hint: "A shop, workshop or dealer asks about buying in bulk" },
] as const;
export type Kind = (typeof KINDS)[number]["key"];
