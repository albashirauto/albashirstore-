"use client";

import { useEffect, useState } from "react";
import { Check, Lock } from "lucide-react";
import { browserClient } from "@/lib/supabase";

const input = "w-full rounded-xl border border-line bg-bg px-4 py-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10";

/** Where "Forgot password?" may send links. Staff never get reset links: the owner sets their passwords. */
export default function ResetEmailsCard() {
  const db = browserClient();
  const [a, setA] = useState(""), [b, setB] = useState("");
  const [saved, setSaved] = useState<[string, string]>(["", ""]);
  const [state, setState] = useState<"idle" | "saving" | "done" | "bad">("idle");

  useEffect(() => {
    db.from("settings").select("key,value").in("key", ["team_reset_email", "team_reset_email2"]).then(({ data }: { data: { key: string; value: string }[] | null }) => {
      const m = Object.fromEntries((data ?? []).map((r) => [r.key, r.value ?? ""]));
      setA(m.team_reset_email ?? ""); setB(m.team_reset_email2 ?? ""); setSaved([m.team_reset_email ?? "", m.team_reset_email2 ?? ""]);
    });
  }, [db]);

  const ok = (e: string) => !e || /^\S+@\S+\.\S+$/.test(e);
  const save = async () => {
    if (!ok(a) || !ok(b)) return setState("bad");
    setState("saving");
    const { error } = await db.from("settings").upsert([{ key: "team_reset_email", value: a.trim().toLowerCase() }, { key: "team_reset_email2", value: b.trim().toLowerCase() }]);
    if (error) return setState("bad");
    setSaved([a.trim().toLowerCase(), b.trim().toLowerCase()]); setState("done"); setTimeout(() => setState("idle"), 2000);
  };
  const dirty = a !== saved[0] || b !== saved[1];

  return (
    <section className="rounded-2xl border border-line bg-card p-5 md:p-6">
      <h2 className="flex items-center gap-2 text-lg font-bold"><Lock size={18} className="text-brand-600" />Password reset emails</h2>
      <p className="mt-1 max-w-3xl text-sm text-muted">
        “Forgot password?” on the admin login can only send a link to <b className="text-fg">these addresses</b>, never to a team member and never on WhatsApp.
        Team members cannot change their own password: you set it here and give it to them. Each address needs its own owner login to receive a link.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
        <label className="text-sm font-semibold">Official email<input type="email" value={a} onChange={(e) => setA(e.target.value)} placeholder="owner@gmail.com" className={`${input} mt-1.5 ${ok(a) ? "" : "border-hot"}`} /></label>
        <label className="text-sm font-semibold">Second email (optional)<input type="email" value={b} onChange={(e) => setB(e.target.value)} placeholder="backup@gmail.com" className={`${input} mt-1.5 ${ok(b) ? "" : "border-hot"}`} /></label>
        <button onClick={save} disabled={!dirty || state === "saving"} className="inline-flex h-[46px] items-center justify-center gap-1.5 rounded-xl bg-brand-600 px-6 text-sm font-bold text-white transition hover:bg-brand-700 disabled:opacity-40">
          {state === "done" ? <><Check size={16} />Saved</> : state === "saving" ? "Saving…" : "Save emails"}
        </button>
      </div>
      {state === "bad" && <p className="mt-2 text-sm font-semibold text-hot">Check the email addresses.</p>}
    </section>
  );
}
