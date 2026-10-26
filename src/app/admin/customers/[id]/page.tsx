import CustomerForm from "@/components/admin/customers/CustomerForm";

/** /admin/customers/new adds a customer (?phone= fills it from their orders); /admin/customers/<id> edits one. */
export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerForm key={id} id={id} />;
}
