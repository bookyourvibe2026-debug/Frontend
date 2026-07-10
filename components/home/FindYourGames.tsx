"use client";

import Image from "next/image";
import { SPORTS_CATALOG } from "./data";
import type { Sport } from "./types";

export function FindYourGames({
  onSelectSport,
}: {
  onSelectSport: (sport: Sport) => void;
}) {
  return (
    <section id="games" className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
      <div className="overflow-hidden rounded-[2rem] bg-[#eaf2ff] px-4 py-4 shadow-[0_18px_60px_rgba(148,163,184,0.18)] sm:px-6 sm:py-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            Find A Venue
          </p>
          <button
            type="button"
            onClick={() => {
              const firstSport = SPORTS_CATALOG[0];
              if (firstSport) onSelectSport(firstSport);
            }}
            className="whitespace-nowrap text-[11px] font-bold uppercase tracking-wide text-sky-500 transition hover:text-sky-600"
          >
            Explore Sports Venue
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-7">
          {SPORTS_CATALOG.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSport(s)}
              className="group flex flex-col items-center justify-start text-center"
            >
            <div className="relative flex h-20 w-20 items-center justify-center sm:h-24 sm:w-24">
                <span
                  className={`absolute inset-2 rounded-full bg-gradient-to-b ${s.bubble} shadow-[0_20px_35px_rgba(148,163,184,0.16)] transition duration-300 group-hover:scale-105`}
                />
                <Image
                  src={s.image}
                  alt={s.alt}
                  width={64}
                  height={64}
                  unoptimized
                  priority
                  className="relative z-10 h-14 w-14 object-contain transition duration-300 group-hover:scale-105 sm:h-16 sm:w-16"
                />
                {s.isNew && (
                  <span className="absolute -bottom-1 z-20 rounded-full bg-gradient-to-r from-sky-500 to-violet-600 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-lg shadow-sky-500/20">
                    NEW
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm font-extrabold tracking-tight text-slate-900 sm:text-base">
                {s.label}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
