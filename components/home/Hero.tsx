"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Hand, Search, Settings, Star } from "lucide-react";
import { HERO_IMAGES, HERO_SLIDE_DURATION_MS, HERO_STATS } from "./data";
import { PrimaryButton } from "./ui";

export function Hero({
  userName,
  searchValue,
  onSearchChange,
  onOpenFilters,
  activeFilterCount = 0,
}: {
  userName: string;
  searchValue: string;
  onSearchChange: (v: string) => void;
  onOpenFilters: () => void;
  activeFilterCount?: number;
}) {
  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setHeroSlide((i) => (i + 1) % HERO_IMAGES.length);
    }, HERO_SLIDE_DURATION_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="home" className="relative overflow-hidden">
      <div
        className="relative"
        style={{
          background:
            "linear-gradient(135deg, #15101f 0%, #211731 35%, #2b1f3d 60%, #3a2a1a 100%)",
        }}
      >
        {/* rotating background slideshow */}
        <div className="absolute inset-0" aria-hidden>
          {HERO_IMAGES.map((src, i) => (
            <div
              key={src}
              className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                i === heroSlide ? "opacity-100" : "opacity-0"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                priority={i === 0}
                sizes="100vw"
                className={`object-cover ${
                  i === heroSlide ? "animate-[hero-kenburns_3.8s_ease-out_forwards]" : ""
                }`}
              />
            </div>
          ))}
          {/* gradient wash so text keeps its contrast over the photos */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, rgba(21,16,31,0.88) 0%, rgba(33,23,49,0.82) 35%, rgba(43,31,61,0.78) 60%, rgba(58,42,26,0.72) 100%)",
            }}
          />
        </div>

        {/* ambient glow accents */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-brand-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 top-10 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:pb-20 lg:pt-16">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-brand-200 backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Good Morning, {userName} <Hand className="h-3.5 w-3.5" /> — Udaipur is live
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              Let&rsquo;s Find Your{" "}
              <span className="bg-gradient-to-r from-brand-400 via-amber-300 to-accent-400 bg-clip-text text-transparent">
                Vibe
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-slate-300 sm:text-lg">
              Book courts and turfs, find players for tonight&rsquo;s match, order food
              courtside, and never argue about who owes what — all from one app.
            </p>

            {/* Search bar */}
            <div className="mt-7 flex flex-col gap-2 rounded-2xl bg-white/95 p-2 shadow-2xl shadow-black/30 sm:flex-row sm:items-center sm:rounded-full sm:p-1.5 sm:pl-5">
              <span aria-hidden className="hidden text-slate-400 sm:block">
                <Search className="h-4 w-4" />
              </span>
              <input
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search turf, badminton, pickleball..."
                className="w-full flex-1 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 sm:bg-transparent sm:px-0 sm:py-2"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Filters"
                  onClick={onOpenFilters}
                  className="relative hidden h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 sm:flex"
                >
                  <Settings className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[9px] font-bold text-white ring-2 ring-white">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
                <PrimaryButton className="w-full !px-6 !py-3 sm:w-auto">Search</PrimaryButton>
              </div>
            </div>

            {/* trust row */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1.5">
                <span aria-hidden className="flex items-center gap-0.5 text-amber-300">
                  <Star className="h-3.5 w-3.5 fill-current" /> 4.8
                </span>{" "}
                rated by 12,000+ players
              </span>
              <span className="hidden h-3 w-px bg-white/15 sm:block" />
              <span>Zero booking commission for your first 3 matches</span>
            </div>
          </div>

          {/* slideshow dots */}
          <div className="mt-10 flex items-center justify-center gap-2 lg:justify-start">
            {HERO_IMAGES.map((src, i) => (
              <button
                key={src}
                type="button"
                aria-label={`Show hero image ${i + 1}`}
                onClick={() => setHeroSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === heroSlide ? "w-7 bg-brand-400" : "w-1.5 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats strip, overlapping the bottom edge of the hero */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid translate-y-8 grid-cols-2 gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-xl sm:translate-y-12 sm:grid-cols-4 sm:gap-4 sm:p-6">
            {HERO_STATS.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-1 text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
                  <s.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-lg font-extrabold text-slate-900 sm:text-xl">{s.value}</p>
                  <p className="text-[11px] font-semibold text-slate-500 sm:text-xs">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* spacer to absorb the stats-strip overlap */}
      <div className="h-14 bg-slate-50 sm:h-16" />
    </section>
  );
}
