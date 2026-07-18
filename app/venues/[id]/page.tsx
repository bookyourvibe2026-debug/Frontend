"use client";

/* ------------------------------------------------------------------ */
/*  VENUE DETAIL PAGE  —  /venues/[id]                                 */
/*                                                                     */
/*  Opened when a user taps "Book Now" (or a card) on Trending Venues. */
/*  Its "Book Now" launches the real booking flow (review -> confirm). */
/* ------------------------------------------------------------------ */

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  MapPin,
  CalendarDays,
  ChevronDown,
  ListChecks,
  HelpCircle,
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
  Users2,
  GraduationCap,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import BookingFlow from "@/components/booking-flow";
import { ImageCarousel } from "@/components/ImageCarousel";
import { getVenueById } from "@/lib/api/venues";
import { ApiError } from "@/lib/api/client";
import { Listing } from "@/lib/api/types";
import { categoryLabel } from "@/lib/taxonomy";

const DEFAULT_HIGHLIGHTS = ["Well-maintained facility", "Floodlit for evening play", "Easy online booking"];
const DEFAULT_INCLUSIONS = ["Venue access", "Drinking water", "Changing room"];
const DEFAULT_EXCLUSIONS = ["Personal gear", "Food & beverages", "Coaching"];

/** Itinerary (day-by-day plan) + FAQs added in the event form. Shared by the desktop and
 * mobile event views so whatever an organizer fills in shows to the customer. */
