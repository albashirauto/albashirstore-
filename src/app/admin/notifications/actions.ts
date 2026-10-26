"use server";

import nodemailer from "nodemailer";
import { sendMail, testMail } from "@/lib/notify";
import { requireOwner } from "@/lib/requireOwner";
import { hasServiceKey } from "@/lib/supabaseAdmin";

type Result<T = undefined> = { ok: boolean; message?: string; data?: T };
export type Sender = { gmail: string; hasPassword: boolean; lastError: string | null };

const SETUP = "Notifications need the server key (SUPABASE_SERVICE_ROLE_KEY) on the server.";
const owner = (token: string) => requireOwner(token, "change notifications");

/** Sender Gmail (never the password itself) and the last sending error, if any. */
export async function getSender(token: string): Promise<Result<Sender>> {
  if (!hasServiceKey()) return { ok: false, message: SETUP };
  try {
    const { db } = await owner(token);
    const { data } = await db.from("notify_config").select("gmail_user,gmail_password,last_error").eq("id", 1).maybeSingle();
    return { ok: true, data: { gmail: data?.gmail_user ?? "", hasPassword: !!data?.gmail_password, lastError: data?.last_error ?? null } };
  } catch (e) { return { ok: false, message: (e as Error).message }; }
}

/** Save the Gmail that sends the emails. The app password is checked with Gmail before it is saved. */
export async function saveSender(token: string, gmail: string, appPassword: string): Promise<Result> {
  if (!hasServiceKey()) return { ok: false, message: SETUP };
  try {
    const { db } = await owner(token);
    const user = gmail.trim().toLowerCase();
    if (!/^[^\s@]+@(gmail|googlemail)\.com$/.test(user)) return { ok: false, message: "Enter a Gmail address, e.g. albashirauto@gmail.com" };
    const { data: cur } = await db.from("notify_config").select("gmail_password").eq("id", 1).maybeSingle();
    const pass = appPassword.replace(/\s/g, "") || cur?.gmail_password || "";
    if (!/^[a-z]{16}$/i.test(pass)) return { ok: false, message: "The app password is 16 letters (Google shows it in 4 groups of 4)." };
    try {
      await nodemailer.createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass } }).verify();
    } catch {
      return { ok: false, message: "Gmail did not accept this address + app password. Check both, and that 2-Step Verification is on." };
    }
    const { error } = await db.from("notify_config").update({ gmail_user: user, gmail_password: pass, last_error: null, updated_at: new Date().toISOString() }).eq("id", 1);
    if (error) throw error;
    return { ok: true, message: "Sender Gmail saved and checked with Google." };
  } catch (e) { return { ok: false, message: (e as Error).message }; }
}

/** Send a test email to every active recipient. */
export async function sendTest(token: string): Promise<Result> {
  if (!hasServiceKey()) return { ok: false, message: SETUP };
  try {
    const { db } = await owner(token);
    const [{ data: cfg }, { data: people }, { data: name }] = await Promise.all([
      db.from("notify_config").select("gmail_user,gmail_password").eq("id", 1).maybeSingle(),
      db.from("notify_recipients").select("email").eq("active", true),
      db.from("settings").select("value").eq("key", "store_name").maybeSingle(),
    ]);
    if (!cfg?.gmail_user || !cfg.gmail_password) return { ok: false, message: "Set up the sender Gmail first." };
    const to = (people ?? []).map((p) => p.email);
    if (!to.length) return { ok: false, message: "Add at least one email to notify." };
    const store = name?.value || "Al Bashir Autos";
    await sendMail(cfg.gmail_user, cfg.gmail_password, to, testMail(store), store);
    return { ok: true, message: `Test email sent to ${to.length} address${to.length === 1 ? "" : "es"}. Check inbox (and Spam).` };
  } catch (e) { return { ok: false, message: `Could not send: ${(e as Error).message}` }; }
}
