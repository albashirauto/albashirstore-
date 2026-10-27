import CartProvider from "@/components/CartProvider";
import FloatingContact from "@/components/FloatingContact";
import Footer from "@/components/footer/Footer";
import Analytics from "@/components/Analytics";
import Header from "@/components/Header";
import WishlistProvider from "@/components/wishlist/WishlistProvider";
import { feeRange } from "@/lib/delivery";
import CampaignHost from "@/components/campaigns/CampaignHost";
import { getCampaigns, getBrands, getCategories, getPages, getSettings, getVehicles, sellBrands } from "@/lib/data";

export const revalidate = 60;

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, vehicles, brands, pages, camp] = await Promise.all([getSettings(), getCategories(), getVehicles(), getBrands(), getPages(), getCampaigns()]);
  return (
    <WishlistProvider>
    <CartProvider shipping={feeRange(settings).min} shippingMax={feeRange(settings).max} freeOver={Number(settings.shipping_free_over) || 0}>
      <CampaignHost campaigns={camp.campaigns} products={camp.products}>
      <Header settings={settings} categories={categories} vehicles={vehicles} brands={sellBrands(brands)} />
      <main id="main">{children}</main>
      <Footer settings={settings} categories={categories} pages={pages} />
      <FloatingContact whatsapp={settings.whatsapp} />
      <Analytics s={settings} />
      </CampaignHost>
    </CartProvider>
    </WishlistProvider>
  );
}
