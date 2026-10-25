"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useAnimationControls } from "motion/react";
import { ArrowLeft, ArrowRight, BarChart3, Eye, EyeOff, Lock, Mail, MailCheck, PackagePlus, ShieldCheck } from "lucide-react";
import Logo from "@/components/Logo";
import Sprocket from "@/components/Sprocket";
import { browserClient } from "@/lib/supabase";

/** Where "Forgot password" sends the reset link by default. */
const ADMIN_EMAIL = "albashirauto@gmail.com";

type Mode = "login" | "forgot" | "sent";
const ease = [0.22, 1, 0.36, 1] as const;
const field = "w-full rounded-xl border border-line bg-bg py-3.5 pl-11 pr-4 outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";

/** Admin sign-in: brand panel + animated card with sign in / forgot password / email sent. */
export default function LoginScreen({ denied, onSignedIn, onSignOut }: { denied: boolean; onSignedIn: () => void; onSignOut: () => void }) {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [resetEmail, setResetEmail] = useState(ADMIN_EMAIL);
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const shake = useAnimationControls();

  const fail = (msg: string) => {
    setErr(msg);
    shake.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.4 } });
  };

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const { error } = await browserClient().auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return fail(error.message.toLowerCase().includes("confirm") ? "Please confirm your email first. Check your inbox." : "Wrong email or password.");
    onSignedIn();
  };

  const forgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setErr("");
    const { error } = await browserClient().auth.resetPasswordForEmail(resetEmail.trim(), { redirectTo: `${window.location.origin}/admin/reset` });
    setBusy(false);
    if (error) return fail(error.message.includes("rate") ? "Too many emails sent. Please wait a little and try again." : "Could not send the email. Please try again.");
    setMode("sent");
  };

  return (
    <div className="grid min-h-dvh bg-bg lg:grid-cols-[1.1fr_1fr]">
      {/* brand panel */}
      <aside className="relative hidden overflow-hidden bg-brand-900 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,var(--color-brand-600),transparent_60%)]" />
        <span className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "56px 56px" }} />
        <Sprocket size={520} className="absolute -bottom-40 -right-40 text-white/[0.06] [animation:spin-slow_80s_linear_infinite]" />
        <Sprocket size={160} teeth={11} className="absolute right-24 top-28 text-hot/70 [animation:spin-rev_50s_linear_infinite]" />

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="relative w-fit rounded-2xl bg-white p-3">
          <Logo size={40} />
        </motion.div>

        <motion.div initial="hide" animate="show" transition={{ staggerChildren: 0.1, delayChildren: 0.15 }} className="relative max-w-md">
          <motion.p variants={{ hide: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-white/70"><span className="h-px w-6 bg-hot" />Store admin</motion.p>
          <motion.h1 variants={{ hide: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} className="text-6xl font-extrabold uppercase leading-[0.92]">Run your shop<br /><span className="text-hot">from one place.</span></motion.h1>
          <ul className="mt-8 grid gap-3">
            {[
              { icon: PackagePlus, t: "Add parts, prices, photos and schemes" },
              { icon: BarChart3, t: "Track every order from new to delivered" },
              { icon: ShieldCheck, t: "Only approved admins can make changes" },
            ].map(({ icon: Icon, t }) => (
              <motion.li key={t} variants={{ hide: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }} className="flex items-center gap-3 text-white/85">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10"><Icon size={18} /></span>{t}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        <p className="relative text-sm text-white/50">© {new Date().getFullYear()} Al Bashir Autos</p>
      </aside>

      {/* card */}
      <main className="relative flex items-center justify-center px-4 py-12">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-hot via-brand-500 to-hot lg:hidden" />
        <motion.div animate={shake} className="w-full max-w-md">
          <div className="mb-8 lg:hidden"><Logo size={40} /></div>

          <AnimatePresence mode="wait">
            {mode === "login" && (
              <motion.form key="login" onSubmit={login} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35, ease }}>
                <h2 className="text-5xl font-extrabold uppercase leading-none text-brand-900 dark:text-white">Welcome back</h2>
                <p className="mt-2 text-muted">Sign in to manage your store.</p>

                {denied && (
                  <div className="mt-6 rounded-xl border border-hot/30 bg-hot/10 p-4 text-sm">
                    <p className="font-bold text-hot">This account is not an admin yet.</p>
                    <p className="mt-1 text-muted">Run the admin SQL from <code>schema.sql</code> for this email, then sign in again.</p>
                    <button type="button" onClick={onSignOut} className="mt-2 font-bold text-brand-600 hover:underline">Sign out</button>
                  </div>
                )}

                <label className="mt-8 block text-sm font-semibold">Email
                  <span className="relative mt-1.5 block">
                    <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={field} />
                  </span>
                </label>

                <label className="mt-5 block text-sm font-semibold">
                  <span className="flex items-center justify-between">Password
                    <button type="button" onClick={() => { setMode("forgot"); setErr(""); }} className="text-sm font-bold text-brand-600 hover:text-hot">Forgot password?</button>
                  </span>
                  <span className="relative mt-1.5 block">
                    <Lock size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input type={show ? "text" : "password"} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={`${field} pr-12`} />
                    <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted transition hover:bg-soft hover:text-fg">
                      {show ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </span>
                </label>

                <AnimatePresence>{err && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} role="alert" className="mt-4 text-sm font-semibold text-hot">{err}</motion.p>}</AnimatePresence>

                <button disabled={busy} className="group mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-4 text-lg font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60">
                  {busy ? <Spinner /> : <>Sign in <ArrowRight size={19} className="transition group-hover:translate-x-1" /></>}
                </button>
                <Link href="/" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-muted transition hover:text-fg"><ArrowLeft size={15} />Back to the store</Link>
              </motion.form>
            )}

            {mode === "forgot" && (
              <motion.form key="forgot" onSubmit={forgot} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.35, ease }}>
                <button type="button" onClick={() => { setMode("login"); setErr(""); }} className="mb-6 flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-hot"><ArrowLeft size={15} />Back to sign in</button>
                <h2 className="text-5xl font-extrabold uppercase leading-none text-brand-900 dark:text-white">Reset password</h2>
                <p className="mt-2 text-muted">We will email you a link to choose a new password.</p>
                <label className="mt-8 block text-sm font-semibold">Send the link to
                  <span className="relative mt-1.5 block">
                    <Mail size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                    <input type="email" required value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} className={field} />
                  </span>
                </label>
                <AnimatePresence>{err && <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} role="alert" className="mt-4 text-sm font-semibold text-hot">{err}</motion.p>}</AnimatePresence>
                <button disabled={busy} className="mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-brand-600 py-4 text-lg font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-60">
                  {busy ? <Spinner /> : "Send reset link"}
                </button>
              </motion.form>
            )}

            {mode === "sent" && (
              <motion.div key="sent" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4, ease }} className="text-center">
                <motion.span initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.1 }} className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-600/10 text-green-600">
                  <MailCheck size={38} />
                </motion.span>
                <h2 className="mt-6 text-4xl font-extrabold uppercase leading-none text-brand-900 dark:text-white">Check your email</h2>
                <p className="mx-auto mt-3 max-w-sm text-muted">If <b className="text-fg">{resetEmail}</b> has an admin account, a reset link is on its way. It can take a minute. Check spam too.</p>
                <button onClick={() => setMode("login")} className="mt-8 inline-flex items-center gap-1.5 font-bold text-brand-600 hover:text-hot"><ArrowLeft size={16} />Back to sign in</button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}

function Spinner() {
  return <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-label="Loading" />;
}
