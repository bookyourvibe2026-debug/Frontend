"use client";

import { Tag, Zap, Users, Trophy, MapPin, Handshake } from "lucide-react";
import { SectionHeading } from "./ui";

const QUICK_ACTIONS = [
  { id: "book-now", label: "Book Now", icon: Zap },
  { id: "find-players", label: "Find Players", icon: Users },
  { id: "tournaments", label: "Tournaments", icon: Trophy },
  { id: "near-me", label: "Near Me", icon: MapPin },
  { id: "offers", label: "Offers", icon: Tag },
  { id: "community", label: "Community", icon: Handshake },
];

export function QuickActionsSection({
  onQuickAction,
  onViewAllQuickActions,
}: {
  onQuickAction: (taskId: string, gameId: string) => void;
  onViewAllQuickActions: () => void;
}) {
  return (
    <section id="quick-actions" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Shortcuts"
        title="Quick Actions"
        subtitle="Quick links to book slots, view tournaments, find players, and explore offers."
        icon={Zap}
        actionLabel="View All"
        onAction={onViewAllQuickActions}
      />

      <div className="flex flex-wrap items-center justify-start gap-6 sm:gap-10 py-4">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onQuickAction(a.id, "")}
            className="flex flex-col items-center gap-3 text-center group cursor-pointer transition active:scale-95 duration-150"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-brand-500 shadow-[0_8px_30px_rgba(15,23,42,0.06)] border border-slate-50 transition duration-200 group-hover:scale-105 group-hover:shadow-[0_12px_24px_rgba(15,23,42,0.08)] group-hover:border-brand-200">
              <a.icon className="h-8 w-8 stroke-[1.75]" />
            </span>
            <span className="text-xs font-semibold text-slate-800 tracking-tight group-hover:text-brand-600 transition-colors duration-200 sm:text-sm">
              {a.label}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-accent-500 p-3 text-white">
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
