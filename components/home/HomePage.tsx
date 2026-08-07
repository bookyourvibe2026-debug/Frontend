"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { type Venue, listingToVenue } from "@/lib/venues";
import { browseVenues } from "@/lib/api/venues";
import { SiteHeader } from "@/components/site-header";
import { Hero } from "./Hero";
import { QuickEventsSection } from "./QuickEventsSection";
import { QuickActionsSection } from "./QuickActionsSection";
import { FoodAndBeverages } from "./FoodAndBeverages";
import { FindYourGames } from "./FindYourGames";
import { TrendingVenues } from "./TrendingVenues";
import { TopPlayersRanking } from "./TopPlayersRanking";
import { HowItWorks } from "./HowItWorks";
import { AdBanner } from "./AdBanner";
import { LastMinuteDealsSection } from "./LastMinuteDealsSection";
import { CommunityMatches } from "./CommunityMatches";
import { EventsAndOffers } from "./EventsAndOffers";
import { WhyBookYourVibe } from "./WhyBookYourVibe";
import { AboutUs } from "./AboutUs";
import { Testimonials } from "./Testimonials";
import { AppDownloadCTA } from "./AppDownloadCTA";
import { Footer } from "./Footer";
import { FiltersModal } from "./modals/FiltersModal";
import { SignupModal } from "./modals/SignupModal";
import { MobileHome } from "./mobile/MobileHome";
import { useVenueFilters } from "./useVenueFilters";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";

import { OnboardingFlow } from "./OnboardingFlow";

// Only rendered once the player opens the challenge sheet, and pulls in
// jsPDF/html-to-image — code-split out of the initial home page bundle.
const ChallengeFlow = dynamic(
  () => import("@/components/challenges/ChallengeFlow").then((m) => m.ChallengeFlow),
  { ssr: false }
);

