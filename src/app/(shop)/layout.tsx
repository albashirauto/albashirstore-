import CartProvider from "@/components/CartProvider";
import FloatingContact from "@/components/FloatingContact";
import Footer from "@/components/footer/Footer";
import Analytics from "@/components/Analytics";
import Header from "@/components/Header";
import WishlistProvider from "@/components/wishlist/WishlistProvider";
import { getBrands, getCategories, getPages, getSettings, getVehicles } from "@/lib/data";

export const revalidate = 60;

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, vehicles, brands, pages] = await Promise.all([getSettings(), getCategories(), getVehicles(), getBrands(), getPages()]);
  return (
    <WishlistProvider>
    <CartProvider shipping={Number(settings.shipping_flat || 400)}>
      <Header settings={settings} categories={categories} vehicles={vehicles} brands={brands} />
      <main id="main">{children}</main>
      <Footer settings={settings} categories={categories} pages={pages} />
      <FloatingContact whatsapp={settings.whatsapp} />
      <Analytics s={settings} />
    </CartProvider>
    </WishlistProvider>
  );
}
