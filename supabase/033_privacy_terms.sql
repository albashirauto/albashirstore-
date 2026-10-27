-- =====================================================================
-- Al Bashir Autos: Privacy policy + Terms & conditions pages
-- Edit them any time in Admin > Pages. "Last updated" follows each edit.
-- Safe to run again (never overwrites a page you already edited).
-- =====================================================================

-- pages: keep updated_at current on every edit (shown as "Last updated")
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists pages_touch on public.pages;
create trigger pages_touch before update on public.pages for each row execute function public.touch_updated_at();

insert into public.pages (title, slug, show_in_footer, active, content) values
('Privacy policy', 'privacy-policy', true, true, $html$
<p>This policy explains what information Al Bashir Autos collects when you use this website or order from us, why we collect it, and how we keep it safe. We only collect what we need to deliver your parts and help you.</p>

<h2>Who we are</h2>
<p>Al Bashir Autos is a motorcycle, rickshaw, loader and cycle spare parts shop on Pakpattan Road, opposite MCB Bank, Haveli Lakha, Tehsil Depalpur, District Okara, Pakistan. You can reach us by email at <a href="mailto:albashirauto@gmail.com">albashirauto@gmail.com</a> or on the numbers shown on our <a href="/contact">Contact page</a>.</p>

<h2>What we collect</h2>
<ul>
  <li><strong>Order details:</strong> your name, phone number, delivery address, city, optional email, the parts you order and any note you add.</li>
  <li><strong>Messages:</strong> what you send us through the contact form, WhatsApp or a product review (your name and review are shown publicly on the product).</li>
  <li><strong>Newsletter:</strong> your email or phone if you sign up for offers.</li>
  <li><strong>Payment proof:</strong> if you pay by JazzCash, EasyPaisa or bank transfer, the transaction ID or screenshot you share. We never see or store your card, wallet PIN or bank password.</li>
  <li><strong>Website use:</strong> basic technical data such as pages visited, device and browser type, collected by analytics tools to improve the website.</li>
  <li><strong>Your cart and wishlist</strong> are saved in your own browser. If you start checkout and type your phone number, we may save the cart so we can help you finish the order.</li>
</ul>

<h2>Why we use it</h2>
<ul>
  <li>To confirm your order by phone, pack it, deliver it and send you its tracking status.</li>
  <li>To answer your questions and help you find the part that fits your bike.</li>
  <li>To handle exchanges, returns and warranty questions.</li>
  <li>To send offers only if you asked for them. You can stop them at any time.</li>
  <li>To keep the website working, safe and easy to use.</li>
</ul>

<h2>Who we share it with</h2>
<p>We do not sell your information. We share only what is needed:</p>
<ul>
  <li><strong>Courier companies</strong> get your name, phone and address to deliver your parcel.</li>
  <li><strong>Service providers</strong> that run this website (hosting, database and email) store data for us under their own security rules.</li>
  <li><strong>Analytics and advertising tools</strong> such as Google Analytics or Meta (Facebook) Pixel may receive anonymous website-use data, if they are switched on.</li>
  <li><strong>The law:</strong> if a Pakistani authority lawfully asks for it.</li>
</ul>

<h2>Cookies</h2>
<p>The website uses small files in your browser (cookies and local storage) to remember your cart, wishlist, light or dark mode, and offers you have already closed. Analytics tools may also set cookies. You can clear or block them in your browser settings; the shop will still work, but your cart may be forgotten.</p>

<h2>How long we keep it</h2>
<p>We keep order records for as long as we need them for accounts, tax and warranty, usually a few years. Messages and newsletter details are kept until you ask us to remove them.</p>

<h2>Keeping it safe</h2>
<p>Your data is stored on secure servers with encrypted connections (https). Only the shop owners and staff they allow can see orders, and each staff member sees only the sections they need.</p>

<h2>Your choices</h2>
<p>You can ask us to show, correct or delete the information we hold about you, or to stop sending you offers. Message us on WhatsApp or email <a href="mailto:albashirauto@gmail.com">albashirauto@gmail.com</a> and we will reply within a few working days. We may keep what the law requires (for example, past invoices).</p>

<h2>Children</h2>
<p>This website is meant for adults. We do not knowingly collect information from children under 13.</p>

<h2>Changes</h2>
<p>If we change this policy, the new version will appear on this page with a new "Last updated" date.</p>
$html$),
('Terms & conditions', 'terms', true, true, $html$
<p>These terms apply when you use this website or order from Al Bashir Autos. By placing an order you agree to them. If something here is not clear, call or WhatsApp us before you order.</p>

<h2>About us</h2>
<p>Al Bashir Autos, Pakpattan Road, opposite MCB Bank, Haveli Lakha, Tehsil Depalpur, District Okara, Pakistan. Email: <a href="mailto:albashirauto@gmail.com">albashirauto@gmail.com</a>. Phone and WhatsApp numbers are on our <a href="/contact">Contact page</a>.</p>

<h2>Products and fitment</h2>
<ul>
  <li>We sell genuine and good-quality replacement parts for motorcycles, rickshaws, loaders, cycles and generators. Each product page says which brand it is.</li>
  <li>Pictures are for guidance. Colour, packaging or small design details may differ from the photo.</li>
  <li>"Fits" lists are given in good faith. If you are not sure a part fits, send us your bike model or a photo of the old part before ordering. We are happy to check.</li>
</ul>

<h2>Prices</h2>
<ul>
  <li>All prices are in Pakistani Rupees (Rs.). Delivery charges are shown at checkout.</li>
  <li>Prices can change without notice. The price on your confirmed order is the price you pay.</li>
  <li>If a price is shown wrongly by mistake, we will call you before dispatch; you can accept the correct price or cancel.</li>
</ul>

<h2>Orders</h2>
<ul>
  <li>After you place an order we call or WhatsApp you to confirm it. We dispatch only confirmed orders.</li>
  <li>If a part is out of stock, we will offer a replacement, a wait time, or remove it from the order.</li>
  <li>We may cancel an order we cannot confirm, for example if the phone number does not answer or the address is incomplete.</li>
  <li>Scheme offers (for example "buy 10, get 1 free") and coupons apply only as shown, cannot be swapped for cash, and may end at any time.</li>
</ul>

<h2>Payment</h2>
<ul>
  <li><strong>Cash on delivery:</strong> pay the rider when the parcel arrives.</li>
  <li><strong>JazzCash, EasyPaisa or bank transfer:</strong> use only the account details shown at checkout and send us the payment proof. We will never ask you to pay into a personal number by phone call.</li>
  <li>Refusing a cash-on-delivery parcel without a valid reason may mean we ask for advance payment on your next order.</li>
</ul>

<h2>Delivery</h2>
<p>We deliver across Pakistan through courier partners, and you can also collect from the shop. Delivery times are estimates; see our <a href="/pages/delivery">Delivery information</a> page. Please check the parcel when it arrives and tell us within 24 hours if anything is missing or damaged.</p>

<h2>Exchange and returns</h2>
<p>If you receive the wrong or a faulty part, you can exchange it within 7 days in its original condition and packaging. Fitted, used, burnt or damaged electrical parts cannot be returned. Full details are in our <a href="/pages/refund-policy">Refund &amp; exchange policy</a>.</p>

<h2>Warranty</h2>
<p>Some parts, such as batteries, carry a company warranty. The warranty is given by the manufacturer under its own rules; we will help you claim it. Damage from wrong fitting, accidents or misuse is not covered.</p>

<h2>Fitting and safety</h2>
<p>Brake, steering, wheel and electrical parts should be fitted by a trained mechanic. We are not responsible for loss or injury caused by wrong fitting or misuse of a part.</p>

<h2>Reviews and content</h2>
<p>Reviews you post must be honest and polite. We may remove reviews that are abusive, fake or advertising. All text, photos and logos on this website belong to Al Bashir Autos or to the brands shown, and may not be copied without permission.</p>

<h2>Our responsibility</h2>
<p>If something goes wrong with an order, the most we are responsible for is the price you paid for that order. Nothing in these terms takes away your rights under Pakistani consumer law.</p>

<h2>Law</h2>
<p>These terms follow the laws of Pakistan. We will always try to solve any problem by talking with you first.</p>

<h2>Changes</h2>
<p>We may update these terms. The version on this page, with its "Last updated" date, applies to new orders.</p>
$html$)
on conflict (slug) do nothing;
