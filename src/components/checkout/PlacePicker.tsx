"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, PenLine } from "lucide-react";
import { PROVINCES, districtsOf, townsOf } from "@/lib/pk-places";

export type Place = { province: string; district: string; city: string };

/** Province -> District -> City / town. Each list is searchable (type to filter); the town can also be typed freely. */
export default function PlacePicker({ value, onChange, input }: { value: Place; onChange: (p: Place) => void; input: string }) {
  const districts = useMemo(() => districtsOf(value.province), [value.province]);
  const towns = useMemo(() => townsOf(value.province, value.district), [value.province, value.district]);
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Combo label="Province" required value={value.province} options={PROVINCES} input={input} placeholder="Choose province"
        onPick={(province) => onChange({ province, district: "", city: "" })} />
      <Combo label="District" required value={value.district} options={districts} input={input} disabled={!value.province}
        placeholder={value.province ? "Search district…" : "Choose province first"}
        onPick={(district) => {
          const t = townsOf(value.province, district);
          onChange({ ...value, district, city: t.length === 1 ? t[0] : "" });
        }} />
      <Combo label="City / town" required free value={value.city} options={towns} input={input} disabled={!value.district}
        placeholder={value.district ? "Search or type your town…" : "Choose district first"}
        onPick={(city) => onChange({ ...value, city })} />
    </div>
  );
}

/** Searchable dropdown. With `free`, whatever the customer types is kept even if it isn't in the list (small villages). */
function Combo({ label, value, options, onPick, placeholder, input, disabled, required, free }: {
  label: string; value: string; options: string[]; onPick: (v: string) => void; placeholder: string; input: string;
  disabled?: boolean; required?: boolean; free?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [hi, setHi] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const id = useId();

  const term = q.trim().toLowerCase();
  const shown = useMemo(() => {
    if (!term) return options;
    const starts = options.filter((o) => o.toLowerCase().startsWith(term));
    return [...starts, ...options.filter((o) => !starts.includes(o) && o.toLowerCase().includes(term))];
  }, [options, term]);
  const custom = free && term && !options.some((o) => o.toLowerCase() === term) ? q.trim() : "";
  const items = custom ? [...shown, custom] : shown;

  useEffect(() => {
    const close = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  useEffect(() => { list.current?.querySelector(`[data-i="${hi}"]`)?.scrollIntoView({ block: "nearest" }); }, [hi]);

  const pick = (v: string) => { onPick(v); setQ(""); setOpen(false); };
  const key = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHi((h) => Math.min(h + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHi((h) => Math.max(h - 1, 0)); }
    else if (e.key === "Enter" && open && items[hi]) { e.preventDefault(); pick(items[hi]); }
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={box} className="relative text-sm font-semibold">
      <label htmlFor={id}>{label}{required && " *"}</label>
      <div className="relative">
        <input id={id} role="combobox" aria-expanded={open} aria-controls={`${id}-list`} aria-autocomplete="list" autoComplete="off"
          disabled={disabled} required={required} placeholder={placeholder}
          value={open ? q : value} onFocus={() => { setOpen(true); setQ(""); setHi(0); }}
          onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0); }}
          onBlur={() => { if (free && term) onPick(options.find((o) => o.toLowerCase() === term) ?? q.trim()); }}
          onKeyDown={key}
          className={`${input} pr-9 disabled:cursor-not-allowed disabled:opacity-50`} />
        <ChevronDown size={16} className={`pointer-events-none absolute right-3 top-1/2 mt-0.5 text-muted transition ${open ? "rotate-180" : ""}`} />
      </div>
      {open && !disabled && (
        <ul ref={list} id={`${id}-list`} role="listbox" className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-line bg-card p-1 font-medium shadow-xl">
          {items.map((o, i) => {
            const isCustom = custom && i === items.length - 1;
            return (
              <li key={`${o}-${i}`} data-i={i} role="option" aria-selected={o === value}
                onMouseDown={(e) => { e.preventDefault(); pick(o); }} onMouseEnter={() => setHi(i)}
                className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 ${i === hi ? "bg-brand-50 text-brand-900 dark:bg-brand-900 dark:text-white" : ""}`}>
                {isCustom ? <span className="flex items-center gap-2 text-brand-600"><PenLine size={14} />Use “{o}”</span> : o}
                {o === value && !isCustom && <Check size={14} className="text-brand-600" />}
              </li>
            );
          })}
          {!items.length && <li className="px-3 py-2 text-muted">No match</li>}
        </ul>
      )}
    </div>
  );
}
