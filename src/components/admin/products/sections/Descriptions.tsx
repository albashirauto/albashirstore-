import HtmlEditor from "@/components/admin/HtmlEditor";
import type { P } from "../model";
import { Count, Field, Section, input } from "../ui";

export default function Descriptions({ p, set }: { p: P; set: (v: Partial<P>) => void }) {
  return (
    <Section id="descriptions" title="Descriptions" sub="A short summary near the price, and full details lower on the page.">
      <div className="space-y-5">
        <Field label="Short description" extra={<Count n={p.description.length} max={200} />} help="2–3 lines: what it is and why it is good.">
          <textarea rows={3} value={p.description} onChange={(e) => set({ description: e.target.value })} className={`${input} resize-y`} />
        </Field>
        <div className="text-sm font-semibold">
          <p className="mb-1.5">Full description</p>
          <HtmlEditor value={p.details_html} onChange={(v) => set({ details_html: v })} />
        </div>
      </div>
    </Section>
  );
}
