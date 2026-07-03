"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type Venue, TRENDING_VENUES } from "@/lib/venues";
import type { AuthMode, Role } from "./types";
import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { QuickActionsSection } from "./QuickActionsSection";
import { FindYourGames } from "./FindYourGames";
import { TrendingVenues } from "./TrendingVenues";
import { HowItWorks } from "./HowItWorks";
import { PlatformSystemsSection } from "./PlatformSystemsSection";
import { SectionHeading } from "./ui";
import { UpcomingBookingCard, WalletCard, FitnessSnapshotCard } from "./SnapshotCards";
import { CommunityMatches } from "./CommunityMatches";
import { EventsAndOffers } from "./EventsAndOffers";
import { CommerceSection } from "./CommerceSection";
import { WalkInPOSSection } from "./WalkInPOSSection";
import { WhyBookYourVibe } from "./WhyBookYourVibe";
import { BuildCostAndExtensionsSection } from "./BuildCostAndExtensionsSection";
import { Testimonials } from "./Testimonials";
import { AppDownloadCTA } from "./AppDownloadCTA";
import { Footer } from "./Footer";
import { LoginModal } from "./modals/LoginModal";
import { SignupModal } from "./modals/SignupModal";
import { AdminConsoleModal } from "./modals/AdminConsoleModal";
import { MobileHome } from "./mobile/MobileHome";

export default function HomePage() {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("Yashank");
  const [search, setSearch] = useState("");
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

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
    (id: string) => {
      const routes: Record<string, string> = {
        book: "/venues",
        players: "/community",
        tournaments: "/tournaments",
        near: "/venues",
        food: "/offers",
        offers: "/offers",
      };
      router.push(routes[id] ?? "/games");
    },
    [router]
  );

  const handleSelectSport = useCallback(
    () => {
      router.push("/venues");
    },
    [router]
  );

  const handleLoginSuccess = useCallback((name: string) => {
    setUserName(name);
    setIsLoggedIn(true);
    setAuthMode(null);
    showToast(`Welcome back, ${name}!`);
  }, [showToast]);

  const handleSignupSuccess = useCallback(
    (name: string, role: Role) => {
      setUserName(name);
      setIsLoggedIn(true);
      setAuthMode(null);
      const roleLabel = role === "player" ? "Player" : role === "owner" ? "Venue Owner" : "Food Owner";
      showToast(`Account created as ${roleLabel}. Welcome, ${name}!`);
    },
    [showToast]
  );

  const filteredVenuesNote = useMemo(() => {
    if (!search) return null;
    const matches = TRENDING_VENUES.filter((v) =>
      v.name.toLowerCase().includes(search.toLowerCase())
    );
    return matches.length;
  }, [search]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="sm:hidden">
        <MobileHome
          userName={userName}
          searchValue={search}
          onSearchChange={setSearch}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onViewVenue={openVenue}
          onBookVenue={openVenue}
          onViewAllVenues={() => router.push("/venues")}
          onQuickAction={handleQuickAction}
          onViewAllQuickActions={() => router.push("/games")}
          onChooseGame={() => router.push("/venues")}
          onJoinCommunity={() => showToast("Joining Badminton Doubles match…")}
          onViewAllCommunity={() => router.push("/community")}
          onViewAllEvents={() => router.push("/tournaments")}
          onViewAllOffers={() => router.push("/offers")}
        />
      </div>

      <div className="hidden sm:block">
        <Navbar
          onOpenLogin={() => setAuthMode("login")}
          onOpenSignup={() => setAuthMode("signup")}
          isLoggedIn={isLoggedIn}
          userName={userName}
          onOpenAdmin={() => setAuthMode("admin")}
        />

        <Hero
          userName={userName}
          searchValue={search}
          onSearchChange={setSearch}
        />

        {filteredVenuesNote !== null && (
          <p className="mx-auto -mt-8 max-w-7xl px-4 text-sm text-slate-500 sm:px-6">
            {filteredVenuesNote} venue(s) match &ldquo;{search}&rdquo;
          </p>
        )}

        <QuickActionsSection
          onQuickAction={handleQuickAction}
          onViewAllQuickActions={() => router.push("/games")}
        />

        <FindYourGames onSelectSport={handleSelectSport} />

        <TrendingVenues
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
          onViewVenue={openVenue}
          onBookVenue={openVenue}
          onViewAll={() => router.push("/venues")}
        />

        <HowItWorks />

        <PlatformSystemsSection />

        <section id="book" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Your snapshot"
            title="Your Bookings, Wallet & Activity"
            subtitle="Everything you need before you walk out the door."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            <UpcomingBookingCard />
            <WalletCard />
            <FitnessSnapshotCard />
          </div>
        </section>

        <CommunityMatches
          onJoin={() => showToast("Joining Badminton Doubles match…")}
          onViewAll={() => router.push("/community")}
        />

        <EventsAndOffers
          onViewAllEvents={() => router.push("/tournaments")}
          onViewAllOffers={() => router.push("/offers")}
        />

        <CommerceSection />

        <WalkInPOSSection />

        <WhyBookYourVibe />

        <BuildCostAndExtensionsSection />

        <Testimonials />

        <AppDownloadCTA />
      </div>

      <Footer />

      {/* Auth modals */}
      {authMode === "login" && (
        <LoginModal
          onClose={() => setAuthMode(null)}
          onLoginSuccess={handleLoginSuccess}
          onSwitchToSignup={() => setAuthMode("signup")}
        />
      )}
      {authMode === "signup" && (
        <SignupModal
          onClose={() => setAuthMode(null)}
          onSignupSuccess={handleSignupSuccess}
          onSwitchToLogin={() => setAuthMode("login")}
        />
      )}
      {authMode === "admin" && <AdminConsoleModal onClose={() => setAuthMode(null)} />}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xl">
          {toast}
        </div>
      )}
    </div>
  );
}
