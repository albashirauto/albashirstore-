import { notFound, redirect } from "next/navigation";
import { getPage } from "@/lib/data";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getPage((await params).slug);
  return { title: p?.title ?? "Page" };
}

export default async function CmsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // these two have their own designed pages
  if (slug === "about") redirect("/about");
  if (slug === "contact") redirect("/contact");
  const p = await getPage(slug);
  if (!p) notFound();
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-5xl font-extrabold uppercase text-brand-700 dark:text-white">{p.title}</h1>
      {/* Content is written by the shop owner in the admin panel */}
      <div className="prose-cms mt-6" dangerouslySetInnerHTML={{ __html: p.content ?? "" }} />
    </div>
  );
}
