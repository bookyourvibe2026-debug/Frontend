"use client";

import { Flame, Heart, MapPin } from "lucide-react";
import { type Venue, TRENDING_VENUES } from "@/lib/venues";
import { PrimaryButton, SectionHeading, StarRating, StatusPill } from "./ui";

function VenueCard({
  venue,
  isFavorite,
  onToggleFavorite,
  onView,
  onBook,
}: {
  venue: Venue;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onView: () => void;
  onBook: () => void;
}) {
  return (
    <div className="group snap-start flex w-[85vw] max-w-xs flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:w-72">
      <div
        role="button"
        tabIndex={0}
        onClick={onView}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onView();
          }
        }}
        className="relative h-40 w-full cursor-pointer text-left"
        style={{ background: venue.image, backgroundSize: "cover" }}
      >
        <div className="absolute left-3 top-3">
          <StarRating rating={venue.rating} />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow"
          aria-label="Toggle favorite"
        >
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-rose-500 text-rose-500" : "text-slate-400"}`} />
        </button>
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <StatusPill status={venue.status} />
          <span className="rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
            {venue.sport}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-bold text-slate-900">{venue.name}</h3>
        <p className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5" aria-hidden /> {venue.area} · {venue.distanceKm} km
        </p>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">
            ₹{venue.pricePerHour}
            <span className="font-normal text-slate-400"> /hour</span>
          </p>
          <PrimaryButton onClick={onBook} className="!px-4 !py-2 text-xs">
            Book Now
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

export function TrendingVenues({
  favorites,
  onToggleFavorite,
  onViewVenue,
  onBookVenue,
  onViewAll,
}: {
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  onViewVenue: (v: Venue) => void;
  onBookVenue: (v: Venue) => void;
  onViewAll: () => void;
}) {
  return (
    <section id="venues" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Booked the most this week"
        title="Trending Venues"
        subtitle="Hand-picked from real booking volume across Udaipur — updated daily."
        icon={Flame}
        actionLabel="View All Venues"
        onAction={onViewAll}
      />
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
        {TRENDING_VENUES.map((v) => (
          <VenueCard
            key={v.id}
            venue={v}
            isFavorite={favorites.has(v.id)}
            onToggleFavorite={() => onToggleFavorite(v.id)}
            onView={() => onViewVenue(v)}
            onBook={() => onBookVenue(v)}
          />
        ))}
      </div>
    </section>
  );
}
