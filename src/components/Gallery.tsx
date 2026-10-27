"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import ProductImage from "./ProductImage";

export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [i, setI] = useState(0);
  return (
    <div>
      <div className="group relative aspect-square overflow-hidden rounded-3xl border border-line bg-soft">
        {/* initial={false}: the first photo is visible straight from the server HTML (fast LCP); later swaps fade */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={i} className="absolute inset-0" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
            <ProductImage src={images[i]} alt={alt} sizes="(max-width:1024px) 100vw, 50vw" priority />
          </motion.div>
        </AnimatePresence>
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((src, k) => (
            <button key={src} onClick={() => setI(k)} aria-label={`Image ${k + 1}`} className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${k === i ? "border-hot" : "border-line hover:border-brand-500"}`}>
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
