"use client";

import { useEffect, useState } from "react";
import { SiteHeader } from "../../components/site-header";
import { MobileTopBar } from "@/components/mobile/ui";
import { VenuePosterCard } from "@/components/venue-poster-card";
import { browseVenues } from "@/lib/api/venues";
import { Listing } from "@/lib/api/types";

function eventBadge(event: Listing): string | undefined {
  if (typeof event.spotsLeft === "number") return `${event.spotsLeft} spots left`;
  return undefined;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    browseVenues({ type: "Event", limit: 24 })
      .then((result) => setEvents(result.items))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed,_#f8fafc_42%,_#ffffff_78%)]">
      <div className="hidden sm:block">
        <SiteHeader />
      </div>

      <div className="sm:hidden">
        <div className="px-4 pt-4">
          <MobileTopBar />
        </div>
        <main className="flex flex-col gap-5 px-4 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Events</p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
              Marathons, workshops, and everything past turf time.
            </h1>
            <p className="mt-2 text-sm text-slate-500">RSVP in a couple of taps — same flow as booking a slot.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {events.map((event) => (
              <VenuePosterCard
                key={event._id}
                href={`/venues/${event.slug || event._id}`}
                image={event.coverImage}
                title={event.title}
                subtitle={event.categories.join(", ") || "Event"}
                city={event.city}
                price={event.price > 0 ? event.price : undefined}
                badge={eventBadge(event)}
              />
            ))}
            {!loading && events.length === 0 && (
              <p className="col-span-2 rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">
                No events hosted yet. Check back soon.
              </p>
            )}
          </div>
        </main>
      </div>

      <main className="mx-auto hidden max-w-7xl px-4 py-10 sm:block sm:px-6 sm:py-14">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-600">Events</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Any event a venue hosts — RSVP the same way you book a slot.
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-500 sm:text-base">
            Marathons, tournaments, workshops, corporate offsites — hosted through the same booking
            engine as turf time, with the same QR check-in.
          </p>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {events.map((event) => (
            <VenuePosterCard
              key={event._id}
              href={`/venues/${event.slug || event._id}`}
              image={event.coverImage}
              title={event.title}
              subtitle={event.categories.join(", ") || "Event"}
              city={event.city}
              price={event.price > 0 ? event.price : undefined}
              badge={eventBadge(event)}
            />
          ))}
          {!loading && events.length === 0 && (
            <p className="col-span-full rounded-[1.75rem] border border-slate-100 bg-white p-10 text-center text-sm text-slate-500">
              No events hosted yet. Check back soon.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
