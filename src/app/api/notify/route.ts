// Called by the database (supabase/014_notifications.sql) when an order or product changes.
// Checks the shared secret, then emails the recipients who want this kind of event.
import { timingSafeEqual } from "node:crypto";
import { KINDS, deliver, type Kind } from "@/lib/notify";
import { adminClient, hasServiceKey } from "@/lib/supabaseAdmin";

const same = (a: string, b: string) => a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));

export async function POST(req: Request) {
  if (!hasServiceKey()) return Response.json({ ok: false, error: "no server key" }, { status: 503 });
  const db = adminClient();
  const { data: cfg } = await db.from("notify_config").select("secret").eq("id", 1).maybeSingle();
  if (!cfg?.secret || !same(req.headers.get("x-notify-secret") ?? "", cfg.secret)) return Response.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => null) as { event?: string; id?: string } | null;
  const kind = KINDS.find((k) => k.key === body?.event)?.key as Kind | undefined;
  if (!kind || !body?.id || !/^[0-9a-f-]{36}$/i.test(body.id)) return Response.json({ ok: false, error: "bad event" }, { status: 400 });

  try {
    const sent = await deliver(kind, body.id);
    await db.from("notify_config").update({ last_error: null, updated_at: new Date().toISOString() }).eq("id", 1);
    return Response.json({ ok: true, sent });
  } catch (e) {
    const msg = `${new Date().toISOString()} · ${kind}: ${(e as Error).message}`.slice(0, 500);
    await db.from("notify_config").update({ last_error: msg }).eq("id", 1);
    return Response.json({ ok: false, error: "send failed" }, { status: 500 });
  }
}
