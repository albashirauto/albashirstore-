import { buildLlms } from "@/lib/llms";

export const revalidate = 600;

/** /llms-full.txt: the guide plus every live product with price, stock, brand, fitment and specifications. */
export async function GET() {
  return new Response(await buildLlms(true), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
