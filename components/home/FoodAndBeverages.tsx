"use client";

import { CupSoda } from "lucide-react";
import { SectionHeading } from "./ui";

/** Food ordering isn't live yet — the section stays visible but reads as Coming Soon. */
export function FoodAndBeverages() {
  return (
    <section id="food" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <SectionHeading
          title="Food & Beverages"
          subtitle="Order snacks and drinks from the venue counter — ready by the time you take a break."
        />
        <div className="flex w-full flex-col gap-3 rounded-xl bg-slate-50 p-4 text-left sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
              <CupSoda className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-500">Hungry between games?</p>
              <p className="text-xs text-slate-400">Courtside snacks &amp; drinks, ordered from your seat.</p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-amber-50 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wide text-amber-600 sm:self-auto">
            Coming Soon
          </span>
        </div>
      </div>
    </section>
  );
}
