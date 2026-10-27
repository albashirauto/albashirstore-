import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronDown, FileText, Mail, Phone } from "lucide-react";
import PageHero from "@/components/PageHero";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { getPage, getPages, getSettings } from "@/lib/data";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getPage((await params).slug);
  return { title: p?.title ?? "Page", alternates: p ? { canonical: `/pages/${p.slug}` } : undefined };
}

const POLICY = /privacy|terms|refund|return|delivery|shipping|warranty|policy/;
const slugify = (t: string) => t.replace(/<[^>]+>/g, "").toLowerCase().replace(/&amp;/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Give every <h2> an id, and list them for "On this page". */
function withAnchors(html: string) {
  const toc: { id: string; text: string }[] = [];
  const out = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/g, (_, attrs: string, inner: string) => {
    let id = slugify(inner) || `section-${toc.length + 1}`;
    if (toc.some((t) => t.id === id)) id += `-${toc.length + 1}`;
    toc.push({ id, text: inner.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim() });
    return `<h2${attrs.replace(/\sid="[^"]*"/, "")} id="${id}">${inner}</h2>`;
  });
  return { html: out, toc };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // these two have their own designed pages
  if (slug === "about") redirect("/about");
  if (slug === "contact") redirect("/contact");
  const [p, pages, settings] = await Promise.all([getPage(slug), getPages(), getSettings()]);
  if (!p) notFound();

  // Content is written by the shop owner in the admin panel
  const { html, toc } = withAnchors(p.content ?? "");
  const policy = POLICY.test(slug);
  const updated = p.updated_at ? new Date(p.updated_at).toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" }) : null;
  const others = pages.filter((x) => x.slug !== slug && x.show_in_footer !== false && !["about", "contact"].includes(x.slug));

  return (
    <>
      <PageHero crumb={p.title} eyebrow={policy ? "Store policy" : "Al Bashir Autos"} title={p.title} sub={updated ? `Last updated ${updated}` : undefined} />

      <div className="relative z-10 mx-auto -mt-14 grid max-w-7xl gap-6 px-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-8">
        <article className="min-w-0 rounded-3xl border border-line bg-card p-5 shadow-sm sm:p-8 md:p-10">
          {toc.length > 2 && (
            <details className="group mb-6 rounded-2xl border border-line bg-soft/60 lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-bold">
                On this page <ChevronDown size={18} className="transition group-open:rotate-180" />
              </summary>
              <ol className="space-y-1 px-4 pb-4 text-sm">
                {toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className="block py-1 text-muted transition hover:text-brand-600">{t.text}</a></li>)}
              </ol>
            </details>
          )}
          <div className="prose-cms prose-article [&>*:first-child]:mt-0" dangerouslySetInnerHTML={{ __html: html }} />
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          {toc.length > 2 && (
            <nav aria-label="On this page" className="hidden rounded-2xl border border-line bg-card p-5 lg:block">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">On this page</p>
              <ol className="mt-3 space-y-0.5 text-sm">
                {toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className="block rounded-lg px-2 py-1.5 font-semibold text-fg/70 transition hover:bg-soft hover:text-brand-600">{t.text}</a></li>)}
              </ol>
            </nav>
          )}

          <div className="rounded-2xl bg-brand-900 p-5 text-white">
            <p className="font-display text-2xl font-bold uppercase leading-tight">Questions?</p>
            <p className="mt-1 text-sm text-white/70">Ask us before you order. We reply fast.</p>
            <div className="mt-4 space-y-2">
              {settings.whatsapp && <a href={`https://wa.me/${settings.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-full bg-[#25d366] py-2.5 text-sm font-bold text-white transition hover:brightness-110"><WhatsAppIcon size={17} />WhatsApp us</a>}
              {settings.phone && <a href={`tel:${settings.phone}`} className="flex items-center justify-center gap-2 rounded-full bg-white/10 py-2.5 text-sm font-bold transition hover:bg-white/20"><Phone size={16} />{settings.phone}</a>}
              {settings.email && <a href={`mailto:${settings.email}`} className="flex items-center justify-center gap-2 break-all rounded-full py-2 text-sm font-semibold text-white/80 transition hover:text-white"><Mail size={15} />{settings.email}</a>}
            </div>
          </div>

          {others.length > 0 && (
            <div className="rounded-2xl border border-line bg-card p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">More information</p>
              <ul className="mt-3 space-y-1">
                {others.map((o) => <li key={o.id}><Link href={`/pages/${o.slug}`} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-fg/75 transition hover:bg-soft hover:text-brand-600"><FileText size={15} className="shrink-0 text-muted" />{o.title}</Link></li>)}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
