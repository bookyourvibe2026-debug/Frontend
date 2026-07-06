"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UtensilsCrossed, MapPin } from "lucide-react";
import { SiteHeader } from "../../components/site-header";
import { MobileTopBar } from "@/components/mobile/ui";
import { getFoodVendors } from "@/lib/api/foodOrders";
import { ApiError } from "@/lib/api/client";
import { FoodVendor } from "@/lib/api/types";

export default function FoodPage() {
  const [vendors, setVendors] = useState<FoodVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFoodVendors()
      .then(setVendors)
      .catch((err) => setError(err instanceof ApiError ? err.describe() : "Failed to load food vendors"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#eef2ff_45%,_#ffffff_82%)]">
      <div className="hidden sm:block">
        <SiteHeader />
      </div>
      <div className="sm:hidden px-4 pt-4">
        <MobileTopBar />
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Food &amp; Beverages</p>
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-4xl">
          Order food from venues near you.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-slate-500 sm:text-base">
          Pre-order before your match, order courtside, or grab a bite at the venue cafe.
        </p>

        {error && <p className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{error}</p>}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <Link
              key={vendor._id}
              href={`/food/${vendor._id}`}
              className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              {vendor.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={vendor.logo} alt={vendor.businessName} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
              ) : (
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
                  <UtensilsCrossed className="h-6 w-6" />
                </span>
              )}
              <div className="min-w-0">
                <h2 className="truncate font-bold text-slate-900">{vendor.businessName}</h2>
                <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" /> {vendor.city ? `${vendor.city}, ` : ""}
                  {vendor.state}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {!loading && vendors.length === 0 && !error && (
          <p className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            No food partners are live yet. Check back soon.
          </p>
        )}
      </main>
    </div>
  );
}
