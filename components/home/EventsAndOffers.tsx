"use client";

import { Trophy } from "lucide-react";
import { SectionHeading } from "./ui";

export function EventsAndOffers({
  onViewAllEvents,
}: {
  onViewAllEvents: () => void;
}) {
  return (
    <section id="tournaments" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <SectionHeading title="Upcoming Events" actionLabel="View All" onAction={onViewAllEvents} />
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-3">
          <span className="text-amber-500" aria-hidden>
            <Trophy className="h-8 w-8" />
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">BYV Premier League</p>
            <p className="text-xs text-slate-500">31 May – 6 June · Udaipur</p>
          </div>
        </div>
      </div>
    </section>
  );
}
