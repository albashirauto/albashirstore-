import { notFound } from "next/navigation";
import ResourceManager from "@/components/admin/ResourceManager";
import { RESOURCES } from "@/lib/admin-config";

export default async function ResourcePage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  const R = RESOURCES[resource];
  if (!R) notFound();
  return <ResourceManager key={resource} resource={R} />;
}
