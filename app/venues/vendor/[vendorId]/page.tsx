"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MapPin, Store } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { MobileTopBar } from "@/components/mobile/ui";
import { getVendorProfile, VendorPublicProfile } from "@/lib/api/venues";
import { ApiError } from "@/lib/api/client";
import { Listing } from "@/lib/api/types";
import { categoryLabel } from "@/lib/taxonomy";

export default function VendorProfilePage() {
  const params = useParams<{ vendorId: string }>();
  const vendorId = params.vendorId;

  const [vendor, setVendor] = useState<VendorPublicProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("");

  useEffect(() => {
    getVendorProfile(vendorId)
      .then(({ vendor, listings }) => {
        setVendor(vendor);
        setListings(listings);
      })
      .catch((err) => setError(err instanceof ApiError ? err.describe() : "Failed to load vendor profile"))
      .finally(() => setLoading(false));
  }, [vendorId]);

  const availableCategories = useMemo(() => {
    const ids = new Set<string>();
    listings.forEach((l) => l.categories.forEach((c) => ids.add(c)));
    return Array.from(ids);
  }, [listings]);

  const filteredListings = category ? listings.filter((l) => l.categories.includes(category)) : listings;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc,_#eef2ff_45%,_#ffffff_82%)] pb-24">
      <div className="hidden sm:block">
        <SiteHeader />
      </div>
      <div className="sm:hidden px-4 pt-4">
        <MobileTopBar />
      </div>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {loading && <p className="text-sm text-slate-500">Loading vendor profile...</p>}
        {error && <p className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{error}</p>}

        {vendor && (
          <>
            {vendor.banner && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={vendor.banner}
                alt={`${vendor.businessName} banner`}
                className="mb-6 h-48 w-full rounded-2xl object-cover sm:h-64"
              />
            )}

            <div className="flex items-center gap-4">
              {vendor.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={vendor.logo} alt={vendor.businessName} className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
              ) : (
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-500">
                  <Store className="h-7 w-7" />
                </span>
              )}
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-extrabold text-slate-900 sm:text-3xl">{vendor.businessName}</h1>
                <p className="flex items-center gap-1 truncate text-sm text-slate-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {vendor.city ? `${vendor.city}, ` : ""}
                  {vendor.state}
                </p>
              </div>
            </div>

            {availableCategories.length > 1 && (
              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategory("")}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                    category === "" ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All
                </button>
                {availableCategories.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCategory(id)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      category === id ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {categoryLabel(id)}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredListings.map((listing) => (
                <Link
                  key={listing._id}
                  href={`/venues/${listing.slug || listing._id}`}
                  className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative overflow-hidden rounded-[1.25rem] bg-slate-900 p-5 text-white">
                    {listing.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={listing.coverImage}
                        alt={listing.title}
                        className="absolute inset-0 h-full w-full object-cover opacity-70"
                      />
                    )}
                    <div className="relative">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-90">
                        {listing.categories.map(categoryLabel).join(", ") || listing.type}
                      </p>
                      <h2 className="mt-2 text-xl font-black">{listing.title}</h2>
                    </div>
                  </div>
                  <p className="mt-4 text-lg font-bold text-slate-950">₹{listing.price.toLocaleString("en-IN")}</p>
                </Link>
              ))}
              {!loading && filteredListings.length === 0 && (
                <p className="col-span-full rounded-[1.75rem] border border-slate-100 bg-white p-10 text-center text-sm text-slate-500">
                  This vendor has no active listings yet.
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
