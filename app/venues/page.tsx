import Link from "next/link";
import { Star } from "lucide-react";
import { SiteHeader } from "../../components/site-header";
import { TRENDING_VENUES } from "../../lib/venues";

export const metadata = {
  title: "Venues | Book Your Vibe",
  description: "Browse featured sports venues with a clean booking-focused layout.",
};

const VENUES = TRENDING_VENUES;

export default function VenuesPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#eef2ff_45%,_#ffffff_82%)]">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <section className="rounded-[2rem] bg-slate-950 px-6 py-10 text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)] sm:px-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-orange-300">Venues</p>
          <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                Choose a venue that feels easy to book and good to play in.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Each card is built to surface the details people actually care about: location,
                sport type, price, and whether the slot is disappearing fast.
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

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {VENUES.map((venue, index) => (
            <article
              key={venue.id}
              className={`overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                index === 0 ? "md:col-span-2 xl:col-span-1" : ""
              }`}
            >
              <div
                className="relative rounded-[1.5rem] p-5 text-white"
                style={{ background: venue.image, backgroundSize: "cover" }}
              >
                <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-90">
                  {venue.status}
                </p>
                <h2 className="mt-2 text-2xl font-black">{venue.name}</h2>
                <p className="mt-1 flex items-center gap-1 text-sm text-white/85">
                  {venue.sport} · {venue.rating}
                  <Star className="h-3.5 w-3.5 fill-current" />
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{venue.area} · {venue.distanceKm} km</p>
                  <p className="mt-1 text-lg font-bold text-slate-950">
                    ₹{venue.pricePerHour}/hr
                  </p>
                </div>
                <Link
                  href={`/venues/${venue.id}`}
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-500"
                >
                  View details
                </Link>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-600">
                Booking flow
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Fewer taps, clearer info, faster confirmation.
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-orange-50 px-4 py-2 text-sm font-semibold text-orange-700">
                Live slots
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
