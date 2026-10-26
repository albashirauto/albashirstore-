"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import Highlight from "@tiptap/extension-highlight";
import { TableKit } from "@tiptap/extension-table";
import {
  AlignCenter, AlignLeft, AlignRight, Bold, Code2, FileCode2, Heading2, Heading3, Heading4, Highlighter, ImagePlus, Italic,
  Link2, List, ListOrdered, Loader2, Minus, Pilcrow, Quote, Redo2, RemoveFormatting, Strikethrough, Table2, Underline, Undo2, Youtube as YoutubeIcon,
} from "lucide-react";
import { upload } from "@/components/admin/ImageField";
import { readingMinutes, wordCount } from "@/lib/blog";

/** WordPress-style visual editor (TipTap): toolbar, image upload / drag & drop / paste, YouTube, tables, HTML view. */
export default function RichEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const [source, setSource] = useState(false);
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const insertFiles = async (ed: Editor, files: File[], pos?: number) => {
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return false;
    setBusy(true);
    try {
      for (const f of imgs) {
        const src = await upload(f, "blog");
        const alt = f.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
        const chain = ed.chain().focus();
        (pos !== undefined ? chain.insertContentAt(pos, { type: "image", attrs: { src, alt } }) : chain.setImage({ src, alt })).run();
      }
    } catch (e) { alert(`Upload failed: ${(e as Error).message}`); }
    setBusy(false);
    return true;
  };

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] }, link: { openOnClick: false, autolink: true, defaultProtocol: "https" } }),
      Image.configure({ HTMLAttributes: { loading: "lazy" } }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Start writing your article… Use H2 / H3 headings for sections." }),
      Youtube.configure({ nocookie: true, width: 640, height: 360 }),
      Highlight,
      TableKit.configure({ table: { resizable: false } }),
    ],
    content: value,
    editorProps: {
      attributes: { class: "prose-cms min-h-[480px] px-5 py-4 text-lg outline-none md:px-8" },
      handleDrop: (view, e) => {
        const files = Array.from(e.dataTransfer?.files ?? []);
        if (!files.length || !edRef.current) return false;
        const pos = view.posAtCoords({ left: e.clientX, top: e.clientY })?.pos;
        e.preventDefault(); insertFiles(edRef.current, files, pos); return true;
      },
      handlePaste: (_v, e) => {
        const files = Array.from(e.clipboardData?.files ?? []);
        if (!files.length || !edRef.current) return false;
        e.preventDefault(); insertFiles(edRef.current, files); return true;
      },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
  });
  const edRef = useRef<Editor | null>(null);
  edRef.current = editor;

  // content replaced from outside (loading a post, restoring a backup)
  useEffect(() => {
    if (editor && !editor.isFocused && value !== editor.getHTML()) editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => e ? {
      p: e.isActive("paragraph"), h2: e.isActive("heading", { level: 2 }), h3: e.isActive("heading", { level: 3 }), h4: e.isActive("heading", { level: 4 }),
      b: e.isActive("bold"), i: e.isActive("italic"), u: e.isActive("underline"), st: e.isActive("strike"), hl: e.isActive("highlight"),
      ul: e.isActive("bulletList"), ol: e.isActive("orderedList"), q: e.isActive("blockquote"), code: e.isActive("codeBlock"), link: e.isActive("link"),
      left: e.isActive({ textAlign: "left" }), center: e.isActive({ textAlign: "center" }), right: e.isActive({ textAlign: "right" }),
      img: e.isActive("image"), table: e.isActive("table"), undo: e.can().undo(), redo: e.can().redo(),
    } : null,
  });

  if (!editor || !s) return <div className="grid min-h-[540px] place-items-center rounded-2xl border border-line bg-card text-muted"><Loader2 className="animate-spin" /></div>;
  const c = () => editor.chain().focus();

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = prompt("Link address (e.g. /collections/chain-kits or https://…). Empty = remove link.", prev ?? "");
    if (url === null) return;
    if (!url.trim()) return c().extendMarkRange("link").unsetLink().run();
    c().extendMarkRange("link").setLink({ href: url.trim(), target: /^https?:\/\//.test(url) && !url.includes(window.location.host) ? "_blank" : null }).run();
  };
  const imageAlt = () => {
    const alt = prompt("Alt text: describe the picture (helps Google and blind readers). Use your focus keyword if it fits.", editor.getAttributes("image").alt ?? "");
    if (alt !== null) c().updateAttributes("image", { alt }).run();
  };
  const imageUrl = () => { const src = prompt("Picture address (https://…)"); if (src) c().setImage({ src, alt: prompt("Alt text") ?? "" }).run(); };
  const video = () => { const src = prompt("YouTube link"); if (src) c().setYoutubeVideo({ src }).run(); };

  const B = ({ on, title, onClick, children, disabled }: { on?: boolean; title: string; onClick: () => void; children: React.ReactNode; disabled?: boolean }) => (
    <button type="button" title={title} aria-label={title} aria-pressed={on} disabled={disabled} onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className={`grid h-8 min-w-8 place-items-center rounded-lg px-1.5 transition disabled:opacity-30 ${on ? "bg-brand-600 text-white" : "text-fg/80 hover:bg-soft hover:text-fg"}`}>{children}</button>
  );
  const Sep = () => <span className="mx-0.5 h-5 w-px bg-line" />;
  const html = editor.getHTML();

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-card">
      <div className="sticky top-0 z-20 flex flex-wrap items-center gap-0.5 border-b border-line bg-card/95 p-1.5 backdrop-blur">
        <B title="Undo (Ctrl+Z)" onClick={() => c().undo().run()} disabled={!s.undo || source}><Undo2 size={16} /></B>
        <B title="Redo (Ctrl+Y)" onClick={() => c().redo().run()} disabled={!s.redo || source}><Redo2 size={16} /></B>
        <Sep />
        <B title="Paragraph" on={s.p} onClick={() => c().setParagraph().run()}><Pilcrow size={16} /></B>
        <B title="Heading 2 (section)" on={s.h2} onClick={() => c().toggleHeading({ level: 2 }).run()}><Heading2 size={16} /></B>
        <B title="Heading 3 (sub-section)" on={s.h3} onClick={() => c().toggleHeading({ level: 3 }).run()}><Heading3 size={16} /></B>
        <B title="Heading 4" on={s.h4} onClick={() => c().toggleHeading({ level: 4 }).run()}><Heading4 size={16} /></B>
        <Sep />
        <B title="Bold (Ctrl+B)" on={s.b} onClick={() => c().toggleBold().run()}><Bold size={16} /></B>
        <B title="Italic (Ctrl+I)" on={s.i} onClick={() => c().toggleItalic().run()}><Italic size={16} /></B>
        <B title="Underline (Ctrl+U)" on={s.u} onClick={() => c().toggleUnderline().run()}><Underline size={16} /></B>
        <B title="Strikethrough" on={s.st} onClick={() => c().toggleStrike().run()}><Strikethrough size={16} /></B>
        <B title="Highlight" on={s.hl} onClick={() => c().toggleHighlight().run()}><Highlighter size={16} /></B>
        <B title="Link (Ctrl+K)" on={s.link} onClick={setLink}><Link2 size={16} /></B>
        <Sep />
        <B title="Align left" on={s.left} onClick={() => c().setTextAlign("left").run()}><AlignLeft size={16} /></B>
        <B title="Align centre" on={s.center} onClick={() => c().setTextAlign("center").run()}><AlignCenter size={16} /></B>
        <B title="Align right" on={s.right} onClick={() => c().setTextAlign("right").run()}><AlignRight size={16} /></B>
        <Sep />
        <B title="Bullet list" on={s.ul} onClick={() => c().toggleBulletList().run()}><List size={16} /></B>
        <B title="Numbered list" on={s.ol} onClick={() => c().toggleOrderedList().run()}><ListOrdered size={16} /></B>
        <B title="Quote / tip box" on={s.q} onClick={() => c().toggleBlockquote().run()}><Quote size={16} /></B>
        <B title="Code block" on={s.code} onClick={() => c().toggleCodeBlock().run()}><Code2 size={16} /></B>
        <B title="Divider line" onClick={() => c().setHorizontalRule().run()}><Minus size={16} /></B>
        <Sep />
        <B title="Upload picture (or drag & drop / paste into the article)" onClick={() => file.current?.click()}>{busy ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}</B>
        <B title="Picture from a link" onClick={imageUrl}><span className="text-[11px] font-bold">URL</span></B>
        <B title="YouTube video" onClick={video}><YoutubeIcon size={16} /></B>
        <B title="Table (3 × 3)" on={s.table} onClick={() => c().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}><Table2 size={16} /></B>
        <B title="Clear formatting" onClick={() => c().unsetAllMarks().clearNodes().run()}><RemoveFormatting size={16} /></B>
        <span className="ml-auto" />
        <B title={source ? "Back to visual editor" : "Edit HTML"} on={source} onClick={() => setSource(!source)}><FileCode2 size={16} /><span className="ml-1 hidden text-xs font-bold sm:inline">HTML</span></B>
      </div>

      {/* context bars for picture / table */}
      {!source && s.img && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-brand-50 px-3 py-1.5 text-xs font-semibold dark:bg-brand-900">
          Picture: <button type="button" onClick={imageAlt} className="rounded-md bg-card px-2 py-1 hover:text-brand-600">Alt text{editor.getAttributes("image").alt ? ` (“${String(editor.getAttributes("image").alt).slice(0, 30)}”)` : " (missing!)"}</button>
          <button type="button" onClick={() => c().deleteSelection().run()} className="rounded-md bg-card px-2 py-1 text-hot">Remove</button>
        </div>
      )}
      {!source && s.table && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-brand-50 px-3 py-1.5 text-xs font-semibold dark:bg-brand-900">
          Table:
          {([["+ Row", () => c().addRowAfter().run()], ["+ Column", () => c().addColumnAfter().run()], ["− Row", () => c().deleteRow().run()], ["− Column", () => c().deleteColumn().run()], ["Header row", () => c().toggleHeaderRow().run()]] as const).map(([l, f]) => (
            <button key={l} type="button" onClick={f} className="rounded-md bg-card px-2 py-1 hover:text-brand-600">{l}</button>
          ))}
          <button type="button" onClick={() => c().deleteTable().run()} className="rounded-md bg-card px-2 py-1 text-hot">Delete table</button>
        </div>
      )}

      {source
        ? <textarea value={html} onChange={(e) => { editor.commands.setContent(e.target.value, { emitUpdate: false }); onChange(e.target.value); }} spellCheck={false} className="min-h-[480px] w-full resize-y bg-card p-5 font-mono text-sm outline-none" />
        : <EditorContent editor={editor} />}

      <div className="flex flex-wrap justify-between gap-2 border-t border-line bg-soft/60 px-4 py-2 text-xs text-muted">
        <span>{wordCount(html)} words · {readingMinutes(html)} min read</span>
        <span>Tip: drag pictures straight into the article · Ctrl+B / I / U · Ctrl+Z undo</span>
      </div>
      <input ref={file} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { insertFiles(editor, Array.from(e.target.files ?? [])); e.target.value = ""; }} />
    </div>
  );
}
