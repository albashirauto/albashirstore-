import ProductEditor from "@/components/admin/products/ProductEditor";

/** /admin/products/new adds a product; /admin/products/<id> edits one. */
export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductEditor key={id} id={id} />;
}
