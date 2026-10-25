import ShopListing, { type SP } from "@/components/shop/ShopListing";

export const metadata = { title: "Shop all parts" };

export default async function Shop({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  return <ShopListing title={sp.q ? "Search results" : "All parts"} subtitle="Filter by category, brand or the bike you ride." basePath="/shop" sp={sp} parents={[]} />;
}
