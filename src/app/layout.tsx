import type { Metadata, Viewport } from "next";
import "@fontsource-variable/manrope";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "@fontsource/barlow-condensed/800.css";
import "./globals.css";
import { getSettings } from "@/lib/data";
import { verificationMeta } from "@/lib/analytics";

/** Site-wide metadata. Favicon, store name and Google verification come from Admin > Settings. */
export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  const name = s.store_name || "Al Bashir Autos";
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
    title: { default: `${name} | Motorcycle, Rickshaw & Cycle Spare Parts`, template: `%s | ${name}` },
    description: s.tagline ? `${s.tagline}. Genuine parts, delivery all over Pakistan.` : "Genuine and imported spare parts for motorcycles, rickshaws, loaders and cycles. Delivery all over Pakistan.",
    icons: s.favicon ? { icon: s.favicon, apple: s.favicon } : undefined,
    // Google, Bing, Yandex, Pinterest, Facebook (Admin > Settings > Verification & analytics)
    verification: verificationMeta(s),
  };
}
export const viewport: Viewport = { themeColor: "#1d4fd8" };

const themeScript = `try{var t=localStorage.getItem('aba-theme');if(t)document.documentElement.dataset.theme=t;}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body>{children}</body>
    </html>
  );
}
