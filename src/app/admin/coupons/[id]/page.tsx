"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { ArrowLeft, Dices, Loader2, Percent, Tag, Trash2, Truck } from "lucide-react";
import { browserClient } from "@/lib/supabase";
import { money } from "@/lib/format";
import { offer, rules, type Coupon } from "@/components/admin/coupons/shared";

const input = "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";
const card = "rounded-2xl border border-line bg-card p-5 md:p-6";
const BLANK: Coupon = { id: "", code: "", description: "", kind: "percent", value: 10, min_order: 0, max_discount: null, starts_at: null, ends_at: null, usage_limit: null, per_customer_limit: 1, first_order_only: false, active: true };
const KINDS = [
  { k: "percent", l: "% off", d: "e.g. 10% off the parts", i: Percent },
  { k: "fixed", l: "Rs. off", d: "e.g. Rs. 200 off the order", i: Tag },
  { k: "free_shipping", l: "Free delivery", d: "Delivery charge becomes free", i: Truck },
] as const;
const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");
const fromLocal = (v: string) => (v ? new Date(v).toISOString() : null);
const num = (v: string) => (v === "" ? null : Math.max(0, Number(v) || 0));
const randomCode = () => Array.from({ length: 8 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 32)]).join("");

/** /admin/coupons/new or /admin/coupons/<id> */
export default function CouponEditor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();
  const db = browserClient();
  const [c, setC] = useState<Coupon>(BLANK);
  const [state, setState] = useState<"loading" | "ok" | "missing">(isNew ? "ok" : "loading");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (v: Partial<Coupon>) => setC((x) => ({ ...x, ...v }));

  useEffect(() => {
    if (isNew) return;
    db.from("coupons").select("*").eq("id", id).maybeSingle().then(({ data }: { data: Coupon | null }) => { if (data) { setC(data); setState("ok"); } else setState("missing"); });
  }, [db, id, isNew]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    const code = c.code.trim().toUpperCase().replace(/\s+/g, "");
    if (!/^[A-Z0-9_-]{3,30}$/.test(code)) return setErr("Code: 3–30 letters or numbers, no spaces (e.g. EID10).");
    if (c.kind === "percent" && (Number(c.value) <= 0 || Number(c.value) > 100)) return setErr("Percent must be between 1 and 100.");
    if (c.kind === "fixed" && Number(c.value) <= 0) return setErr("Enter the amount off.");
    if (c.starts_at && c.ends_at && c.ends_at < c.starts_at) return setErr("The end date is before the start date.");
    setBusy(true);
    const row = { ...c, code, description: c.description?.trim() || null, value: c.kind === "free_shipping" ? 0 : Number(c.value), updated_at: new Date().toISOString() };
    delete (row as Partial<Coupon>).id; delete (row as Partial<Coupon>).created_at;
    const res = isNew ? await db.from("coupons").insert(row) : await db.from("coupons").update(row).eq("id", id);
    setBusy(false);
    if (res.error) return setErr(res.error.message.includes("duplicate") ? `The code ${code} already exists.` : res.error.message);
    router.push(`/admin/coupons?saved=${isNew ? "added" : "saved"}`);
  };
  const remove = async () => {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    await db.from("coupons").delete().eq("id", id);
    router.push("/admin/coupons?saved=deleted");
  };

  if (state === "loading") return <p className="grid place-items-center p-16 text-muted"><Loader2 className="animate-spin" /></p>;
  if (state === "missing") return <div className="p-10 text-center"><p className="font-bold">Coupon not found.</p><Link href="/admin/coupons" className="mt-3 inline-block font-bold text-brand-600">← Coupons</Link></div>;

  // example: what a Rs. 3,000 order would get
  const example = 3000;
  const exDiscount = c.kind === "percent" ? Math.min(Math.round((example * Number(c.value || 0)) / 100), c.max_discount ?? Infinity) : c.kind === "fixed" ? Math.min(Number(c.value || 0), example) : 0;

  return (
    <form onSubmit={save} className="space-y-6">
      <div>
        <Link href="/admin/coupons" className="inline-flex items-center gap-1.5 text-sm font-bold text-muted transition hover:text-brand-600"><ArrowLeft size={16} />Coupons</Link>
        <h1 className="mt-2 text-3xl font-extrabold uppercase leading-none text-brand-900 dark:text-white sm:text-4xl md:text-5xl">{isNew ? "New coupon" : c.code}</h1>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className={card}>
            <p className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">Code & discount</p>
            <label className="block text-sm font-semibold">Coupon code
              <div className="mt-1 flex gap-2">
                <input value={c.code} onChange={(e) => set({ code: e.target.value.toUpperCase().replace(/\s+/g, "") })} placeholder="e.g. EID10" className={`${input} font-mono text-lg font-bold uppercase tracking-wider`} />
                <button type="button" onClick={() => set({ code: randomCode() })} title="Random code" className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-bold transition hover:border-brand-500"><Dices size={16} />Random</button>
              </div>
            </label>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {KINDS.map(({ k, l, d, i: I }) => (
                <button key={k} type="button" onClick={() => set({ kind: k, value: k === "percent" ? 10 : k === "fixed" ? 200 : 0 })} className={`rounded-xl border-2 p-3 text-left transition ${c.kind === k ? "border-brand-600 bg-brand-50 dark:bg-brand-900" : "border-line hover:border-brand-500/50"}`}>
                  <I size={18} className="text-brand-600" /><p className="mt-1 font-bold">{l}</p><p className="text-xs text-muted">{d}</p>
                </button>
              ))}
            </div>
            {c.kind !== "free_shipping" && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold">{c.kind === "percent" ? "Percent off" : "Amount off (Rs.)"}<input inputMode="numeric" value={String(c.value ?? "")} onChange={(e) => set({ value: Number(e.target.value.replace(/\D/g, "")) || 0 })} className={`${input} mt-1`} /></label>
                {c.kind === "percent" && <label className="text-sm font-semibold">Maximum discount (Rs.) <span className="font-normal text-muted">optional</span><input inputMode="numeric" value={c.max_discount ?? ""} onChange={(e) => set({ max_discount: num(e.target.value) })} placeholder="no maximum" className={`${input} mt-1`} /></label>}
              </div>
            )}
            <label className="mt-4 block text-sm font-semibold">Note for customers <span className="font-normal text-muted">optional, shown at checkout</span><input value={c.description ?? ""} onChange={(e) => set({ description: e.target.value })} placeholder="e.g. Eid Mubarak! 10% off all parts" className={`${input} mt-1`} /></label>
          </section>

          <section className={card}>
            <p className="mb-3 text-sm font-bold uppercase tracking-wider text-muted">Rules</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold">Minimum order (Rs.)<input inputMode="numeric" value={c.min_order || ""} onChange={(e) => set({ min_order: num(e.target.value) ?? 0 })} placeholder="no minimum" className={`${input} mt-1`} /></label>
              <label className="text-sm font-semibold">Total uses <span className="font-normal text-muted">all customers</span><input inputMode="numeric" value={c.usage_limit ?? ""} onChange={(e) => set({ usage_limit: num(e.target.value) })} placeholder="unlimited" className={`${input} mt-1`} /></label>
              <label className="text-sm font-semibold">Uses per customer <span className="font-normal text-muted">by phone</span><input inputMode="numeric" value={c.per_customer_limit ?? ""} onChange={(e) => set({ per_customer_limit: num(e.target.value) })} placeholder="unlimited" className={`${input} mt-1`} /></label>
              <label className="flex items-center gap-2.5 self-end rounded-xl border border-line p-3 text-sm font-semibold"><input type="checkbox" checked={c.first_order_only} onChange={(e) => set({ first_order_only: e.target.checked })} className="h-4 w-4 accent-brand-600" />First order only (new customers)</label>
              <label className="text-sm font-semibold">Starts <span className="font-normal text-muted">optional</span><input type="datetime-local" value={toLocal(c.starts_at)} onChange={(e) => set({ starts_at: fromLocal(e.target.value) })} className={`${input} mt-1`} /></label>
              <label className="text-sm font-semibold">Ends <span className="font-normal text-muted">optional</span><input type="datetime-local" value={toLocal(c.ends_at)} onChange={(e) => set({ ends_at: fromLocal(e.target.value) })} className={`${input} mt-1`} /></label>
            </div>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-900 p-6 text-white shadow-xl shadow-brand-900/20">
            <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-bg" /><span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-bg" />
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Preview</p>
            <p className="mt-2 font-mono text-3xl font-extrabold tracking-wider">{c.code || "CODE"}</p>
            <p className="mt-1 font-display text-2xl font-extrabold uppercase text-amber-300">{offer(c)}</p>
            <p className="mt-2 border-t border-dashed border-white/25 pt-2 text-sm text-white/80">{rules(c).join(" · ") || "Any order, no limits"}</p>
            {c.kind !== "free_shipping" && <p className="mt-2 text-xs text-white/60">On a {money(example)} order: −{money(exDiscount)}</p>}
          </div>
          <div className={`${card} space-y-3`}>
            <label className="flex items-center gap-2.5 text-sm font-semibold"><input type="checkbox" checked={c.active} onChange={(e) => set({ active: e.target.checked })} className="h-4 w-4 accent-green-600" />Coupon is on</label>
            {err && <p role="alert" className="rounded-xl bg-hot/10 px-3 py-2 text-sm font-semibold text-hot">{err}</p>}
            <button disabled={busy} className="w-full rounded-full bg-brand-600 py-3 font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60">{busy ? "Saving…" : isNew ? "Create coupon" : "Save changes"}</button>
            {!isNew && <button type="button" onClick={remove} className="flex w-full items-center justify-center gap-1.5 text-sm font-bold text-hot hover:underline"><Trash2 size={14} />Delete coupon</button>}
            <p className="text-xs text-muted">Share it as a link that applies the code: <span className="break-all font-mono">/checkout?coupon={c.code || "CODE"}</span></p>
          </div>
        </aside>
      </div>
    </form>
  );
}
