-- =====================================================================
-- Al Bashir Autos: FAQ page (/faq) with topics + more common questions
-- Edit in Admin > FAQs. Safe to run again (adds a question only once).
-- =====================================================================

alter table public.faqs add column if not exists topic text default 'orders';

update public.faqs set topic = 'delivery' where question in ('Do you deliver outside Okara?', 'How fast will my order ship?');
update public.faqs set topic = 'parts'    where question = 'I am not sure which part fits my bike.';
update public.faqs set topic = 'returns'  where question = 'What if I receive the wrong part?';
update public.faqs set topic = 'orders'   where question in ('Can I order on WhatsApp instead of the website?', 'Do you have bulk schemes for workshops?');

insert into public.faqs (question, answer, topic, sort_order)
select v.q, v.a, v.t, v.o from (values
  ('How do I place an order?', 'Add the parts to your cart and press Checkout. Enter your name, phone and address, choose how you will pay and press Place order. We then call or WhatsApp you to confirm before we send it.', 'orders', 10),
  ('Which payment methods do you accept?', 'JazzCash, EasyPaisa and bank transfer (whichever are shown at checkout). Choose one, send the amount to the account shown, and add the transaction ID. Only pay into the accounts shown at checkout.', 'orders', 11),
  ('Do you offer cash on delivery?', 'Not on website orders at the moment. Payment is by JazzCash, EasyPaisa or bank transfer. If you have a question before paying, call or WhatsApp us first.', 'orders', 12),
  ('Can I change or cancel my order?', 'Yes, until it is dispatched. Call or WhatsApp us with your order number as soon as possible.', 'orders', 13),
  ('How much is delivery?', 'The delivery charge for your city is shown at checkout before you place the order.', 'delivery', 20),
  ('How can I track my order?', 'Open Track my order (at the bottom of every page) and enter your order number and phone number. You will see each step from confirmed to delivered.', 'delivery', 21),
  ('My parcel arrived damaged or a part is missing.', 'Please take a photo and tell us on WhatsApp within 24 hours of delivery. We will send the missing part or replace the damaged one.', 'delivery', 22),
  ('Are your parts genuine?', 'Yes. We are an authorised dealer of TQR, ISH, RP, DYL Lubricants and Odiking, and every product page shows the brand. If a part is a quality replacement and not company original, the product page says so.', 'parts', 30),
  ('How do I find parts for my bike?', 'Use Shop by bike in the menu, or Find parts for your bike on the home page, and choose your model. You will see only the parts that fit it.', 'parts', 31),
  ('A part I need is not on the website.', 'We have many more parts in the shop than online. Send the part name or a photo on WhatsApp and we will check stock and price for you.', 'parts', 32),
  ('Do parts come with a warranty?', 'Some parts, such as batteries, have a company warranty. It is written on the product page. Keep your bill, and we will help you claim it.', 'returns', 40),
  ('Which parts cannot be returned?', 'Parts that have been fitted, used, burnt or damaged, and electrical parts once installed. Unused parts in their original packing can be exchanged within 7 days.', 'returns', 41),
  ('Where is your shop?', 'Pakpattan Road, opposite MCB Bank, Haveli Lakha, Tehsil Depalpur, District Okara. Directions and the map are on the Contact page.', 'shop', 50),
  ('What are your shop timings?', 'Saturday to Thursday 8:00 am to 8:00 pm, and Friday 8:00 am to 1:00 pm. The website shows Open now or Closed automatically.', 'shop', 51)
) as v(q, a, t, o)
where not exists (select 1 from public.faqs f where f.question = v.q);

-- Terms: payment is JazzCash / EasyPaisa / bank transfer (no cash on delivery on website orders)
update public.pages set content = regexp_replace(content, '<h2>Payment</h2>.*?(?=<h2>Delivery</h2>)', $html$<h2>Payment</h2>
<ul>
  <li>Website orders are paid by <strong>JazzCash, EasyPaisa or bank transfer</strong>, whichever are shown at checkout. Cash on delivery is not offered on website orders at the moment.</li>
  <li>Send the amount only to the account shown at checkout, and add your transaction ID or send us the payment screenshot. We will never ask you to pay into a different number by phone call.</li>
  <li>We send your order after we confirm it with you and check your payment.</li>
  <li>If we cannot supply your order, or you cancel before dispatch, we return your payment to the same account.</li>
</ul>

$html$)
where slug = 'terms' and content like '%Cash on delivery:%';
