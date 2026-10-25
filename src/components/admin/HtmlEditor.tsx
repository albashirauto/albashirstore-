"use client";

import { useRef, useState } from "react";
import { Bold, Heading2, Link2, List, Pilcrow } from "lucide-react";

/** Simple page editor: buttons insert HTML tags, with a live preview next to it. */
export default function HtmlEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(true);

  const wrap = (open: string, close: string, fallback = "text") => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e } = el;
    const sel = value.slice(s, e) || fallback;
    onChange(value.slice(0, s) + open + sel + close + value.slice(e));
    requestAnimationFrame(() => el.focus());
  };

  const btn = "flex items-center gap-1 rounded-lg border border-line bg-card px-2.5 py-1.5 text-sm font-semibold transition hover:border-brand-500 hover:text-brand-600";
  return (
    <div className="rounded-2xl border-2 border-line">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-soft p-2">
        <button type="button" className={btn} onClick={() => wrap("<h2>", "</h2>", "Heading")}><Heading2 size={15} />Heading</button>
        <button type="button" className={btn} onClick={() => wrap("<p>", "</p>", "Paragraph")}><Pilcrow size={15} />Paragraph</button>
        <button type="button" className={btn} onClick={() => wrap("<strong>", "</strong>")}><Bold size={15} />Bold</button>
        <button type="button" className={btn} onClick={() => wrap("<ul>\n  <li>", "</li>\n</ul>", "Item")}><List size={15} />List</button>
        <button type="button" className={btn} onClick={() => { const u = prompt("Link address (e.g. /shop or https://…)"); if (u) wrap(`<a href="${u}">`, "</a>", "link"); }}><Link2 size={15} />Link</button>
        <label className="ml-auto flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} />Preview</label>
      </div>
      <div className={`grid ${preview ? "md:grid-cols-2" : ""}`}>
        <textarea ref={ref} value={value} onChange={(e) => onChange(e.target.value)} rows={14} spellCheck className="w-full resize-y bg-card p-4 font-mono text-sm outline-none" />
        {preview && <div className="prose-cms max-h-[420px] overflow-auto border-t border-line bg-card p-4 md:border-l md:border-t-0" dangerouslySetInnerHTML={{ __html: value }} />}
      </div>
    </div>
  );
}
