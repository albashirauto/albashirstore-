import ShopListing, { type SP } from "@/components/shop/ShopListing";

export const metadata = { title: "Bulk schemes" };
export const revalidate = 60;

/** Every product with a "buy X get Y free" scheme, with the normal filters and pages. */
export default async function Schemes({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  return (
    <ShopListing
      title="Bulk schemes" eyebrow="Buy more, get free"
      subtitle="Order the set quantity and get free pieces with your order. Free pieces are added in your cart automatically."
      parents={[{ label: "Deal zone", href: "/promotions" }]}
      basePath="/promotions/schemes" fixed={{ scheme: true }} sp={sp}
    />
  );
}
