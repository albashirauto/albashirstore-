"use client";

import { ArrowUp } from "lucide-react";

export default function BackToTop() {
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="group inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-bold text-white/80 transition hover:border-white hover:bg-white hover:text-brand-900">
      Back to top <ArrowUp size={16} className="transition group-hover:-translate-y-0.5" />
    </button>
  );
}
