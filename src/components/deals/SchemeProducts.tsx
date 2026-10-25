import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import SectionTitle from "@/components/SectionTitle";
import type { Product } from "@/lib/types";

/** Preview of scheme items with a link to the full list. */
export default function SchemeProducts({ products, total }: { products: Product[]; total: number }) {
  if (!products.length) return null;
  return (
    <section className="mx-auto mt-20 max-w-7xl px-4">
      <SectionTitle eyebrow="Bulk schemes" title="Buy more, get free pieces" sub="Ideal for workshops and shops. Free pieces are added automatically." href="/promotions/schemes" cta={`All ${total} scheme items`} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
      </div>
      {total > products.length && (
        <div className="mt-10 text-center">
          <Link href="/promotions/schemes" className="group inline-flex items-center gap-2 rounded-full bg-green-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-green-600/25 transition hover:-translate-y-0.5 hover:bg-green-700">
            See all {total} scheme items <ArrowRight size={18} className="transition group-hover:translate-x-1" />
          </Link>
        </div>
      )}
    </section>
  );
}
