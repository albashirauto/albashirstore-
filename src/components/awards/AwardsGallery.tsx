"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Trophy } from "lucide-react";
import { AwardCard, AwardLightbox, AwardMarquee, Sparkles } from "./AwardsShow";
import type { Award } from "@/lib/types";

/** Awards page body: a moving strip, then every award in a grid that pops in card by card. */
export default function AwardsGallery({ awards }: { awards: Award[] }) {
  const [open, setOpen] = useState<number | null>(null);

  if (!awards.length) {
    return (
      <section className="mx-auto -mt-12 max-w-7xl px-4">
        <div className="rounded-3xl border border-line bg-card p-12 text-center">
          <Trophy size={48} className="mx-auto text-amber-500 [animation:float-y_3s_ease-in-out_infinite]" />
          <p className="mt-4 text-lg font-bold">Our awards are coming soon.</p>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="relative isolate -mt-12 overflow-hidden bg-brand-950 py-6">
        <Sparkles count={12} />
        <AwardMarquee awards={awards} onOpen={setOpen} />
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {awards.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 40, rotateX: 25, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: (i % 4) * 0.08, ease: [0.22, 1, 0.36, 1] }}
              style={{ perspective: 800 }}
            >
              <AwardCard a={a} onOpen={() => setOpen(i)} className="w-full" />
              {a.caption && <p className="mt-3 px-1 text-sm text-muted">{a.caption}</p>}
            </motion.div>
          ))}
        </div>
      </section>

      <AwardLightbox awards={awards} index={open} setIndex={setOpen} />
    </>
  );
}
