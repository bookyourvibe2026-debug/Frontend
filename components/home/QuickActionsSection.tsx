"use client";

import { ArrowRight, Tag, Zap } from "lucide-react";
import { QUICK_ACTIONS } from "./data";
import { SectionHeading } from "./ui";

export function QuickActionsSection({
  onQuickAction,
  onViewAllQuickActions,
}: {
  onQuickAction: (id: string) => void;
  onViewAllQuickActions: () => void;
}) {
  return (
    <section id="quick-actions" className="mx-auto mt-6 max-w-7xl px-4 sm:px-6">
      <div className="mb-3 flex items-end justify-between">
        <div className="max-w-xl">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">Shortcuts</p>
          <h2 className="flex items-center gap-1.5 text-base font-extrabold text-slate-900 sm:text-lg">
            Quick Actions
            <Zap className="h-4 w-4 text-brand-500" aria-hidden />
          </h2>
          <p className="mt-0.5 text-[11px] text-slate-500">Jump straight to booking, players, tournaments, and more.</p>
        </div>
        <button
          onClick={onViewAllQuickActions}
          className="inline-flex items-center gap-0.5 whitespace-nowrap text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onQuickAction(a.id)}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm transition hover:border-brand-200 hover:shadow-md"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-500">
              <a.icon className="h-4 w-4" />
            </span>
            <span className="text-[10px] font-semibold leading-tight text-slate-600">{a.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-accent-500 p-3 text-white">
        <span aria-hidden>
          <Tag className="h-4 w-4" />
        </span>
        <div>
          <p className="text-xs font-bold">Flat 20% off your next booking</p>
          <p className="text-[10px] text-brand-100">Use code VIBE20 at checkout</p>
        </div>
      </div>
    </section>
  );
}
