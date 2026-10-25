import Link from "next/link";
import { Bike, ClipboardList, FilePlus2, Gift, PackagePlus, Settings } from "lucide-react";

const ACTIONS = [
  { href: "/admin/products", label: "Add product", icon: PackagePlus },
  { href: "/admin/vehicles", label: "Add vehicle", icon: Bike },
  { href: "/admin/orders?status=new", label: "Pending orders", icon: ClipboardList },
  { href: "/admin/products", label: "Set a scheme", icon: Gift },
  { href: "/admin/orders?new=1", label: "New order", icon: FilePlus2 },
  { href: "/admin/settings", label: "Store settings", icon: Settings },
];

export default function QuickActions() {
  return (
    <div className="rounded-2xl border border-line bg-card p-5 md:p-6">
      <h3 className="text-xl font-bold">Quick actions</h3>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {ACTIONS.map(({ href, label, icon: Icon }) => (
          <Link key={label} href={href} className="group flex flex-col items-center gap-2 rounded-xl border border-line p-3 text-center text-xs font-bold transition hover:-translate-y-0.5 hover:border-brand-500/50 hover:text-brand-600">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-900"><Icon size={18} /></span>
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
