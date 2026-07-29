"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Flame, MapPin, Sparkles, Tag, Clock, Building2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { MobileTopBar } from "@/components/mobile/ui";
import { browseVenues } from "@/lib/api/venues";
import { Listing } from "@/lib/api/types";
import { categoryLabel } from "@/lib/taxonomy";
import { activeBoostPct, boostedPrice, nowMinutes } from "@/lib/lastMinBoost";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function slotsForToday(listing: Listing) {
  const override = listing.dateOverrides?.find((o) => o.date === todayIso());
  const slots = override ? (override.isHoliday ? [] : override.slots ?? []) : listing.slotsList ?? [];
  return slots.filter((s) => !s.blocked);
}

interface ActiveDealDetails {
  originalPrice: number;
  discountedPrice: number;
  discountPct: number;
  savings: number;
  nextSlotTime?: string;
}

function getActiveDealDetails(listing: Listing, minutesNow: number): ActiveDealDetails | null {
  const slots = slotsForToday(listing);
  if (slots.length === 0) return null;

  let best: ActiveDealDetails | null = null;

  for (const slot of slots) {
    const basePrice = slot.price > 0 ? slot.price : listing.price;
    if (basePrice <= 0) continue;

    const pct = activeBoostPct(listing.lastMinBoost, slot.startTime, minutesNow);
    if (pct >= 10) {
      const discounted = boostedPrice(basePrice, pct);
      const savings = Math.max(0, basePrice - discounted);
      if (!best || pct > best.discountPct) {
        best = {
          originalPrice: basePrice,
          discountedPrice: discounted,
          discountPct: pct,
          savings,
          nextSlotTime: slot.startTime,
        };
      }
    }
  }

  if (!best && listing.price > 0) {
    const validPrices = slots.map((s) => s.price).filter((p) => p > 0);
    if (validPrices.length > 0) {
      const cheapest = Math.min(...validPrices);
      if (cheapest < listing.price) {
        const discountPct = Math.round((1 - cheapest / listing.price) * 100);
        if (discountPct >= 10) {
          best = {
            originalPrice: listing.price,
            discountedPrice: cheapest,
            discountPct,
            savings: Math.max(0, listing.price - cheapest),
          };
        }
      }
    }
  }

  return best;
}

export default function DedicatedDealsPage() {
  const [venues, setVenues] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    browseVenues({ type: "Turf", limit: 50 })
      .then((res) => setVenues(res.items))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const activeDeals = useMemo(() => {
    const minutesNow = nowMinutes(new Date(nowTick));
    return venues
      .map((venue) => {
        const deal = getActiveDealDetails(venue, minutesNow);
        return deal ? { venue, deal } : null;
      })
      .filter((item): item is { venue: Listing; deal: ActiveDealDetails } => item !== null)
      .sort((a, b) => b.deal.discountPct - a.deal.discountPct);
  }, [venues, nowTick]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed,_#f8fafc_42%,_#ffffff_78%)] text-slate-900">
      <div className="hidden sm:block">
        <SiteHeader />
      </div>

      <div className="sm:hidden px-4 pt-4">
        <MobileTopBar />
      </div>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Header section */}
        <div className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-brand-950 p-6 text-white shadow-xl sm:p-10">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/20 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-orange-300 backdrop-blur-md">
              <Flame className="h-4 w-4 text-orange-400 fill-orange-400 animate-bounce" /> Last Minute Deals
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
              Live Now
            </span>
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
            Exclusive Court Price Drops
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
            Hand-picked last minute deals triggered in real time. Grab discounted slots at top turfs near you before time runs out.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm">
              ⚡ {activeDeals.length} active deals live
            </span>
            <span className="rounded-full bg-orange-500/20 px-4 py-2 text-xs font-bold text-orange-300 border border-orange-500/30">
              Up to 30% OFF
            </span>
          </div>
        </div>

        {/* Deals Listing Grid */}
        <section className="mt-8">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl flex items-center gap-2">
              Discounted Turfs <span className="text-sm font-semibold text-slate-500">({activeDeals.length})</span>
            </h2>
            <Link
              href="/venues"
              className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 sm:text-sm"
            >
              Browse All Venues →
            </Link>
          </div>

          {activeDeals.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {activeDeals.map(({ venue, deal }) => (
                <div
                  key={venue._id}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* Card Image Container */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                    {venue.coverImage ? (
                      <Image
                        src={venue.coverImage}
                        alt={venue.title}
                        fill
                        unoptimized
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
                        <Building2 className="h-10 w-10" />
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    {/* Discount Badge */}
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-3 py-1 text-xs font-black uppercase text-white shadow-lg shadow-orange-500/30">
                      <Tag className="h-3 w-3 fill-current" /> {deal.discountPct}% OFF
                    </span>

                    {/* Next slot badge if available */}
                    {deal.nextSlotTime && (
                      <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-bold text-amber-300 backdrop-blur-md">
                        <Clock className="h-3 w-3" /> Slot: {deal.nextSlotTime}
                      </span>
                    )}
                  </div>

                  {/* Card Content Details */}
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 line-clamp-1 group-hover:text-brand-600 transition">
                        {venue.title}
                      </h3>
                      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        {venue.city}
                      </p>

                      {venue.categories && venue.categories.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {venue.categories.map((catId) => (
                            <span
                              key={catId}
                              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600"
                            >
                              {categoryLabel(catId)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-slate-900 sm:text-xl">
                              ₹{deal.discountedPrice.toLocaleString("en-IN")}
                            </span>
                            <span className="text-xs font-bold text-slate-400 line-through">
                              ₹{deal.originalPrice.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <p className="text-[10px] font-bold text-emerald-600">
                            Save ₹{deal.savings.toLocaleString("en-IN")} / hr
                          </p>
                        </div>

                        <Link
                          href={`/venues/${venue.slug || venue._id}`}
                          className="rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow transition hover:bg-brand-600 active:scale-95"
                        >
                          Book Now
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : !loading ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                <Sparkles className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-lg font-extrabold text-slate-900">No Last Minute Deals Active Right Now</h3>
              <p className="mt-1 text-sm text-slate-500">
                Venues trigger last minute boosts when court slots approach. Check back soon or browse all available turfs.
              </p>
              <Link
                href="/venues"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-brand-700"
              >
                Browse All Venues
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-3xl bg-slate-100" />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
