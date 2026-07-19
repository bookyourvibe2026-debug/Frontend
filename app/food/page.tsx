"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { UtensilsCrossed, MapPin, Star, BadgePercent, Store } from "lucide-react";
import { SiteHeader } from "../../components/site-header";
import { MobileTopBar } from "@/components/mobile/ui";
import { getFoodOutlets } from "@/lib/api/foodOrders";
import { ApiError } from "@/lib/api/client";
import { FoodOutlet } from "@/lib/api/types";

/** True when the outlet is open right now per weekly hours + holiday calendar. */
export function isOutletOpenNow(outlet: FoodOutlet): boolean {
  const now = new Date();
  const todayKey = now.toDateString();
  const onLeave = (outlet.leaves ?? []).some(
    (l) => new Date(l.date).toDateString() === todayKey && l.type === "full"
  );
  if (onLeave) return false;
  const day = (outlet.weeklyAvailability ?? []).find((d) => d.day === now.getDay());
  if (!day) return true;
  if (!day.isOpen) return false;
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return hhmm >= day.startTime && hhmm <= day.endTime;
}

export default function FoodPage() {
  const [outlets, setOutlets] = useState<FoodOutlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cuisine, setCuisine] = useState<string | null>(null);

  useEffect(() => {
    getFoodOutlets({ limit: 50 })
      .then((res) => setOutlets(res.items))
      .catch((err) => setError(err instanceof ApiError ? err.describe() : "Failed to load restaurants"))
      .finally(() => setLoading(false));
  }, []);

  const allCuisines = useMemo(() => {
    const set = new Set<string>();
    outlets.forEach((o) => o.cuisines.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [outlets]);

  const visible = cuisine
    ? outlets.filter((o) => o.cuisines.some((c) => c.toLowerCase() === cuisine.toLowerCase()))
    : outlets;

  const dining = visible.filter((o) => (o.kind ?? "dining") === "dining");
  const venueFood = visible.filter((o) => o.kind === "venue");

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
        <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-4xl">Eat well around your game.</h1>
        <p className="mt-2 max-w-xl text-sm text-slate-500 sm:text-base">
          Grab a discounted bite at a partner cafe, or order from the food counter right at your venue.
        </p>

        {error && <p className="mt-6 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">{error}</p>}

        {/* Cuisine filter chips */}
        {allCuisines.length > 0 && (
          <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setCuisine(null)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                !cuisine ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              All
            </button>
            {allCuisines.map((c) => (
              <button
                key={c}
                onClick={() => setCuisine(cuisine === c ? null : c)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                  cuisine === c ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Section 1 — Dining spots (with player discounts) */}
        <OutletSection
          icon={<BadgePercent className="h-4 w-4" />}
          title="Dining near your venue"
          subtitle="Partner cafes & restaurants — show your BYV booking for a discount."
          outlets={dining}
        />

        {/* Section 2 — Food served at sports venues */}
        <OutletSection
          icon={<Store className="h-4 w-4" />}
          title="Food at sports venues"
          subtitle="Turfs & pickleball courts that serve food — see what's on offer."
          outlets={venueFood}
        />

        {!loading && visible.length === 0 && !error && (
          <p className="mt-10 rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            {cuisine ? `No restaurants serving ${cuisine} yet.` : "No restaurants are live yet. Check back soon."}
          </p>
        )}
      </main>
    </div>
  );
}

function OutletSection({
  icon,
  title,
  subtitle,
  outlets,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  outlets: FoodOutlet[];
}) {
  if (outlets.length === 0) return null;
  return (
    <section className="mt-8">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {outlets.map((outlet) => (
          <OutletCard key={outlet._id} outlet={outlet} />
        ))}
      </div>
    </section>
  );
}

function OutletCard({ outlet }: { outlet: FoodOutlet }) {
  const open = isOutletOpenNow(outlet);
  return (
    <Link
      href={`/food/${outlet.slug || outlet._id}`}
      className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative">
        {outlet.banner || outlet.poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={outlet.banner || outlet.poster}
            alt={outlet.name}
            className="h-40 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-40 w-full items-center justify-center bg-brand-50 text-brand-300">
            <UtensilsCrossed className="h-10 w-10" />
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide ${
            open ? "bg-emerald-500 text-white" : "bg-slate-800/90 text-white"
          }`}
        >
          {open ? "Open now" : "Closed"}
        </span>
        {outlet.kind === "dining" && outlet.offer && (
          <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-extrabold text-amber-950 shadow">
            <BadgePercent className="h-3 w-3" /> {outlet.offer}
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 p-4">
        {outlet.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={outlet.logo} alt={outlet.name} className="h-12 w-12 shrink-0 rounded-xl object-cover" />
        ) : (
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate font-bold text-slate-900">{outlet.name}</h3>
          <p className="truncate text-xs font-semibold text-brand-600">
            {outlet.cuisines.slice(0, 3).join(" · ") || "Multi-cuisine"}
          </p>
          {(outlet.location?.area || outlet.location?.city) && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3" />
              {[outlet.location.area, outlet.location.city].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
        <Star className="ml-auto h-4 w-4 shrink-0 text-amber-400" fill="currentColor" />
      </div>
    </Link>
  );
}
