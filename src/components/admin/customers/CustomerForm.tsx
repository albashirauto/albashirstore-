"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ClipboardList, Loader2, Phone, Plus, StickyNote, Tags, Trash2, UserRound, X } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import PlacePicker from "@/components/checkout/PlacePicker";
import { statusOf } from "@/components/admin/dashboard/types";
import { browserClient } from "@/lib/supabase";
import { money } from "@/lib/format";
import { placeLine } from "@/lib/pk-places";

export type CustomerRow = {
  id: string; name: string; phone: string; phone_key?: string; email: string | null; province: string | null; district: string | null; city: string | null;
  address: string | null; source: string | null; tags: string[]; notes: string | null; created_at?: string; updated_at?: string | null;
};
type O = { id: string; customer_name: string; phone: string; email: string | null; province: string | null; district: string | null; city: string | null; address: string; total: number; subtotal: number; status: string; created_at: string };

export const SOURCES = [["walk-in", "Walk-in at shop"], ["phone", "Phone call"], ["whatsapp", "WhatsApp"], ["facebook", "Facebook"], ["instagram", "Instagram"], ["tiktok", "TikTok"], ["website", "Website"], ["referral", "Referred by someone"], ["other", "Other"]] as const;
const TAG_IDEAS = ["mechanic", "workshop", "wholesale", "dealer", "retail", "vip", "rickshaw", "loader"];
export const phoneKey = (p: string) => p.replace(/\D/g, "").replace(/^92/, "0");
const wa = (p: string) => p.replace(/\D/g, "").replace(/^0/, "92");
const input = "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";
const card = "rounded-2xl border border-line bg-card p-5 md:p-6";
const heading = "mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted";
const EMPTY = { name: "", phone: "", email: "", province: "", district: "", city: "", address: "", source: "", tags: [] as string[], notes: "" };

