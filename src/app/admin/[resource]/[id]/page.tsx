import { notFound } from "next/navigation";
import ResourceForm from "@/components/admin/ResourceForm";
import { RESOURCES } from "@/lib/admin-config";

/** /admin/<resource>/new adds a row; /admin/<resource>/<id> edits one (categories, brands, bikes, pages…). */
export default async function ResourceItemPage({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = await params;
  const R = RESOURCES[resource];
  if (!R) notFound();
  return <ResourceForm key={`${resource}-${id}`} resource={R} slug={resource} id={id} />;
}
