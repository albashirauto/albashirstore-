import { buildFeed } from "@/lib/feed";

// rebuilt at most every hour from the database
export const revalidate = 3600;

/** /feeds/products.xml: product feed for Google Merchant Center and the Facebook & Instagram catalog. */
export async function GET() {
  return new Response(await buildFeed(), { headers: { "content-type": "application/xml; charset=utf-8" } });
}