/** Add / edit a customer profile: /admin/customers/new (optional ?phone= to start from their orders) or /admin/customers/<id>. */
export default function CustomerForm({ id }: { id: string }) {
  const isNew = id === "new";
  const router = useRouter();
  const db = browserClient();
  const [f, setF] = useState(EMPTY);
  const [orders, setOrders] = useState<O[]>([]);
  const [state, setState] = useState<"loading" | "ok" | "missing">("loading");
  const [tag, setTag] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<React.ReactNode>("");
  const [ok, setOk] = useState("");

  const loadOrders = async (phone: string) => {
    const key = phoneKey(phone);
    if (key.length < 10) return setOrders([]);
    // match on the last 10 digits, then confirm the full number
    const { data } = await db.from("orders").select("id,customer_name,phone,email,province,district,city,address,total,subtotal,status,created_at").ilike("phone", `%${key.slice(-4)}%`).order("created_at", { ascending: false }).limit(500);
    setOrders(((data as O[]) ?? []).filter((o) => phoneKey(o.phone) === key));
  };

  useEffect(() => {
    (async () => {
      if (isNew) {
        const phone = new URLSearchParams(window.location.search).get("phone") ?? "";
        if (phone) {
          const { data } = await db.from("orders").select("customer_name,phone,email,province,district,city,address").order("created_at", { ascending: false }).limit(2000);
          const last = ((data as O[]) ?? []).find((o) => phoneKey(o.phone) === phoneKey(phone));
          setF({ ...EMPTY, phone, ...(last ? { name: last.customer_name, email: last.email ?? "", province: last.province ?? "", district: last.district ?? "", city: last.city ?? "", address: last.address } : {}) });
          await loadOrders(phone);
        }
        return setState("ok");
      }
      const { data } = await db.from("customers").select("*").eq("id", id).maybeSingle();
      const c = data as CustomerRow | null;
      if (!c) return setState("missing");
      setF({ name: c.name, phone: c.phone, email: c.email ?? "", province: c.province ?? "", district: c.district ?? "", city: c.city ?? "", address: c.address ?? "", source: c.source ?? "", tags: c.tags ?? [], notes: c.notes ?? "" });
      await loadOrders(c.phone);
      setState("ok");
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isNew]);

  const stats = useMemo(() => {
    const sales = orders.filter((o) => o.status !== "cancelled" && o.status !== "returned");
    return { count: orders.length, spent: sales.reduce((n, o) => n + Number(o.subtotal ?? o.total), 0), last: orders[0]?.created_at };
  }, [orders]);

  const addTag = (raw: string) => {
    const t = raw.trim().toLowerCase();
    if (t && !f.tags.includes(t)) setF({ ...f, tags: [...f.tags, t] });
    setTag("");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(""); setOk("");
    if (!f.name.trim()) return setErr("Add the customer's name.");
    if (phoneKey(f.phone).length < 10) return setErr("Enter a full phone number, e.g. 0300 1234567.");
    if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) return setErr("That email doesn't look right.");
    setBusy(true);
    const row = {
      name: f.name.trim(), phone: f.phone.trim(), email: f.email.trim() || null, province: f.province || null, district: f.district || null, city: f.city.trim() || null,
      address: f.address.trim() || null, source: f.source || null, tags: f.tags, notes: f.notes.trim() || null, updated_at: new Date().toISOString(),
    };
    const res = isNew ? await db.from("customers").insert(row).select("id").single() : await db.from("customers").update(row).eq("id", id).select("id").single();
    setBusy(false);
    if (res.error) {
      if (res.error.message.includes("duplicate") || res.error.code === "23505") {
        const { data: other } = await db.from("customers").select("id,name").eq("phone_key", phoneKey(f.phone)).maybeSingle();
        return setErr(<>This phone number already has a profile{other ? <>: <Link href={`/admin/customers/${other.id}`} className="underline">{other.name}</Link></> : ""}.</>);
      }
      return setErr(res.error.message);
    }
    if (isNew) return router.push(`/admin/customers?saved=added`);
    setOk("Saved"); setTimeout(() => setOk(""), 2500);
    loadOrders(f.phone);
  };

  const remove = async () => {
    if (!confirm(`Delete ${f.name}'s profile? Their orders stay; only the saved details, tags and notes are removed.`)) return;
    const { error } = await db.from("customers").delete().eq("id", id);
    if (error) return setErr(error.message);
    router.push("/admin/customers?saved=deleted");
  };

  if (state === "loading") return <p className="grid place-items-center p-16 text-muted"><Loader2 className="animate-spin" /></p>;
  if (state === "missing") return (
    <div className="p-10 text-center">
      <p className="font-bold">This customer was not found.</p>
      <Link href="/admin/customers" className="mt-4 inline-block font-bold text-brand-600">← Back to customers</Link>
    </div>
  );

  const place = placeLine(f);
  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin/customers" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted transition hover:text-brand-600"><ArrowLeft size={16} />Customers</Link>
          <h1 className="mt-2 text-4xl font-extrabold uppercase leading-none text-brand-900 dark:text-white md:text-5xl">{isNew ? "Add customer" : f.name || "Customer"}</h1>
          <p className="mt-1.5 text-muted">{isNew ? "Save a customer's details, even before their first order." : orders.length ? `First order ${new Date(orders[orders.length - 1].created_at).toLocaleDateString("en-PK", { month: "long", year: "numeric" })}` : "No orders yet."}</p>
        </div>
        {!isNew && phoneKey(f.phone).length >= 10 && (
          <div className="flex flex-wrap gap-2">
            <a href={`tel:${f.phone}`} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-sm font-bold transition hover:border-brand-600"><Phone size={15} />Call</a>
            <a href={`https://wa.me/${wa(f.phone)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2.5 text-sm font-bold text-white"><WhatsAppIcon size={16} />WhatsApp</a>
            <Link href={`/admin/orders/new?phone=${encodeURIComponent(f.phone)}`} className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25"><Plus size={15} />New order</Link>
          </div>
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className={card}>
            <h2 className={heading}><UserRound size={16} />Details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold">Name *<input className={`${input} mt-1`} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Ahmed Raza" /></label>
              <label className="text-sm font-semibold">Phone / WhatsApp *<input className={`${input} mt-1`} inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} onBlur={() => loadOrders(f.phone)} placeholder="03xx xxxxxxx" /></label>
              <label className="text-sm font-semibold">Email<input className={`${input} mt-1`} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="optional" /></label>
              <label className="text-sm font-semibold">How did they find you?
                <select className={`${input} mt-1`} value={f.source} onChange={(e) => setF({ ...f, source: e.target.value })}>
                  <option value="">Not set</option>
                  {SOURCES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </select>
              </label>
              <div className="sm:col-span-2"><PlacePicker optional input={input} value={{ province: f.province, district: f.district, city: f.city }} onChange={(p) => setF({ ...f, ...p })} /></div>
              <label className="text-sm font-semibold sm:col-span-2">Address<input className={`${input} mt-1`} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} placeholder="House / shop, street, area, landmark" /></label>
            </div>
          </section>

          <section className={card}>
            <h2 className={heading}><Tags size={16} />Tags</h2>
            <div className="flex flex-wrap gap-1.5">
              {f.tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-900 dark:text-white">{t}<button type="button" aria-label={`Remove ${t}`} onClick={() => setF({ ...f, tags: f.tags.filter((x) => x !== t) })}><X size={12} /></button></span>
              ))}
              {TAG_IDEAS.filter((t) => !f.tags.includes(t)).map((t) => (
                <button key={t} type="button" onClick={() => addTag(t)} className="rounded-full border border-dashed border-line px-3 py-1 text-xs font-bold text-muted transition hover:border-brand-500 hover:text-brand-600">+ {t}</button>
              ))}
            </div>
            <input value={tag} onChange={(e) => setTag(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(tag); } }} onBlur={() => tag && addTag(tag)} placeholder="Your own tag, press Enter" className={`${input} mt-3`} />
          </section>

          <section className={card}>
            <h2 className={heading}><StickyNote size={16} />Private notes</h2>
            <textarea rows={4} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="Only admins see this. e.g. Owns 3 rickshaws, prefers delivery after 5 pm, gives 5% discount." className={`${input} resize-y`} />
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <div className={card}>
            <h2 className={heading}><ClipboardList size={16} />Orders</h2>
            {stats.count ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-soft p-3"><p className="text-xs text-muted">Orders</p><p className="font-display text-2xl font-extrabold">{stats.count}</p></div>
                  <div className="rounded-xl bg-soft p-3"><p className="text-xs text-muted">Spent</p><p className="font-display text-2xl font-extrabold">{money(stats.spent)}</p></div>
                </div>
                <ul className="mt-3 divide-y divide-line text-sm">
                  {orders.slice(0, 6).map((o) => {
                    const s = statusOf(o.status);
                    return (
                      <li key={o.id}>
                        <Link href={`/admin/orders?open=${o.id}`} className="flex items-center justify-between gap-2 py-2 hover:text-brand-600">
                          <span><b className="font-mono">#{o.id.slice(0, 8).toUpperCase()}</b><span className="block text-xs text-muted">{new Date(o.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}</span></span>
                          <span className="text-right"><b>{money(o.total)}</b><span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${s.pill}`}>{s.label}</span></span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                {orders.length > 6 && <Link href={`/admin/orders?q=${encodeURIComponent(f.phone)}`} className="mt-2 block text-sm font-bold text-brand-600">All {orders.length} orders →</Link>}
              </>
            ) : <p className="text-sm text-muted">{phoneKey(f.phone).length >= 10 ? "No orders with this number yet." : "Enter the phone number to see their orders."}</p>}
            {place && <p className="mt-3 border-t border-line pt-3 text-xs text-muted">{place}</p>}
          </div>

          <div className={`${card} space-y-3`}>
            {err && <p role="alert" className="rounded-xl bg-hot/10 px-3 py-2 text-sm font-semibold text-hot">{err}</p>}
            {ok && <p role="status" className="flex items-center gap-1.5 rounded-xl bg-green-100 px-3 py-2 text-sm font-semibold text-green-800"><Check size={15} />{ok}</p>}
            <button disabled={busy} className="w-full rounded-full bg-brand-600 py-3 font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60">{busy ? "Saving…" : isNew ? "Add customer" : "Save changes"}</button>
            {!isNew && <button type="button" onClick={remove} className="flex w-full items-center justify-center gap-1.5 text-sm font-bold text-hot hover:underline"><Trash2 size={14} />Delete profile</button>}
          </div>
        </aside>
      </div>
    </form>
  );
}
