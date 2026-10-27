import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import Reveal from "@/components/Reveal";
import type { Faq } from "@/lib/types";


/** Contact page questions (Admin > FAQs). */
export default function ContactFaq({ items }: { items: Faq[] }) {
  if (!items.length) return null;
  return (
    <Reveal y={18}>
      <div className="rounded-2xl border border-line bg-card p-6 md:p-8">
        <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-hot"><span className="h-px w-6 bg-hot" />Quick answers</p>
        <h2 className="text-4xl font-extrabold uppercase leading-none text-brand-900 dark:text-white">Common questions</h2>
        <div className="mt-5 divide-y divide-line">
          {items.slice(0, 6).map((f, i) => (
            // same `name` = only one answer open at a time (browser closes the previous one)
            <details key={f.id} name="contact-faq" open={i === 0} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
                {f.question}
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-soft text-brand-600 transition duration-300 group-open:rotate-45 group-open:bg-brand-600 group-open:text-white"><Plus size={15} /></span>
              </summary>
              <p className="mt-2 whitespace-pre-line pr-10 leading-relaxed text-muted">{f.answer}</p>
            </details>
          ))}
        </div>
        <Link href="/faq" className="group mt-4 inline-flex items-center gap-1.5 font-bold text-brand-600 transition hover:text-hot">See all {items.length} questions<ArrowRight size={16} className="transition group-hover:translate-x-1" /></Link>
      </div>
    </Reveal>
  );
}
