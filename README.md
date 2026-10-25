# Al Bashir Autos: Online Store + Admin CMS

Next.js (App Router) + Tailwind CSS v4 + Supabase + Motion animations.
White background, blue main colour, red accents, dark/light switch.

## 1. Run it on your computer (demo mode, no database needed)

```bash
npm install
npm run dev
```

Open http://localhost:3000. The store shows built-in demo products until you connect Supabase.

## 2. Connect Supabase (real data + admin panel)

1. Create a free project at https://supabase.com.
2. Open **SQL Editor > New query**, paste everything from `supabase/schema.sql`, click **Run**.
   This creates all tables, security rules, the `media` image bucket and starter content.
3. Copy `.env.example` to `.env.local` and fill in **Project URL** and **anon public key**
   (Supabase > Project Settings > API).
4. Create your admin login: Supabase > **Authentication > Users > Add user** (email + password).
5. Make that user an admin: SQL Editor, run (change the email to yours):
   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'albashirauto@gmail.com';
   ```
6. Restart `npm run dev`, then open http://localhost:3000/admin and sign in.

## 3. What you can manage in /admin

| Section | What it controls |
|---|---|
| Products | name, price, old price (discount), stock, photos, category, brand, bike, promotion, trending / staff picks |
| Categories | menu + home page category tiles |
| Brands | Honda, RP Speedo, ISH, TQR… |
| Bikes & companies | CD 70, CG 125, rickshaw, loader, cycle models (the "Shop by bike" menu) |
| Promotions | Deal zone offers; assign products from the product form |
| Home banners | the big sliding banners (text, button, link, picture) |
| Pages | About, Contact, policies, any new page at `/pages/your-slug` (HTML editor with preview) |
| Testimonials, Trust bar | review cards and the 4 highlights under the banner |
| Store settings | name, phone, WhatsApp, address, announcement bar, delivery charges |
| Orders | customer orders with status (new, confirmed, shipped, delivered, cancelled) |

Changes appear on the website within about a minute.

## 4. Your logo and favicon

- Put your favicon at `src/app/favicon.ico`.
- The header logo is `src/components/Logo.tsx` (a blue gear with a B placeholder). Put your file in
  `public/logo.png` and replace the SVG with `<Image src="/logo.png" alt="" width={160} height={48} />`.

## 5. Deploy

Push to GitHub, import the repo in Vercel, add the same two environment variables, deploy.

## Project map

```
src/app/(shop)/      storefront pages (home, shop, collections, products, cart, checkout, pages…)
src/app/admin/       admin panel (dashboard, orders, settings, generic manager for every table)
src/components/      Header, HeroSlider, ProductCard, CartProvider, admin/ResourceManager…
src/lib/data.ts      reads from Supabase (falls back to demo data)
src/lib/admin-config.ts   the list of fields the admin forms show. Add a field here to edit it.
supabase/schema.sql  database, security rules, starter data
```

## Notes

- At checkout the server re-reads prices from the database, so customers cannot change prices.
- To add online payment (JazzCash, Easypaisa, card), add it inside `placeOrder` in `src/app/actions.ts`.
- Only users listed in the `admins` table can change data (enforced by Supabase row-level security, not just the UI).
