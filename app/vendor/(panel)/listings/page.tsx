"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Copy, Eye, Plus, Search, Trash2 } from "lucide-react";
import { PageHero, Badge } from "@/components/vendor/ui";
import { useVendorAuth } from "@/components/providers/VendorAuthProvider";
import { Toast } from "@/components/admin/Toast";
import { Listing } from "@/lib/types";
import { getVendorListings, createVendorListing, deleteVendorListing } from "@/lib/api/vendor";
import { apiListingToMock, mockListingToApiInput } from "@/lib/api/listingAdapter";
import { ApiError } from "@/lib/api/client";
import { categoryLabel } from "@/lib/taxonomy";

const TABS = ["All", "Turf", "Game", "Event"] as const;

const TYPE_TONE: Record<Listing["type"], "info" | "success" | "pending"> = {
  Turf: "info",
  Game: "success",
  Event: "pending",
};

export default function ListingsPage() {
  const { vendor } = useVendorAuth();
  const canAddEvent = vendor.verticals.includes("events");
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof TABS)[number]>("All");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(() => {
    getVendorListings()
      .then((items) => setAllListings(items.map(apiListingToMock)))
      .catch((err) => setToast(err instanceof ApiError ? err.describe() : "Failed to load listings"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleClone(listing: Listing) {
    try {
      const input = mockListingToApiInput({ ...listing, title: `${listing.title} (Copy)`, status: "Inactive" });
      const clone = await createVendorListing(input);
      refresh();
      setToast(`Cloned "${listing.title}" as "${clone.title}"`);
    } catch (err) {
      setToast(err instanceof ApiError ? err.describe() : "Failed to clone listing");
    }
  }

  async function handleDelete(listing: Listing) {
    if (!window.confirm(`Delete "${listing.title}"? This cannot be undone.`)) return;
    try {
      await deleteVendorListing(listing.id);
      refresh();
      setToast(`Deleted "${listing.title}"`);
    } catch (err) {
      setToast(err instanceof ApiError ? err.describe() : "Failed to delete listing");
    }
  }

  const filtered = useMemo(() => {
    return allListings.filter((l) => {
      const matchesTab = tab === "All" || l.type === tab;
      const matchesQuery = l.title.toLowerCase().includes(query.toLowerCase());
      return matchesTab && matchesQuery;
    });
  }, [allListings, tab, query]);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Vendor Listings"
        title="Manage your listings"
        description="Add turfs, indoor games, or events — control pricing, availability and visibility from one place."
        right={
          <>
            <Link
              href="/vendor/listings/new?kind=turf"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-vibe-violet font-semibold text-sm px-4 py-2.5 hover:bg-white/90 transition-colors"
            >
              <Plus size={16} /> Add Turf / Game
            </Link>
            {canAddEvent && (
              <Link
                href="/vendor/listings/new?kind=event"
                className="inline-flex items-center gap-2 rounded-xl bg-vibe-lime text-vibe-indigo font-semibold text-sm px-4 py-2.5 hover:bg-vibe-lime/90 transition-colors"
              >
                <Plus size={16} /> Add New Event
              </Link>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SummaryCard label="My Listings" value={allListings.length} hint="Vendor owned" />
        <SummaryCard label="Claimable Admin Listings" value={0} hint="Available to claim" />
        <SummaryCard label="Claimed From Admin" value={0} hint="Claimed listings" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="inline-flex rounded-xl border border-surface-border bg-white p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t
                  ? "bg-vibe-violet text-white"
                  : "text-ink-soft hover:bg-cream-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search my listings..."
            className="w-full rounded-xl border border-surface-border bg-white pl-9 pr-3 py-2.5 text-sm outline-none focus:border-vibe-violet"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={listing}
            onClone={() => handleClone(listing)}
            onDelete={() => handleDelete(listing)}
          />
        ))}
        {loading && (
          <div className="col-span-full rounded-xl2 border border-dashed border-surface-border bg-white py-14 text-center">
            <p className="text-sm text-ink-faint">Loading listings...</p>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="col-span-full rounded-xl2 border border-dashed border-surface-border bg-white py-14 text-center">
            <p className="text-sm text-ink-faint">
              No listings match this filter yet — try another tab or add a new listing.
            </p>
          </div>
        )}
      </div>

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <div className="rounded-xl2 border border-surface-border bg-white p-5 shadow-panel">
      <p className="text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-xs text-ink-faint">{hint}</p>
    </div>
  );
}

function ListingCard({
  listing,
  onClone,
  onDelete,
}: {
  listing: Listing;
  onClone: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl2 border border-surface-border bg-white overflow-hidden shadow-panel flex flex-col">
      <div className="h-32 bg-gradient-to-br from-vibe-indigo to-vibe-violetSoft relative flex items-end p-4">
        <div className="absolute top-3 left-3 flex gap-2">
          <Badge tone={TYPE_TONE[listing.type]}>{listing.type}</Badge>
          <Badge tone={listing.status === "Active" ? "success" : "neutral"}>
            {listing.status}
          </Badge>
        </div>
        <p className="text-white/80 text-[11px] font-semibold tracking-wide uppercase">
          {listing.categories.map(categoryLabel).join(", ") || "Uncategorized"}
        </p>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <h4 className="font-display font-semibold text-ink text-sm">{listing.title}</h4>
        <div className="flex items-center justify-between mt-2">
          <p className="text-lg font-semibold text-ink">
            ₹{listing.price.toLocaleString("en-IN")}
            <span className="text-xs font-normal text-ink-faint"> /slot</span>
          </p>
          <span className="text-[11px] text-ink-faint">Listed {listing.listedOn}</span>
        </div>

        <div className="mt-3 rounded-lg bg-cream-300 px-3 py-2 text-[11px] text-ink-soft">
          Access: <span className="font-semibold">{listing.access}</span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={`/vendor/listings/${listing.id}`}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-vibe-violet text-white text-xs font-semibold py-2 hover:bg-vibe-violetSoft transition-colors"
          >
            <Eye size={14} /> View
          </Link>
          <button
            onClick={onClone}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-surface-border text-ink-soft text-xs font-semibold py-2 hover:bg-cream-300 transition-colors"
          >
            <Copy size={14} /> Clone
          </button>
        </div>
        <button
          onClick={onDelete}
          className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 text-vibe-coral text-xs font-semibold py-2 hover:bg-rose-50 transition-colors"
        >
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
}
