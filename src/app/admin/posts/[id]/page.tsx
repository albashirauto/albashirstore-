import PostEditor from "@/components/admin/blog/PostEditor";

/** /admin/posts/new writes a post; /admin/posts/<id> edits one. */
export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostEditor key={id} id={id} />;
}
