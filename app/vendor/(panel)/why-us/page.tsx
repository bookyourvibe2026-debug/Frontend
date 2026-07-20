"use client";

import {
  Award,
  Zap,
  Wallet,
  ShieldCheck,
  LayoutGrid,
  CalendarCheck2,
  MessageCircle,
  Check,
  X,
} from "lucide-react";

const HIGHLIGHTS = [
  {
    icon: Zap,
    bg: "bg-amber-50",
    text: "text-amber-600",
    title: "Last Min Boost",
    body: "Fill empty slots in real time — one-tap discounts on today's unbooked slots as they're about to go empty.",
  },
  {
    icon: Wallet,
    bg: "bg-lime-50",
    text: "text-lime-700",
    title: "Clear Settlement Ledger",
    body: "See exactly what BYV owes you from online bookings, and what you owe BYV on offline cash bookings — no guesswork.",
  },
  {
    icon: ShieldCheck,
    bg: "bg-indigo-50",
    text: "text-indigo-600",
    title: "Role-Based Team Access",
    body: "Give family, managers or staff exactly the access they need, with ready-made presets — no manual checkbox hunting.",
  },
  {
    icon: LayoutGrid,
    bg: "bg-sky-50",
    text: "text-sky-600",
    title: "One Account, Every Vertical",
    body: "Run Turf, Coaching, Food and Events from a single dashboard instead of juggling separate tools.",
  },
  {
    icon: CalendarCheck2,
    bg: "bg-emerald-50",
    text: "text-emerald-600",
    title: "Real-Time Slot Sync",
    body: "Online and offline/walk-in bookings update the same live calendar — customers never see a slot that's already taken.",
  },
  {
    icon: MessageCircle,
    bg: "bg-green-50",
    text: "text-green-600",
    title: "Direct WhatsApp Support",
    body: "Talk to a real person on our support line when you need help — not a ticket queue.",
  },
];

const COMPARISON = [
  { label: "Real-time slot sync across online + offline bookings", byv: true, typical: false },
  { label: "One-tap last-minute discounting on unsold slots", byv: true, typical: false },
  { label: "Combined receivable/payable settlement ledger", byv: true, typical: false },
  { label: "Turf, Coaching, Food & Events from one account", byv: true, typical: false },
  { label: "Ready-made role presets for your team", byv: true, typical: false },
];

export default function WhyUsPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
          <Award className="text-rose-500" /> Why Book Your Vibe?
        </h1>
        <p className="text-sm text-slate-500 mt-1">What BYV gives you that a typical booking app doesn&apos;t.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-8">
        {HIGHLIGHTS.map((h) => (
          <div key={h.title} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${h.bg} ${h.text}`}>
              <h.icon size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">{h.title}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{h.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 mb-6">
        <p className="text-sm font-bold text-slate-900 mb-1">Book Your Vibe vs. a typical booking app</p>
        <p className="text-[11px] text-slate-500 mb-4">
          A general comparison based on common gaps in single-purpose booking tools.
        </p>
        <div className="divide-y divide-slate-100">
          <div className="grid grid-cols-[1fr_auto_auto] gap-3 pb-2 text-[9px] font-black uppercase tracking-wider text-slate-400">
            <span />
            <span className="w-14 text-center">BYV</span>
            <span className="w-14 text-center">Typical App</span>
          </div>
          {COMPARISON.map((row) => (
            <div key={row.label} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-3">
              <span className="text-xs font-semibold text-slate-700">{row.label}</span>
              <span className="w-14 flex justify-center">
                {row.byv ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Check size={13} />
                  </span>
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                    <X size={13} />
                  </span>
                )}
              </span>
              <span className="w-14 flex justify-center">
                {row.typical ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Check size={13} />
                  </span>
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                    <X size={13} />
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Want a side-by-side screenshot against a specific app you have in mind? Send it over and we&apos;ll add it here —
        we don&apos;t use another platform&apos;s branding or screenshots without one on hand.
      </p>
    </div>
  );
}