function EventItineraryFaqs({ itinerary, faqs }: Pick<Listing, "itinerary" | "faqs">) {
  if ((itinerary?.length ?? 0) === 0 && (faqs?.length ?? 0) === 0) return null;
  return (
    <>
      {itinerary?.length > 0 && (
        <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900 sm:text-lg">
            <ListChecks className="h-5 w-5 text-brand-500" /> Itinerary
          </h2>
          <ol className="mt-4 space-y-4">
            {itinerary.map((d, i) => (
              <li key={i} className="relative border-l-2 border-brand-100 pl-5">
                <span className="absolute -left-[11px] top-0 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                  {d.day || i + 1}
                </span>
                <p className="text-sm font-bold text-slate-900">{d.title || `Day ${d.day || i + 1}`}</p>
                {d.description && <p className="mt-1 text-sm leading-relaxed text-slate-600">{d.description}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {faqs?.length > 0 && (
        <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-slate-900 sm:text-lg">
            <HelpCircle className="h-5 w-5 text-brand-500" /> FAQs
          </h2>
          <div className="mt-3 divide-y divide-slate-100">
            {faqs.map((f, i) => (
              <details key={i} className="group py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-slate-800">
                  {f.question}
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export default function VenueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [venue, setVenue] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [selectedSportForBooking, setSelectedSportForBooking] = useState<string>("");
  // Desktop sport picker (the mobile shell owns its own copy of this state).
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [sportModalOpen, setSportModalOpen] = useState(false);

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
  const desktopAmenities = inclusions.map((item) => {
    const match = AMENITY_ICON_RULES.find((rule) => rule.keywords.some((k) => item.toLowerCase().includes(k)));
    return { label: item, Icon: match?.icon ?? Layers };
  });
  const categoryText = venue.categories.map(categoryLabel).join(", ") || "General";
  // Cards elsewhere show images[0] (poster). The detail-page hero shows a scrollable
  // gallery built from the banner + any extra photos (images[1..]), falling back to
  // the poster alone when nothing else was uploaded.
  const allImageUrls = venue.images.map((img) => img.url).filter(Boolean);
  const galleryImages = allImageUrls.slice(0, 10);
  console.log("DEBUG VENUE:", venue.title, "images:", venue.images, "allImageUrls:", allImageUrls, "galleryImages:", galleryImages);

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
          galleryImages={galleryImages}
          onOpenBooking={(sport) => {
            setSelectedSportForBooking(sport);
            setBooking(true);
          }}
        />
      </div>

      <main className="mx-auto hidden max-w-7xl px-4 py-6 sm:block sm:px-6 sm:py-8">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
          >
            <ArrowLeft className="h-4 w-4" /> Back to venues
          </button>
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
            {/* Hero gallery */}
            <div className="relative h-64 w-full overflow-hidden rounded-3xl border border-brand-200 bg-slate-900 sm:h-80">
              <ImageCarousel images={galleryImages} alt={venue.title} className="absolute inset-0" />
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

            {venue.videoUrl && (
              <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                  🎥 Event Video
                </h2>
                <div className="mt-4 aspect-video w-full overflow-hidden rounded-2xl bg-black border border-slate-100 shadow-sm">
                  {venue.videoUrl.includes("youtube.com") || venue.videoUrl.includes("youtu.be") ? (
                    <iframe
                      src={getYouTubeEmbedUrl(venue.videoUrl)}
                      className="h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : venue.videoUrl.includes("vimeo.com") ? (
                    <iframe
                      src={getVimeoEmbedUrl(venue.videoUrl)}
                      className="h-full w-full border-0"
                      allowFullScreen
                    />
                  ) : (
                    <video src={venue.videoUrl} controls className="h-full w-full" />
                  )}
                </div>
              </section>
            )}

            {/* Same info the mobile view shows — specs, weather, sports, amenities, players, reviews. */}
            {!isEvent && (
              <VenueInfoSections
                venue={venue}
                highlights={highlights}
                amenities={desktopAmenities}
                onPickSport={(sport) => {
                  setSelectedSport(sport);
                  setSportModalOpen(true);
                }}
              />
            )}

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

                {/* Itinerary + FAQs from the event form */}
                <EventItineraryFaqs itinerary={venue.itinerary} faqs={venue.faqs} />
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
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-xl font-extrabold text-slate-900">{venue.title}</h1>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 4.8
                </span>
              </div>
              <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-600">
                {categoryText} · {venue.city}
              </p>

              <p className="mt-4 text-2xl font-black text-slate-900">
                ₹{venue.price.toLocaleString("en-IN")}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Starting price</p>

              <div className="mt-4 space-y-2 border-y border-slate-100 py-4 text-sm text-slate-600">
                {isEvent && venue.availableFrom && (
                  <p className="flex items-center gap-2 font-semibold text-slate-800">
                    <CalendarDays className="h-4 w-4 text-brand-500" />
                    {new Date(venue.availableFrom).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    {(venue.reportingStartTime || venue.reportingEndTime) && (
                      <span className="text-slate-500">
                        · {venue.reportingStartTime ?? "—"}{venue.reportingEndTime ? `–${venue.reportingEndTime}` : ""}
                      </span>
                    )}
                  </p>
                )}
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

      {/* Desktop sport picker — mobile renders its own inside MobileVenueDetail. */}
      {sportModalOpen && (
        <SportPickerSheet
          venue={venue}
          selectedSport={selectedSport}
          onSelect={setSelectedSport}
          onClose={() => setSportModalOpen(false)}
          onContinue={() => {
            setSportModalOpen(false);
            setSelectedSportForBooking(selectedSport);
            setBooking(true);
          }}
        />
      )}

      {booking && <BookingFlow listing={venue} onClose={() => setBooking(false)} selectedSport={selectedSportForBooking} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SHARED venue sections — rendered on BOTH mobile and desktop         */
/* ------------------------------------------------------------------ */

/** Emoji + court-count copy per sport. Single source for the grid and the picker sheet. */
function sportMeta(sportName: string): { emoji: string; courts: string } {
  const l = sportName.toLowerCase();
  if (l.includes("badminton")) return { emoji: "🏸", courts: "4 Courts" };
  if (l.includes("cricket")) return { emoji: "🏏", courts: "2 Nets" };
  if (l.includes("turf") || l.includes("football")) return { emoji: "⚽", courts: "1 Turf" };
  if (l.includes("pickleball")) return { emoji: "🏓", courts: "2 Courts" };
  if (l.includes("tennis")) return { emoji: "🎾", courts: "3 Courts" };
  return { emoji: "🎯", courts: "1 Court" };
}

/** Categories to show, falling back to a sensible default set. */
function venueSports(venue: Listing): string[] {
  return venue.categories?.length > 0 ? venue.categories : ["badminton", "cricket", "football", "pickleball"];
}

/** Self-contained so both layouts can drop it in without duplicating the fetch. */
function LocalWeatherCard({ city }: { city: string }) {
  const weather = useCityWeather(city);
  if (weather.loading) return <div className="mt-3 h-24 animate-pulse rounded-2xl bg-slate-100" />;
  if (weather.error || !weather.current) return null;
  return (
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
  );
}

/**
 * Every info section of a venue (hours, specs, weather, sports, amenities,
 * players, reviews). Rendered by both the mobile shell and the desktop page so
 * the two views can't drift apart again.
 */
function VenueInfoSections({
  venue,
  highlights,
  amenities,
  onPickSport,
}: {
  venue: Listing;
  highlights: string[];
  amenities: { label: string; Icon: typeof Layers }[];
  onPickSport: (sportName: string) => void;
}) {
  return (
    <>
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
      <section className="mt-6">
        <h2 className="text-base font-black tracking-tight text-slate-900">Technical Specifications</h2>
        <p className="mt-0.5 text-xs font-medium text-slate-400">What makes this venue play-ready.</p>
        <div className="mt-3.5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {highlights.map((h, i) => {
            const Icon = SPEC_ICONS[i % SPEC_ICONS.length];
            const accent = SPEC_ACCENTS[i % SPEC_ACCENTS.length];
            return (
              <div
                key={h}
                className={`flex items-center gap-3.5 rounded-2xl border ${accent.ring} bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accent.badge} text-white shadow-lg`}
                >
                  <Icon className="h-5 w-5 stroke-[2.25]" />
                </span>
                <p className="text-sm font-bold leading-snug text-slate-800">{h}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Local weather */}
      <section className="mt-5">
        <h2 className="text-sm font-extrabold text-slate-900">Local Weather</h2>
        <LocalWeatherCard city={venue.city} />
      </section>

      {/* Sports available */}
      <section className="mt-5">
        <h2 className="text-sm font-extrabold text-slate-900">Sports Available</h2>
        <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {venueSports(venue).map((catId) => {
            const sportName = categoryLabel(catId);
            const { emoji, courts } = sportMeta(sportName);
            return (
              <button
                key={catId}
                onClick={() => onPickSport(sportName)}
                className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-brand-200"
              >
                <span className="text-3xl">{emoji}</span>
                <div className="mt-1 text-center">
                  <span className="block text-sm font-bold text-slate-800">{sportName}</span>
                  <span className="block text-[10px] font-semibold text-slate-400">{courts}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

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
  );
}

/** Bottom sheet for choosing which sport to book. Shared by both layouts. */
function SportPickerSheet({
  venue,
  selectedSport,
  onSelect,
  onClose,
  onContinue,
}: {
  venue: Listing;
  selectedSport: string;
  onSelect: (sport: string) => void;
  onClose: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="relative w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl animate-in slide-in-from-bottom-full duration-300">
        <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h3 className="text-sm font-bold text-slate-900">{venue.title}</h3>
        </div>

        <h2 className="mb-5 text-xl font-extrabold text-slate-900">Which sport do you want to play?</h2>

        <div className="space-y-3">
          {venueSports(venue).map((catId) => {
            const sportName = categoryLabel(catId);
            const { emoji, courts } = sportMeta(sportName);
            const isSelected = selectedSport === sportName;
            return (
              <button
                key={catId}
                onClick={() => onSelect(sportName)}
                className={`flex w-full items-center justify-between rounded-2xl border p-4 transition ${
                  isSelected ? "border-[#0b9c65] bg-[#0b9c65]/5" : "border-slate-100 bg-white"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-2xl shadow-sm">
                    {emoji}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-slate-900">{sportName}</p>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-500">{courts} Available</p>
                  </div>
                </div>
                <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${isSelected ? "border-[#0b9c65]" : "border-slate-300"}`}>
                  {isSelected && <div className="h-3 w-3 rounded-full bg-[#0b9c65]" />}
                </div>
              </button>
            );
          })}
        </div>

        <button
          disabled={!selectedSport}
          onClick={onContinue}
          className="mt-6 w-full rounded-2xl bg-[#0b9c65] py-4 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-[#0b9c65]/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          CONTINUE
        </button>
      </div>
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

/** Rotating accent palette so each spec chip gets its own attractive colour. */
const SPEC_ACCENTS = [
  { badge: "from-brand-500 to-brand-600 shadow-brand-500/30", ring: "border-brand-100" },
  { badge: "from-amber-400 to-orange-500 shadow-orange-500/30", ring: "border-orange-100" },
  { badge: "from-emerald-400 to-teal-500 shadow-emerald-500/30", ring: "border-emerald-100" },
  { badge: "from-violet-500 to-indigo-500 shadow-indigo-500/30", ring: "border-indigo-100" },
];

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
  galleryImages,
  onOpenBooking,
}: {
  venue: Listing;
  highlights: string[];
  inclusions: string[];
  categoryText: string;
  galleryImages: string[];
  onOpenBooking: (sport: string) => void;
}) {
  const router = useRouter();
  const [favorite, setFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<"home" | "booking" | "academy">("home");
  const [selectedSport, setSelectedSport] = useState<string>("");
  const [sportModalOpen, setSportModalOpen] = useState(false);

  const amenities = inclusions.map((item) => {
    const match = AMENITY_ICON_RULES.find((rule) => rule.keywords.some((k) => item.toLowerCase().includes(k)));
    return { label: item, Icon: match?.icon ?? Layers };
  });

  const mapsQuery = encodeURIComponent(venue.address || venue.city);

  return (
    <div className="pb-24">
      {/* Hero gallery with floating header */}
      <div className="relative h-72 w-full bg-slate-900">
        <ImageCarousel images={galleryImages} alt={venue.title} className="absolute inset-0" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Back"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
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
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              {venue.type === "Event" ? "Per person" : "Starting price"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (venue.type === "Event") {
                // Events: skip sport picker, go directly to booking
                onOpenBooking("");
              } else {
                // Turf/Game: pick a sport first
                onOpenBooking(venue.categories.length > 0 ? categoryLabel(venue.categories[0]) : "");
              }
            }}
            className={`rounded-xl px-6 py-3 text-xs font-bold uppercase tracking-wide transition bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/30`}
          >
            Book Now
          </button>
        </div>

        {/* Tabs */}
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
          {([{ id: "home", label: "Home" }, { id: "academy", label: "Academy" }] as const).map((tab) => (
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
            {/* ── TURF / GAME — show specs, weather, sports, amenities, players, reviews ── */}
            {venue.type !== "Event" && (
              <VenueInfoSections
                venue={venue}
                highlights={highlights}
                amenities={amenities}
                onPickSport={(sport) => { setSelectedSport(sport); setSportModalOpen(true); }}
              />
            )}

            {/* ── EVENT — show event-specific sections ── */}
            {venue.type === "Event" && (
              <>
                {/* Date & time */}
                {venue.availableFrom && (
                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                    <CalendarDays className="h-4 w-4 text-brand-500" />
                    <span className="text-xs font-bold text-slate-700">
                      {new Date(venue.availableFrom).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                      {venue.reportingStartTime && ` · ${venue.reportingStartTime}`}
                      {venue.reportingEndTime && `–${venue.reportingEndTime}`}
                    </span>
                  </div>
                )}

                {/* Highlights */}
                {highlights.length > 0 && (
                  <section className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                      <CheckCircle2 className="h-4 w-4 text-brand-500" /> Highlights
                    </h2>
                    <ul className="mt-3 space-y-2">
                      {highlights.map((h) => (
                        <li key={h} className="flex items-center gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-brand-500" /> {h}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Inclusions / Exclusions */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <h3 className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Included
                    </h3>
                    <ul className="mt-2 space-y-1.5">
                      {inclusions.map((i) => (
                        <li key={i} className="flex items-center gap-1.5 text-[11px] text-slate-700">
                          <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" /> {i}
                        </li>
                      ))}
                    </ul>
                  </section>
                  <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <h3 className="flex items-center gap-1.5 text-xs font-extrabold text-slate-900">
                      <XCircle className="h-3.5 w-3.5 text-accent-500" /> Not Included
                    </h3>
                    <ul className="mt-2 space-y-1.5">
                      {venue.exclusions.map((e) => (
                        <li key={e} className="flex items-center gap-1.5 text-[11px] text-slate-700">
                          <XCircle className="h-3 w-3 shrink-0 text-accent-400" /> {e}
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>

                {/* Amenities (inclusions as tags) */}
                {amenities.length > 0 && (
                  <section className="mt-4">
                    <h2 className="text-xs font-extrabold text-slate-900">Amenities</h2>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {amenities.map(({ label, Icon }) => (
                        <span key={label} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600">
                          <Icon className="h-3 w-3 text-brand-500" /> {label}
                        </span>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* Map Location — shown for all types */}
            {venue.address && (
              <div className="mt-5 space-y-2">
                <p className="flex items-start gap-2 text-sm font-medium text-slate-700">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" /> {venue.address}
                </p>
                <div className="relative h-48 w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
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

            {/* Description */}
            <section className="mt-5 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-extrabold text-slate-900">Summary</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{venue.description}</p>
            </section>

            {/* Video — shown for all types when videoUrl exists */}
            {venue.videoUrl && (
              <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-extrabold text-slate-900">🎥 {venue.type === "Event" ? "Event Video" : "Venue Video"}</h2>
                <div className="mt-3 aspect-video w-full overflow-hidden rounded-2xl bg-black border border-slate-100 shadow-sm">
                  {venue.videoUrl.includes("youtube.com") || venue.videoUrl.includes("youtu.be") ? (
                    <iframe
                      src={getYouTubeEmbedUrl(venue.videoUrl)}
                      className="h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : venue.videoUrl.includes("vimeo.com") ? (
                    <iframe
                      src={getVimeoEmbedUrl(venue.videoUrl)}
                      className="h-full w-full border-0"
                      allowFullScreen
                    />
                  ) : (
                    <video src={venue.videoUrl} controls className="h-full w-full" />
                  )}
                </div>
              </section>
            )}

            {/* Itinerary + FAQs — only for Events */}
            {venue.type === "Event" && <EventItineraryFaqs itinerary={venue.itinerary} faqs={venue.faqs} />}
          </>
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
      </div>

      {/* Sport Selection Bottom Sheet */}
      {sportModalOpen && (
        <SportPickerSheet
          venue={venue}
          selectedSport={selectedSport}
          onSelect={setSelectedSport}
          onClose={() => setSportModalOpen(false)}
          onContinue={() => {
            setSportModalOpen(false);
            onOpenBooking(selectedSport);
          }}
        />
      )}
    </div>
  );
}

function getYouTubeEmbedUrl(url: string): string {
  try {
    let videoId = "";
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1].split(/[?#]/)[0];
    } else if (url.includes("youtube.com/watch")) {
      const match = url.match(/[?&]v=([^&#]+)/);
      videoId = match ? match[1] : "";
    } else if (url.includes("youtube.com/embed/")) {
      videoId = url.split("youtube.com/embed/")[1].split(/[?#]/)[0];
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  } catch {
    return url;
  }
}

function getVimeoEmbedUrl(url: string): string {
  try {
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? `https://player.vimeo.com/video/${match[1]}` : url;
  } catch {
    return url;
  }
}
