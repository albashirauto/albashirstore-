"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BadgeCheck, Camera, ChevronLeft, ChevronRight, MessageSquarePlus, PenLine, Star, Store, X } from "lucide-react";
import { submitReview } from "@/app/actions";
import type { Review } from "@/lib/types";
import Stars from "./Stars";

const input = "w-full rounded-xl border border-line bg-bg px-4 py-3 outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";
const when = (iso: string) => new Date(iso).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
const WORDS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** Product reviews: star summary with breakdown, sortable list with shop replies, and a form (every review is checked before it shows). */
export default function ProductReviews({ productId, productName, reviews }: { productId: string; productName: string; reviews: Review[] }) {
  const [sort, setSort] = useState<"new" | "high" | "low">("new");
  const [only, setOnly] = useState(0);
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(6);
  const [photo, setPhoto] = useState<{ list: string[]; i: number } | null>(null);
  const allPhotos = reviews.flatMap((r) => r.images ?? []);

  const count = reviews.length;
  const avg = count ? reviews.reduce((n, r) => n + r.rating, 0) / count : 0;
  const dist = [5, 4, 3, 2, 1].map((s) => ({ s, n: reviews.filter((r) => r.rating === s).length }));
  const list = useMemo(() => {
    const l = reviews.filter((r) => !only || r.rating === only);
    return sort === "high" ? [...l].sort((a, b) => b.rating - a.rating) : sort === "low" ? [...l].sort((a, b) => a.rating - b.rating) : l;
  }, [reviews, sort, only]);

  return (
    <section id="reviews" className="mt-20 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-hot"><span className="h-px w-6 bg-hot" />Customer reviews</p>
          <h2 className="text-4xl font-extrabold uppercase leading-none text-brand-700 dark:text-white">What buyers say</h2>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-bold text-white shadow-lg shadow-brand-600/25 transition hover:-translate-y-0.5 hover:bg-brand-700"><PenLine size={17} />Write a review</button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* summary */}
        <div className="h-fit rounded-3xl border border-line bg-card p-6 lg:sticky lg:top-24">
          {count ? (
            <>
              <div className="flex items-end gap-3">
                <span className="font-display text-6xl font-extrabold leading-none">{avg.toFixed(1)}</span>
                <span className="pb-1 text-muted">out of 5</span>
              </div>
              <Stars value={avg} size={22} className="mt-2" />
              <p className="mt-1 text-sm text-muted">Based on {count} review{count === 1 ? "" : "s"}</p>
              <ul className="mt-5 space-y-1.5">
                {dist.map(({ s, n }) => (
                  <li key={s}>
                    <button onClick={() => setOnly(only === s ? 0 : s)} disabled={!n} className={`flex w-full items-center gap-2 rounded-lg px-1.5 py-1 text-sm transition disabled:opacity-40 ${only === s ? "bg-amber-400/15" : "hover:bg-soft"}`}>
                      <span className="flex w-8 items-center gap-0.5 font-bold">{s}<Star size={12} className="fill-amber-400 text-amber-400" /></span>
                      <span className="h-2 flex-1 overflow-hidden rounded-full bg-line"><span className="block h-full rounded-full bg-amber-400 transition-all duration-700" style={{ width: `${count ? (n / count) * 100 : 0}%` }} /></span>
                      <span className="w-6 text-right text-muted">{n}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {only > 0 && <button onClick={() => setOnly(0)} className="mt-2 text-xs font-bold text-brand-600">Show all ratings</button>}
              {allPhotos.length > 0 && (
                <div className="mt-5 border-t border-line pt-4">
                  <p className="flex items-center gap-1.5 text-sm font-bold"><Camera size={15} />Customer photos ({allPhotos.length})</p>
                  <div className="mt-2 grid grid-cols-4 gap-1.5">
                    {allPhotos.slice(0, 8).map((u, k) => (
                      <button key={u + k} type="button" onClick={() => setPhoto({ list: allPhotos, i: k })} className="aspect-square overflow-hidden rounded-lg ring-1 ring-line" aria-label="Open photo">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u} alt="" loading="lazy" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <Stars value={0} size={26} />
              <p className="mt-3 font-bold">No reviews yet</p>
              <p className="mt-1 text-sm text-muted">Bought this part? Be the first to tell other riders how it fits.</p>
            </div>
          )}
        </div>

        {/* list */}
        <div>
          {count > 1 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted">{list.length} review{list.length === 1 ? "" : "s"}{only ? ` with ${only} stars` : ""}</p>
              <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort reviews" className="rounded-full border border-line bg-card px-4 py-2 text-sm font-semibold">
                <option value="new">Newest first</option><option value="high">Highest rating</option><option value="low">Lowest rating</option>
              </select>
            </div>
          )}
          {count === 0 && (
            <button onClick={() => setOpen(true)} className="flex w-full flex-col items-center gap-2 rounded-3xl border-2 border-dashed border-line p-10 text-muted transition hover:border-brand-500 hover:text-brand-600">
              <MessageSquarePlus size={30} /><span className="font-bold">Write the first review</span>
            </button>
          )}
          <ul className="grid gap-4">
            {list.slice(0, shown).map((r, i) => (
              <motion.li key={r.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 6) * 0.04 }}
                className="rounded-3xl border border-line bg-card p-5 md:p-6">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display text-lg font-bold text-white">{r.name.charAt(0).toUpperCase()}</span>
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="font-bold">{r.name}{r.city && <span className="font-normal text-muted"> · {r.city}</span>}</p>
                    <p className="text-xs text-muted">{when(r.created_at)}</p>
                  </div>
                  {r.verified && <span className="inline-flex items-center gap-1 rounded-full bg-green-600/10 px-2.5 py-1 text-xs font-bold text-green-700 dark:text-green-400"><BadgeCheck size={14} />Verified buyer</span>}
                </div>
                <div className="mt-3 flex items-center gap-2"><Stars value={r.rating} size={16} /><span className="text-xs font-bold text-muted">{WORDS[r.rating]}</span></div>
                {r.title && <p className="mt-2 font-bold">{r.title}</p>}
                <p className="mt-1 whitespace-pre-line leading-relaxed text-muted">{r.body}</p>
                {!!r.images?.length && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.images.map((u, k) => (
                      <button key={u} type="button" onClick={() => setPhoto({ list: r.images!, i: k })} className="overflow-hidden rounded-xl ring-1 ring-line transition hover:ring-brand-500" aria-label="Open photo">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={u} alt={`Photo from ${r.name}`} loading="lazy" className="h-20 w-20 object-cover transition duration-500 hover:scale-110" />
                      </button>
                    ))}
                  </div>
                )}
                {r.reply && (
                  <div className="mt-4 rounded-2xl border-l-4 border-brand-600 bg-soft p-4">
                    <p className="flex items-center gap-1.5 text-sm font-bold"><Store size={15} className="text-brand-600" />Reply from the shop{r.reply_at && <span className="font-normal text-muted"> · {when(r.reply_at)}</span>}</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted">{r.reply}</p>
                  </div>
                )}
              </motion.li>
            ))}
          </ul>
          {list.length > shown && <button onClick={() => setShown(shown + 6)} className="mt-5 w-full rounded-full border border-line py-3 font-bold transition hover:border-brand-500">Show more reviews ({list.length - shown})</button>}
        </div>
      </div>

      <AnimatePresence>
        {photo && (
          <motion.div className="fixed inset-0 z-[80] grid place-items-center bg-black/90 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setPhoto(null)} role="dialog" aria-label="Customer photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.list[photo.i]} alt="Customer photo" className="max-h-[85dvh] max-w-full rounded-2xl object-contain" onClick={(e) => e.stopPropagation()} />
            <button onClick={() => setPhoto(null)} aria-label="Close" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"><X size={22} /></button>
            {photo.list.length > 1 && <>
              <button onClick={(e) => { e.stopPropagation(); setPhoto({ ...photo, i: (photo.i - 1 + photo.list.length) % photo.list.length }); }} aria-label="Previous photo" className="absolute left-3 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"><ChevronLeft size={24} /></button>
              <button onClick={(e) => { e.stopPropagation(); setPhoto({ ...photo, i: (photo.i + 1) % photo.list.length }); }} aria-label="Next photo" className="absolute right-3 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"><ChevronRight size={24} /></button>
              <span className="absolute bottom-5 rounded-full bg-white/15 px-3 py-1 text-sm font-bold text-white">{photo.i + 1} / {photo.list.length}</span>
            </>}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>{open && <ReviewForm productId={productId} productName={productName} onClose={() => setOpen(false)} />}</AnimatePresence>
    </section>
  );
}

function ReviewForm({ productId, productName, onClose }: { productId: string; productName: string; onClose: () => void }) {
  const [f, setF] = useState({ name: "", phone: "", city: "", title: "", body: "" });
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return setMsg({ ok: false, t: "Tap the stars to give a rating." });
    start(async () => { const r = await submitReview({ productId, rating, ...f }); setMsg({ ok: r.ok, t: r.message }); });
  };

  return (
    <motion.div className="fixed inset-0 z-[70] flex items-end justify-center bg-brand-900/60 backdrop-blur-sm sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.form onSubmit={send} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Write a review"
        className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-bg p-6 shadow-2xl sm:rounded-3xl md:p-8"
        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}>
        {msg?.ok ? (
          <div className="py-6 text-center">
            <BadgeCheck size={56} className="mx-auto text-green-500" />
            <p className="mt-3 text-2xl font-extrabold uppercase">Thank you!</p>
            <p className="mt-1 text-muted">{msg.t}</p>
            <button type="button" onClick={onClose} className="mt-6 rounded-full bg-brand-600 px-8 py-3 font-bold text-white">Close</button>
          </div>
        ) : (
          <>
            <p className="text-xs font-bold uppercase tracking-wider text-hot">Write a review</p>
            <h3 className="mt-1 text-2xl font-extrabold uppercase leading-tight">{productName}</h3>
            <div className="mt-5 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onClick={() => setRating(s)} onMouseEnter={() => setHover(s)} aria-label={`${s} star${s > 1 ? "s" : ""}`} className="transition hover:scale-110">
                  <Star size={36} className={(hover || rating) >= s ? "fill-amber-400 text-amber-400" : "text-line"} strokeWidth={1.5} />
                </button>
              ))}
              <span className="ml-2 text-sm font-bold text-muted">{WORDS[hover || rating]}</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold">Your name *<input required value={f.name} onChange={set("name")} className={`${input} mt-1`} /></label>
              <label className="text-sm font-semibold">City<input value={f.city} onChange={set("city")} className={`${input} mt-1`} placeholder="e.g. Okara" /></label>
              <label className="text-sm font-semibold sm:col-span-2">Phone * <span className="font-normal text-muted">(private, never shown. Used to mark you as a verified buyer)</span>
                <input required inputMode="tel" value={f.phone} onChange={set("phone")} className={`${input} mt-1`} placeholder="03xx xxxxxxx" />
              </label>
              <label className="text-sm font-semibold sm:col-span-2">Title<input value={f.title} onChange={set("title")} maxLength={100} className={`${input} mt-1`} placeholder="e.g. Perfect fit on my CD 70" /></label>
              <label className="text-sm font-semibold sm:col-span-2">Your review *<textarea required rows={4} value={f.body} onChange={set("body")} maxLength={2000} className={`${input} mt-1 resize-y`} placeholder="Did it fit? How is the quality? How fast was delivery?" /></label>
            </div>
            {msg && !msg.ok && <p role="alert" className="mt-3 rounded-xl bg-hot/10 px-4 py-2.5 text-sm font-semibold text-hot">{msg.t}</p>}
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={onClose} className="rounded-full border border-line px-6 py-3 font-bold">Cancel</button>
              <button disabled={pending} className="flex-1 rounded-full bg-brand-600 py-3 font-bold text-white transition hover:bg-brand-700 disabled:opacity-60">{pending ? "Sending…" : "Send review"}</button>
            </div>
            <p className="mt-3 text-center text-xs text-muted">Reviews are checked by the shop before they appear.</p>
          </>
        )}
      </motion.form>
    </motion.div>
  );
}
