"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MapPin, Volleyball, Waves, CircleDot, Footprints, Gamepad2, type LucideIcon } from "lucide-react";
import { SiteHeader } from "../../components/site-header";
import { MobileCard, MobileTopBar } from "@/components/mobile/ui";
import { SPORT_CATEGORIES, categoryLabel } from "@/lib/taxonomy";
import { browseVenues, getVendorProfile, type VendorPublicProfile } from "@/lib/api/venues";
import { Listing } from "@/lib/api/types";

/** One card on the browsing grid — either a single venue, or a business with
 * several venues (tap it to see all of them, à la a vendor's own storefront).
 * Mirrors /venues page's grouping so the same vendor never shows as unrelated
 * separate cards just because this page fetches its own short venue list. */
interface VenueCard {
  id: string;
  href: string;
  title: string;
  subtitle?: string;
  image?: string;
  city?: string;
  price: number;
  badge?: string;
}

import { useRouter } from "next/navigation";
import { SportsCategoryBar, SportCategoryItem } from "@/components/sports/SportsCategoryBar";

const NOTES: Record<string, string> = {
  cricket: "Fast bookings, turf-friendly",
  football: "Turf matches and friendly kickoffs",
  badminton: "Indoor courts, live availability",
  pickleball: "Trending now with limited slots",
  tennis: "Singles, doubles, and coaching",
  "table-tennis": "Quick rallies, fun evenings",
};

const EMOJI_MAP: Record<string, string> = {
  cricket: "🏏",
  football: "⚽",
  badminton: "🏸",
  pickleball: "🏓",
  tennis: "🎾",
  "table-tennis": "🏓",
  basketball: "🏀",
  volleyball: "🏐",
  swimming: "🏊",
  "snooker-pool": "🎱",
  skating: "🛼",
  "indoor-games": "🎮",
};

const CATEGORIES: SportCategoryItem[] = SPORT_CATEGORIES.map((cat) => ({
  id: cat.id,
  label: cat.label,
  emoji: EMOJI_MAP[cat.id],
  image: cat.image,
  note: NOTES[cat.id] ?? "Live availability, easy booking",
}));

const SPORTS = CATEGORIES;

