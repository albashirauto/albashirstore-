// Blog helpers shared by the admin (list + editor) and the public blog pages.
import type { Post } from "./types";
import type { SeoInput } from "./seo";

export type PostStatus = "published" | "scheduled" | "draft" | "trash";

export const postStatus = (p: Pick<Post, "active" | "published_at" | "deleted_at">, now = Date.now()): PostStatus =>
  p.deleted_at ? "trash" : !p.active ? "draft" : new Date(p.published_at).getTime() > now ? "scheduled" : "published";

export const STATUS_STYLE: Record<PostStatus, { label: string; cls: string }> = {
  published: { label: "Published", cls: "bg-green-100 text-green-800" },
  scheduled: { label: "Scheduled", cls: "bg-purple-100 text-purple-800" },
  draft: { label: "Draft", cls: "bg-amber-100 text-amber-800" },
  trash: { label: "In trash", cls: "bg-hot/10 text-hot" },
};

export const stripHtml = (h: string) => h.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
export const wordCount = (h: string) => (stripHtml(h).match(/[\p{L}\p{N}']+/gu) ?? []).length;
/** ~200 words a minute, at least 1 */
export const readingMinutes = (h: string) => Math.max(1, Math.round(wordCount(h) / 200));

export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80);

/** Gives every H2/H3 an id (for the table of contents and #links) and returns the list. */
export function withHeadingIds(html: string) {
  const toc: { id: string; text: string; level: 2 | 3 }[] = [];
  const used = new Set<string>();
  const out = html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_m, lvl: string, attrs: string, inner: string) => {
    const text = stripHtml(inner);
    let id = (attrs.match(/\sid="([^"]+)"/)?.[1]) || slugify(text) || "section";
    for (let n = 2; used.has(id); n++) id = `${slugify(text)}-${n}`;
    used.add(id);
    toc.push({ id, text, level: Number(lvl) as 2 | 3 });
    return `<h${lvl}${attrs.replace(/\sid="[^"]*"/, "")} id="${id}">${inner}</h${lvl}>`;
  });
  return { html: out, toc };
}

/** Rank Math-style input for one post. */
export function postSeoInput(p: Pick<Post, "title" | "slug" | "excerpt" | "content_html" | "seo_title" | "seo_description" | "focus_keywords" | "cover" | "cover_alt">, others: Pick<Post, "focus_keywords">[], sitename = "Al Bashir Autos"): SeoInput {
  const html = p.content_html ?? "";
  const imgs = html.match(/<img\b[^>]*>/gi) ?? [];
  const alts = imgs.map((t) => t.match(/\salt="([^"]*)"/i)?.[1] ?? "");
  return {
    kind: "post",
    keywords: (p.focus_keywords ?? "").split(",").map((k) => k.trim()).filter(Boolean),
    title: p.seo_title || `${p.title} | ${sitename}`,
    description: p.seo_description || p.excerpt || "",
    slug: p.slug,
    name: p.title,
    shortDesc: "",
    html,
    images: imgs.length + (p.cover ? 1 : 0),
    alts: [...alts, ...(p.cover ? [p.cover_alt || p.title] : [])],
    video: /<iframe[^>]+(youtube|vimeo)/i.test(html),
    specs: 0,
    otherKeywords: others.map((o) => (o.focus_keywords ?? "").split(",")[0]?.trim()).filter(Boolean) as string[],
  };
}

export const SCHEMA_TYPES = [
  { v: "BlogPosting", l: "Blog post", d: "Tips, guides, news from the shop (best for most posts)" },
  { v: "Article", l: "Article", d: "Longer evergreen article" },
  { v: "NewsArticle", l: "News", d: "Time-sensitive news (new stock, price changes)" },
];
