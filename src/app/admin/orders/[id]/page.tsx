import OrderForm from "@/components/admin/orders/OrderForm";

/** /admin/orders/new adds an order; /admin/orders/<id> edits one. */
export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderForm key={id} id={id} />;
}
