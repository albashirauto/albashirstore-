"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useMemo, useState } from "react";
import { ArrowLeft, BadgeCheck, Loader2, Search, Star, Trash2, X } from "lucide-react";
import ImageField from "@/components/admin/ImageField";
import { browserClient } from "@/lib/supabase";

type P = { id: string; name: string; sku: string | null; images: string[] | null };
type R = {
  product_id: string; name: string; phone: string; city: string; rating: number; title: string; body: string; images: string[];
  verified: boolean; status: "pending" | "approved" | "rejected"; reply: string; created_at: string;
};
const BLANK: R = { product_id: "", name: "", phone: "", city: "", rating: 5, title: "", body: "", images: [], verified: false, status: "approved", reply: "", created_at: new Date().toISOString() };
const WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];
const input = "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";
const card = "rounded-2xl border border-line bg-card p-5 md:p-6";
const toLocal = (iso: string) => new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16);

/** Add a review by hand (e.g. from WhatsApp or the shop counter) or edit any review: stars, text, photos, date, status, reply. */
export default function ReviewEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();
  const db = browserClient();
  const [r, setR] = useState<R>(BLANK);
  const [products, setProducts] = useState<P[]>([]);
  const [find, setFind] = useState("");
  const [hover, setHover] = useState(0);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (v: Partial<R>) => setR((x) => ({ ...x, ...v }));

  useEffect(() => {
    (async () => {
      const { data: ps } = await db.from("products").select("id,name,sku,images").order("name");
      setProducts((ps as P[]) ?? []);
      if (isNew) {
        const pid = new URLSearchParams(window.location.search).get("product");
        if (pid) set({ product_id: pid });
        return setState("ok");
      }
      const { data } = await db.from("product_reviews").select("*").eq("id", id).maybeSingle();
      if (!data) return setState("missing");
      const d = data as R & { reply: string | null; title: string | null; city: string | null; phone: string | null; images: string[] | null };
      setR({ ...d, title: d.title ?? "", city: d.city ?? "", phone: d.phone ?? "", reply: d.reply ?? "", images: d.images ?? [] });
      setState("ok");
    })();
  }, [db, id, isNew]);

  const product = products.find((p) => p.id === r.product_id);
  const hits = useMemo(() => { const t = find.trim().toLowerCase(); return t ? products.filter((p) => `${p.name} ${p.sku ?? ""}`.toLowerCase().includes(t)).slice(0, 8) : []; }, [find, products]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (!r.product_id) return setErr("Choose the product.");
    if (r.name.trim().length < 2) return setErr("Add the customer's name.");
    if (r.body.trim().length < 3) return setErr("Write the review text.");
    setBusy(true);
    const row = {
      product_id: r.product_id, name: r.name.trim(), phone: r.phone.trim() || null, city: r.city.trim() || null, rating: r.rating, title: r.title.trim() || null,
      body: r.body.trim(), images: r.images, verified: r.verified, status: r.status, reply: r.reply.trim() || null, created_at: new Date(r.created_at).toISOString(),
      ...(isNew ? { source: "admin", reply_at: r.reply.trim() ? new Date().toISOString() : null } : {}),
    };
    const res = isNew ? await db.from("product_reviews").insert(row) : await db.from("product_reviews").update({ ...row, ...(r.reply.trim() ? {} : { reply_at: null }) }).eq("id", id);
    setBusy(false);
    if (res.error) return setErr(res.error.message);
    router.push(`/admin/reviews?saved=${isNew ? "added" : "saved"}`);
  };
  const remove = async () => {
    if (!confirm("Delete this review forever?")) return;
    await db.from("product_reviews").delete().eq("id", id);
    router.push("/admin/reviews?saved=deleted");
  };

  if (state === "loading") return <p className="grid place-items-center p-16 text-muted"><Loader2 className="animate-spin" /></p>;
  if (state === "missing") return <div className="p-10 text-center"><p className="font-bold">Review not found.</p><Link href="/admin/reviews" className="mt-3 inline-block font-bold text-brand-600">← Product reviews</Link></div>;

  return (
    <form onSubmit={save} className="space-y-6">
      <div>
        <Link href="/admin/reviews" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted transition hover:text-brand-600"><ArrowLeft size={16} />Product reviews</Link>
        <h1 className="mt-2 text-3xl font-extrabold uppercase leading-none text-brand-900 dark:text-white sm:text-4xl md:text-5xl">{isNew ? "Add review" : "Edit review"}</h1>
        <p className="mt-1.5 text-muted">{isNew ? "For reviews you got on WhatsApp, Facebook or at the counter. Ask the customer before you post their words." : "Change anything: stars, text, photos, date, status or your reply."}</p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className={card}>
            <p className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">Product</p>
            {product ? (
              <div className="flex items-center gap-3 rounded-xl border border-line p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {product.images?.[0] ? <img src={product.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <span className="h-12 w-12 rounded-lg bg-soft" />}
                <span className="min-w-0 flex-1"><b className="block truncate">{product.name}</b><span className="text-xs text-muted">{product.sku}</span></span>
                <button type="button" onClick={() => set({ product_id: "" })} className="rounded-full p-1.5 text-muted hover:bg-soft" aria-label="Change product"><X size={16} /></button>
              </div>
            ) : (
              <div className="relative">
                <Search size={16} className="pointer-events-none absolute left-3.5 top-3 text-muted" />
                <input value={find} onChange={(e) => setFind(e.target.value)} placeholder="Search product name or SKU" className={`${input} pl-10`} autoFocus />
                {hits.length > 0 && (
                  <ul className="absolute inset-x-0 top-full z-10 mt-1 overflow-hidden rounded-xl border border-line bg-card shadow-xl">
                    {hits.map((p) => <li key={p.id}><button type="button" onClick={() => { set({ product_id: p.id }); setFind(""); }} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-soft"><b>{p.name}</b> <span className="text-xs text-muted">{p.sku}</span></button></li>)}
                  </ul>
                )}
              </div>
            )}
          </section>

          <section className={card}>
            <p className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">Rating</p>
            <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => set({ rating: s })} onMouseEnter={() => setHover(s)} aria-label={`${s} star${s > 1 ? "s" : ""}`} className="transition hover:scale-110">
                  <Star size={38} strokeWidth={1.5} className={(hover || r.rating) >= s ? "fill-amber-400 text-amber-400" : "text-line"} />
                </button>
              ))}
              <span className="ml-2 font-bold text-muted">{WORDS[hover || r.rating]}</span>
            </div>
            <div className="mt-5 grid gap-3">
              <label className="text-sm font-semibold">Title <span className="font-normal text-muted">optional</span><input value={r.title} onChange={(e) => set({ title: e.target.value })} maxLength={100} placeholder="e.g. Perfect fit on my CD 70" className={`${input} mt-1`} /></label>
              <label className="text-sm font-semibold">Review *<textarea value={r.body} onChange={(e) => set({ body: e.target.value })} rows={5} maxLength={2000} placeholder="What the customer said about the part, fitting and delivery." className={`${input} mt-1 resize-y`} /></label>
            </div>
          </section>

          <section className={card}>
            <p className="text-sm font-bold uppercase tracking-wider text-muted">Photos</p>
            <p className="mb-3 text-xs text-muted">The part fitted on the bike, the parcel… Real photos make reviews more trusted.</p>
            <ImageField multiple value={r.images} onChange={(v) => set({ images: (v as string[]) ?? [] })} folder="reviews" />
          </section>

          <section className={card}>
            <p className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">Your reply <span className="normal-case text-muted">(shown under the review)</span></p>
            <textarea value={r.reply} onChange={(e) => set({ reply: e.target.value })} rows={3} placeholder="e.g. Thank you! Enjoy the ride." className={`${input} resize-y`} />
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <section className={`${card} space-y-3`}>
            <p className="text-sm font-bold uppercase tracking-wider text-muted">Customer</p>
            <label className="block text-sm font-semibold">Name *<input value={r.name} onChange={(e) => set({ name: e.target.value })} className={`${input} mt-1`} placeholder="e.g. Ahmed R." /></label>
            <label className="block text-sm font-semibold">City<input value={r.city} onChange={(e) => set({ city: e.target.value })} className={`${input} mt-1`} placeholder="e.g. Okara" /></label>
            <label className="block text-sm font-semibold">Phone <span className="font-normal text-muted">private</span><input value={r.phone} onChange={(e) => set({ phone: e.target.value })} inputMode="tel" className={`${input} mt-1`} placeholder="never shown" /></label>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={r.verified} onChange={(e) => set({ verified: e.target.checked })} className="h-4 w-4 accent-green-600" /><BadgeCheck size={15} className="text-green-600" />Verified buyer</label>
            <label className="block text-sm font-semibold">Date<input type="datetime-local" value={toLocal(r.created_at)} onChange={(e) => e.target.value && set({ created_at: new Date(e.target.value).toISOString() })} className={`${input} mt-1`} /></label>
          </section>
          <section className={`${card} space-y-3`}>
            <p className="text-sm font-bold uppercase tracking-wider text-muted">Status</p>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-soft p-1 text-xs font-bold">
              {([["approved", "Published"], ["pending", "Waiting"], ["rejected", "Hidden"]] as const).map(([k, l]) => (
                <button key={k} type="button" onClick={() => set({ status: k })} className={`rounded-lg py-2 transition ${r.status === k ? "bg-card shadow-sm" : "text-muted"}`}>{l}</button>
              ))}
            </div>
            {err && <p role="alert" className="rounded-xl bg-hot/10 px-3 py-2 text-sm font-semibold text-hot">{err}</p>}
            <button disabled={busy} className="w-full rounded-full bg-brand-600 py-3 font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60">{busy ? "Saving…" : isNew ? "Add review" : "Save changes"}</button>
            {!isNew && <button type="button" onClick={remove} className="flex w-full items-center justify-center gap-1.5 text-sm font-bold text-hot hover:underline"><Trash2 size={14} />Delete review</button>}
          </section>
        </aside>
      </div>
    </form>
  );
}
