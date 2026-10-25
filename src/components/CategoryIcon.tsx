import { BatteryCharging, Bike, Cog, CircleDot, Disc3, Droplets, Fuel, Gauge, Lightbulb, Link2, Truck, Wind, Zap } from "lucide-react";

const map: Record<string, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  "chain-kits": Link2, batteries: BatteryCharging, "engine-oil": Droplets, lights: Lightbulb, "brakes-clutch": Disc3,
  tyres: CircleDot, "spark-plugs": Zap, speedometers: Gauge, "fuel-tanks": Fuel, silencers: Wind, "rickshaw-parts": Truck, "cycle-parts": Bike,
};

export default function CategoryIcon({ slug, size = 34, className }: { slug: string; size?: number; className?: string }) {
  const Icon = map[slug] ?? Cog;
  return <Icon size={size} strokeWidth={1.6} className={className} />;
}
