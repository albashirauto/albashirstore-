import CartProvider from "@/components/CartProvider";
import FloatingContact from "@/components/FloatingContact";
import Footer from "@/components/footer/Footer";
import Analytics from "@/components/Analytics";
import Header from "@/components/Header";
import WishlistProvider from "@/components/wishlist/WishlistProvider";
import { feeRange } from "@/lib/delivery";
import { getBrands, getCategories, getPages, getSettings, getVehicles } from "@/lib/data";

export const revalidate = 60;

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, vehicles, brands, pages] = await Promise.all([getSettings(), getCategories(), getVehicles(), getBrands(), getPages()]);
  return (
    <WishlistProvider>
    <CartProvider shipping={feeRange(settings).min} shippingMax={feeRange(settings).max} freeOver={Number(settings.shipping_free_over) || 0}>
      <Header settings={settings} categories={categories} vehicles={vehicles} brands={brands} />
      <main id="main">{children}</main>
      <Footer settings={settings} categories={categories} pages={pages} />
      <FloatingContact whatsapp={settings.whatsapp} />
      <Analytics s={settings} />
    </CartProvider>
    </WishlistProvider>
  );
}
