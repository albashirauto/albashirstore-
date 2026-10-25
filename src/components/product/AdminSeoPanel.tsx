"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CircleAlert, Pencil, X, XCircle } from "lucide-react";
import type { SeoInput } from "@/lib/seo";
import { analyze, scoreTone } from "@/lib/seo";
import { browserClient, hasSupabase } from "@/lib/supabase";

/** Floating SEO score on the live product page. Rendered only for signed-in admins; customers never see it. */
export default function AdminSeoPanel({ input, editHref, label = "product" }: { input: SeoInput; editHref: string; label?: string }) {
  const [admin, setAdmin] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasSupabase) return;
    const db = browserClient();
    (async () => {
      const { data } = await db.auth.getUser();
      if (!data.user) return;
      const { data: row } = await db.from("admins").select("user_id").eq("user_id", data.user.id).maybeSingle();
      setAdmin(!!row);
    })();
  }, []);

  if (!admin) return null;
  const { score, checks } = analyze(input);
  const t = scoreTone(score);
  const problems = checks.filter((c) => !c.ok).sort((a, b) => Number(!!a.warn) - Number(!!b.warn));

  return (
    <div className="fixed bottom-5 left-5 z-40">
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6 }}
            className="mb-3 w-80 origin-bottom-left rounded-2xl border border-line bg-card p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">SEO check: {label} <span className="font-normal text-muted">(only you see this)</span></p>
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1 text-muted hover:bg-soft"><X size={15} /></button>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="font-display text-5xl font-extrabold leading-none" style={{ color: t.ring }}>{score}</span>
              <div>
                <p className={`font-bold ${t.text}`}>{t.label}</p>
                <p className="text-xs text-muted">{checks.length - problems.length} of {checks.length} checks passed</p>
              </div>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: t.ring }} /></div>
            {problems.length > 0 ? (
              <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1 text-xs">
                {problems.map((c) => (
                  <li key={c.id} className="flex gap-2">
                    {c.warn ? <CircleAlert size={14} className="mt-0.5 shrink-0 text-amber-600" /> : <XCircle size={14} className="mt-0.5 shrink-0 text-hot" />}
                    <span>{c.text}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-3 text-sm font-semibold text-green-700">No problems found. Great job!</p>}
            <Link href={editHref} className="mt-4 flex items-center justify-center gap-1.5 rounded-full bg-brand-600 py-2 text-sm font-bold text-white transition hover:bg-brand-700"><Pencil size={14} />Edit SEO</Link>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setOpen(!open)} className={`flex items-center gap-2 rounded-full border-2 bg-card py-1.5 pl-1.5 pr-4 text-sm font-bold shadow-lg transition hover:-translate-y-0.5`} style={{ borderColor: t.ring }}>
        <span className="grid h-8 w-8 place-items-center rounded-full font-display text-sm font-extrabold text-white" style={{ background: t.ring }}>{score}</span>
        SEO{problems.filter((c) => !c.warn).length ? ` · ${problems.filter((c) => !c.warn).length} to fix` : ""}
      </button>
    </div>
  );
}
