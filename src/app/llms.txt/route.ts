import { buildLlms } from "@/lib/llms";

// rebuilt at most every 10 minutes from the database
export const revalidate = 600;

/** /llms.txt: short guide to the store for AI assistants (llmstxt.org). */
export async function GET() {
  return new Response(await buildLlms(false), { headers: { "content-type": "text/plain; charset=utf-8" } });
}
