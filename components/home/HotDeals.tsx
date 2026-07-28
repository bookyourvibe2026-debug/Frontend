"use client";

import { useEffect, useMemo, useState } from "react";
import { Flame } from "lucide-react";
import { SectionHeading } from "./ui";
import { VenuePosterCard } from "@/components/venue-poster-card";
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

/**
 * The best deal live on this venue *right now*.
 *
 * Two sources, and they are different things. A Last Min Boost is a real, time-boxed
 * offer — it only counts while the vendor's trigger window is open, which is why it's
 * evaluated rather than read off the price. A plain price cut (dynamic pricing, a manual
 * markdown) is still detected the old way, by comparing today's cheapest open slot
 * against the venue's base rate.
 */
function bestDealNow(listing: Listing, minutesNow: number): { price: number; discountPct: number } | null {
  const slots = slotsForToday(listing);
  if (slots.length === 0 || listing.price <= 0) return null;

  let best: { price: number; discountPct: number } | null = null;
  const take = (price: number, discountPct: number) => {
    if (discountPct < 10) return;
    if (!best || discountPct > best.discountPct) best = { price, discountPct };
  };

  for (const slot of slots) {
    const pct = activeBoostPct(listing.lastMinBoost, slot.startTime, minutesNow);
    if (pct > 0) take(boostedPrice(slot.price, pct), pct);
  }

  const cheapest = Math.min(...slots.map((s) => s.price));
  take(cheapest, Math.round((1 - cheapest / listing.price) * 100));

  return best;
}

/** Below the hero on the homepage — surfaces venues whose price has actually
 * dropped today (Last-Minute Boost, dynamic pricing, or a manual cut), biggest discount first. */
export function LastMinuteDeals({ className = "mx-auto mt-8 max-w-7xl px-4 sm:px-6" }: { className?: string }) {
  const [venues, setVenues] = useState<Listing[]>([]);
  // Ticks so a boost appears here the moment its trigger window opens, and drops off
  // again once the slot starts — without this the row would be stale until a reload.
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    browseVenues({ type: "Turf", limit: 30 })
      .then((r) => setVenues(r.items))
      .catch(() => setVenues([]));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const deals = useMemo(() => {
    const minutesNow = nowMinutes(new Date(nowTick));
    return venues
      // A poster card with no poster is just a grey placeholder box — not worth a slot
      // in a row that's meant to sell. Vendors who haven't uploaded a cover sit this out.
      .filter((venue) => Boolean(venue.coverImage))
      .map((venue) => {
        const best = bestDealNow(venue, minutesNow);
        return best ? { venue, best: best.price, discountPct: best.discountPct } : null;
      })
      .filter((d): d is { venue: Listing; best: number; discountPct: number } => d !== null)
      .sort((a, b) => b.discountPct - a.discountPct)
      .slice(0, 10);
  }, [venues, nowTick]);

  if (deals.length === 0) return null;

  return (
    <section className={className}>
      <SectionHeading
        eyebrow="Today Only"
        title="Last Minute Deals"
        subtitle="Last-minute price drops on venues, live right now."
        icon={Flame}
      />
      <div className="flex snap-x snap-mandatory gap-3.5 overflow-x-auto scroll-smooth pb-2 scrollbar-none">
        {deals.map(({ venue, best, discountPct }) => (
          <div key={venue._id} className="w-36 shrink-0 snap-start sm:w-44">
            <VenuePosterCard
              href={`/venues/${venue.slug || venue._id}`}
              image={venue.coverImage}
              title={venue.title}
              subtitle={venue.categories.map(categoryLabel).join(", ") || venue.type}
              city={venue.city}
              price={best}
              badge={`${discountPct}% OFF`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

export const HotDeals = LastMinuteDeals;
