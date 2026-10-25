import Image from "next/image";
import { Cog } from "lucide-react";

/** Shows the product photo, or a branded placeholder until you upload one in the admin panel. */
export default function ProductImage({ src, alt, sizes = "(max-width:768px) 50vw, 25vw", priority = false }: { src?: string | null; alt: string; sizes?: string; priority?: boolean }) {
  if (src) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover transition duration-500 group-hover:scale-105" />;
  }
  return (
    <div className="relative grid h-full w-full place-items-center overflow-hidden bg-gradient-to-br from-brand-50 via-white to-brand-100 dark:from-brand-900 dark:via-bg dark:to-brand-900" aria-label={alt} role="img">
      <div className="absolute inset-0 grid-bg opacity-40" />
      <Cog className="relative text-brand-500/50 transition duration-700 group-hover:rotate-45 group-hover:text-brand-600" size={52} strokeWidth={1.4} />
    </div>
  );
}
