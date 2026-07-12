"use client";

/* ------------------------------------------------------------------ */
/*  VENUE DETAIL PAGE  —  /venues/[id]                                 */
/*                                                                     */
/*  Opened when a user taps "Book Now" (or a card) on Trending Venues. */
/*  Its "Book Now" launches the real booking flow (review -> confirm). */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  MapPin,
  Share2,
  ArrowLeft,
  Building2,
  UserRoundCog,
  Store,
  Heart,
  Star,
  Clock,
  ParkingCircle,
  Droplets,
  Wifi,
  Utensils,
  ShowerHead,
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  MessageSquareText,
  Ruler,
  Lightbulb,
  Layers,
  ShieldCheck,
  Users2,
  Tag,
  GraduationCap,
  FileText,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import BookingFlow from "@/components/booking-flow";
import { getVenueById } from "@/lib/api/venues";
import { ApiError } from "@/lib/api/client";
import { Listing } from "@/lib/api/types";
import { categoryLabel } from "@/lib/taxonomy";

const DEFAULT_HIGHLIGHTS = ["Well-maintained facility", "Floodlit for evening play", "Easy online booking"];
const DEFAULT_INCLUSIONS = ["Venue access", "Drinking water", "Changing room"];
const DEFAULT_EXCLUSIONS = ["Personal gear", "Food & beverages", "Coaching"];