export default function HomePage() {
  const router = useRouter();
  const { customer, status } = useCustomerAuth();
  const userName = customer?.name.split(" ")[0] ?? "Guest";
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [challengeOpen, setChallengeOpen] = useState(false);
  const [joinInviteOpen, setJoinInviteOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);
  const filters = useVenueFilters(venues, search);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated") {
      setShowOnboarding(false);
      return;
    }

    if (typeof window === "undefined") return;
    // Some in-app/WebView browsers block or silently no-op sessionStorage — if we can't
    // read it, fail toward NOT showing the splash again rather than showing it every time.
    try {
      const seen = sessionStorage.getItem("onboarding_seen");
      if (!seen) {
        sessionStorage.setItem("onboarding_seen", "true");
        setShowOnboarding(true);
      } else {
        setShowOnboarding(false);
      }
    } catch {
      setShowOnboarding(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === "guest" && new URLSearchParams(window.location.search).get("join") === "player") {
      setJoinInviteOpen(true);
    }
  }, [status]);

  useEffect(() => {
    browseVenues({ limit: 30, type: "Turf" })
      .then((result) => {
        const byVendor = new Map<string, typeof result.items>();
        const standalone: typeof result.items = [];

        for (const item of result.items) {
          if (item.vendorId) {
            const list = byVendor.get(item.vendorId) ?? [];
            list.push(item);
            byVendor.set(item.vendorId, list);
          } else {
            standalone.push(item);
          }
        }

        const groupedVenues: Venue[] = [];

        for (const [vendorId, items] of byVendor.entries()) {
          if (items.length === 1) {
            groupedVenues.push(listingToVenue(items[0]));
          } else {
            const lowestPrice = Math.min(...items.map((i) => i.price));
            const maxRating = Math.max(...items.map((i) => i.rating || 0));
            const first = items[0];
            groupedVenues.push({
              id: first._id,
              vendorId,
              slug: first.slug,
              name: first.ownerName || first.title,
              area: first.city,
              distanceKm: 0,
              rating: maxRating,
              pricePerHour: lowestPrice,
              status: "Available",
              sport: `${items.length} Venues Available`,
              image: first.coverImage ?? "",
              totalVenues: items.length,
            });
          }
        }

        for (const s of standalone) {
          groupedVenues.push(listingToVenue(s));
        }

        setVenues(groupedVenues);
      })
      .catch(() => {
        setVenues([]);
      });
  }, []);

  const openVenue = useCallback(
    (v: Venue) => {
      if (v.totalVenues && v.totalVenues > 1 && v.vendorId) {
        router.push(`/venues/vendor/${v.vendorId}`);
      } else {
        router.push(`/venues/${v.slug || v.id}`);
      }
    },
    [router]
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleQuickAction = useCallback(
    (taskId: string, gameId: string) => {
      const routes: Record<string, string> = {
        coaches: "/coaches",
        "challenge-a-friend": "/challenges",
        tournaments: "/tournaments",
        "near-me": "/venues",
        community: "/community",
        // Keep old mapping for compatibility with other components
        "book-now": "/venues",
        "find-players": "/community",
        offers: "/deals",
        venue: `/venues?category=${gameId}`,
        food: "/food",
        challenge: "/challenges",
      };
      router.push(routes[taskId] ?? "/venues");
    },
    [router]
  );

  const handleSelectSport = useCallback(
    () => {
      router.push("/venues");
    },
    [router]
  );

  const filteredVenuesNote = useMemo(() => {
    if (!search && filters.activeFilterCount === 0) return null;
    return filters.filteredVenues.length;
  }, [search, filters.activeFilterCount, filters.filteredVenues]);

  const handleOnboardingComplete = useCallback(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("onboarding_seen", "true");
      } catch {
        // Storage unavailable — the flag just won't persist across a reload.
      }
    }
    setShowOnboarding(false);
  }, []);

  if (showOnboarding === null) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {showOnboarding && <OnboardingFlow onComplete={handleOnboardingComplete} />}
      <div className="sm:hidden">
        <MobileHome
          searchValue={search}
          onSearchChange={setSearch}
          venues={venues}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onViewVenue={openVenue}
          onBookVenue={openVenue}
          onViewAllVenues={() => router.push("/venues")}
          onQuickAction={handleQuickAction}
          onViewAllQuickActions={() => router.push("/games")}
          onChooseGame={() => router.push("/venues")}
          onViewAllSports={() => router.push("/games")}
          onJoinCommunity={() => setChallengeOpen(true)}
          onViewAllCommunity={() => router.push("/community")}
          onViewAllEvents={() => router.push("/tournaments")}
        />
      </div>

      <div className="hidden sm:block">
        <SiteHeader />

        <Hero
          searchValue={search}
          onSearchChange={setSearch}
          onOpenFilters={() => setFiltersOpen(true)}
          activeFilterCount={filters.activeFilterCount}
        />

        {filteredVenuesNote !== null && (
          <p className="mx-auto -mt-8 max-w-7xl px-4 text-sm text-slate-500 sm:px-6">
            {filteredVenuesNote} venue(s) match &ldquo;{search}&rdquo;
          </p>
        )}

        <AdBanner />
        <LastMinuteDealsSection />

        <FindYourGames onSelectSport={handleSelectSport} />

        <TrendingVenues
          venues={filters.filteredVenues}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onViewVenue={openVenue}
          onBookVenue={openVenue}
          onViewAll={() => router.push("/venues")}
        />
        <TopPlayersRanking />

        <QuickEventsSection onViewAll={() => router.push("/quick-events")} />

        <QuickActionsSection
          onQuickAction={handleQuickAction}
          onViewAllQuickActions={() => router.push("/games")}
        />

        <CommunityMatches
          onJoin={() => showToast("Joining Badminton Doubles match…")}
          onHost={() => router.push("/community")}
          onBookCoach={() => router.push("/coaches")}
          onViewAll={() => router.push("/community")}
          onLaunchChallenge={() => setChallengeOpen(true)}
        />

        <FoodAndBeverages />

        <HowItWorks />

        <EventsAndOffers
          onViewAllEvents={() => router.push("/tournaments")}
        />

        <WhyBookYourVibe />

        <AboutUs />

        <Testimonials />

        <AppDownloadCTA />
      </div>

      <Footer />

      {filtersOpen && (
        <FiltersModal
          onClose={() => setFiltersOpen(false)}
          resultCount={filters.filteredVenues.length}
          filters={filters}
        />
      )}
      {challengeOpen && <ChallengeFlow onClose={() => setChallengeOpen(false)} />}
      {joinInviteOpen && (
        <SignupModal
          onClose={() => setJoinInviteOpen(false)}
          onSignedUp={() => setJoinInviteOpen(false)}
          onSwitchToLogin={() => setJoinInviteOpen(false)}
        />
      )}
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
