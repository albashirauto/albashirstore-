"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import Logo from "@/components/Logo";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { browserClient } from "@/lib/supabase";

const field = "w-full rounded-xl border border-line bg-bg py-3.5 pl-11 pr-12 outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";

/** Opened from the "reset password" email. Supabase signs the user in from the link, then they pick a new password. */
export default function ResetPassword() {
  const router = useRouter();
  const [ready, setReady] = useState<"wait" | "yes" | "no">("wait");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const db = browserClient();
    const { data: sub } = db.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady("yes");
    });
    // link may already have been processed before this listener started
    db.auth.getSession().then(({ data }: { data: { session: Session | null } }) => { if (data.session) setReady("yes"); });
    const t = setTimeout(() => setReady((r) => (r === "wait" ? "no" : r)), 6000);
    return () => { sub.subscription.unsubscribe(); clearTimeout(t); };
  }, []);

  const strong = pw.length >= 8;
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (!strong) return setErr("Use at least 8 characters.");
    if (pw !== pw2) return setErr("The two passwords do not match.");
    setBusy(true);
    const { error } = await browserClient().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return setErr(error.message.includes("different") ? "Choose a password different from the old one." : "Could not save. Please open the email link again.");
    setDone(true);
    setTimeout(() => router.push("/admin"), 1800);
  };

  return (
    <div className="grid min-h-dvh place-items-center bg-soft px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full max-w-md rounded-3xl border border-line bg-card p-8 shadow-2xl shadow-brand-900/10">
        <Logo size={38} />
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-6 text-center">
              <CheckCircle2 size={56} className="mx-auto text-green-600" />
              <h1 className="mt-4 text-4xl font-extrabold uppercase">Password saved</h1>
              <p className="mt-2 text-muted">Taking you to the admin panel…</p>
            </motion.div>
          ) : ready === "no" ? (
            <motion.div key="bad" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6">
              <h1 className="text-4xl font-extrabold uppercase">Link expired</h1>
              <p className="mt-2 text-muted">This reset link is old or was already used. Ask for a new one from the sign-in page.</p>
              <Link href="/admin" className="mt-6 inline-flex items-center gap-1.5 font-bold text-brand-600 hover:text-hot"><ArrowLeft size={16} />Back to sign in</Link>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={save} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900"><KeyRound size={22} /></span>
              <h1 className="mt-4 text-4xl font-extrabold uppercase leading-none">Choose a new password</h1>
              <p className="mt-2 text-muted">At least 8 characters. Avoid using your email as the password.</p>

              {[{ v: pw, set: setPw, label: "New password" }, { v: pw2, set: setPw2, label: "Type it again" }].map((f, i) => (
                <label key={f.label} className="mt-5 block text-sm font-semibold">{f.label}
                  <span className="relative mt-1.5 block">
                    <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input type={show ? "text" : "password"} required autoComplete="new-password" value={f.v} onChange={(e) => f.set(e.target.value)} className={field} disabled={ready !== "yes"} />
                    {i === 0 && (
                      <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted hover:bg-soft hover:text-fg">
                        {show ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    )}
                  </span>
                </label>
              ))}

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
                <div className={`h-full rounded-full transition-all duration-500 ${strong ? "bg-green-600" : "bg-hot"}`} style={{ width: `${Math.min(100, (pw.length / 12) * 100)}%` }} />
              </div>

              {err && <p role="alert" className="mt-4 text-sm font-semibold text-hot">{err}</p>}
              <button disabled={busy || ready !== "yes"} className="mt-6 w-full rounded-full bg-brand-600 py-4 text-lg font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60">
                {ready === "wait" ? "Checking your link…" : busy ? "Saving…" : "Save new password"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
