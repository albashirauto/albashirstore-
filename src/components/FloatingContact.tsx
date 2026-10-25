"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import WhatsAppIcon from "./WhatsAppIcon";

/** Compact WhatsApp button: wiggles now and then, slides open a label on hover, shows a small "typing" greeting once. */
export default function FloatingContact({ whatsapp }: { whatsapp: string }) {
  const [bubble, setBubble] = useState(false);
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    try { if (sessionStorage.getItem("wa-bubble")) return; } catch {}
    const show = setTimeout(() => setBubble(true), 5000);
    const text = setTimeout(() => setTyping(false), 6400);
    return () => { clearTimeout(show); clearTimeout(text); };
  }, []);

  const close = () => {
    setBubble(false);
    try { sessionStorage.setItem("wa-bubble", "1"); } catch {}
  };

  if (!whatsapp) return null;
  const href = `https://wa.me/${whatsapp}?text=${encodeURIComponent("Hello, I need a spare part.")}`;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2.5">
      <AnimatePresence>
        {bubble && (
          <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.95 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="relative origin-bottom-right rounded-2xl rounded-br-sm border border-line bg-card py-2.5 pl-3.5 pr-8 text-sm shadow-xl">
            <button onClick={close} aria-label="Close" className="absolute right-1.5 top-1.5 rounded-full p-1 text-muted transition hover:text-fg"><X size={13} /></button>
            {typing ? (
              <span className="flex h-5 items-center gap-1" aria-label="typing">
                {[0, 1, 2].map((d) => <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${d * 0.15}s` }} />)}
              </span>
            ) : (
              <a href={href} target="_blank" rel="noreferrer" onClick={close} className="block max-w-[190px] leading-snug">
                <span className="font-bold">Need a part? 👋</span> <span className="text-muted">We reply in minutes.</span>
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <a href={href} target="_blank" rel="noreferrer" aria-label="Chat on WhatsApp" onClick={close}
        className="group flex h-14 items-center overflow-hidden rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 transition-all duration-300 hover:bg-[#1ebe5b] hover:shadow-xl hover:shadow-[#25D366]/40">
        <span className="grid h-14 w-14 shrink-0 place-items-center">
          <WhatsAppIcon size={28} className="animate-wiggle" />
        </span>
        <span className="max-w-0 whitespace-nowrap text-sm font-bold opacity-0 transition-all duration-300 group-hover:max-w-[120px] group-hover:pr-5 group-hover:opacity-100">
          Chat with us
        </span>
      </a>
    </div>
  );
}
