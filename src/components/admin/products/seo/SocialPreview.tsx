"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { SITE_URL } from "@/lib/seo";

/** How the link looks when shared on Facebook / WhatsApp or X (Twitter). */
export default function SocialPreview({ title, description, image }: { title: string; description: string; image: string }) {
  const [net, setNet] = useState<"facebook" | "x">("facebook");
  const host = SITE_URL.replace(/^https?:\/\//, "").toUpperCase();

  return (
    <div className="rounded-xl border border-line bg-bg">
      <div className="flex items-center justify-between border-b border-line px-4 py-2">
        <p className="text-xs font-bold uppercase tracking-wider text-muted">Share preview</p>
        <div className="flex gap-1 rounded-full bg-soft p-0.5 text-xs font-bold">
          {(["facebook", "x"] as const).map((n) => (
            <button key={n} type="button" onClick={() => setNet(n)} className={`rounded-full px-3 py-1 transition ${net === n ? "bg-card text-fg shadow-sm" : "text-muted"}`}>{n === "facebook" ? "Facebook / WhatsApp" : "X (Twitter)"}</button>
          ))}
        </div>
      </div>
      <div className="p-4">
        <div className={`mx-auto max-w-md overflow-hidden border border-line bg-card ${net === "x" ? "rounded-2xl" : "rounded-md"}`}>
          <div className="relative grid aspect-[1.91/1] place-items-center bg-soft text-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <span className="grid place-items-center gap-1 text-xs"><ImageOff size={22} />Add a photo for a better share</span>}
            {net === "x" && title && <span className="absolute bottom-2 left-2 max-w-[90%] truncate rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">{title}</span>}
          </div>
          {net === "facebook" ? (
            <div className="bg-soft px-3 py-2">
              <p className="text-[11px] text-muted">{host}</p>
              <p className="line-clamp-1 font-bold">{title}</p>
              <p className="line-clamp-1 text-sm text-muted">{description}</p>
            </div>
          ) : (
            <p className="px-3 py-1.5 text-xs text-muted">From {host.toLowerCase()}</p>
          )}
        </div>
      </div>
    </div>
  );
}