export default function GamesPage() {
  const router = useRouter();
  const [venues, setVenues] = useState<Listing[]>([]);
  const [vendorProfiles, setVendorProfiles] = useState<Record<string, VendorPublicProfile>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    browseVenues({ type: "Turf", limit: 8 })
      .then(async (res) => {
        setVenues(res.items);
        // One business can list several turfs — fetch each distinct vendor's public
        // profile (business name + poster) so they can be grouped into one card,
        // same as the /venues page.
        const vendorIds = Array.from(
          new Set(res.items.map((v) => v.vendorId).filter((id): id is string => Boolean(id)))
        );
        const profiles = await Promise.all(
          vendorIds.map((id) => getVendorProfile(id).then((r) => r.vendor).catch(() => null))
        );
        const map: Record<string, VendorPublicProfile> = {};
        profiles.forEach((p) => {
          if (p) map[p._id] = p;
        });
        setVendorProfiles(map);
      })
      .finally(() => setLoading(false));
  }, []);

  /** Group listings by vendor — a single-listing vendor keeps its own card, a
   * multi-listing vendor collapses into one "N Venues" card that opens its
   * business profile. Mirrors /venues page's grouping exactly. */
  const cards = useMemo<VenueCard[]>(() => {
    const byVendor = new Map<string, Listing[]>();
    const standalone: Listing[] = [];
    for (const v of venues) {
      if (v.vendorId) {
        const arr = byVendor.get(v.vendorId) ?? [];
        arr.push(v);
        byVendor.set(v.vendorId, arr);
      } else {
        standalone.push(v);
      }
    }

    const result: VenueCard[] = [];
    for (const [vendorId, listings] of byVendor) {
      if (listings.length === 1) {
        const l = listings[0];
        result.push({
          id: l._id,
          href: `/venues/${l.slug || l._id}`,
          title: l.title,
          subtitle: vendorProfiles[vendorId]?.businessName,
          image: l.coverImage,
          city: l.city,
          price: l.price,
        });
        continue;
      }
      const profile = vendorProfiles[vendorId];
      result.push({
        id: vendorId,
        href: `/venues/vendor/${vendorId}`,
        title: profile?.businessName ?? listings[0].title,
        image: profile?.poster || profile?.banner || listings[0].coverImage,
        city: profile?.city ?? listings[0].city,
        price: Math.min(...listings.map((l) => l.price)),
        badge: `${listings.length} venues`,
      });
    }
    for (const l of standalone) {
      result.push({
        id: l._id,
        href: `/venues/${l.slug || l._id}`,
        title: l.title,
        image: l.coverImage,
        city: l.city,
        price: l.price,
      });
    }
    return result;
  }, [venues, vendorProfiles]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff,_#f8fafc_40%,_#ffffff_75%)]">
      <div className="hidden sm:block">
        <SiteHeader />
      </div>

      <div className="sm:hidden">
        <div className="px-4 pt-4">
          <MobileTopBar />
        </div>
        <main className="flex flex-col gap-6 px-4 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Choose Your Game</p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
              Pick a sport, then jump to the right venue.
            </h1>
          </div>

          <SportsCategoryBar
            categories={CATEGORIES}
            variant="card"
            onSelectCategory={(sportId) => {
              router.push(`/venues?category=${sportId}`);
            }}
          />



          <div>
            <p className="mb-2 text-sm font-bold uppercase tracking-[0.15em] text-brand-600">Venues</p>
            <div className="flex flex-col gap-3">
              {cards.map((card) => (
                <MobileCard key={card.id} className="!p-4">
                  {/* Banner opens the venue/vendor too — not just the "View details" button */}
                  <Link href={card.href} className="relative flex h-36 flex-col justify-end overflow-hidden rounded-2xl bg-slate-900 p-4 text-white">
                    {card.image && (
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 400px"
                        className="object-cover opacity-80"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    {card.badge && (
                      <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-black/50 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wide text-white backdrop-blur">
                        {card.badge}
                      </span>
                    )}
                    <div className="relative z-10">
                      <h2 className="text-lg font-extrabold text-white">{card.title}</h2>
                      {card.subtitle && <p className="text-xs font-semibold text-white/70">{card.subtitle}</p>}
                    </div>
                  </Link>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="h-3 w-3" /> {card.city}
                      </p>
                      <p className="mt-1 text-sm font-bold text-slate-900">₹{card.price.toLocaleString("en-IN")}/hr</p>
                    </div>
                    <Link
                      href={card.href}
                      className="rounded-full bg-slate-950 px-4 py-2 text-xs font-semibold text-white"
                    >
                      View details
                    </Link>
                  </div>
                </MobileCard>
              ))}
              {!loading && cards.length === 0 && (
                <p className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">
                  No venues available yet.
                </p>
              )}
            </div>
          </div>

        </main>
      </div>

      <main className="mx-auto hidden max-w-7xl px-4 py-10 sm:block sm:px-6 sm:py-14">
        <section className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white/80 p-6 shadow-[0_20px_80px_rgba(148,163,184,0.18)] backdrop-blur sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-600">Choose Your Game</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Pick a sport, then jump straight to the right venue.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                We keep the decision simple. Browse the sport you want, see what is popular right
                now, and move into booking without hunting across the app.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
                  {SPORTS.length} sports ready
                </span>
                <span className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                  Live availability
                </span>
                <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  Fast rebooking
                </span>
              </div>
            </div>

            <div className="rounded-[2rem] bg-gradient-to-br from-sky-50 via-white to-brand-50 p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-4">
                {SPORTS.slice(0, 4).map((sport) => (
                  <div
                    key={sport.id}
                    className="rounded-3xl border border-white/70 bg-white p-4 shadow-sm"
                  >
                    <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
                      {sport.image ? (
                        <Image src={sport.image} alt={sport.label} fill className="object-contain p-2" />
                      ) : sport.icon ? (
                        <sport.icon className="h-12 w-12 text-brand-500" />
                      ) : null}
                    </div>
                    <p className="mt-2 text-center text-sm font-bold text-slate-900">{sport.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">Browse by sport</p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Tap a sport and start from there</h2>
            </div>
            <p className="hidden text-sm text-slate-500 sm:block">Built for quick discovery on mobile and desktop.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {SPORTS.map((sport, index) => (
              <Link
                key={sport.id}
                href={`/venues?category=${sport.id}`}
                className={`group overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${index === 0 ? "sm:col-span-2 xl:col-span-2" : ""
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-slate-50 to-slate-100">
                    {sport.image ? (
                      <Image src={sport.image} alt={sport.label} fill className="object-contain p-2 transition group-hover:scale-105" />
                    ) : sport.icon ? (
                      <sport.icon className="h-9 w-9 text-brand-500" />
                    ) : null}
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-950">{sport.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{sport.note}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>


        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">Venues</p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Book a court, turf, or table near you</h2>
            </div>
            <Link href="/venues" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
              View All Venues
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <Link
                key={card.id}
                href={card.href}
                className="overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative flex h-40 flex-col justify-end overflow-hidden rounded-[1.25rem] bg-slate-900 p-4 text-white">
                  {card.image && (
                    <Image
                      src={card.image}
                      alt={card.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover opacity-80"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  {card.badge && (
                    <span className="absolute right-2.5 top-2.5 z-10 rounded-full bg-black/50 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-wide text-white backdrop-blur">
                      {card.badge}
                    </span>
                  )}
                  <div className="relative z-10">
                    <h3 className="text-lg font-black text-white">{card.title}</h3>
                    {card.subtitle && <p className="text-xs font-semibold text-white/70">{card.subtitle}</p>}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="flex items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5" /> {card.city}
                  </p>
                  <p className="text-sm font-bold text-slate-950">₹{card.price.toLocaleString("en-IN")}/hr</p>
                </div>
              </Link>
            ))}
            {!loading && cards.length === 0 && (
              <p className="col-span-full rounded-[1.75rem] border border-slate-100 bg-white p-10 text-center text-sm text-slate-500">
                No venues available yet.
              </p>
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
