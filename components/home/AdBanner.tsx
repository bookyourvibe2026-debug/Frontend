"use client";

import {
  ArrowRight,
  Calendar,
  Clock,
  Dumbbell,
  Heart,
  MapPin,
  Star,
  Users,
  Wifi,
  Car,
  Music,
  Camera,
  ShowerHead,
  Utensils,
  Ticket,
  Gift,
  Percent,
} from "lucide-react";
import { useState } from "react";

const AD_CARDS = [
  {
    id: "ad-tournament",
    title: "Summer Slam Cricket Tournament",
    subtitle: "Win ₹50,000 + Trophy + Featured on BYV",
    gradient: "from-orange-600 via-red-500 to-pink-600",
    imageLabel: "T20",
    rating: 4.8,
    reviews: 230,
    location: "Shobhagpura, Udaipur",
    distance: "2.3 km",
    date: "Aug 15-20",
    time: "6:00 AM - 10:00 PM",
    category: "Cricket",
    cta: "Register Free",
    highlights: [
      { icon: Users, label: "16 Teams Max" },
      { icon: Ticket, label: "₹500 Entry" },
      { icon: Gift, label: "Prizes Worth ₹1L" },
    ],
    amenities: [
      { icon: Wifi, label: "Free WiFi" },
      { icon: Car, label: "Parking" },
      { icon: Utensils, label: "Cafeteria" },
      { icon: ShowerHead, label: "Showers" },
    ],
    offer_tag: "Register before Aug 1 — Get Free Jersey",
    bgImage: "/hero1.png",
  },
  {
    id: "ad-offer",
    title: "Flat 30% Off — First Booking",
    subtitle: "Use code BYV30 on Badminton, Cricket, Football & more",
    gradient: "from-violet-700 via-purple-600 to-indigo-800",
    imageLabel: "OFFER",
    rating: 4.9,
    reviews: 1_850,
    location: "All Venues • Udaipur",
    distance: "Near You",
    date: "Valid till Jul 31",
    time: "Any Slot",
    category: "All Sports",
    cta: "Book Now",
    highlights: [
      { icon: Percent, label: "30% Off" },
      { icon: Clock, label: "Limited Time" },
      { icon: Users, label: "Group Bookings" },
    ],
    amenities: [
      { icon: Wifi, label: "Free WiFi" },
      { icon: Car, label: "Free Parking" },
      { icon: Music, label: "Music System" },
      { icon: Camera, label: "CCTV" },
    ],
    offer_tag: "No minimum order • Coupon auto-applied at checkout",
    bgImage: "/hero2.png",
  },
  {
    id: "ad-refer",
    title: "Refer & Earn ₹200",
    subtitle: "Share BYV with friends — you both get ₹200 wallet credit",
    gradient: "from-emerald-600 via-teal-500 to-cyan-700",
    imageLabel: "REFER",
    rating: 5.0,
    reviews: 3_420,
    location: "Pan India",
    distance: "Online",
    date: "Ongoing",
    time: "24x7",
    category: "Referral",
    cta: "Refer Now",
    highlights: [
      { icon: Gift, label: "₹200 Each" },
      { icon: Users, label: "No Limit" },
      { icon: Star, label: "Instant Credit" },
    ],
    amenities: [
      { icon: Wifi, label: "Works Online" },
      { icon: Dumbbell, label: "Any Sport" },
      { icon: Car, label: "No Travel" },
      { icon: ShowerHead, label: "Zero Hassle" },
    ],
    offer_tag: "Unlimited referrals • Credits never expire",
    bgImage: "/hero3.png",
  },
];

export function AdBanner() {
  const [visibleAds, setVisibleAds] = useState<Set<string>>(new Set(AD_CARDS.map((a) => a.id)));
  const [favoriteAds, setFavoriteAds] = useState<Set<string>>(new Set());

  const dismissAd = (id: string) => {
    setVisibleAds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleFavorite = (id: string) => {
    setFavoriteAds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visible = AD_CARDS.filter((a) => visibleAds.has(a.id));
  if (visible.length === 0) return null;

  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <div className="mb-6 max-w-xl">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">
          EXCLUSIVE
        </p>
        <h2 className="flex items-center gap-1.5 text-base font-extrabold text-slate-900 sm:text-lg">
          Hot Offers & Events
          <Ticket className="h-4 w-4 text-amber-500" aria-hidden />
        </h2>
        <p className="mt-0.5 text-[11px] text-slate-500">
          Limited-time deals, tournaments, and referral bonuses — handpicked for you.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {visible.map((ad) => (
          <div
            key={ad.id}
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
          >
            {/* ----- Image / Gradient Header ----- */}
            <div
              className="relative h-44 w-full overflow-hidden"
              style={
                ad.bgImage
                  ? {
                      backgroundImage: `url(${ad.bgImage})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }
                  : undefined
              }
            >
              {/* Gradient overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${ad.gradient} opacity-85`}
              />

              {/* Rating badge */}
              <div className="absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-xs font-bold text-slate-900 shadow-sm backdrop-blur-sm">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {ad.rating}
                <span className="font-normal text-slate-400">({ad.reviews})</span>
              </div>

              {/* Favorite button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(ad.id);
                }}
                className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow backdrop-blur-sm"
                aria-label="Toggle favorite"
              >
                <Heart
                  className={`h-4 w-4 ${
                    favoriteAds.has(ad.id)
                      ? "fill-accent-500 text-accent-500"
                      : "text-slate-400"
                  }`}
                />
              </button>

              {/* Category pill */}
              <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
                <span className="rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold text-slate-900 shadow-sm backdrop-blur-sm">
                  {ad.imageLabel}
                </span>
                <span className="rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                  {ad.category}
                </span>
              </div>

              {/* Title overlay on bottom right */}
              <div className="absolute bottom-3 right-3 z-10 text-right">
                <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                  {ad.date}
                </p>
              </div>
            </div>

            {/* ----- Body ----- */}
            <div className="flex flex-1 flex-col gap-3 p-4">
              {/* Title + Subtitle */}
              <div>
                <h3 className="text-base font-extrabold leading-tight text-slate-900">
                  {ad.title}
                </h3>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                  {ad.subtitle}
                </p>
              </div>

              {/* Location & Time row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-brand-400" />
                  {ad.location} · {ad.distance}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-brand-400" />
                  {ad.time}
                </span>
              </div>

              {/* Highlights */}
              <div className="flex flex-wrap gap-2">
                {ad.highlights.map((h) => (
                  <span
                    key={h.label}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-[10px] font-semibold text-brand-700"
                  >
                    <h.icon className="h-3 w-3" />
                    {h.label}
                  </span>
                ))}
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100" />

              {/* Amenities grid */}
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Amenities & Highlights
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {ad.amenities.map((a) => (
                    <span
                      key={a.label}
                      className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-600"
                    >
                      <a.icon className="h-3 w-3 text-slate-400" />
                      {a.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Offer Tag */}
              <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 px-3 py-2 text-[11px] font-semibold text-amber-800">
                🏷️ {ad.offer_tag}
              </div>

              {/* CTA */}
              <button className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-brand-500/20 transition hover:scale-[1.02] active:scale-[0.98]">
                {ad.cta}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}