"use client";

import { useActionState } from "react";
import { subscribe } from "@/app/actions";

export default function Newsletter() {
  const [state, action, pending] = useActionState(subscribe, null as null | { ok: boolean; message: string });
  return (
    <form action={action} className="mt-6">
      <label htmlFor="nl" className="text-sm font-semibold">Get deal alerts by email</label>
      <div className="mt-2 flex gap-2">
        <input id="nl" name="email" type="email" required placeholder="you@email.com" className="min-w-0 flex-1 rounded-full bg-white/10 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/50 focus:bg-white/20" />
        <button disabled={pending} className="rounded-full bg-hot px-5 py-2.5 text-sm font-bold transition hover:bg-hot-dark disabled:opacity-60">{pending ? "…" : "Join"}</button>
      </div>
      {state && <p className={`mt-2 text-sm ${state.ok ? "text-green-300" : "text-red-300"}`} role="status">{state.message}</p>}
    </form>
  );
}
