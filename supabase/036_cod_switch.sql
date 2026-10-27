-- =====================================================================
-- Al Bashir Autos: cash on delivery switch (Admin > Settings > Delivery & payments)
-- Off (default): checkout, Terms and FAQ never mention cash on delivery.
-- On: checkout offers it, and {{tokens}} in Terms / FAQ fill in the details.
-- Safe to run again.
-- =====================================================================

insert into public.settings (key, value) values ('cod_enabled', ''), ('cod_fee', ''), ('cod_max', ''), ('cod_note', '')
on conflict (key) do nothing;

-- Terms: payment section follows the switch
update public.pages set content = regexp_replace(content, '<h2>Payment</h2>.*?(?=<h2>Delivery</h2>)', $html$<h2>Payment</h2>
<ul>
  <li>Website orders are paid by {{payment_methods}}, as shown at checkout.</li>
  <li>{{cod_terms}}</li>
  <li>For JazzCash, Easypaisa or bank transfer, send the amount only to the account shown at checkout, and add your transaction ID or send us the payment screenshot. We will never ask you to pay into a different number by phone call.</li>
  <li>We send your order after we confirm it with you by phone, and for online payments after we check your payment.</li>
  <li>If we cannot supply your order, or you cancel before dispatch, we return any payment you made to the same account.</li>
</ul>

$html$)
where slug = 'terms' and content like '%Cash on delivery is not offered%';

-- FAQ: the cash on delivery answer is added automatically when the switch is on
delete from public.faqs where question = 'Do you offer cash on delivery?';
update public.faqs
set answer = '{{payment_methods}}, whichever you choose at checkout. For JazzCash, Easypaisa or bank transfer, send the amount only to the account shown at checkout and add the transaction ID.'
where question = 'Which payment methods do you accept?' and answer like 'JazzCash, EasyPaisa and bank transfer (whichever are shown at checkout)%';
