"use client";

import { MapPin } from "lucide-react";
import { PrimaryButton, SectionHeading } from "./ui";

export function CommunityMatches({ onJoin, onViewAll }: { onJoin: () => void; onViewAll: () => void }) {
  return (
    <section id="community" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Open right now"
        title="Community Matches Near You"
        subtitle="Jump into a game that already has players waiting."
        actionLabel="View All"
        onAction={onViewAll}
      />
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            Open Match
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">Badminton Doubles</p>
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5" /> Shobhagpura · 1.2 km
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold text-brand-600">Today, 8:00 PM</p>
            <p className="text-xs text-slate-500">₹100 / Player</p>
          </div>
          <PrimaryButton onClick={onJoin}>Join Now</PrimaryButton>
        </div>
      </div>
    </section>
  );
}
