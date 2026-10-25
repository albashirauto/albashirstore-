"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.dataset.theme === "dark"), []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try { localStorage.setItem("aba-theme", next ? "dark" : "light"); } catch {}
  };
  return (
    <button onClick={toggle} aria-label="Switch light / dark theme" className="grid h-10 w-10 place-items-center rounded-full border border-line bg-card transition hover:border-brand-500 hover:text-brand-600">
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
