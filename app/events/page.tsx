"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { SiteHeader } from "../../components/site-header";
import { MobileCard, MobileTopBar } from "@/components/mobile/ui";
import { browseVenues } from "@/lib/api/venues";
import { Listing } from "@/lib/api/types";

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

          <div className="flex flex-col gap-3">
            {events.map((event) => (
              <Link key={event._id} href={`/venues/${event._id}`}>
                <MobileCard className="!p-4">
                  <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-4 text-white">
                    {event.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={event.coverImage} alt={event.title} className="absolute inset-0 h-full w-full object-cover opacity-70" />
                    )}
                    <div className="relative">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-90">{event.categories.join(", ") || "Event"}</p>
                      <h2 className="mt-1 text-lg font-extrabold">{event.title}</h2>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="h-3 w-3" /> {event.city}
                    </p>
                    {typeof event.spotsLeft === "number" && (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                        <Users className="h-3 w-3" /> {event.spotsLeft} spots left
                      </span>
                    )}
                  </div>
                </MobileCard>
              </Link>
            ))}
            {!loading && events.length === 0 && (
              <p className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">
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

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event, index) => (
            <article
              key={event._id}
              className={`overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                index === 0 ? "md:col-span-2 xl:col-span-1" : ""
              }`}
            >
              <div className="relative overflow-hidden rounded-[1.5rem] bg-slate-900 p-5 text-white">
                {event.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={event.coverImage} alt={event.title} className="absolute inset-0 h-full w-full object-cover opacity-70" />
                )}
                <div className="relative">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-90">{event.categories.join(", ") || "Event"}</p>
                  <h2 className="mt-2 text-2xl font-black">{event.title}</h2>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5" /> {event.city}
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    {event.price > 0 ? `₹${event.price.toLocaleString("en-IN")}` : "Free entry"}
                  </p>
                  {typeof event.spotsLeft === "number" && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                      <Users className="h-3.5 w-3.5" /> {event.spotsLeft} spots left
                    </p>
                  )}
                </div>
                <Link
                  href={`/venues/${event._id}`}
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500"
                >
                  RSVP
                </Link>
              </div>
            </article>
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
