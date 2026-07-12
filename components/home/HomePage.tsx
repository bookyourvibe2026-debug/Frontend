"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type Venue, listingToVenue } from "@/lib/venues";
import { browseVenues } from "@/lib/api/venues";
import { SiteHeader } from "@/components/site-header";
import { Hero } from "./Hero";
import { QuickActionsSection } from "./QuickActionsSection";
import { FoodAndBeverages } from "./FoodAndBeverages";
import { FindYourGames } from "./FindYourGames";
import { TrendingVenues } from "./TrendingVenues";
import { HowItWorks } from "./HowItWorks";
import { PlatformSystemsSection } from "./PlatformSystemsSection";
import { AdBanner } from "./AdBanner";
import { CommunityMatches } from "./CommunityMatches";
import { EventsAndOffers } from "./EventsAndOffers";
import { CommerceSection } from "./CommerceSection";
import { WalkInPOSSection } from "./WalkInPOSSection";
import { WhyBookYourVibe } from "./WhyBookYourVibe";
import { AboutUs } from "./AboutUs";
import { BuildCostAndExtensionsSection } from "./BuildCostAndExtensionsSection";
import { Testimonials } from "./Testimonials";
import { AppDownloadCTA } from "./AppDownloadCTA";
import { Footer } from "./Footer";
import { FiltersModal } from "./modals/FiltersModal";
import { SignupModal } from "./modals/SignupModal";
import { MobileHome } from "./mobile/MobileHome";
import { useVenueFilters } from "./useVenueFilters";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";
import { ChallengeFlow } from "@/components/challenges/ChallengeFlow";

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
  const filters = useVenueFilters(venues, search);

  useEffect(() => {
    if (status === "guest" && new URLSearchParams(window.location.search).get("join") === "player") {
      setJoinInviteOpen(true);
    }
  }, [status]);

  useEffect(() => {
    browseVenues({ limit: 12 })
      .then((result) => setVenues(result.items.map(listingToVenue)))
      .catch(() => setVenues([]));
  }, []);

  const openVenue = useCallback(
    (v: Venue) => router.push(`/venues/${v.id}`),
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
        venue: `/venues?category=${gameId}`,
        food: "/food",
        tournaments: "/tournaments",
        challenge: "/community",
        community: "/community",
        coaches: "/coaches",
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="sm:hidden">
        <MobileHome
          userName={userName}
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
          onJoinCommunity={() => setChallengeOpen(true)}
          onViewAllCommunity={() => router.push("/community")}
          onViewAllEvents={() => router.push("/tournaments")}
          onViewAllOffers={() => router.push("/offers")}
        />
      </div>

      <div className="hidden sm:block">
        <SiteHeader />

        <Hero
          userName={userName}
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

        <FindYourGames onSelectSport={handleSelectSport} />

        <TrendingVenues
          venues={filters.filteredVenues}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onViewVenue={openVenue}
          onBookVenue={openVenue}
          onViewAll={() => router.push("/venues")}
        />

        <QuickActionsSection
          onQuickAction={handleQuickAction}
          onViewAllQuickActions={() => router.push("/games")}
        />

        <FoodAndBeverages onViewAll={() => router.push("/food")} />

        <AdBanner />

        <HowItWorks />

        <PlatformSystemsSection />

        <CommunityMatches
          onJoin={() => showToast("Joining Badminton Doubles match…")}
          onViewAll={() => router.push("/community")}
          onLaunchChallenge={() => setChallengeOpen(true)}
        />

        <EventsAndOffers
          onViewAllEvents={() => router.push("/tournaments")}
          onViewAllOffers={() => router.push("/offers")}
        />

        <CommerceSection />

        <WalkInPOSSection />

        <WhyBookYourVibe />

        <AboutUs />

        <BuildCostAndExtensionsSection />

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
