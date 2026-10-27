import Image from "next/image";

/** Brand logo if uploaded, otherwise a clean monogram (first letters of the name). */
export default function BrandMark({ name, logo, size = 56, dark = false }: { name: string; logo?: string | null; size?: number; dark?: boolean }) {
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 3).toUpperCase();
  return (
    <span
      style={{ width: size, height: size }}
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-xl font-display font-extrabold tracking-wide transition duration-300 ${
        dark ? "bg-white/10 text-white ring-1 ring-white/15" : "bg-brand-50 text-brand-700 group-hover:bg-brand-600 group-hover:text-white dark:bg-brand-900 dark:text-white"
      } ${logo ? "bg-white!" : ""}`}
    >
      {logo
        ? <Image src={logo} alt={name} fill sizes={`${size}px`} className={`object-contain ${size < 50 ? "p-1" : "p-2"}`} />
        : <span style={{ fontSize: size * 0.36 }}>{initials}</span>}
    </span>
  );
}
