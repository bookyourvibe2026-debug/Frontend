"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MapPin } from "lucide-react";
import { SiteHeader } from "../../components/site-header";
import { MobileCard, MobileTopBar } from "@/components/mobile/ui";
import { browseVenues } from "@/lib/api/venues";
import { Listing } from "@/lib/api/types";
import { categoryLabel } from "@/lib/taxonomy";

function VenuesPageInner() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category") ?? "";
  const [venues, setVenues] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Venues page shows only Turf & Game listings — Events have their own /events page
    browseVenues({ limit: 24, category: category || undefined, type: category ? undefined : "Turf" })
      .then((result) => setVenues(result.items))
      .finally(() => setLoading(false));
  }, [category]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#eef2ff_45%,_#ffffff_82%)]">
      <div className="hidden sm:block">
        <SiteHeader />
      </div>

      <div className="sm:hidden">
        <div className="px-4 pt-4">
          <MobileTopBar />
        </div>
        <main className="flex flex-col gap-5 px-4 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Sports</p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
              Venues and events, all in one place.
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Location, sport, and price — at a glance.
            </p>
          </div>

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
                No venues available yet. Check back soon.
              </p>
            )}
          </div>
        </main>
      </div>

      <main className="mx-auto hidden max-w-7xl px-4 py-10 sm:block sm:px-6 sm:py-14">
        <section className="rounded-[2rem] bg-slate-950 px-6 py-10 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-300">Sports</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Venues and events, all in one place.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Each card is built to surface the details people actually care about: location,
                sport type and price.
              </p>
            </div>
            <Link
              href="/games"
              className="inline-flex h-fit items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
            >
              Explore sports first
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {venues.map((venue, index) => (
            <article
              key={venue._id}
              className={`overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                index === 0 ? "md:col-span-2 xl:col-span-1" : ""
              }`}
            >
              {/* Banner opens the venue too — not just the "View details" button */}
              <Link href={`/venues/${venue._id}`} className="relative block overflow-hidden rounded-[1.5rem] bg-slate-900 p-5 text-white">
                {venue.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={venue.coverImage} alt={venue.title} className="absolute inset-0 h-full w-full object-cover opacity-70" />
                )}
                <div className="relative">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-90">{venue.categories.map(categoryLabel).join(", ") || "General"}</p>
                  <h2 className="mt-2 text-2xl font-black">{venue.title}</h2>
                </div>
              </Link>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div>
                  <p className="flex items-center gap-1 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5" /> {venue.city}
                  </p>
                  <p className="mt-1 text-lg font-bold text-slate-950">₹{venue.price.toLocaleString("en-IN")}/hr</p>
                </div>
                <Link
                  href={`/venues/${venue.slug || venue._id}`}
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500"
                >
                  View details
                </Link>
              </div>
            </article>
          ))}
          {!loading && venues.length === 0 && (
            <p className="col-span-full rounded-[1.75rem] border border-slate-100 bg-white p-10 text-center text-sm text-slate-500">
              No venues available yet. Check back soon.
            </p>
          )}
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">
                Booking flow
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Fewer taps, clearer info, faster confirmation.
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
                Real-time booking
              </span>
              <span className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                Price at a glance
              </span>
              <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                Friendly UX
              </span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function VenuesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <VenuesPageInner />
    </Suspense>
  );
}
