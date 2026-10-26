// Used by the 404 page (RedirectCheck): new address for an old link (Admin > Redirects), or null after logging the miss.
// A fixed API route, because a server action posts to the current URL, and a missing URL has no route to answer it.
import { hasSupabase, serverClient } from "@/lib/supabase";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { path?: unknown; ref?: unknown } | null;
  const path = typeof body?.path === "string" ? body.path.slice(0, 300) : "";
  if (!hasSupabase || !path.startsWith("/")) return Response.json({ to: null });
  const { data } = await serverClient().rpc("resolve_path", { p_path: path, p_ref: typeof body?.ref === "string" ? body.ref.slice(0, 300) : "" });
  return Response.json({ to: typeof data === "string" && data ? data : null });
}