export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [venue, setVenue] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    getVenueById(id)
      .catch((err) => {
        if (!(err instanceof ApiError)) throw err;
        return null;
      })
      .then(setVenue)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center text-sm text-slate-400">Loading venue...</div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <Building2 className="mx-auto h-16 w-16 text-slate-300" />
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">
            Venue not found
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This venue may have been removed or the link is incorrect.
          </p>
          <Link
            href="/venues"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Browse all venues
          </Link>
        </div>
      </div>
    );
  }

  const isEvent = venue.type === "Event";
  const highlights = venue.highlights.length > 0 ? venue.highlights : DEFAULT_HIGHLIGHTS;
  const inclusions = venue.inclusions.length > 0 ? venue.inclusions : DEFAULT_INCLUSIONS;
  const exclusions = venue.exclusions.length > 0 ? venue.exclusions : DEFAULT_EXCLUSIONS;
  const categoryText = venue.categories.map(categoryLabel).join(", ") || "General";

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="hidden sm:block">
        <SiteHeader />
      </div>

      <div className="sm:hidden">
        <MobileVenueDetail
          venue={venue}
          highlights={highlights}
          inclusions={inclusions}
          categoryText={categoryText}
          onBook={() => setBooking(true)}
        />
      </div>

      <main className="mx-auto hidden max-w-7xl px-4 py-6 sm:block sm:px-6 sm:py-8">
        <div className="mb-4 flex items-center justify-between">
          <Link
            href="/venues"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" /> Back to venues
          </Link>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href).catch(() => {});
            }}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:border-brand-300 hover:text-brand-600"
          >
            <Share2 className="h-3.5 w-3.5" /> Share Venue
          </button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
          {/* LEFT — details */}
          <div>
            {/* Hero image */}
            <div className="relative h-64 w-full overflow-hidden rounded-3xl border border-brand-200 bg-slate-900 sm:h-80">
              {venue.coverImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={venue.coverImage} alt={venue.title} className="h-full w-full object-cover" />
              )}
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  {categoryText}
                </span>
              </div>
            </div>

            {/* Summary */}
            <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-extrabold text-slate-900">Summary</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{venue.description}</p>
            </section>

            {isEvent && (
              <>
                {/* Highlights */}
                <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                  <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                    <CheckCircle2 className="h-5 w-5 text-brand-500" /> Highlights
                  </h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {highlights.map((h) => (
                      <div key={h} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-500" />
                        {h}
                      </div>
                    ))}
                  </div>
                </section>

                {/* Inclusions / exclusions */}
                <section className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" /> What&apos;s Included
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {inclusions.map((i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                          {i}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                    <h3 className="flex items-center gap-2 text-base font-extrabold text-slate-900">
                      <XCircle className="h-5 w-5 text-accent-500" /> What&apos;s Not Included
                    </h3>
                    <ul className="mt-3 space-y-2">
                      {exclusions.map((e) => (
                        <li key={e} className="flex items-center gap-2 text-sm text-slate-700">
                          <XCircle className="h-4 w-4 shrink-0 text-accent-400" />
                          {e}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              </>
            )}

            {/* Location / Live Map Section */}
            {venue.address && (
              <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                  <MapPin className="h-5 w-5 text-brand-500" /> Location &amp; Directions
                </h2>
                <p className="mt-2 text-sm text-slate-600 font-medium">{venue.address}</p>
                
                <div className="mt-4 w-full h-72 rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative bg-slate-50">
                  <iframe
                    title="Venue Location Map"
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(venue.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                    className="absolute inset-0 w-full h-full border-0"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </section>
            )}
          </div>

          {/* RIGHT — sticky booking card */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
              <h1 className="text-xl font-extrabold text-slate-900">{venue.title}</h1>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
                {categoryText} · {venue.city}
              </p>

              <p className="mt-4 text-2xl font-black text-slate-900">
                ₹{venue.price.toLocaleString("en-IN")}
              </p>

              <div className="mt-4 space-y-2 border-y border-slate-100 py-4 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-brand-500" />
                  {venue.city} · {venue.address}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setBooking(true)}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-md shadow-brand-500/30 transition hover:scale-[1.01]"
              >
                Book Now
              </button>
            </div>

            {venue.vendorId && (
              <Link
                href={`/venues/vendor/${venue.vendorId}`}
                className="mt-4 flex items-center gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                  <Store className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-slate-900">View vendor profile</span>
                  <span className="block text-xs text-slate-500">See all turfs &amp; games from this vendor</span>
                </span>
              </Link>
            )}

            <Link
              href="/coaches"
              className="mt-4 flex items-center gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
                <UserRoundCog className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-bold text-slate-900">Want a coach here?</span>
                <span className="block text-xs text-slate-500">Browse coaches and book a session</span>
              </span>
            </Link>
          </div>
        </div>
      </main>

      {booking && <BookingFlow listing={venue} onClose={() => setBooking(false)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  MOBILE — app-shell style venue detail view                         */
/* ------------------------------------------------------------------ */

interface WeatherDay {
  label: string;
  tempMax: number;
  code: number;
}

interface WeatherState {
  loading: boolean;
  error: boolean;
  current?: { temp: number; code: number };
  days: WeatherDay[];
}

const SPEC_ICONS = [Ruler, Lightbulb, Layers, CheckCircle2];

const AMENITY_ICON_RULES: { keywords: string[]; icon: typeof ParkingCircle; label: string }[] = [
  { keywords: ["park"], icon: ParkingCircle, label: "Parking" },
  { keywords: ["restroom", "washroom", "toilet"], icon: ShowerHead, label: "Restrooms" },
  { keywords: ["water"], icon: Droplets, label: "Drinking Water" },
  { keywords: ["shower"], icon: ShowerHead, label: "Showers" },
  { keywords: ["wifi"], icon: Wifi, label: "WiFi" },
  { keywords: ["food", "cafe", "canteen", "snack"], icon: Utensils, label: "Food & Snacks" },
];

function weatherIcon(code: number, className = "h-7 w-7") {
  if (code === 0) return <Sun className={className} />;
  if (code <= 3) return <Cloud className={className} />;
  if (code === 45 || code === 48) return <CloudFog className={className} />;
  if (code >= 95) return <CloudLightning className={className} />;
  if (code >= 71 && code <= 86 && ![80, 81, 82].includes(code)) return <CloudSnow className={className} />;
  return <CloudRain className={className} />;
}

function weatherLabel(code: number) {
  if (code === 0) return "Sunny, Clear";
  if (code <= 3) return "Cloudy";
  if (code === 45 || code === 48) return "Foggy";
  if (code >= 95) return "Thunderstorm";
  if (code >= 71 && code <= 86 && ![80, 81, 82].includes(code)) return "Snowy";
  return "Rainy";
}

function useCityWeather(city: string) {
  const [weather, setWeather] = useState<WeatherState>(() =>
    city ? { loading: true, error: false, days: [] } : { loading: false, error: true, days: [] }
  );

  useEffect(() => {
    if (!city) return;
    let cancelled = false;
    (async () => {
      try {
        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
        );
        const geo = await geoRes.json();
        const place = geo?.results?.[0];
        if (!place) throw new Error("no geocoding match");

        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max&timezone=auto&forecast_days=4`
        );
        const data = await weatherRes.json();
        if (cancelled) return;
        setWeather({
          loading: false,
          error: false,
          current: { temp: Math.round(data.current.temperature_2m), code: data.current.weather_code },
          days: (data.daily.time as string[]).slice(1, 4).map((iso, i) => ({
            label: new Date(iso).toLocaleDateString("en-US", { weekday: "short" }),
            tempMax: Math.round(data.daily.temperature_2m_max[i + 1]),
            code: data.daily.weather_code[i + 1],
          })),
        });
      } catch {
        if (!cancelled) setWeather({ loading: false, error: true, days: [] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [city]);

  return weather;
}

function MobileVenueDetail({
  venue,
  highlights,
  inclusions,
  categoryText,
  onBook,
}: {
  venue: Listing;
  highlights: string[];
  inclusions: string[];
  categoryText: string;
  onBook: () => void;
}) {
  const [favorite, setFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "booking" | "academy" | "book">("home");
  const weather = useCityWeather(venue.city);

  const amenities = inclusions.map((item) => {
    const match = AMENITY_ICON_RULES.find((rule) => rule.keywords.some((k) => item.toLowerCase().includes(k)));
    return { label: item, Icon: match?.icon ?? Layers };
  });

  const mapsQuery = encodeURIComponent(venue.address || venue.city);

  const TABS: { id: "home" | "booking" | "academy" | "book"; label: string }[] = [
    { id: "home", label: "Home" },
    { id: "booking", label: "Booking" },
    { id: "academy", label: "Academy" },
    { id: "book", label: "Book Now" },
  ];

  return (
    <div className="pb-24">
      {/* Hero image with floating header */}
      <div className="relative h-72 w-full bg-slate-900">
        {venue.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={venue.coverImage} alt={venue.title} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <Link
            href="/venues"
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFavorite((v) => !v)}
              aria-label="Toggle favorite"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
            >
              <Heart className={`h-4 w-4 ${favorite ? "fill-accent-500 text-accent-500" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(window.location.href).catch(() => {})}
              aria-label="Share venue"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="absolute bottom-3 left-4 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          {categoryText}
        </div>
      </div>

      <div className="rounded-t-3xl -mt-5 relative bg-slate-50 px-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-xl font-extrabold text-slate-900">{venue.title}</h1>
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 4.8
          </span>
        </div>
        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" /> {venue.city}
          {venue.address ? ` · ${venue.address}` : ""}
        </p>

        {/* Price + Book Now — the only price/booking CTA on this page (no separate sticky bar) */}
        <div id="price-block" className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-black text-slate-900">₹{venue.price.toLocaleString("en-IN")}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Starting price</p>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-600"
          >
            Rates
          </button>
          <button
            type="button"
            onClick={onBook}
            className="rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-xs font-bold uppercase tracking-wide text-white shadow-md shadow-brand-500/30"
          >
            Book Now
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 grid grid-cols-4 gap-1 rounded-2xl bg-slate-100 p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl py-2 text-[10px] font-bold uppercase tracking-wide transition ${
                activeTab === tab.id ? "bg-white text-brand-600 shadow-sm" : "text-slate-500"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "home" && (
          <>

        {venue.address && (
          <div className="mt-4 space-y-2">
            <p className="flex items-start gap-2 text-sm font-medium text-slate-700">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" /> {venue.address}
            </p>
            <div className="relative h-40 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <iframe
                title="Venue Location Map"
                src={`https://maps.google.com/maps?q=${mapsQuery}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                className="absolute inset-0 h-full w-full border-0"
                loading="lazy"
              />
              <span className="absolute right-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[10px] font-bold uppercase text-white">
                Satellite View
              </span>
            </div>
          </div>
        )}

        {(venue.reportingStartTime || venue.reportingEndTime) && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
            <Clock className="h-4 w-4 text-brand-500" />
            <span className="text-xs font-bold text-slate-700">
              Open Today · {venue.reportingStartTime ?? "—"} - {venue.reportingEndTime ?? "—"}
            </span>
            <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold uppercase text-emerald-600">
              Open
            </span>
          </div>
        )}

        {/* Technical / venue highlights */}
        <section className="mt-5">
          <h2 className="text-sm font-extrabold text-slate-900">Technical Specifications</h2>
          <div className="mt-3 grid grid-cols-1 gap-2.5">
            {highlights.map((h, i) => {
              const Icon = SPEC_ICONS[i % SPEC_ICONS.length];
              return (
                <div key={h} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="text-xs font-semibold text-slate-700">{h}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Local weather */}
        <section className="mt-5">
          <h2 className="text-sm font-extrabold text-slate-900">Local Weather</h2>
          {weather.loading ? (
            <div className="mt-3 h-24 animate-pulse rounded-2xl bg-slate-100" />
          ) : weather.error || !weather.current ? null : (
            <div className="mt-3 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-4 text-white shadow-lg shadow-brand-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black">{weather.current.temp}°</p>
                  <p className="text-xs font-semibold text-white/80">{weatherLabel(weather.current.code)}</p>
                </div>
                {weatherIcon(weather.current.code, "h-10 w-10")}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/20 pt-3">
                {weather.days.map((d) => (
                  <div key={d.label} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-bold uppercase text-white/80">{d.label}</span>
                    {weatherIcon(d.code, "h-4 w-4")}
                    <span className="text-xs font-bold">{d.tempMax}°</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Sports available */}
        {venue.categories.length > 0 && (
          <section className="mt-5">
            <h2 className="text-sm font-extrabold text-slate-900">Sports Available</h2>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              {venue.categories.map((catId) => (
                <div key={catId} className="flex items-center gap-2.5 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Layers className="h-4 w-4" />
                  </span>
                  <span className="truncate text-xs font-bold text-slate-700">{categoryLabel(catId)}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Amenities */}
        {amenities.length > 0 && (
          <section className="mt-5">
            <h2 className="text-sm font-extrabold text-slate-900">Amenities</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {amenities.map(({ label, Icon }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600"
                >
                  <Icon className="h-3.5 w-3.5 text-brand-500" /> {label}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Description */}
        <section className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-extrabold text-slate-900">Summary</h2>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{venue.description}</p>
        </section>

        {/* Top players */}
        <section className="mt-5">
          <h2 className="text-sm font-extrabold text-slate-900">Top Players</h2>
          <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center">
            <Users2 className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2 text-xs font-semibold text-slate-500">No frequent players tracked here yet.</p>
          </div>
        </section>

        {/* Player reviews */}
        <section className="mt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900">Player Reviews</h2>
            <span className="text-xs font-semibold text-brand-600">View All</span>
          </div>
          <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center">
            <MessageSquareText className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2 text-xs font-semibold text-slate-500">No reviews yet — be the first to play &amp; review!</p>
          </div>
        </section>
          </>
        )}

        {activeTab === "booking" && (
          <section className="mt-5">
            <h2 className="text-sm font-extrabold text-slate-900">Sports</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(venue.categories.length > 0 ? venue.categories : ["general"]).map((catId) => (
                <span
                  key={catId}
                  className="rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-700"
                >
                  {categoryLabel(catId)}
                </span>
              ))}
            </div>

            <h2 className="mt-5 text-sm font-extrabold text-slate-900">Date &amp; Available Slots</h2>
            <p className="mt-1 text-xs text-slate-500">
              Pick a date, then choose a slot — duration adjusts in 30-minute steps.
            </p>
            <button
              type="button"
              onClick={onBook}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-md shadow-brand-500/30"
            >
              <Clock className="h-4 w-4" /> Check Available Slots
            </button>
          </section>
        )}

        {activeTab === "academy" && (
          <section className="mt-5">
            <h2 className="text-sm font-extrabold text-slate-900">Academy</h2>
            <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-center">
              <GraduationCap className="mx-auto h-6 w-6 text-slate-300" />
              <p className="mt-2 text-xs font-semibold text-slate-500">
                No academy programs listed at this venue yet.
              </p>
              <Link
                href="/coaches"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600"
              >
                Browse coaches instead
              </Link>
            </div>
          </section>
        )}

        {activeTab === "book" && (
          <section className="mt-5 flex flex-col gap-3">
            <div className="flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-800">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                <span className="font-bold">Insurance Mandatory</span> — every booking includes player insurance
                coverage by default.
              </span>
            </div>
            <div className="flex items-start gap-2 rounded-2xl border border-slate-100 bg-white p-3 text-xs text-slate-600 shadow-sm">
              <FileText className="h-4 w-4 shrink-0 text-brand-500" />
              <span>Terms &amp; Conditions apply and must be accepted before payment.</span>
            </div>
            <div className="flex items-start gap-2 rounded-2xl border border-slate-100 bg-white p-3 text-xs text-slate-600 shadow-sm">
              <Tag className="h-4 w-4 shrink-0 text-brand-500" />
              <span>Split the payment with friends at checkout if you&apos;re playing as a group.</span>
            </div>
            <div className="flex items-start gap-2 rounded-2xl border border-slate-100 bg-white p-3 text-xs text-slate-600 shadow-sm">
              <Share2 className="h-4 w-4 shrink-0 text-brand-500" />
              <span>After payment, share your booking on WhatsApp or Instagram Story straight away.</span>
            </div>
            <button
              type="button"
              onClick={onBook}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-md shadow-brand-500/30"
            >
              Proceed to Book — ₹{venue.price.toLocaleString("en-IN")}
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
