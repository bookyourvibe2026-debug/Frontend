"use client";

import { Tag, Zap } from "lucide-react";
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
    <section id="quick-actions" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Shortcuts"
        title="Quick Actions"
        subtitle="Jump straight to booking, players, tournaments, and more."
        icon={Zap}
        actionLabel="View All"
        onAction={onViewAllQuickActions}
      />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onQuickAction(a.id)}
            className="flex flex-col items-center gap-3 rounded-3xl border border-slate-100 bg-white p-5 text-center shadow-sm transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-md"
          >
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-orange-500">
              <a.icon className="h-6 w-6" />
            </span>
            <span className="text-xs font-semibold leading-tight text-slate-600">{a.label}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-3xl bg-gradient-to-r from-orange-500 to-rose-500 p-5 text-white">
        <span aria-hidden>
          <Tag className="h-6 w-6" />
        </span>
        <div>
          <p className="text-sm font-bold">Flat 20% off your next booking</p>
          <p className="text-xs text-orange-100">Use code VIBE20 at checkout</p>
        </div>
      </div>
    </section>
  );
}
