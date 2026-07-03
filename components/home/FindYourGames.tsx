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
      <div className="overflow-hidden rounded-[2rem] bg-[#eaf2ff] px-5 py-6 shadow-[0_18px_60px_rgba(148,163,184,0.18)] sm:px-8 sm:py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-[2rem]">
              Find A Venue
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const firstSport = SPORTS_CATALOG[0];
              if (firstSport) onSelectSport(firstSport);
            }}
            className="self-start text-sm font-bold uppercase tracking-wide text-sky-500 transition hover:text-sky-600"
          >
            Explore Sports Venue
          </button>
        </div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-8 min-[420px]:grid-cols-2 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-7">
          {SPORTS_CATALOG.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSport(s)}
              className="group flex flex-col items-center justify-start text-center"
            >
              <div className="relative flex h-28 w-28 items-center justify-center sm:h-36 sm:w-36">
                <span
                  className={`absolute inset-4 rounded-full bg-gradient-to-b ${s.bubble} shadow-[0_20px_35px_rgba(148,163,184,0.16)] transition duration-300 group-hover:scale-105`}
                />
                <span className="absolute inset-0 rounded-full bg-white/35 opacity-0 blur-2xl transition duration-300 group-hover:opacity-100" />
                <Image
                  src={s.image}
                  alt={s.alt}
                  width={96}
                  height={96}
                  unoptimized
                  priority
                  className="relative z-10 h-20 w-20 object-contain transition duration-300 group-hover:scale-105 sm:h-24 sm:w-24"
                />
                {s.isNew && (
                  <span className="absolute bottom-0 z-20 rounded-full bg-gradient-to-r from-sky-500 to-violet-600 px-4 py-1 text-xs font-bold text-white shadow-lg shadow-sky-500/20">
                    NEW
                  </span>
                )}
              </div>
              <p className="mt-2 text-base font-extrabold tracking-tight text-slate-900 sm:text-[1.35rem]">
                {s.label}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
