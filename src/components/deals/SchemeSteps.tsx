import { Gift, PackageCheck, ShoppingCart } from "lucide-react";
import Reveal from "@/components/Reveal";

const STEPS = [
  { icon: ShoppingCart, title: "Pick a scheme item", body: "Look for the green “Buy 20 Get 5 Free” tag." },
  { icon: Gift, title: "Order the set quantity", body: "Add 20, 40 or 60 pieces. Free pieces show in your cart." },
  { icon: PackageCheck, title: "Get the free pieces", body: "We pack them with your order at no extra cost." },
];

/** "How schemes work": one card, three steps, overlapping the banner. */
export default function SchemeSteps() {
  return (
    <section className="relative z-10 mx-auto -mt-12 max-w-7xl px-4">
      <Reveal y={18}>
        <ol className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line shadow-xl shadow-brand-900/[0.07] md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="group flex items-start gap-4 bg-card p-6">
              <span className="relative grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-green-600/10 text-green-700 transition duration-300 group-hover:bg-green-600 group-hover:text-white dark:text-green-400">
                <Icon size={22} />
                <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-brand-900 text-[11px] font-bold text-white dark:bg-white dark:text-brand-900">{i + 1}</span>
              </span>
              <div>
                <h3 className="text-lg font-bold leading-tight">{title}</h3>
                <p className="mt-1 text-sm text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}
