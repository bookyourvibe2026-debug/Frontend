"use client";

import { Tag, Trophy } from "lucide-react";
import { SectionHeading } from "./ui";

export function EventsAndOffers({
  onViewAllEvents,
  onViewAllOffers,
}: {
  onViewAllEvents: () => void;
  onViewAllOffers: () => void;
}) {
  return (
    <section id="tournaments" className="mx-auto mt-16 grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-2">
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

      <div id="offers" className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <SectionHeading title="Offers For You" actionLabel="View All" onAction={onViewAllOffers} />
        <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 p-4 text-white">
          <div>
            <p className="text-3xl font-extrabold">
              FLAT <span className="text-yellow-200">20%</span>
            </p>
            <p className="text-sm font-medium text-orange-50">OFF on Your Next Booking</p>
          </div>
          <span aria-hidden>
            <Tag className="h-8 w-8" />
          </span>
        </div>
      </div>
    </section>
  );
}
