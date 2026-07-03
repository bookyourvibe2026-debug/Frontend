"use client";

/* ------------------------------------------------------------------ */
/*  VENUE DETAIL PAGE  —  /venues/[id]                                 */
/*                                                                     */
/*  Opened when a user taps "Book Now" (or a card) on Trending Venues. */
/*  Mirrors the Book-My-Adventure detail layout: hero image, summary,  */
/*  highlights, inclusions/exclusions on the left; a sticky booking    */
/*  card on the right. Its "Book Now" launches the booking flow        */
/*  (select slots -> review -> confirm).                               */
/* ------------------------------------------------------------------ */

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  Share2,
  Star,
  ArrowLeft,
  Building2,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import BookingFlow from "@/components/booking-flow";
import { getVenueById, getVenueDetail } from "@/lib/venues";

const STATUS_STYLES = {
  Available: "bg-emerald-500 text-white",
  "Filling Fast": "bg-orange-500 text-white",
  Full: "bg-rose-500 text-white",
} as const;

export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const venue = getVenueById(id);
  const [booking, setBooking] = useState(false);

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
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Browse all venues
          </Link>
        </div>
      </div>
    );
  }

  const detail = getVenueDetail(venue);
  const slotsLeft = venue.status === "Filling Fast" ? 6 : 50;

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-orange-600"
          >
            <ArrowLeft className="h-4 w-4" /> Back to venues
          </Link>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-orange-300 hover:text-orange-600"
          >
            <Share2 className="h-3.5 w-3.5" /> Share Venue
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          {/* LEFT — details */}
          <div>
            {/* Hero image */}
            <div
              className="relative h-64 w-full overflow-hidden rounded-3xl border border-orange-200 sm:h-80"
              style={{ background: venue.image, backgroundSize: "cover" }}
            >
              <span className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-black/60 px-3 py-1 text-sm font-bold text-white backdrop-blur-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {venue.rating}
              </span>
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[venue.status]}`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
                  {venue.status}
                </span>
                <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {venue.sport}
                </span>
              </div>
            </div>

            {/* Summary */}
            <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-slate-900">Summary</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {detail.summary}
              </p>
            </section>

            {/* Highlights */}
            <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                <CheckCircle2 className="h-5 w-5 text-orange-500" /> Highlights
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {detail.highlights.map((h) => (
                  <div key={h} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-orange-500" />
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
                  {detail.inclusions.map((i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      {i}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                  <XCircle className="h-5 w-5 text-rose-500" /> What&apos;s Not Included
                </h3>
                <ul className="mt-3 space-y-2">
                  {detail.exclusions.map((e) => (
                    <li key={e} className="flex items-center gap-2 text-sm text-slate-700">
                      <XCircle className="h-4 w-4 shrink-0 text-rose-400" />
                      {e}
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            {/* Amenities */}
            <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-base font-extrabold text-slate-900">Amenities</h2>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                {detail.amenities.map((a) => (
                  <div
                    key={a.label}
                    className="flex flex-col items-center gap-1.5 rounded-lg bg-slate-50 py-3 font-semibold text-slate-600"
                  >
                    <a.icon className="h-4 w-4 text-orange-500" />
                    {a.label}
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* RIGHT — sticky booking card */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
              <h1 className="text-xl font-extrabold text-slate-900">{venue.name}</h1>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-orange-600">
                {venue.sport} · {venue.area}
              </p>

              <p className="mt-4 text-2xl font-black text-slate-900">
                ₹{venue.pricePerHour.toLocaleString("en-IN")}
                <span className="text-sm font-normal text-slate-400"> /hour</span>
              </p>

              <div className="mt-4 space-y-2 border-y border-slate-100 py-4 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  {venue.area} · {venue.distanceKm} km away
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  Open {detail.hours}
                </p>
                <p className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-emerald-600">
                    {slotsLeft} slots available today
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setBooking(true)}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-md shadow-orange-500/30 transition hover:scale-[1.01]"
              >
                Book Now
              </button>
              <p className="mt-2 text-center text-xs text-slate-400">
                Enquiry Now?
              </p>
            </div>
          </div>
        </div>
      </main>

      {booking && (
        <BookingFlow venue={venue} onClose={() => setBooking(false)} />
      )}
    </div>
  );
}
