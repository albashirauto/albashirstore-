import Link from "next/link";
import { Package, PlayCircle } from "lucide-react";
import { youtubeId } from "@/lib/video";
import { money } from "@/lib/format";
import type { Product } from "@/lib/types";

/** Lower half of the product page: video, full description, specifications and bundle contents. */
export default function ProductDetails({ p, bundleItems }: { p: Product; bundleItems: { product: Product; qty: number }[] }) {
  const yt = p.video_url ? youtubeId(p.video_url) : null;
  const specs = (p.specs ?? []).filter((s) => s.label && s.value);
  const separate = bundleItems.reduce((n, b) => n + b.product.price * b.qty, 0);
  if (!yt && !p.details_html && !specs.length && !bundleItems.length) return null;

  return (
    <div className="mt-16 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-8">
        {bundleItems.length > 0 && (
          <section className="rounded-2xl border border-line bg-card p-6">
            <h2 className="flex items-center gap-2 text-2xl font-bold"><Package size={22} className="text-brand-600" />What is in this kit</h2>
            <ul className="mt-4 divide-y divide-line">
              {bundleItems.map((b) => (
                <li key={b.product.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <Link href={`/products/${b.product.slug}`} className="font-semibold hover:text-brand-600">{b.qty} × {b.product.name}</Link>
                  <span className="text-muted">{money(b.product.price * b.qty)}</span>
                </li>
              ))}
            </ul>
            {separate > p.price && <p className="mt-3 rounded-xl bg-green-600/10 p-3 text-sm font-semibold text-green-700">Bought separately {money(separate)}. You save {money(separate - p.price)} with this kit.</p>}
          </section>
        )}

        {p.details_html && (
          <section>
            <h2 className="text-3xl font-extrabold uppercase text-brand-900 dark:text-white">Details</h2>
            {/* written by the shop owner in the admin panel */}
            <div className="prose-cms mt-3" dangerouslySetInnerHTML={{ __html: p.details_html }} />
          </section>
        )}

        {yt && (
          <section>
            <h2 className="flex items-center gap-2 text-3xl font-extrabold uppercase text-brand-900 dark:text-white"><PlayCircle size={26} className="text-hot" />Video</h2>
            <div className="mt-3 aspect-video overflow-hidden rounded-2xl border border-line">
              <iframe title={`${p.name} video`} src={`https://www.youtube-nocookie.com/embed/${yt}`} loading="lazy" allowFullScreen className="h-full w-full" />
            </div>
          </section>
        )}
      </div>

      {specs.length > 0 && (
        <section className="h-fit rounded-2xl border border-line bg-card p-6 lg:sticky lg:top-44">
          <h2 className="text-2xl font-bold">Specifications</h2>
          <dl className="mt-4 divide-y divide-line text-sm">
            {specs.map((s, i) => (
              <div key={i} className="grid grid-cols-[2fr_3fr] gap-3 py-2.5">
                <dt className="text-muted">{s.label}</dt><dd className="font-semibold">{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
    </div>
  );
}
