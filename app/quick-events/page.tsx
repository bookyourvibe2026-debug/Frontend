"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Zap,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { MobileTopBar } from "@/components/mobile/ui";
import { browseVenues } from "@/lib/api/venues";
import { getVendorListings } from "@/lib/api/vendor";
import { Listing } from "@/lib/api/types";

function formatEventDate(rawDate?: string): string {
  if (!rawDate) return "Upcoming";
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return rawDate;
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return rawDate;
  }
}

import { isEventExpired } from "@/lib/eventUtils";

export default function QuickEventsPage() {
  const router = useRouter();
  const [quickEvents, setQuickEvents] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      browseVenues({ limit: 100 }),
      getVendorListings({ type: "Event" }),
    ])
      .then(([publicRes, vendorRes]) => {
        const publicItems = publicRes.status === "fulfilled" ? publicRes.value.items || [] : [];
        const vendorItems = vendorRes.status === "fulfilled" ? vendorRes.value || [] : [];

        const map = new Map<string, Listing>();
        for (const item of [...publicItems, ...vendorItems]) {
          const idKey = String(item._id || (item as unknown as { id?: string }).id || item.title);
          if (idKey && !map.has(idKey)) {
            map.set(idKey, item);
          }
        }

        const now = new Date();
        const combined = Array.from(map.values()).filter((e) => !isEventExpired(e, now));
        // Filter strictly for Quick Add events
        const filtered = combined.filter((e) => {
          const subCats = e.subCategories || [];
          const tags = e.tags || [];
          const cats = e.categories || [];
          const desc = (e.description || "").toLowerCase();
          return (
            subCats.some((s) => s.toLowerCase().includes("quick")) ||
            tags.some((t) => t.toLowerCase().includes("quick")) ||
            cats.some((c) => c.toLowerCase().includes("quick")) ||
            desc.includes("coming soon for") ||
            desc.includes("fast track")
          );
        });
        setQuickEvents(filtered);
      })
      .catch(() => setQuickEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const handleCardClick = (event: Listing) => {
    router.push(`/venues/${event.slug || event._id}`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed,_#f8fafc_42%,_#ffffff_78%)]">
      {/* Desktop Navigation Header */}
      <div className="hidden sm:block">
        <SiteHeader />
      </div>

      {/* Mobile Top Bar */}
      <div className="sm:hidden px-4 pt-4">
        <MobileTopBar />
      </div>

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
        {/* Top Back Navigation & Counter */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/90 px-3.5 py-2 text-xs sm:text-sm font-bold text-slate-700 shadow-xs transition-all hover:bg-white hover:shadow-md active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </button>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-black text-amber-700 border border-amber-500/20">
            <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span>{quickEvents.length} Live Quick Events</span>
          </span>
        </div>

        {/* Hero Title Header */}
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-600">
            <Zap className="h-4 w-4 fill-amber-500 animate-pulse text-amber-500" />
            <span>FAST-TRACK EXPERIENCE</span>
          </div>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Quick Events &amp; Pop-Up RSVPs
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed">
            Browse all quick events added directly by event organizers and venue hosts. RSVP in a couple of taps with instant QR entry.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-72 w-full animate-pulse rounded-3xl bg-slate-100 border border-slate-200/60"
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && quickEvents.length === 0 && (
          <div className="mt-10 flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/90 p-12 text-center shadow-xs">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 ring-8 ring-amber-500/5 mb-4">
              <Zap className="h-8 w-8 stroke-[2.2]" />
            </div>
            <h3 className="text-lg font-extrabold text-slate-950">No Quick Events Available</h3>
            <p className="mt-1.5 max-w-md text-xs sm:text-sm text-slate-500 leading-relaxed">
              There are no live quick events right now. Check back soon as organizers publish new fast-track events.
            </p>
          </div>
        )}

        {/* Quick Events Cards Grid */}
        {!loading && quickEvents.length > 0 && (
          <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 transition-all duration-300">
            {quickEvents.map((event) => {
              const poster = event.coverImage || event.images?.[0]?.url || "/images/events-banner.png";
              const category = event.categories?.[0] || "Quick Event";
              const organizer = event.ownerName || "Verified Host";
              const venueName = event.address || event.city || "Venue Location";
              const rawDate = event.availableFrom || event.dateOverrides?.[0]?.date;
              const formattedDate = formatEventDate(rawDate);
              const eventTime =
                event.reportingStartTime && event.reportingEndTime
                  ? `${event.reportingStartTime} - ${event.reportingEndTime}`
                  : event.reportingStartTime || "10:00 AM";
              const capacityText = typeof event.capacity === "number" ? `${event.capacity} seats` : null;

              return (
                <div
                  key={event._id}
                  onClick={() => handleCardClick(event)}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
                >
                  {/* Image Banner */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900">
                    <Image
                      src={poster}
                      alt={event.title}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 350px"
                      priority
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

                    {/* Quick Event Badge */}
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 px-3 py-1 text-xs font-black uppercase text-white shadow-lg shadow-orange-500/30">
                      <Zap className="h-3.5 w-3.5 fill-current" /> Quick Event
                    </span>

                    {/* Time Badge */}
                    <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-[10px] font-bold text-amber-300 backdrop-blur-md">
                      <Clock className="h-3 w-3" /> {eventTime}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 line-clamp-1 group-hover:text-brand-600 transition">
                        {event.title}
                      </h3>
                      <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{venueName}</span>
                      </p>

                      {/* Pill Tags */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                          {category}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                          {organizer}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                          {formattedDate}
                        </span>
                        {capacityText && (
                          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700">
                            {capacityText}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Footer Price & Action Button */}
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-lg font-black text-slate-900 sm:text-xl">
                            {event.price === 0 ? "FREE" : `₹${event.price.toLocaleString("en-IN")}`}
                          </span>
                          <p className="text-[10px] font-bold text-emerald-600">
                            Instant Entry RSVP
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick(event);
                          }}
                          className="rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow transition group-hover:bg-brand-600 active:scale-95"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}
      </main>
    </div>
  );
}
