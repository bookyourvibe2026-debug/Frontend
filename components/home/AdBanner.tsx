"use client";

import {
  ArrowRight,
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
import { useEffect, useState } from "react";
import { SectionHeading } from "./ui";

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
  {
    id: "ad-fnb",
    title: "Order Courtside Food & Beverages",
    subtitle: "Fresh snacks and drinks delivered straight to your court between games",
    gradient: "from-amber-600 via-orange-500 to-rose-600",
    imageLabel: "F&B",
    rating: 4.7,
    reviews: 960,
    location: "All Partner Venues",
    distance: "Near You",
    date: "Ongoing",
    time: "Open Slots",
    category: "Food & Beverages",
    cta: "Order Now",
    highlights: [
      { icon: Percent, label: "Combo Deals" },
      { icon: Clock, label: "10 Min Delivery" },
      { icon: Gift, label: "Free 1st Order" },
    ],
    amenities: [
      { icon: Utensils, label: "Cafeteria" },
      { icon: Wifi, label: "Free WiFi" },
      { icon: Car, label: "Parking" },
      { icon: ShowerHead, label: "Showers" },
    ],
    offer_tag: "Order from the Food & Beverages tab in Quick Actions",
    bgImage: "/hero1.png",
  },
  {
    id: "ad-coach",
    title: "Book a Verified Coach",
    subtitle: "Train with certified coaches across cricket, badminton, tennis & more",
    gradient: "from-sky-700 via-blue-600 to-indigo-800",
    imageLabel: "COACH",
    rating: 4.9,
    reviews: 540,
    location: "Multiple Venues",
    distance: "Udaipur",
    date: "Slots Daily",
    time: "6:00 AM - 9:00 PM",
    category: "Coaching",
    cta: "Find a Coach",
    highlights: [
      { icon: Users, label: "1-on-1 & Group" },
      { icon: Star, label: "Verified Coaches" },
      { icon: Ticket, label: "Trial Session" },
    ],
    amenities: [
      { icon: Dumbbell, label: "Fitness Gear" },
      { icon: Wifi, label: "Free WiFi" },
      { icon: Car, label: "Parking" },
      { icon: Camera, label: "Session Recording" },
    ],
    offer_tag: "First trial session at flat ₹199",
    bgImage: "/hero2.png",
  },
];

export function AdBanner() {
  const [index, setIndex] = useState(0);
  const [favoriteAds, setFavoriteAds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % AD_CARDS.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  const toggleFavorite = (id: string) => {
    setFavoriteAds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <SectionHeading eyebrow="Exclusive" title="Hot Offers & Events" subtitle="Limited-time deals, tournaments, and referral bonuses — handpicked for you." icon={Ticket} />

      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {AD_CARDS.map((ad) => (
          <div
            key={ad.id}
            className="group relative flex w-full shrink-0 flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm sm:flex-row"
          >
            {/* ----- Image / Gradient Header ----- */}
            <div
              className="relative h-44 w-full shrink-0 overflow-hidden sm:h-auto sm:w-72"
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

        <div className="mt-4 flex items-center justify-center gap-2">
          {AD_CARDS.map((ad, i) => (
            <button
              key={ad.id}
              type="button"
              aria-label={`Show banner ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                i === index ? "w-7 bg-brand-500" : "w-1.5 bg-slate-200 hover:bg-slate-300"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}