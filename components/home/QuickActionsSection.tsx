"use client";

import { useState } from "react";
import Image from "next/image";
import { ArrowLeft, Tag, Zap } from "lucide-react";
import { QUICK_ACTION_GAMES, QUICK_ACTION_TASKS } from "./data";
import { SectionHeading } from "./ui";

export function QuickActionsSection({
  onQuickAction,
  onViewAllQuickActions,
}: {
  onQuickAction: (taskId: string, gameId: string) => void;
  onViewAllQuickActions: () => void;
}) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const game = QUICK_ACTION_GAMES.find((g) => g.id === selectedGame) ?? null;

  return (
    <section id="quick-actions" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Shortcuts"
        title="Quick Actions"
        subtitle={game ? `What do you want to do for ${game.label}?` : "Pick your game to get started."}
        icon={Zap}
        actionLabel="View All"
        onAction={onViewAllQuickActions}
      />

      {!game ? (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {QUICK_ACTION_GAMES.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelectedGame(g.id)}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm transition hover:border-brand-200 hover:shadow-md"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                {"image" in g && g.image ? (
                  <Image src={g.image} alt={g.label} width={20} height={20} unoptimized className="h-5 w-5 object-contain" />
                ) : "icon" in g && g.icon ? (
                  <g.icon className="h-4 w-4" />
                ) : null}
              </span>
              <span className="text-[10px] font-semibold leading-tight text-slate-600">{g.label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            <button
              type="button"
              onClick={() => setSelectedGame(null)}
              className="flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-slate-200 bg-white p-3 text-center text-slate-500 transition hover:border-brand-200"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-50">
                <ArrowLeft className="h-4 w-4" />
              </span>
              <span className="text-[10px] font-semibold leading-tight">Change Game</span>
            </button>
            {QUICK_ACTION_TASKS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => onQuickAction(a.id, game.id)}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-slate-100 bg-white p-3 text-center shadow-sm transition hover:border-brand-200 hover:shadow-md"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                  <a.icon className="h-4 w-4" />
                </span>
                <span className="text-[10px] font-semibold leading-tight text-slate-600">{a.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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
