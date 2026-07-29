"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Flame, Sparkles, ArrowRight } from "lucide-react";
import { SectionHeading } from "./ui";
import { browseVenues } from "@/lib/api/venues";
import { Listing } from "@/lib/api/types";
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

export function bestDealNow(listing: Listing, minutesNow: number): { price: number; discountPct: number } | null {
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

/**
 * Swiggy/Zomato style offer card component for homepage.
 * Features high-quality turf image as background with a bold promotional discount badge.
 * Does NOT display turf name, location, price, rating, or amenities on homepage.
 * Entire card is clickable and navigates to /deals.
 */
function PromoOfferCard({ image, discountPct }: { image?: string; discountPct: number }) {
  return (
    <Link
      href="/deals"
      className="group relative block aspect-[16/10] w-64 shrink-0 snap-start overflow-hidden rounded-3xl border border-white/10 bg-slate-950 p-4 shadow-lg transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-brand-500/20 sm:w-72"
    >
      {image ? (
        <Image
          src={image}
          alt="Last Minute Deal"
          fill
          unoptimized
          className="object-cover opacity-80 transition duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-slate-950 to-slate-900" />
      )}

      {/* Modern gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.35),transparent_55%)]" />

      {/* Card Content — Offer Focus Only */}
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 rounded-full border border-orange-400/30 bg-orange-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-orange-300 backdrop-blur-md">
            <Sparkles className="h-3 w-3 text-amber-300 animate-pulse" /> ⚡ LAST MINUTE
          </span>
          <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold text-white/80 backdrop-blur-sm">
            TODAY
          </span>
        </div>

        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-orange-400 drop-shadow">
            LIMITED TIME OFFER
          </p>
          <p className="mt-0.5 text-2xl sm:text-3xl font-black tracking-tight text-white drop-shadow-md">
            UP TO {discountPct}% OFF
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-white/15 pt-2 text-[11px] font-bold text-white/90">
          <span>Claim Court Deal</span>
          <span className="inline-flex items-center gap-1 text-orange-400 transition group-hover:translate-x-1">
            Explore Deals <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Homepage Last Minute Deals section — displaying Swiggy/Zomato style offer cards */
export function LastMinuteDeals({ className = "mx-auto mt-8 max-w-7xl px-4 sm:px-6" }: { className?: string }) {
  const router = useRouter();
  const [venues, setVenues] = useState<Listing[]>([]);
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

        icon={Flame}
        actionLabel="View All Deals"
        onAction={() => router.push("/deals")}
      />
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 scrollbar-none">
        {deals.map(({ venue, discountPct }) => (
          <PromoOfferCard
            key={venue._id}
            image={venue.coverImage}
            discountPct={discountPct}
          />
        ))}
      </div>
    </section>
  );
}

export const HotDeals = LastMinuteDeals;
