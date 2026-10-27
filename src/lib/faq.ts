/** FAQ topics (Admin > FAQs > Topic), in the order they show on /faq. */
export const FAQ_TOPICS = [
  { key: "orders", label: "Orders & payment" },
  { key: "delivery", label: "Delivery & tracking" },
  { key: "parts", label: "Parts & fitment" },
  { key: "returns", label: "Returns & warranty" },
  { key: "shop", label: "Our shop" },
] as const;

export const topicLabel = (k?: string | null) => FAQ_TOPICS.find((t) => t.key === k)?.label ?? "Other questions";
