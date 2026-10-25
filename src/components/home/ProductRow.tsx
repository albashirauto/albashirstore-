import ProductCard from "@/components/ProductCard";
import SectionTitle from "@/components/SectionTitle";
import type { Product } from "@/lib/types";

/** Titled product grid. Used by "Trending now" and "Staff picks". */
export default function ProductRow({ title, sub, href, eyebrow, products }: { title: string; sub?: string; href?: string; eyebrow?: string; products: Product[] }) {
  if (!products.length) return null;
  return (
    <section className="mx-auto mt-24 max-w-7xl px-4">
      <SectionTitle eyebrow={eyebrow} title={title} sub={sub} href={href} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
      </div>
    </section>
  );
}
