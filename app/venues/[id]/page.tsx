"use client";

/* ------------------------------------------------------------------ */
/*  VENUE DETAIL PAGE  —  /venues/[id]                                 */
/*                                                                     */
/*  Opened when a user taps "Book Now" (or a card) on Trending Venues. */
/*  Its "Book Now" launches the real booking flow (review -> confirm). */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, MapPin, Share2, ArrowLeft, Building2, UserRoundCog } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import BookingFlow from "@/components/booking-flow";
import { getVenueById } from "@/lib/api/venues";
import { ApiError } from "@/lib/api/client";
import { Listing } from "@/lib/api/types";

const DEFAULT_HIGHLIGHTS = ["Well-maintained facility", "Floodlit for evening play", "Easy online booking"];
const DEFAULT_INCLUSIONS = ["Venue access", "Drinking water", "Changing room"];
const DEFAULT_EXCLUSIONS = ["Personal gear", "Food & beverages", "Coaching"];

export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [venue, setVenue] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    getVenueById(id)
      .catch((err) => {
        if (!(err instanceof ApiError)) throw err;
        return null;
      })
      .then(setVenue)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center text-sm text-slate-400">Loading venue...</div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <Building2 className="mx-auto h-16 w-16 text-slate-300" />
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
            Venue not found
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This venue may have been removed or the link is incorrect.
          </p>
          <Link
            href="/venues"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Browse all venues
          </Link>
        </div>
      </div>
    );
  }

  const highlights = venue.highlights.length > 0 ? venue.highlights : DEFAULT_HIGHLIGHTS;
  const inclusions = venue.inclusions.length > 0 ? venue.inclusions : DEFAULT_INCLUSIONS;
  const exclusions = venue.exclusions.length > 0 ? venue.exclusions : DEFAULT_EXCLUSIONS;

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/venues"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" /> Back to venues
          </Link>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href).catch(() => {});
            }}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-600"
          >
            <Share2 className="h-3.5 w-3.5" /> Share Venue
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          {/* LEFT — details */}
          <div>
            {/* Hero image */}
            <div className="relative h-64 w-full overflow-hidden rounded-3xl border border-brand-200 bg-slate-900 sm:h-80">
              {venue.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={venue.coverImage} alt={venue.title} className="h-full w-full object-cover" />
              )}
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {venue.category}
                </span>
              </div>
            </div>

            {/* Summary */}
            <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-slate-900">Summary</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{venue.description}</p>
            </section>

            {/* Highlights */}
            <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                <CheckCircle2 className="h-5 w-5 text-brand-500" /> Highlights
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-500" />
                    {h}
                  </div>
                ))}
              </div>
            </section>

            {/* Inclusions / exclusions */}
            <section className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" /> What&apos;s Included
                </h3>
                <ul className="mt-3 space-y-2">
                  {inclusions.map((i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                  <XCircle className="h-5 w-5 text-accent-500" /> What&apos;s Not Included
                </h3>
                <ul className="mt-3 space-y-2">
                  {exclusions.map((e) => (
                    <li key={e} className="flex items-center gap-2 text-sm text-slate-700">
                      <XCircle className="h-4 w-4 shrink-0 text-accent-400" />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>

          {/* RIGHT — sticky booking card */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
              <h1 className="text-xl font-extrabold text-slate-900">{venue.title}</h1>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
                {venue.category} · {venue.city}
              </p>

              <p className="mt-4 text-2xl font-black text-slate-900">
                ₹{venue.price.toLocaleString("en-IN")}
              </p>

              <div className="mt-4 space-y-2 border-y border-slate-100 py-4 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-500" />
                  {venue.city} · {venue.address}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setBooking(true)}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-md shadow-brand-500/30 transition hover:scale-[1.01]"
              >
                Book Now
              </button>
            </div>

            <Link
              href="/coaches"
              className="mt-4 flex items-center gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                <UserRoundCog className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-bold text-slate-900">Want a coach here?</span>
                <span className="block text-xs text-slate-500">Browse coaches and book a session</span>
              </span>
            </Link>
          </div>
        </div>
      </main>

      {booking && <BookingFlow listing={venue} onClose={() => setBooking(false)} />}
    </div>
  );
}
