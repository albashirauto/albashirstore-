import Link from "next/link";
import { Bike } from "lucide-react";
import Reveal from "@/components/Reveal";
import { getVehicles } from "@/lib/data";

export const metadata = { title: "Shop by bike" };
export const revalidate = 60;

export default async function Vehicles() {
  const vehicles = await getVehicles();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-5xl font-extrabold uppercase text-brand-700 dark:text-white">Shop by bike</h1>
      <p className="mt-2 text-muted">Pick your model to see parts that fit.</p>
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {vehicles.map((v, i) => (
          <Reveal key={v.id} delay={(i % 4) * 0.05}>
            <Link href={`/vehicles/${v.slug}`} className="group flex h-40 flex-col items-center justify-center gap-2 rounded-3xl border border-line bg-card text-center transition hover:-translate-y-1 hover:border-brand-500 hover:shadow-xl">
              <Bike className="text-brand-500 transition group-hover:scale-125 group-hover:text-hot" size={34} />
              <span className="font-display text-2xl font-bold">{v.name}</span>
              <span className="text-xs capitalize text-muted">{v.type}</span>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
