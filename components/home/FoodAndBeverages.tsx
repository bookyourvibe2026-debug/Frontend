"use client";

import { ArrowRight, Clock, CupSoda, Percent } from "lucide-react";
import { SectionHeading } from "./ui";

export function FoodAndBeverages({ onViewAll }: { onViewAll: () => void }) {
  return (
    <section id="food" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <SectionHeading
          title="Food & Beverages"
          subtitle="Order snacks and drinks from the venue counter — ready by the time you take a break."
          actionLabel="Order Now"
          onAction={onViewAll}
        />
        <button
          type="button"
          onClick={onViewAll}
          className="flex w-full flex-col gap-3 rounded-xl bg-brand-50 p-4 text-left sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand-500 shadow-sm">
              <CupSoda className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">Hungry between games?</p>
              <p className="text-xs text-slate-500">Order courtside snacks & drinks</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-brand-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm">
              <Clock className="h-3.5 w-3.5" /> 10 min avg
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm">
              <Percent className="h-3.5 w-3.5" /> Combo deals
            </span>
            <ArrowRight className="h-4 w-4" />
          </div>
        </button>
      </div>
    </section>
  );
}
