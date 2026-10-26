import { Link2, Linkedin, ShoppingBag } from "lucide-react";
import type { Network } from "@/lib/social";

/** Brand mark for a social network (simple-icons path, or a lucide fallback). Uses currentColor. */
export default function SocialIcon({ net, size = 18 }: { net: Network; size?: number }) {
  if (net.icon === "linkedin") return <Linkedin size={size} />;
  if (net.icon === "daraz") return <ShoppingBag size={size} />;
  if (net.icon === "link") return <Link2 size={size} />;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d={net.icon.path} />
    </svg>
  );
}
