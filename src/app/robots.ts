import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/data";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 600;

/** AI crawlers that read sites to train or answer questions. Blocked only when Settings > SEO says so. */
const AI_BOTS = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-Web", "anthropic-ai", "PerplexityBot", "Google-Extended", "CCBot", "Bytespider", "Applebot-Extended", "meta-externalagent"];
const PRIVATE = ["/admin", "/cart", "/checkout", "/wishlist", "/print"];

/** /robots.txt: shop open to search engines; private pages closed; optional AI crawler block. */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const s = await getSettings();
  const blockAi = s.ai_crawlers === "block";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      ...(blockAi ? [{ userAgent: AI_BOTS, disallow: "/" }] : []),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
