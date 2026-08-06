"use client";

import { Tag, Zap, GraduationCap, Swords, Trophy, MapPin, Handshake } from "lucide-react";
import { SectionHeading } from "./ui";

const QUICK_ACTIONS = [
  {
    id: "coaches",
    label: "Coaches",
    icon: GraduationCap,
    iconBg: "bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600",
    glowColor: "shadow-amber-500/30",
    badge: "PRO",
  },
  {
    id: "challenge-a-friend",
    label: "Challenge a Friend",
    icon: Swords,
    iconBg: "bg-gradient-to-br from-rose-500 via-red-500 to-orange-500",
    glowColor: "shadow-rose-500/30",
    badge: "VS",
  },
  {
    id: "tournaments",
    label: "Tournaments",
    icon: Trophy,
    iconBg: "bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500",
    glowColor: "shadow-yellow-500/35",
    badge: "WIN",
  },
  {
    id: "near-me",
    label: "Near Me",
    icon: MapPin,
    iconBg: "bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500",
    glowColor: "shadow-emerald-500/30",
    badge: "GPS",
  },
  {
    id: "community",
    label: "Community",
    icon: Handshake,
    iconBg: "bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600",
    glowColor: "shadow-blue-500/30",
    badge: "JOIN",
  },
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
      />

      <div className="flex flex-wrap items-center justify-start gap-6 sm:gap-10 py-6">
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onQuickAction(a.id, "")}
            className="group flex w-24 sm:w-28 flex-col items-center gap-3 text-center cursor-pointer transition-all duration-300 active:scale-95"
          >
            <div className="relative flex h-20 w-20 sm:h-22 sm:w-22 items-center justify-center rounded-[28px] bg-white p-1.5 shadow-[0_10px_28px_rgba(0,0,0,0.06)] border border-slate-100 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_16px_35px_rgba(0,0,0,0.12)] group-hover:border-slate-200">
              {/* Inner vibrant gradient badge */}
              <div
                className={`flex h-full w-full items-center justify-center rounded-[22px] ${a.iconBg} text-white shadow-md ${a.glowColor} transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3`}
              >
                <a.icon className="h-9 w-9 sm:h-10 sm:w-10 stroke-[2.2] drop-shadow-md" />
              </div>
            </div>
            <span className="text-xs font-extrabold text-slate-800 tracking-tight group-hover:text-brand-600 transition-colors duration-200 sm:text-sm">
              {a.label}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-brand-500 to-accent-500 p-4 text-white shadow-md shadow-brand-500/20">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs">
          <Tag className="h-5 w-5 text-white" />
        </span>
        <div>
          <p className="text-xs font-extrabold sm:text-sm">Flat 20% off your next booking</p>
          <p className="text-[11px] text-brand-100 font-medium">Use code VIBE20 at checkout</p>
        </div>
      </div>
    </section>
  );
}
