import { mdiBicycle, mdiMotorbike, mdiRickshaw, mdiTruckFlatbed } from "@mdi/js";

// Solid vehicle icons (Material Design Icons), one per vehicle type; matches the category icon set.
const PATHS: Record<string, string> = { motorcycle: mdiMotorbike, rickshaw: mdiRickshaw, loader: mdiTruckFlatbed, cycle: mdiBicycle };

export default function VehicleIcon({ type, size = 24, className }: { type?: string | null; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="currentColor" d={PATHS[type ?? ""] ?? mdiMotorbike} />
    </svg>
  );
}
