import { BadgeCheck, Headset, RefreshCcw, ShieldCheck, Tag, Truck } from "lucide-react";

const map = { truck: Truck, shield: ShieldCheck, headset: Headset, refresh: RefreshCcw, tag: Tag, badge: BadgeCheck } as const;

export default function FeatureIcon({ name = "truck", size = 28 }: { name?: string; size?: number }) {
  const Icon = map[name as keyof typeof map] ?? BadgeCheck;
  return <Icon size={size} strokeWidth={1.7} />;
}
