"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Zap } from "lucide-react";
import { browseVenues } from "@/lib/api/venues";
import { getVendorListings } from "@/lib/api/vendor";
import { Listing } from "@/lib/api/types";
import { isEventExpired } from "@/lib/eventUtils";

interface Props {
  className?: string;
  onViewAll?: () => void;
}

export function QuickEventsSection({ className = "", onViewAll }: Props) {
  const router = useRouter();
  const [quickEventsCount, setQuickEventsCount] = useState<number>(0);

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
        // Filter strictly for Quick Add Events
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
        setQuickEventsCount(filtered.length);
      })
      .catch(() => setQuickEventsCount(0));
  }, []);

  return (
    <section className={`w-full py-4 ${className}`}>
      {/* Section Header */}
      <div className="mb-3 flex items-center justify-between px-4 sm:px-0">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900">Quick Events</h2>
      </div>

      {/* Featured Promo Card for Quick Events -> Navigates to /quick-events */}
      <Link
        href="/quick-events"
        onClick={(e) => {
          if (onViewAll) {
            e.preventDefault();
            onViewAll();
          }
        }}
      >
        <div className="group relative overflow-hidden rounded-3xl border border-amber-100 bg-white shadow-[0_10px_30px_rgba(245,158,11,0.12)] transition-all duration-300 hover:shadow-[0_15px_35px_rgba(245,158,11,0.2)] hover:-translate-y-1 cursor-pointer">
          {/* Header Banner Image */}
          <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1000&q=80"
              alt="Quick Events"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-black/20" />

            {/* Top Badges */}
            <div className="absolute top-3.5 inset-x-3.5 flex items-center justify-between gap-2">
              <span className="rounded-full bg-slate-900/90 backdrop-blur-md px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white shadow-xs">
                QUICK EVENTS &amp; RSVPS
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-slate-950 shadow-md">
                <Zap className="h-3.5 w-3.5 fill-slate-950 text-slate-950 shrink-0" />
                <span>INSTANT RSVP</span>
              </span>
            </div>

            {/* Bottom Avatar Stack & Live Count */}
            <div className="absolute bottom-3.5 left-3.5 right-3.5 flex items-center justify-between">
              <div className="flex -space-x-2">
                {[
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
                  "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&q=80",
                ].map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt="Host preview"
                    className="h-9 w-9 rounded-full border-2 border-white object-cover shadow-sm"
                  />
                ))}
              </div>
              <span className="rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-xs font-extrabold text-amber-300 border border-white/10">
                {quickEventsCount > 0 ? `${quickEventsCount} Live Quick Events` : "0 Live Quick Events"}
              </span>
            </div>
          </div>

          {/* Body Content */}
          <div className="relative p-5 sm:p-6">
            <h3 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-brand-600 transition-colors">
              Fast-Track Quick Events &amp; Pop-Up RSVPs
            </h3>
            <p className="mt-1.5 text-xs sm:text-sm font-medium text-slate-500 leading-relaxed">
              Explore all live pop-up parties, sports tournaments, corporate summits &amp; performance shows hosted with instant QR entry.
            </p>

            {/* Category Tags */}
            <div className="mt-3.5 flex flex-wrap gap-2">
              {["🍾 Alcoholic Party", "🥤 Non-Alcoholic Party", "💼 Business", "🏆 Sports", "🎭 Performance"].map((c) => (
                <span
                  key={c}
                  className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700"
                >
                  {c}
                </span>
              ))}
            </div>

            {/* Full-width Slate Button */}
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#0f172a] px-5 py-3.5 text-white shadow-sm transition group-hover:bg-brand-600">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wide">
                EXPLORE QUICK EVENTS
              </span>
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
