"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, BellRing, CheckCircle2, ExternalLink, KeyRound, Mail, Plus, Send, Trash2 } from "lucide-react";
import { KINDS, type Kind } from "@/lib/notify-kinds";
import { browserClient } from "@/lib/supabase";
import { getSender, saveSender, sendTest, type Sender } from "./actions";

type Recipient = { id: string; email: string; name: string | null; events: Kind[]; active: boolean };
const input = "w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";

/** Notifications (owners only): who gets emailed about orders, payments and stock, and the Gmail that sends them. */
export default function Notifications() {
  const db = browserClient();
  const [rows, setRows] = useState<Recipient[]>([]);
  const [sender, setSender] = useState<Sender | null>(null);
  const [gmail, setGmail] = useState("");
  const [pass, setPass] = useState("");
  const [add, setAdd] = useState({ email: "", name: "" });
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);

  const token = async () => (await db.auth.getSession()).data.session?.access_token ?? "";
  const flash = (ok: boolean, t: string) => { setMsg({ ok, t }); setTimeout(() => setMsg(null), 5000); };

  const load = useCallback(async () => {
    const [{ data }, s] = await Promise.all([db.from("notify_recipients").select("*").order("created_at"), getSender(await token())]);
    setRows((data as Recipient[]) ?? []);
    if (s.ok && s.data) { setSender(s.data); setGmail((g) => g || s.data!.gmail); } else flash(false, s.message ?? "Could not load.");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);
  useEffect(() => { load(); }, [load]);

  const saveGmail = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy("sender");
    const r = await saveSender(await token(), gmail, pass);
    setBusy(""); flash(r.ok, r.message ?? ""); if (r.ok) { setPass(""); load(); }
  };
  const addOne = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = add.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return flash(false, "Enter a valid email address.");
    const { error } = await db.from("notify_recipients").insert({ email, name: add.name.trim() || null });
    if (error) return flash(false, error.message.includes("duplicate") ? "That email is already on the list." : error.message);
    setAdd({ email: "", name: "" }); flash(true, `${email} will now get notifications.`); load();
  };
  const update = async (r: Recipient, patch: Partial<Recipient>) => {
    setRows((all) => all.map((x) => (x.id === r.id ? { ...x, ...patch } : x)));
    const { error } = await db.from("notify_recipients").update(patch).eq("id", r.id);
    if (error) { flash(false, error.message); load(); }
  };
  const toggle = (r: Recipient, k: Kind) => update(r, { events: r.events.includes(k) ? r.events.filter((x) => x !== k) : [...r.events, k] });
  const remove = async (r: Recipient) => {
    if (!confirm(`Stop all notifications to ${r.email}?`)) return;
    await db.from("notify_recipients").delete().eq("id", r.id); load();
  };
  const test = async () => { setBusy("test"); const r = await sendTest(await token()); setBusy(""); flash(r.ok, r.message ?? ""); };

  const ready = !!sender?.gmail && sender.hasPassword;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold uppercase leading-none text-brand-900 dark:text-white sm:text-4xl md:text-5xl">Notifications</h1>
          <p className="mt-1.5 text-muted">Get an email for new orders, order updates, payments and stock alerts. Add as many Gmail (or any) addresses as you like.</p>
        </div>
        <button onClick={test} disabled={!ready || !rows.some((r) => r.active) || busy === "test"} className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 font-bold text-white shadow-lg shadow-brand-600/25 transition hover:-translate-y-0.5 hover:bg-brand-700 disabled:opacity-50">
          <Send size={17} />{busy === "test" ? "Sending…" : "Send test email"}
        </button>
      </div>

      {sender?.lastError && (
        <div className="flex gap-3 rounded-2xl border border-hot/30 bg-hot/10 p-4 text-sm">
          <AlertTriangle size={20} className="shrink-0 text-hot" />
          <div><p className="font-bold text-hot">The last email could not be sent</p><p className="mt-0.5 break-words text-muted">{sender.lastError}</p></div>
        </div>
      )}

      {/* 1. sender */}
      <form onSubmit={saveGmail} className="rounded-2xl border border-line bg-card p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900"><Mail size={19} /></span>
          <div className="flex-1">
            <p className="font-bold">1. Gmail that sends the emails</p>
            <p className="text-sm text-muted">Emails come from your own Gmail, using a Google &quot;app password&quot; (not your normal password).</p>
          </div>
          {ready && <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800"><CheckCircle2 size={14} />Connected: {sender!.gmail}</span>}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <input value={gmail} onChange={(e) => setGmail(e.target.value)} type="email" placeholder="albashirauto@gmail.com" className={input} />
          <div className="relative">
            <KeyRound size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input value={pass} onChange={(e) => setPass(e.target.value)} type="password" autoComplete="new-password" placeholder={sender?.hasPassword ? "App password saved (type to change)" : "16-letter app password"} className={`${input} pl-10 font-mono`} />
          </div>
          <button disabled={busy === "sender"} className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-60">{busy === "sender" ? "Checking with Google…" : "Save & check"}</button>
        </div>
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer font-semibold text-brand-600">How do I get an app password? (2 minutes)</summary>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
            <li>Sign in to the Gmail above, then open <a href="https://myaccount.google.com/signinoptions/twosv" target="_blank" rel="noreferrer" className="font-semibold text-brand-600 underline">2-Step Verification <ExternalLink size={11} className="inline" /></a> and turn it on (if it isn&apos;t already).</li>
            <li>Open <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="font-semibold text-brand-600 underline">App passwords <ExternalLink size={11} className="inline" /></a>, type a name like <b>Al Bashir Store</b> and press Create.</li>
            <li>Copy the 16-letter password Google shows and paste it here. Spaces don&apos;t matter.</li>
          </ol>
        </details>
      </form>

      {/* 2. recipients */}
      <div className="rounded-2xl border border-line bg-card p-5 md:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-hot/10 text-hot"><BellRing size={19} /></span>
          <div>
            <p className="font-bold">2. Who gets notified</p>
            <p className="text-sm text-muted">Tick what each person wants. Changes save straight away.</p>
          </div>
        </div>

        <form onSubmit={addOne} className="mt-4 grid gap-3 md:grid-cols-[1.2fr_1fr_auto]">
          <input value={add.email} onChange={(e) => setAdd({ ...add, email: e.target.value })} type="email" placeholder="Email, e.g. owner@gmail.com" className={input} />
          <input value={add.name} onChange={(e) => setAdd({ ...add, name: e.target.value })} placeholder="Name (optional)" className={input} />
          <button className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-600 px-5 py-2.5 text-sm font-bold text-brand-600 transition hover:bg-brand-600 hover:text-white"><Plus size={16} />Add email</button>
        </form>

        <ul className="mt-5 grid gap-3">
          {rows.map((r) => (
            <li key={r.id} className={`rounded-xl border border-line p-4 transition ${r.active ? "" : "opacity-60"}`}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display font-bold text-white">{(r.name || r.email).charAt(0).toUpperCase()}</span>
                <span className="min-w-0 flex-1 leading-tight">
                  <span className="block truncate font-bold">{r.name || r.email}</span>
                  {r.name && <span className="block truncate text-xs text-muted">{r.email}</span>}
                </span>
                <label className="flex items-center gap-2 text-xs font-semibold">
                  <input type="checkbox" checked={r.active} onChange={(e) => update(r, { active: e.target.checked })} className="h-4 w-4 accent-green-600" />{r.active ? "On" : "Paused"}
                </label>
                <button onClick={() => remove(r)} title="Remove" className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-hot/10 hover:text-hot"><Trash2 size={15} /></button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {KINDS.map((k) => {
                  const on = r.events.includes(k.key);
                  return (
                    <button key={k.key} type="button" title={k.hint} onClick={() => toggle(r, k.key)} aria-pressed={on}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${on ? "border-brand-600 bg-brand-600 text-white" : "border-line text-muted hover:border-brand-500/50"}`}>
                      {on ? "✓ " : ""}{k.label}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
          {!rows.length && <li className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-muted">No one yet. Add the owners&apos; emails above.</li>}
        </ul>

        <ul className="mt-5 grid gap-1.5 rounded-xl bg-soft p-4 text-xs text-muted sm:grid-cols-2">
          {KINDS.map((k) => <li key={k.key}><b className="text-fg">{k.label}:</b> {k.hint}</li>)}
        </ul>
      </div>

      {msg && <div role="status" className={`fixed bottom-6 left-1/2 z-[70] max-w-[92vw] -translate-x-1/2 rounded-full px-5 py-3 text-center text-sm font-bold text-white shadow-xl ${msg.ok ? "bg-green-600" : "bg-hot"}`}>{msg.t}</div>}
    </div>
  );
}
