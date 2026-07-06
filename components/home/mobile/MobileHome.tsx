"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Building2,
  CreditCard,
  Feather,
  Heart,
  LayoutGrid,
  MapPin,
  Search,
  SlidersHorizontal,
  Star,
  Tag,
  Trophy,
  Users,
  Waves,
  X,
} from "lucide-react";
import { type Venue } from "@/lib/venues";
import { QUICK_ACTIONS } from "../data";
import { DISTANCE_OPTIONS, filterPillClass, PRICE_OPTIONS, SORT_OPTIONS, useVenueFilters } from "../useVenueFilters";
import { MobileCard, MobileChip, MobileSectionRow, MobileTopBar } from "@/components/mobile/ui";

const CHOOSE_GAME_CHIPS = [
  { id: "cricket", label: "Cricket", image: "/bat.png" },
  { id: "badminton", label: "Badminton", image: "/badminton.png" },
  { id: "pickleball", label: "Pickleball", image: "/pickball.png" },
  { id: "tennis", label: "Tennis", image: "/tennis.png" },
  { id: "snooker", label: "Snooker" },
  { id: "swimming", label: "Swimming" },
  { id: "more", label: "More" },
] as const;

function MobileVenueCard({
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
  const statusStyles =
    venue.status === "Available"
      ? "bg-emerald-500/90 text-white"
      : venue.status === "Filling Fast"
      ? "bg-brand-500/90 text-white"
      : "bg-accent-500/90 text-white";

  return (
    <div className="flex w-[72vw] max-w-[280px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div
        role="button"
        tabIndex={0}
        onClick={onView}
        className="relative h-32 w-full cursor-pointer bg-slate-900"
        style={venue.image ? { backgroundImage: `url(${venue.image})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-xs font-semibold text-amber-300 backdrop-blur-sm">
          <Star className="h-3 w-3 fill-current" /> {venue.rating.toFixed(1)}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-label="Toggle favorite"
          className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 shadow"
        >
          <Heart className={`h-3.5 w-3.5 ${isFavorite ? "fill-accent-500 text-accent-500" : "text-slate-400"}`} />
        </button>
        <span
          className={`absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusStyles}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white/90" /> {venue.status}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="text-sm font-bold text-slate-900">{venue.name}</h3>
        <p className="flex items-center gap-1 text-[11px] text-slate-500">
          <MapPin className="h-3 w-3" aria-hidden /> {venue.area}
          <span className="mx-0.5">·</span> {venue.distanceKm} km
        </p>
        <p className="mt-1 text-sm font-bold text-slate-900">
          ₹{venue.pricePerHour}
          <span className="font-normal text-slate-400"> /hour</span>
        </p>
        <button
          type="button"
          onClick={onBook}
          className="mt-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 py-2 text-xs font-semibold text-white shadow-sm"
        >
          Book Now
        </button>
      </div>
    </div>
  );
}

export function MobileHome({
  userName,
  searchValue,
  onSearchChange,
  venues,
  favorites,
  onToggleFavorite,
  onViewVenue,
  onBookVenue,
  onViewAllVenues,
  onQuickAction,
  onViewAllQuickActions,
  onChooseGame,
  onJoinCommunity,
  onViewAllCommunity,
  onViewAllEvents,
  onViewAllOffers,
}: {
  userName: string;
  searchValue: string;
  onSearchChange: (v: string) => void;
  venues: Venue[];
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  onViewVenue: (v: Venue) => void;
  onBookVenue: (v: Venue) => void;
  onViewAllVenues: () => void;
  onQuickAction: (id: string) => void;
  onViewAllQuickActions: () => void;
  onChooseGame: () => void;
  onJoinCommunity: () => void;
  onViewAllCommunity: () => void;
  onViewAllEvents: () => void;
  onViewAllOffers: () => void;
}) {
  const [selectedGame, setSelectedGame] = useState<string>("cricket");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const {
    sportOptions,
    selectedSports,
    toggleSport,
    maxPrice,
    setMaxPrice,
    maxDistance,
    setMaxDistance,
    sortBy,
    setSortBy,
    resetFilters,
    activeFilterCount,
    filteredVenues,
  } = useVenueFilters(venues, searchValue);

  return (
    <div className="flex flex-col gap-7 px-4 pb-8 pt-4">
      <MobileTopBar />

      <div>
        <p className="flex items-center gap-1.5 text-sm text-slate-500">
          Good Morning, {userName} <span aria-hidden>👋</span>
        </p>
        <h1 className="mt-1 text-3xl font-extrabold leading-tight text-slate-900">
          Let&rsquo;s Find Your{" "}
          <span className="bg-gradient-to-r from-brand-500 via-amber-500 to-accent-500 bg-clip-text text-transparent">
            Vibe
          </span>
        </h1>
      </div>

      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1.5 pl-4 shadow-sm">
        <Search className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        <input
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search turf, badminton, pickleball..."
          className="w-full flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
        <button
          type="button"
          aria-label="Filters"
          onClick={() => setFiltersOpen(true)}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-sm"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[9px] font-bold text-white ring-2 ring-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <section>
        <MobileSectionRow title="Quick Actions" actionLabel="View All" onAction={onViewAllQuickActions} />
        <div className="grid grid-cols-3 gap-y-4">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => onQuickAction(a.id)}
              className="flex flex-col items-center gap-2 text-center"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-500 shadow-md shadow-slate-200">
                <a.icon className="h-6 w-6" />
              </span>
              <span className="text-[11px] font-semibold leading-tight text-slate-600">{a.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <MobileSectionRow title="Trending Venues" emoji="🔥" actionLabel="View All" onAction={onViewAllVenues} />
        {filteredVenues.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
            No venues match your search/filters.
          </div>
        ) : (
          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
            {filteredVenues.map((v) => (
              <MobileVenueCard
                key={v.id}
                venue={v}
                isFavorite={favorites.has(v.id)}
                onToggleFavorite={() => onToggleFavorite(v.id)}
                onView={() => onViewVenue(v)}
                onBook={() => onBookVenue(v)}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <MobileSectionRow title="Choose Your Game" actionLabel="View All Sports" onAction={onChooseGame} />
        <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
          {CHOOSE_GAME_CHIPS.map((c) => (
            <MobileChip
              key={c.id}
              label={c.label}
              selected={selectedGame === c.id}
              onClick={() => {
                setSelectedGame(c.id);
                if (c.id !== "more") onChooseGame();
              }}
              icon={c.id === "swimming" ? Waves : c.id === "more" ? LayoutGrid : undefined}
              image={
                "image" in c ? (
                  <Image src={c.image} alt={c.label} width={28} height={28} unoptimized className="h-7 w-7 object-contain" />
                ) : c.id === "snooker" ? (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white">
                    8
                  </span>
                ) : undefined
              }
            />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <MobileCard className="flex flex-col gap-3 !p-4">
          <p className="text-xs font-bold text-slate-900">Upcoming Booking</p>
          <div className="flex items-center gap-2 rounded-xl bg-brand-50 p-2.5">
            <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-500 text-white">
              <span className="text-[8px] font-bold uppercase leading-none">May</span>
              <span className="text-xs font-extrabold leading-none">27</span>
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-900">Cricket Arena</p>
              <p className="text-[10px] text-slate-500">7:00 – 9:00 PM</p>
            </div>
          </div>
          <p className="flex items-center gap-2 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3" /> 2 Courts
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" /> 10 Players
            </span>
          </p>
          <div className="flex items-center gap-1.5 text-center">
            {[
              { label: "HRS", value: "24" },
              { label: "MIN", value: "05" },
              { label: "SEC", value: "36" },
            ].map((t) => (
              <div key={t.label} className="flex-1 rounded-lg bg-slate-50 py-1.5">
                <p className="text-xs font-extrabold text-slate-900">{t.value}</p>
                <p className="text-[8px] font-semibold text-slate-400">{t.label}</p>
              </div>
            ))}
          </div>
        </MobileCard>

        <MobileCard className="flex flex-col gap-3 !p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-900">My Wallet</p>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-500">
              <CreditCard className="h-4 w-4" />
            </span>
          </div>
          <div>
            <p className="text-xl font-extrabold text-slate-900">₹1,250.00</p>
            <p className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <Star className="h-3 w-3 fill-current text-amber-400" aria-hidden /> 250
            </p>
            <p className="text-[10px] text-slate-400">Reward Points</p>
          </div>
        </MobileCard>
      </section>

      <section>
        <MobileSectionRow title="Community Matches Near You" actionLabel="View All" onAction={onViewAllCommunity} />
        <MobileCard className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
              Open Match
            </span>
            <Feather className="h-4 w-4 shrink-0 text-brand-400" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">Badminton Doubles</p>
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5" /> Shobhagpura · 1.2 km
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              {["A", "R", "K", "S"].map((letter, i) => (
                <span
                  key={letter + i}
                  className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-brand-400 to-accent-500 text-[10px] font-bold text-white"
                >
                  {letter}
                </span>
              ))}
              <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-bold text-slate-600">
                +6
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-brand-600">Today, 8:00 PM</p>
              <p className="text-[10px] text-slate-500">₹100 / Player</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onJoinCommunity}
            className="w-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm"
          >
            Join Now
          </button>
        </MobileCard>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <MobileCard className="flex flex-col gap-2 !p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-900">Upcoming Events</p>
            <button onClick={onViewAllEvents} className="text-[10px] font-semibold text-brand-600">
              View All
            </button>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 p-2.5">
            <Trophy className="h-6 w-6 shrink-0 text-amber-500" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-900">BYV Premier League</p>
              <p className="text-[10px] text-slate-500">31 May – 6 June</p>
            </div>
          </div>
        </MobileCard>

        <MobileCard className="flex flex-col gap-2 !p-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-900">Offers For You</p>
            <button onClick={onViewAllOffers} className="text-[10px] font-semibold text-brand-600">
              View All
            </button>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-brand-500 to-accent-500 p-2.5 text-white">
            <div>
              <p className="text-lg font-extrabold leading-none">
                FLAT <span className="text-yellow-200">20%</span>
              </p>
              <p className="mt-1 text-[9px] font-medium text-brand-50">OFF Next Booking</p>
            </div>
            <Tag className="h-5 w-5 shrink-0" aria-hidden />
          </div>
        </MobileCard>
      </section>

      {filtersOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/40"
            onClick={() => setFiltersOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl">
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-200" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-900">Filters</h2>
              <button
                type="button"
                aria-label="Close filters"
                onClick={() => setFiltersOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Sport</p>
              <div className="flex flex-wrap gap-2">
                {sportOptions.map((sport) => (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => toggleSport(sport)}
                    className={filterPillClass(selectedSports.has(sport))}
                  >
                    {sport}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Max Price</p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setMaxPrice(null)} className={filterPillClass(maxPrice === null)}>
                  Any
                </button>
                {PRICE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMaxPrice(opt.value)}
                    className={filterPillClass(maxPrice === opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Distance</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMaxDistance(null)}
                  className={filterPillClass(maxDistance === null)}
                >
                  Any
                </button>
                {DISTANCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setMaxDistance(opt.value)}
                    className={filterPillClass(maxDistance === opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">Sort By</p>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSortBy(opt.value)}
                    className={filterPillClass(sortBy === opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={resetFilters}
                className="flex-1 rounded-full border border-slate-200 py-3 text-sm font-semibold text-slate-600"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex-1 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-sm font-semibold text-white shadow-sm"
              >
                Show {filteredVenues.length} Venues
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
