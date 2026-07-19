"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, UserRoundCog, Volleyball, Waves, CircleDot, Footprints, Gamepad2, type LucideIcon } from "lucide-react";
import { SiteHeader } from "../../components/site-header";
import { MobileCard, MobileTopBar } from "@/components/mobile/ui";
import { SPORT_CATEGORIES, categoryLabel } from "@/lib/taxonomy";
import { browseVenues } from "@/lib/api/venues";
import { browsePublicCoaches } from "@/lib/api/coaches";
import { Coach, Listing } from "@/lib/api/types";

function coachStartPrice(coach: Coach): string {
  const monthly = coach.batches?.filter((b) => b.active).map((b) => b.priceMonthly).filter((p) => p > 0) ?? [];
  if (monthly.length) return `₹${Math.min(...monthly).toLocaleString("en-IN")}/mo`;
  return coach.fees ? `₹${coach.fees.toLocaleString("en-IN")}` : "View plans";
}

const NOTES: Record<string, string> = {
  cricket: "Fast bookings, turf-friendly",
  football: "Turf matches and friendly kickoffs",
  badminton: "Indoor courts, live availability",
  pickleball: "Trending now with limited slots",
  tennis: "Singles, doubles, and coaching",
  "table-tennis": "Quick rallies, fun evenings",
};

// Fallback icons for sports that don't have a dedicated image asset yet.
const FALLBACK_ICONS: Record<string, LucideIcon> = {
  basketball: CircleDot,
  volleyball: Volleyball,
  swimming: Waves,
  "snooker-pool": CircleDot,
  skating: Footprints,
  "indoor-games": Gamepad2,
};

const SPORTS = SPORT_CATEGORIES.map((cat) => ({
  id: cat.id,
  label: cat.label,
  image: cat.image,
  icon: cat.image ? undefined : FALLBACK_ICONS[cat.id] ?? CircleDot,
  note: NOTES[cat.id] ?? "Live availability, easy booking",
}));

