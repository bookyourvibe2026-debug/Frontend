"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface AdBannerProps {
  image?: string;
  title: string;
  subtitle: string;
  gradient: string;
  cta?: string;
  onCta?: () => void;
}

const ADS = [
  {
    id: "ad1",
    title: "Summer Slam Tournament",
    subtitle: "Win ₹50,000 in prizes • Register now",
    gradient: "from-orange-500 via-red-500 to-pink-500",
    cta: "Register Free",
  },
  {
    id: "ad2",
    title: "Flat 30% Off — First Booking",
    subtitle: "Use code BYV30 • Valid on all sports",
    gradient: "from-violet-600 via-purple-600 to-indigo-700",
    cta: "Book Now",
  },
  {
    id: "ad3",
    title: "Refer & Earn ₹200",
    subtitle: "Share with friends — both of you win!",
    gradient: "from-emerald-500 via-teal-500 to-cyan-600",
    cta: "Refer Now",
  },
];

export function AdBanner() {
  const [visibleAds, setVisibleAds] = useState<Set<string>>(new Set(ADS.map((a) => a.id)));

  const dismissAd = (id: string) => {
    setVisibleAds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const visible = ADS.filter((a) => visibleAds.has(a.id));
  if (visible.length === 0) return null;

  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((ad) => (
          <div
            key={ad.id}
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${ad.gradient} p-5 text-white shadow-lg`}
          >
            <button
              onClick={() => dismissAd(ad.id)}
              className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white/80 hover:bg-white/30"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <p className="text-lg font-extrabold leading-tight">{ad.title}</p>
            <p className="mt-1.5 text-sm font-medium text-white/80">{ad.subtitle}</p>
            {ad.cta && (
              <button className="mt-3 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-slate-900 shadow transition hover:scale-105">
                {ad.cta} →
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}