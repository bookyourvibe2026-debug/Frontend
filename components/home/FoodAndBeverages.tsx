"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CupSoda, MapPin, Store } from "lucide-react";
import { getFoodOutlets } from "@/lib/api/foodOrders";
import type { FoodOutlet } from "@/lib/api/types";
import { SectionHeading } from "./ui";

/** Live player-facing food outlets. Only active outlets are returned by the public API. */
export function FoodAndBeverages() {
  const [outlets, setOutlets] = useState<FoodOutlet[]>([]);

  useEffect(() => {
    getFoodOutlets({ limit: 3 })
      .then((result) => setOutlets(result.items))
      .catch(() => setOutlets([]));
  }, []);

  return (
    <section id="food" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <SectionHeading
        title="Food & Beverages"
        subtitle="Order snacks and drinks from partner restaurants and venue counters."
        actionLabel="View All"
        onAction={() => window.location.assign("/food")}
      />

      {outlets.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {outlets.map((outlet) => (
            <Link
              key={outlet._id}
              href={`/food/${outlet.slug || outlet._id}`}
              className="group flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <CupSoda className="h-5 w-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold text-slate-900">{outlet.name}</span>
                <span className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
                  <MapPin className="h-3 w-3 shrink-0" /> {outlet.location.city || outlet.location.area || "Food partner"}
                </span>
                {outlet.offer && <span className="mt-1 block truncate text-[11px] font-semibold text-emerald-600">{outlet.offer}</span>}
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
            </Link>
          ))}
        </div>
      ) : (
        <Link href="/food" className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-brand-200">
          <span className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Store className="h-5 w-5" /></span>
            <span>
              <span className="block text-sm font-bold text-slate-700">Explore Food &amp; Beverages</span>
              <span className="block text-xs text-slate-500">Browse partner restaurants and venue counters.</span>
            </span>
          </span>
          <ArrowRight className="h-4 w-4 text-brand-600" />
        </Link>
      )}
    </section>
  );
}
