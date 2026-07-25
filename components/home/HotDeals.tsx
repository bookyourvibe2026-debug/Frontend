"use client";

import { useEffect, useMemo, useState } from "react";
import { Flame } from "lucide-react";
import { SectionHeading } from "./ui";
import { VenuePosterCard } from "@/components/venue-poster-card";
import { browseVenues } from "@/lib/api/venues";
import { Listing } from "@/lib/api/types";
import { categoryLabel } from "@/lib/taxonomy";

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Today's cheapest still-open slot on a turf — this is what Last-Minute Boost (and any
 * other manual discount) actually writes to, so comparing it against the base rate is
 * how a "deal" is detected without needing a separate deals/promotions system. */
function todaysBestPrice(listing: Listing): number | null {
  const override = listing.dateOverrides?.find((o) => o.date === todayIso());
  const slots = override ? (override.isHoliday ? [] : override.slots ?? []) : listing.slotsList ?? [];
  const open = slots.filter((s) => !s.blocked);
  if (open.length === 0) return null;
  return Math.min(...open.map((s) => s.price));
}

/** Below "Hot Offers & Events" on the homepage — surfaces venues whose price has actually
 * dropped today (Last-Minute Boost, dynamic pricing, or a manual cut), biggest discount first. */
export function HotDeals() {
  const [venues, setVenues] = useState<Listing[]>([]);

  useEffect(() => {
    browseVenues({ type: "Turf", limit: 30 })
      .then((r) => setVenues(r.items))
      .catch(() => setVenues([]));
  }, []);

  const deals = useMemo(() => {
    return venues
      .map((venue) => {
        if (venue.price <= 0) return null;
        const best = todaysBestPrice(venue);
        if (best === null) return null;
        const discountPct = Math.round((1 - best / venue.price) * 100);
        if (discountPct < 10) return null;
        return { venue, best, discountPct };
      })
      .filter((d): d is { venue: Listing; best: number; discountPct: number } => d !== null)
      .sort((a, b) => b.discountPct - a.discountPct)
      .slice(0, 10);
  }, [venues]);

  if (deals.length === 0) return null;

  return (
    <section className="mx-auto mt-8 max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Today Only"
        title="Hot Deals"
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
