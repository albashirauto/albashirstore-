"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { CheckCircle2, Truck } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { money } from "@/lib/format";
import { payLabel } from "@/lib/receipt";

/** Success screen: big confirmation, receipt summary, and one tap to send the receipt on WhatsApp. */
export default function OrderDone({ orderNo, total, method, receiptText, whatsapp, payLink }: {
  orderNo: string; total: number; method: string; receiptText: string; whatsapp?: string; payLink: boolean;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <motion.div initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 12 }}>
        <CheckCircle2 size={88} className="mx-auto text-green-500" />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h1 className="mt-4 text-5xl font-extrabold uppercase">Order placed!</h1>
        <p className="mt-2 text-lg text-muted">Order <b className="text-fg">#{orderNo}</b> · {money(total)} · {payLabel(method)}</p>

        <div className="mt-8 rounded-2xl border border-line bg-card p-5 text-left">
          <p className="font-bold">What happens next</p>
          <ol className="mt-3 space-y-2.5 text-sm text-muted">
            <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#118043] text-xs font-bold text-white">1</span>Send your receipt on WhatsApp{payLink ? " with your payment screenshot" : ""}.</li>
            <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white">2</span>{payLink ? "We confirm your payment and order." : "We call you to confirm your order. You pay the rider in cash on delivery."}</li>
            <li className="flex gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white"><Truck size={12} /></span>We dispatch and send you the tracking number.</li>
          </ol>
        </div>

        {whatsapp && (
          <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(receiptText)}`} target="_blank" rel="noreferrer"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#118043] py-4 text-lg font-bold text-white shadow-lg shadow-[#25D366]/30 transition hover:-translate-y-0.5 hover:bg-[#0c6b37]">
            <WhatsAppIcon size={22} />Send receipt on WhatsApp
          </a>
        )}
        <p className="mt-4 flex justify-center gap-6">
          <Link href={`/track?no=${orderNo}`} className="inline-flex items-center gap-1.5 font-bold text-brand-600 hover:text-hot"><Truck size={16} />Track this order</Link>
          <Link href="/shop" className="font-bold text-brand-600 hover:text-hot">Keep shopping</Link>
        </p>
      </motion.div>
    </div>
  );
}