export default function GamesPage() {
  const [events, setEvents] = useState<Listing[]>([]);
  const [venues, setVenues] = useState<Listing[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      browseVenues({ type: "Event", limit: 4 }),
      browseVenues({ type: "Turf", limit: 8 }),  // Only Turf/Game — Events have their own section above
    ])
      .then(([eventsResult, venuesResult]) => {
        setEvents(eventsResult.items);
        setVenues(venuesResult.items);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // Nearby coaches: ask for the browser location; if granted, sort by distance,
    // otherwise fall back to the most-recently-added coaches.
    function loadCoaches(coords?: { lat: number; lng: number }) {
      browsePublicCoaches({ limit: 12, radiusKm: 50, ...coords })
        .then((res) => setCoaches(res.items))
        .catch(() => setCoaches([]));
    }
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => loadCoaches({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => loadCoaches(),
        { timeout: 6000 }
      );
    } else {
      loadCoaches();
    }
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff,_#f8fafc_40%,_#ffffff_75%)]">
      <div className="hidden sm:block">
        <SiteHeader />
      </div>

      <div className="sm:hidden">
        <div className="px-4 pt-4">
          <MobileTopBar />
        </div>
        <main className="flex flex-col gap-6 px-4 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Choose Your Game</p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
              Pick a sport, then jump to the right venue.
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Browse what&rsquo;s popular right now and move into booking fast.
            </p>
          </div>

          <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
            {SPORTS.map((sport) => (
              <Link
                key={sport.id}
                href={`/venues?category=${sport.id}`}
                className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-slate-600 transition hover:border-brand-200"
              >
                <span className="flex h-8 w-8 items-center justify-center">
                  {sport.image ? (
                    <Image src={sport.image} alt={sport.label} width={28} height={28} unoptimized className="h-7 w-7 object-contain" />
                  ) : sport.icon ? (
                    <sport.icon className="h-6 w-6 text-brand-500" />
                  ) : null}
                </span>
                <span className="whitespace-nowrap text-[11px] font-semibold">{sport.label}</span>
              </Link>
            ))}
          </div>

          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.15em] text-brand-600">Events</p>
            {events.length > 0 ? (
              <div className="flex flex-col gap-3">
                {events.map((event) => (
                  <MobileCard key={event._id} className="!p-4">
                    {/* Banner opens the event too — not just the "View details" button */}
                    <Link href={`/venues/${event._id}`} className="relative block overflow-hidden rounded-2xl bg-slate-900 p-4 text-white">
                      {event.coverImage && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={event.coverImage} alt={event.title} className="absolute inset-0 h-full w-full object-cover opacity-70" />
                      )}
                      <div className="relative">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-90">{event.categories.join(", ") || "Event"}</p>
                        <h2 className="mt-1 text-lg font-extrabold">{event.title}</h2>
                      </div>
                    </Link>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3 w-3" /> {event.city}
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900">₹{event.price.toLocaleString("en-IN")}</p>
                      </div>
                      <Link
                        href={`/venues/${event.slug || event._id}`}
                        className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
                      >
                        View details
                      </Link>
                    </div>
                  </MobileCard>
                ))}
              </div>
            ) : (
              !loading && (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
                  No events hosted yet. Check back soon.
                </p>
              )
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.15em] text-brand-600">Venues</p>
            <div className="flex flex-col gap-3">
              {venues.map((venue) => (
                <MobileCard key={venue._id} className="!p-4">
                  {/* Banner opens the venue too — not just the "View details" button */}
                  <Link href={`/venues/${venue._id}`} className="relative block overflow-hidden rounded-2xl bg-slate-900 p-4 text-white">
                    {venue.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={venue.coverImage} alt={venue.title} className="absolute inset-0 h-full w-full object-cover opacity-70" />
                    )}
                    <div className="relative">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-90">{venue.categories.map(categoryLabel).join(", ") || "General"}</p>
                      <h2 className="mt-1 text-lg font-extrabold">{venue.title}</h2>
                    </div>
                  </Link>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" /> {venue.city}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">₹{venue.price.toLocaleString("en-IN")}/hr</p>
                    </div>
                    <Link
                      href={`/venues/${venue.slug || venue._id}`}
                      className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
                    >
                      View details
                    </Link>
                  </div>
                </MobileCard>
              ))}
              {!loading && venues.length === 0 && (
                <p className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">
                  No venues available yet.
                </p>
              )}
            </div>
          </div>

          {coaches.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-bold uppercase tracking-[0.15em] text-brand-600">Academy · Coaches near you</p>
              <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
                {coaches.map((coach) => (
                  <CoachMiniCard key={coach._id} coach={coach} />
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      <main className="mx-auto hidden max-w-7xl px-4 py-10 sm:block sm:px-6 sm:py-14">
        <section className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white/80 p-6 shadow-[0_20px_80px_rgba(148,163,184,0.18)] backdrop-blur sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-600">Choose Your Game</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Pick a sport, then jump straight to the right venue.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                We keep the decision simple. Browse the sport you want, see what is popular right
                now, and move into booking without hunting across the app.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
                  {SPORTS.length} sports ready
                </span>
                <span className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                  Live availability
                </span>
                <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  Fast rebooking
                </span>
              </div>
            </div>

            <div className="rounded-[2rem] bg-gradient-to-br from-sky-50 via-white to-brand-50 p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-4">
                {SPORTS.slice(0, 4).map((sport) => (
                  <div
                    key={sport.id}
                    className="rounded-3xl border border-white/70 bg-white p-4 shadow-sm"
                  >
                    <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
                      {sport.image ? (
                        <Image src={sport.image} alt={sport.label} fill className="object-contain p-2" />
                      ) : sport.icon ? (
                        <sport.icon className="h-12 w-12 text-brand-500" />
                      ) : null}
                    </div>
                    <p className="mt-2 text-center text-sm font-bold text-slate-900">{sport.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">Browse by sport</p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Tap a sport and start from there</h2>
            </div>
            <p className="hidden text-sm text-slate-500 sm:block">Built for quick discovery on mobile and desktop.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {SPORTS.map((sport, index) => (
              <Link
                key={sport.id}
                href={`/venues?category=${sport.id}`}
                className={`group overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                  index === 0 ? "sm:col-span-2 xl:col-span-2" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-slate-50 to-slate-100">
                    {sport.image ? (
                      <Image src={sport.image} alt={sport.label} fill className="object-contain p-2 transition group-hover:scale-105" />
                    ) : sport.icon ? (
                      <sport.icon className="h-9 w-9 text-brand-500" />
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-950">{sport.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{sport.note}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">Events</p>
            <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Beyond just booking a slot</h2>
          </div>
          {events.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {events.map((event) => (
                <Link
                  key={event._id}
                  href={`/venues/${event.slug || event._id}`}
                  className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative overflow-hidden rounded-[1.25rem] bg-slate-900 p-4 text-white">
                    {event.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={event.coverImage} alt={event.title} className="absolute inset-0 h-full w-full object-cover opacity-70" />
                    )}
                    <div className="relative">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-90">{event.categories.join(", ") || "Event"}</p>
                      <h3 className="mt-1 text-lg font-black">{event.title}</h3>
                    </div>
                  </div>
                  <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5" /> {event.city}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            !loading && (
              <p className="rounded-[1.75rem] border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
                No events hosted yet. Check back soon.
              </p>
            )
          )}
        </section>

        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">Venues</p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Book a court, turf, or table near you</h2>
            </div>
            <Link href="/venues" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              View All Venues
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {venues.map((venue) => (
              <Link
                key={venue._id}
                href={`/venues/${venue.slug || venue._id}`}
                className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative overflow-hidden rounded-[1.25rem] bg-slate-900 p-4 text-white">
                  {venue.coverImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={venue.coverImage} alt={venue.title} className="absolute inset-0 h-full w-full object-cover opacity-70" />
                  )}
                  <div className="relative">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-90">{venue.categories.map(categoryLabel).join(", ") || "General"}</p>
                    <h3 className="mt-1 text-lg font-black">{venue.title}</h3>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5" /> {venue.city}
                  </p>
                  <p className="text-sm font-bold text-slate-950">₹{venue.price.toLocaleString("en-IN")}/hr</p>
                </div>
              </Link>
            ))}
            {!loading && venues.length === 0 && (
              <p className="col-span-full rounded-[1.75rem] border border-slate-100 bg-white p-10 text-center text-sm text-slate-500">
                No venues available yet.
              </p>
            )}
          </div>
        </section>

        {coaches.length > 0 && (
          <section className="mt-8">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">Academy</p>
                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Coaches near you</h2>
              </div>
              <Link href="/coaches" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
                View All Coaches
              </Link>
            </div>
            <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
              {coaches.map((coach) => (
                <CoachMiniCard key={coach._id} coach={coach} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function CoachMiniCard({ coach }: { coach: Coach }) {
  return (
    <Link
      href={`/coaches/${coach.slug || coach._id}`}
      className="flex w-44 shrink-0 flex-col items-center rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative h-16 w-16 overflow-hidden rounded-full bg-slate-100">
        {coach.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coach.photoUrl} alt={coach.name} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-slate-400">
            <UserRoundCog className="h-7 w-7" />
          </span>
        )}
      </div>
      <p className="mt-2 w-full truncate text-sm font-bold text-slate-900">{coach.name}</p>
      <p className="w-full truncate text-xs text-slate-500">{coach.category}</p>
      {(typeof coach.distanceKm === "number" || coach.location?.city) && (
        <p className="mt-0.5 flex items-center gap-0.5 text-[11px] text-slate-400">
          <MapPin className="h-3 w-3" />
          {typeof coach.distanceKm === "number" ? `${coach.distanceKm} km` : coach.location?.city}
        </p>
      )}
      <p className="mt-1.5 text-xs font-bold text-brand-600">{coachStartPrice(coach)}</p>
    </Link>
  );
}
