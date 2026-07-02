"use client";

/**
 * BOOK YOUR VIBE — Unified Platform Home Page (Enhanced)
 * --------------------------------------------------------
 * Single-file Next.js (App Router) page. Tailwind CSS required.
 * Drop this in app/page.tsx
 *
 * CHANGELOG vs previous version:
 *  - Hero section is now full, two-column, with a stats strip, trust badges
 *    and a much bigger presence (was a thin banner before).
 *  - "Choose Your Game" tabs + the small "Find A Venue" icon strip have been
 *    REPLACED by one single, full-width "Find Your Games" section — a big
 *    image-led sport strip (7 sports) with hover states and a "NEW" badge
 *    support, matching the brief and the shared public assets.
 *  - Added: Stats strip, How It Works, Why Book Your Vibe (feature grid),
 *    Testimonials, App Download CTA — so the home page feels complete and
 *    full-length instead of stopping after two sections.
 *  - Trending Venues expanded from 5 → 8 venues.
 *  - NOTE ON "MULTIPLE PAGES": this is still one file (as requested) so you
 *    can restructure it yourself, but every major section below is already
 *    written as its own component with no cross-dependencies — when you
 *    split this into real Next.js routes, the natural cut points are:
 *      app/page.tsx              -> Hero + StatsStrip + FindYourGames + Trending
 *      app/venues/page.tsx       -> TrendingVenues (full list) + VenueDetailDrawer
 *      app/events/page.tsx       -> CommunityMatches + EventsAndOffers
 *      app/profile/page.tsx      -> UpcomingBookingCard + WalletCard
 *      components/Navbar.tsx, Footer.tsx, modals/* -> shared across all pages
 *    Each component already accepts props instead of reading global state
 *    directly, so lifting them into separate files is mostly copy/paste.
 */

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useMemo, useCallback } from "react";
import { type Venue, TRENDING_VENUES } from "../lib/venues";
import { BrandLogo } from "../components/brand-logo";
import {
  ArrowUpRight,
  Mail,
  MapPin,
  MessageSquareMore,
  Percent,
  PhoneCall,
  Store,
  Trophy,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  TYPES                                                             */
/* ------------------------------------------------------------------ */

type Role = "player" | "owner" | "food";

type Sport = {
  id: string;
  label: string;
  image: string;
  alt: string;
  isNew?: boolean;
  bubble: string;
};

type AuthMode = "login" | "signup" | "admin" | null;

/* ------------------------------------------------------------------ */
/*  STATIC DATA                                                        */
/* ------------------------------------------------------------------ */

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Find Your Games", href: "/games" },
  { label: "Venues", href: "/venues" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "Offers", href: "/offers" },
  { label: "Community", href: "/community" },
];

const HERO_STATS = [
  { id: "venues", label: "Venues Listed", value: "500+", emoji: "🏟️" },
  { id: "players", label: "Active Players", value: "50K+", emoji: "🙌" },
  { id: "bookings", label: "Bookings Daily", value: "1.2K+", emoji: "⚡" },
  { id: "cities", label: "Cities Live", value: "15+", emoji: "📍" },
];

const SPORTS_CATALOG: Sport[] = [
  {
    id: "box-cricket",
    label: "Box Cricket",
    image: "/bat.png",
    alt: "Box cricket bat and ball",
    bubble: "from-amber-200 via-orange-100 to-amber-50",
  },
  {
    id: "football",
    label: "Football",
    image: "/football.png",
    alt: "Football",
    bubble: "from-slate-200 via-slate-50 to-white",
  },
  {
    id: "badminton",
    label: "Badminton",
    image: "/badminton.png",
    alt: "Badminton shuttlecock",
    bubble: "from-sky-200 via-blue-100 to-indigo-100",
  },
  {
    id: "pickleball",
    label: "Pickleball",
    image: "/pickball.png",
    alt: "Pickleball ball",
    isNew: true,
    bubble: "from-amber-200 via-yellow-100 to-amber-50",
  },
  {
    id: "cricket-nets",
    label: "Cricket Nets",
    image: "/nets.png",
    alt: "Cricket ball and net practice",
    bubble: "from-rose-200 via-red-100 to-rose-50",
  },
  {
    id: "tennis",
    label: "Tennis",
    image: "/tennis.png",
    alt: "Tennis racket and ball",
    bubble: "from-violet-200 via-indigo-100 to-blue-100",
  },
  {
    id: "table-tennis",
    label: "Table Tennis",
    image: "/tabletennis.png",
    alt: "Table tennis paddle and ball",
    bubble: "from-pink-200 via-rose-100 to-amber-50",
  },
];

const HOW_IT_WORKS = [
  {
    id: "discover",
    title: "Find your game",
    desc: "Search by sport, area or venue name. Filter by price, rating and amenities in seconds.",
    emoji: "🔍",
  },
  {
    id: "book",
    title: "Lock your slot",
    desc: "Pick a free slot on the live calendar and confirm — no double-booking, no back-and-forth calls.",
    emoji: "📅",
  },
  {
    id: "play",
    title: "Show up & scan",
    desc: "Flash your QR pass at the gate. You're checked in instantly, every time.",
    emoji: "📲",
  },
  {
    id: "repeat",
    title: "Rate & repeat",
    desc: "Earn reward points, rate the venue, and rebook your favourites in one tap next time.",
    emoji: "🔁",
  },
];

const WHY_BYV = [
  { id: "realtime", title: "Real slots, real time", desc: "Calendars sync live across the app and the venue front desk — what you see is what's actually free.", emoji: "⏱️" },
  { id: "squad", title: "Squad booking", desc: "Invite friends, split the bill automatically, and stop chasing people on WhatsApp for their share.", emoji: "👥" },
  { id: "deals", title: "Flash slot deals", desc: "Get notified when a nearby slot drops in price a few hours before kick-off.", emoji: "🏷️" },
  { id: "coach", title: "Book a coach", desc: "Browse verified coaches by sport and experience, and book a session right alongside your court.", emoji: "🎓" },
  { id: "wallet", title: "One wallet, every venue", desc: "Cashback, rewards and refunds land in a single wallet you can use anywhere on the platform.", emoji: "💳" },
  { id: "events", title: "Beyond sports", desc: "Marathons, fitness meets, even corporate offsites — host or join any event, not just a match.", emoji: "🏆" },
];

const TESTIMONIALS = [
  {
    id: "t1",
    name: "Aman Sharma",
    role: "Badminton, Shobhagpura",
    quote:
      "Booking a court used to mean five phone calls. Now I lock a slot, invite my group, and we're playing in ten minutes.",
    emoji: "🏸",
  },
  {
    id: "t2",
    name: "Riya Verma",
    role: "Pickleball, Hiran Magri",
    quote:
      "Found a pickleball venue near me that I genuinely didn't know existed. The flash deal notification got me playing midweek for half price.",
    emoji: "🥒",
  },
  {
    id: "t3",
    name: "CA Yashank R.",
    role: "Venue Owner, Cricket Arena",
    quote:
      "The QR check-in pushing straight into my revenue dashboard means I stopped reconciling cash registers by hand every night.",
    emoji: "🏟️",
  },
];

type LaunchRole = "player" | "owner" | "food" | "admin";

const LAUNCH_ROLES: {
  id: LaunchRole;
  title: string;
  subtitle: string;
  emoji: string;
  accent: string;
  badge: string;
  actions: string[];
}[] = [
  {
    id: "player",
    title: "Player tab",
    subtitle: "Search venues, book slots, join matches, and manage your wallet.",
    emoji: "🏃",
    accent: "from-sky-500 to-cyan-500",
    badge: "Fastest path to play",
    actions: ["Book courts", "Join a squad", "Track rewards"],
  },
  {
    id: "owner",
    title: "Owner tab",
    subtitle: "Manage listings, pricing, walk-ins, bookings, and QR check-ins.",
    emoji: "🏟️",
    accent: "from-emerald-500 to-teal-500",
    badge: "Venue operations",
    actions: ["Manage inventory", "Open POS", "Review revenue"],
  },
  {
    id: "food",
    title: "Food tab",
    subtitle: "Handle menus, counters, order tickets, and billing at the venue.",
    emoji: "🍔",
    accent: "from-orange-500 to-rose-500",
    badge: "Fuel & orders",
    actions: ["Take orders", "Serve tables", "Set combos"],
  },
  {
    id: "admin",
    title: "Admin console",
    subtitle: "Sits above all three roles with master controls, audits, and banners.",
    emoji: "🛠️",
    accent: "from-slate-800 to-slate-600",
    badge: "Global control plane",
    actions: ["Manage content", "Freeze users", "Audit changes"],
  },
];

const PLATFORM_SYSTEMS = [
  {
    id: "identity",
    title: "Identity & Access",
    emoji: "🪪",
    desc: "Login, signup, OTP, role routing, and admin entry in one flow.",
  },
  {
    id: "discovery",
    title: "Venue & Discovery",
    emoji: "🧭",
    desc: "Search, filters, trending venues, sports catalog, and quick actions.",
  },
  {
    id: "booking",
    title: "Booking System",
    emoji: "📅",
    desc: "Live slot selection, venue detail drawer, favorites, and booking CTA.",
  },
  {
    id: "community",
    title: "Community & Coaching",
    emoji: "👥",
    desc: "Open matches, team building, and coach-ready placement hooks.",
  },
  {
    id: "fuel",
    title: "Food & Beverage",
    emoji: "🥤",
    desc: "Food ordering, counters, menu cards, and venue-side order handling.",
  },
  {
    id: "reputation",
    title: "Engagement & Reputation",
    emoji: "⭐",
    desc: "Ratings, rewards, testimonials, milestones, and loyalty surfaces.",
  },
  {
    id: "insight",
    title: "Insight & Finance",
    emoji: "📊",
    desc: "Wallet balance, activity snapshot, revenue cues, and admin visibility.",
  },
  {
    id: "data",
    title: "Shared Architecture",
    emoji: "🧱",
    desc: "Cross-cutting data, one source of truth, and role-aware UI patterns.",
  },
];

const COMMERCE_PLANS = [
  {
    name: "Starter",
    price: "Free",
    note: "For players",
    bullets: ["Book and pay per slot", "Wallet + rewards", "Basic notifications"],
    accent: "from-slate-900 to-slate-700",
  },
  {
    name: "Venue Pro",
    price: "Custom",
    note: "For owners",
    bullets: ["Dynamic pricing", "Walk-in POS", "Revenue and booking analytics"],
    accent: "from-orange-500 to-rose-500",
  },
  {
    name: "Enterprise",
    price: "Custom",
    note: "For BYV operations",
    bullets: ["Multi-role admin", "Banner CMS", "Audit logs and cross-city rollouts"],
    accent: "from-emerald-600 to-teal-500",
  },
];

const POS_TABS = [
  { id: "walkin", label: "Walk-ins", emoji: "🚶" },
  { id: "food", label: "Food Orders", emoji: "🍔" },
  { id: "booking", label: "Booked Slots", emoji: "📅" },
];

const POS_ITEMS = [
  { name: "Cricket Net - 60 min", qty: 1, price: 600 },
  { name: "Bat Rental", qty: 2, price: 100 },
  { name: "Energy Drink", qty: 3, price: 90 },
];

const BUILD_COST_NOTES = [
  "Frontend-only screens are complete in this single-file build.",
  "Backend integrations remain stubbed behind TODOs and toasts.",
  "Role-based UI is represented with modal flows and console previews.",
];

const EXTENSION_CARDS = [
  { title: "Coach marketplace", desc: "Verified coaches, packages, and training slots." },
  { title: "Dynamic pricing", desc: "Peak-hour multipliers and flash-slot discounts." },
  { title: "Rewards engine", desc: "Loyalty points, referral bonuses, and wallet credits." },
  { title: "Venue kiosk", desc: "Self-service check-in and walk-in ticketing." },
];

/* ------------------------------------------------------------------ */
/*  SMALL REUSABLE UI PRIMITIVES                                      */
/* ------------------------------------------------------------------ */

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-black/55 px-2 py-0.5 text-xs font-semibold text-amber-300 backdrop-blur-sm">
      <span aria-hidden>★</span>
      {rating.toFixed(1)}
    </span>
  );
}

function StatusPill({ status }: { status: Venue["status"] }) {
  const styles: Record<Venue["status"], string> = {
    Available: "bg-emerald-500/90 text-white",
    "Filling Fast": "bg-orange-500/90 text-white",
    Full: "bg-rose-500/90 text-white",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${styles[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
      {status}
    </span>
  );
}

function PrimaryButton({
  children,
  onClick,
  className = "",
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition-transform hover:scale-[1.03] hover:shadow-lg active:scale-[0.98] ${className}`}
    >
      {children}
    </button>
  );
}

function GhostButton({
  children,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-orange-300 hover:text-orange-600 ${className}`}
    >
      {children}
    </button>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
  actionLabel,
  onAction,
  emoji,
  light,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  emoji?: string;
  light?: boolean;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p
            className={`mb-2 text-xs font-bold uppercase tracking-[0.2em] ${
              light ? "text-orange-300" : "text-orange-600"
            }`}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className={`flex items-center gap-2 text-2xl font-extrabold sm:text-3xl ${
            light ? "text-white" : "text-slate-900"
          }`}
        >
          {title}
          {emoji && <span aria-hidden>{emoji}</span>}
        </h2>
        {subtitle && (
          <p className={`mt-2 text-sm sm:text-base ${light ? "text-slate-300" : "text-slate-500"}`}>
            {subtitle}
          </p>
        )}
      </div>
      {actionLabel && (
        <button
          onClick={onAction}
          className={`whitespace-nowrap text-sm font-semibold transition ${
            light ? "text-orange-300 hover:text-orange-200" : "text-orange-600 hover:text-orange-700"
          }`}
        >
          {actionLabel} →
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  NAVBAR                                                             */
/* ------------------------------------------------------------------ */

function Navbar({
  onOpenLogin,
  onOpenSignup,
  isLoggedIn,
  userName,
  onOpenAdmin,
}: {
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  isLoggedIn: boolean;
  userName: string;
  onOpenAdmin: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto grid max-w-[1600px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-6 px-4 py-3 sm:px-6 lg:gap-10 lg:px-8">
        {/* Left side */}
        <div className="flex items-center gap-5 lg:gap-6">
          <BrandLogo
            className="shrink-0"
            logoBoxClassName="h-11 w-11 rounded-xl sm:h-12 sm:w-12"
            imageClassName="p-1.5"
            showText={false}
            priority
          />

          {/* Location */}
          <button className="hidden items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-orange-300 hover:text-orange-600 xl:flex">
            <span aria-hidden>📍</span> Udaipur
            <span aria-hidden className="text-xs">▾</span>
          </button>
        </div>

        {/* Nav links */}
        <nav className="hidden min-w-0 items-center justify-center gap-8 whitespace-nowrap xl:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 text-sm font-semibold transition ${
                isActive(link.href)
                  ? "text-orange-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4 lg:gap-5">
          <Link
            href="/vendor/register"
            className="hidden rounded-full border border-orange-200 bg-orange-50 px-5 py-2.5 text-sm font-semibold text-orange-700 transition hover:border-orange-300 hover:bg-orange-100 lg:inline-flex"
          >
            List Your Games
          </Link>
          <button
            aria-label="Search"
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-orange-300 hover:text-orange-600 sm:flex"
          >
            🔍
          </button>
          <button
            aria-label="Notifications"
            className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-orange-300 hover:text-orange-600 sm:flex"
          >
            🔔
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          {isLoggedIn ? (
            <div className="hidden items-center gap-3 lg:flex">
              <button
                onClick={onOpenAdmin}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-orange-300 hover:text-orange-600"
              >
                Admin Console
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          ) : (
            <PrimaryButton onClick={onOpenLogin} className="hidden lg:inline-flex">
              Login / Sign Up
            </PrimaryButton>
          )}

          {/* Mobile hamburger */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  setMobileOpen(false);
                }}
                className={`text-sm font-semibold ${
                  isActive(link.href) ? "text-orange-600" : "text-slate-700"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              {isLoggedIn ? (
                <GhostButton onClick={onOpenAdmin} className="flex-1">
                  Admin Console
                </GhostButton>
              ) : (
                <>
                  <Link
                    href="/vendor/register"
                    onClick={() => {
                      setMobileOpen(false);
                    }}
                    className="flex-1 rounded-full border border-orange-200 bg-orange-50 px-4 py-2.5 text-center text-sm font-semibold text-orange-700 transition hover:border-orange-300 hover:bg-orange-100"
                  >
                    List Your Games
                  </Link>
                  <GhostButton onClick={onOpenLogin} className="flex-1">
                    Login
                  </GhostButton>
                  <PrimaryButton onClick={onOpenSignup} className="flex-1">
                    Sign Up
                  </PrimaryButton>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  HERO — big, two-column, with stats strip                           */
/* ------------------------------------------------------------------ */

const QUICK_ACTIONS = [
  { id: "book", label: "Book Now", emoji: "⚡" },
  { id: "players", label: "Find Players", emoji: "👥" },
  { id: "tournaments", label: "Tournaments", emoji: "🏆" },
  { id: "near", label: "Near Me", emoji: "📍" },
  { id: "food", label: "Food & Beverages", emoji: "🥤" },
  { id: "offers", label: "Offers", emoji: "🏷️" },
];

function Hero({
  userName,
  searchValue,
  onSearchChange,
  onQuickAction,
  onViewAllQuickActions,
}: {
  userName: string;
  searchValue: string;
  onSearchChange: (v: string) => void;
  onQuickAction: (id: string) => void;
  onViewAllQuickActions: () => void;
}) {
  return (
    <section id="home" className="relative overflow-hidden">
      <div
        className="relative"
        style={{
          background:
            "linear-gradient(135deg, #15101f 0%, #211731 35%, #2b1f3d 60%, #3a2a1a 100%)",
        }}
      >
        {/* ambient glow accents */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-orange-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-0 h-[28rem] w-[28rem] rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="pointer-events-none absolute right-1/4 top-10 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />

        {/* floating sport emoji confetti, decorative */}
        <div className="pointer-events-none absolute inset-0 hidden select-none opacity-20 lg:block">
          <span className="absolute left-[8%] top-[18%] text-5xl">🏏</span>
          <span className="absolute left-[20%] top-[65%] text-4xl">🏸</span>
          <span className="absolute right-[12%] top-[12%] text-5xl">🎾</span>
          <span className="absolute right-[22%] top-[60%] text-4xl">⚽</span>
          <span className="absolute right-[6%] bottom-[10%] text-4xl">🥒</span>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:pb-20 lg:pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Left column — copy + search */}
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold text-orange-200 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Good Morning, {userName} 👋 — Udaipur is live
              </div>

              <h1 className="text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
                Let&rsquo;s Find Your{" "}
                <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-rose-400 bg-clip-text text-transparent">
                  Vibe
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-base text-slate-300 sm:text-lg">
                Book courts and turfs, find players for tonight&rsquo;s match, order food
                courtside, and never argue about who owes what — all from one app.
              </p>

              {/* Search bar */}
              <div className="mt-7 flex flex-col gap-2 rounded-2xl bg-white/95 p-2 shadow-2xl shadow-black/30 sm:flex-row sm:items-center sm:rounded-full sm:p-1.5 sm:pl-5">
                <span aria-hidden className="hidden text-slate-400 sm:block">
                  🔍
                </span>
                <input
                  value={searchValue}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search turf, badminton, pickleball..."
                  className="w-full flex-1 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 sm:bg-transparent sm:px-0 sm:py-2"
                />
                <div className="flex items-center gap-2">
                  <button className="hidden h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 sm:flex">
                    ⚙️
                  </button>
                  <PrimaryButton className="w-full !px-6 !py-3 sm:w-auto">Search</PrimaryButton>
                </div>
              </div>

              {/* trust row */}
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className="text-amber-300">★ 4.8</span> rated by 12,000+ players
                </span>
                <span className="hidden h-3 w-px bg-white/15 sm:block" />
                <span>Zero booking commission for your first 3 matches</span>
              </div>
            </div>

              {/* Right column — quick actions card */}
            <div className="w-full rounded-3xl bg-white/95 p-5 shadow-2xl backdrop-blur sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-800">Quick Actions</p>
                <button
                  type="button"
                  onClick={onViewAllQuickActions}
                  className="text-xs font-semibold text-orange-600 transition hover:text-orange-700"
                >
                  View All →
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {QUICK_ACTIONS.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => onQuickAction(a.id)}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-3 text-center transition hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 text-xl">
                      {a.emoji}
                    </span>
                    <span className="text-[11px] font-semibold leading-tight text-slate-600">
                      {a.label}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 p-4 text-white">
                <span className="text-2xl" aria-hidden>
                  🏷️
                </span>
                <div>
                  <p className="text-sm font-bold">Flat 20% off your next booking</p>
                  <p className="text-xs text-orange-100">Use code VIBE20 at checkout</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip, overlapping the bottom edge of the hero */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid translate-y-8 grid-cols-2 gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-xl sm:translate-y-12 sm:grid-cols-4 sm:gap-4 sm:p-6">
            {HERO_STATS.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-1 text-center sm:flex-row sm:items-center sm:gap-3 sm:text-left">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-xl">
                  {s.emoji}
                </span>
                <div>
                  <p className="text-lg font-extrabold text-slate-900 sm:text-xl">{s.value}</p>
                  <p className="text-[11px] font-semibold text-slate-500 sm:text-xs">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* spacer to absorb the stats-strip overlap */}
      <div className="h-14 bg-slate-50 sm:h-16" />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FIND YOUR GAMES — image-led sport strip matching the brief        */
/* ------------------------------------------------------------------ */

function FindYourGames({
  onSelectSport,
}: {
  onSelectSport: (sport: Sport) => void;
}) {
  return (
    <section id="games" className="mx-auto mt-4 max-w-7xl px-4 sm:px-6">
      <div className="overflow-hidden rounded-[2rem] bg-[#eaf2ff] px-5 py-6 shadow-[0_18px_60px_rgba(148,163,184,0.18)] sm:px-8 sm:py-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-[2rem]">
              Find A Venue
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              const firstSport = SPORTS_CATALOG[0];
              if (firstSport) onSelectSport(firstSport);
            }}
            className="self-start text-sm font-bold uppercase tracking-wide text-sky-500 transition hover:text-sky-600"
          >
            Explore Sports Venue
          </button>
        </div>

        <div className="grid grid-cols-1 gap-x-4 gap-y-8 min-[420px]:grid-cols-2 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 xl:grid-cols-7">
          {SPORTS_CATALOG.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSport(s)}
              className="group flex flex-col items-center justify-start text-center"
            >
              <div className="relative flex h-28 w-28 items-center justify-center sm:h-36 sm:w-36">
                <span
                  className={`absolute inset-4 rounded-full bg-gradient-to-b ${s.bubble} shadow-[0_20px_35px_rgba(148,163,184,0.16)] transition duration-300 group-hover:scale-105`}
                />
                <span className="absolute inset-0 rounded-full bg-white/35 opacity-0 blur-2xl transition duration-300 group-hover:opacity-100" />
                <Image
                  src={s.image}
                  alt={s.alt}
                  width={96}
                  height={96}
                  unoptimized
                  priority
                  className="relative z-10 h-20 w-20 object-contain transition duration-300 group-hover:scale-105 sm:h-24 sm:w-24"
                />
                {s.isNew && (
                  <span className="absolute bottom-0 z-20 rounded-full bg-gradient-to-r from-sky-500 to-violet-600 px-4 py-1 text-xs font-bold text-white shadow-lg shadow-sky-500/20">
                    NEW
                  </span>
                )}
              </div>
              <p className="mt-2 text-base font-extrabold tracking-tight text-slate-900 sm:text-[1.35rem]">
                {s.label}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  TRENDING VENUES                                                    */
/* ------------------------------------------------------------------ */

function VenueCard({
  venue,
  isFavorite,
  onToggleFavorite,
  onView,
  onBook,
}: {
  venue: Venue;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onView: () => void;
  onBook: () => void;
}) {
  return (
    <div className="group snap-start flex w-[85vw] max-w-xs flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:w-72">
      <div
        role="button"
        tabIndex={0}
        onClick={onView}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onView();
          }
        }}
        className="relative h-40 w-full cursor-pointer text-left"
        style={{ background: venue.image, backgroundSize: "cover" }}
      >
        <div className="absolute left-3 top-3">
          <StarRating rating={venue.rating} />
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm shadow"
          aria-label="Toggle favorite"
        >
          {isFavorite ? "❤️" : "🤍"}
        </button>
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          <StatusPill status={venue.status} />
          <span className="rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
            {venue.sport}
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-bold text-slate-900">{venue.name}</h3>
        <p className="flex items-center gap-1 text-xs text-slate-500">
          <span aria-hidden>📍</span> {venue.area} · {venue.distanceKm} km
        </p>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-900">
            ₹{venue.pricePerHour}
            <span className="font-normal text-slate-400"> /hour</span>
          </p>
          <PrimaryButton onClick={onBook} className="!px-4 !py-2 text-xs">
            Book Now
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function TrendingVenues({
  favorites,
  onToggleFavorite,
  onViewVenue,
  onBookVenue,
  onViewAll,
}: {
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  onViewVenue: (v: Venue) => void;
  onBookVenue: (v: Venue) => void;
  onViewAll: () => void;
}) {
  return (
    <section id="venues" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Booked the most this week"
        title="Trending Venues"
        subtitle="Hand-picked from real booking volume across Udaipur — updated daily."
        emoji="🔥"
        actionLabel="View All Venues"
        onAction={onViewAll}
      />
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
        {TRENDING_VENUES.map((v) => (
          <VenueCard
            key={v.id}
            venue={v}
            isFavorite={favorites.has(v.id)}
            onToggleFavorite={() => onToggleFavorite(v.id)}
            onView={() => onViewVenue(v)}
            onBook={() => onBookVenue(v)}
          />
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  HOW IT WORKS                                                       */
/* ------------------------------------------------------------------ */

function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="From search to scan"
        title="How Book Your Vibe Works"
        subtitle="Four steps, no phone calls."
        emoji="🧭"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {HOW_IT_WORKS.map((step, i) => (
          <div
            key={step.id}
            className="relative flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
          >
            <span className="text-xs font-bold text-orange-300">STEP {i + 1}</span>
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-2xl">
              {step.emoji}
            </span>
            <p className="text-base font-bold text-slate-900">{step.title}</p>
            <p className="text-sm leading-relaxed text-slate-500">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  UPCOMING BOOKING + WALLET                                          */
/* ------------------------------------------------------------------ */

function UpcomingBookingCard() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-900">Upcoming Booking</p>
        <button className="text-xs font-semibold text-orange-600">View All →</button>
      </div>
      <div className="flex items-center gap-3 rounded-xl bg-orange-50 p-3">
        <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-orange-500 text-white">
          <span className="text-[10px] font-bold uppercase">May</span>
          <span className="text-sm font-extrabold leading-none">27</span>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">Cricket Arena</p>
          <p className="text-xs text-slate-500">Wed, 27 May · 7:00 PM – 9:00 PM</p>
          <p className="text-xs text-slate-400">🏟️ 2 Courts · 👥 10 Players</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-center">
        {[
          { label: "HRS", value: "24" },
          { label: "MIN", value: "05" },
          { label: "SEC", value: "36" },
        ].map((t) => (
          <div key={t.label} className="flex-1 rounded-lg bg-slate-50 py-2">
            <p className="text-sm font-extrabold text-slate-900">{t.value}</p>
            <p className="text-[10px] font-semibold text-slate-400">{t.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function WalletCard() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-900">My Wallet</p>
        <button className="text-xs font-semibold text-orange-600">View All →</button>
      </div>
      <div className="flex items-center justify-between rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 p-4 text-white">
        <div>
          <p className="text-xs text-orange-100">Wallet Balance</p>
          <p className="text-2xl font-extrabold">₹1,250.00</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-orange-100">
            <span aria-hidden>⭐</span> 250 Reward Points
          </p>
        </div>
        <span className="text-3xl" aria-hidden>
          💳
        </span>
      </div>
    </div>
  );
}

function FitnessSnapshotCard() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-slate-900">Your Activity</p>
        <button className="text-xs font-semibold text-orange-600">View All →</button>
      </div>
      <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
        {[
          { label: "Matches", value: "42" },
          { label: "Hours Played", value: "96" },
          { label: "Sports", value: "4" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl bg-slate-50 py-3">
            <p className="text-lg font-extrabold text-slate-900">{m.value}</p>
            <p className="text-[10px] font-semibold text-slate-400">{m.label}</p>
          </div>
        ))}
      </div>
      <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
        🎉 3 matches away from your 50th match milestone
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  COMMUNITY MATCHES                                                   */
/* ------------------------------------------------------------------ */

function CommunityMatches({ onJoin, onViewAll }: { onJoin: () => void; onViewAll: () => void }) {
  return (
    <section id="community" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Open right now"
        title="Community Matches Near You"
        subtitle="Jump into a game that already has players waiting."
        actionLabel="View All"
        onAction={onViewAll}
      />
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            Open Match
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">Badminton Doubles</p>
            <p className="text-xs text-slate-500">📍 Shobhagpura · 1.2 km</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold text-orange-600">Today, 8:00 PM</p>
            <p className="text-xs text-slate-500">₹100 / Player</p>
          </div>
          <PrimaryButton onClick={onJoin}>Join Now</PrimaryButton>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  EVENTS + OFFERS                                                     */
/* ------------------------------------------------------------------ */

function EventsAndOffers({
  onViewAllEvents,
  onViewAllOffers,
}: {
  onViewAllEvents: () => void;
  onViewAllOffers: () => void;
}) {
  return (
    <section id="tournaments" className="mx-auto mt-16 grid max-w-7xl gap-4 px-4 sm:px-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <SectionHeading title="Upcoming Events" actionLabel="View All" onAction={onViewAllEvents} />
        <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-3">
          <span className="text-3xl" aria-hidden>
            🏆
          </span>
          <div>
            <p className="text-sm font-bold text-slate-900">BYV Premier League</p>
            <p className="text-xs text-slate-500">31 May – 6 June · Udaipur</p>
          </div>
        </div>
      </div>

      <div id="offers" className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
        <SectionHeading title="Offers For You" actionLabel="View All" onAction={onViewAllOffers} />
        <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 p-4 text-white">
          <div>
            <p className="text-3xl font-extrabold">
              FLAT <span className="text-yellow-200">20%</span>
            </p>
            <p className="text-sm font-medium text-orange-50">OFF on Your Next Booking</p>
          </div>
          <span className="text-3xl" aria-hidden>
            🏷️
          </span>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  WHY BOOK YOUR VIBE — feature grid                                   */
/* ------------------------------------------------------------------ */

function WhyBookYourVibe() {
  return (
    <section id="why-book-your-vibe" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Built for how you actually play"
        title="Why Book Your Vibe"
        subtitle="Not just another booking form — a full layer around how you play, eat and pay."
        emoji="✨"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WHY_BYV.map((f) => (
          <div
            key={f.id}
            className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-50 text-xl">
              {f.emoji}
            </span>
            <p className="text-base font-bold text-slate-900">{f.title}</p>
            <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  TESTIMONIALS                                                        */
/* ------------------------------------------------------------------ */

function Testimonials() {
  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <SectionHeading eyebrow="From the community" title="Players & Owners Love It" emoji="💬" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.id}
            className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
          >
            <span className="text-2xl" aria-hidden>
              {t.emoji}
            </span>
            <p className="text-sm leading-relaxed text-slate-600">&ldquo;{t.quote}&rdquo;</p>
            <div>
              <p className="text-sm font-bold text-slate-900">{t.name}</p>
              <p className="text-xs text-slate-400">{t.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  APP DOWNLOAD CTA BAND                                               */
/* ------------------------------------------------------------------ */

function AppDownloadCTA() {
  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <div
        className="flex flex-col items-center gap-6 overflow-hidden rounded-3xl p-8 text-center sm:p-12 lg:flex-row lg:items-center lg:justify-between lg:text-left"
        style={{
          background: "linear-gradient(120deg, #1c1530 0%, #2b1f3d 45%, #3a2a1a 100%)",
        }}
      >
        <div>
          <h3 className="text-2xl font-extrabold text-white sm:text-3xl">
            Carry the vibe in your pocket
          </h3>
          <p className="mt-2 max-w-md text-sm text-slate-300 sm:text-base">
            Get the app for faster booking, instant QR check-in and push alerts the moment a
            flash deal drops nearby.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <span className="cursor-pointer rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white">
            ▶ Google Play
          </span>
          <span className="cursor-pointer rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white">
            App Store
          </span>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  LAUNCH SCREEN / ROLE SELECTOR                                      */
/* ------------------------------------------------------------------ */

function LaunchScreenPreview() {
  const [role, setRole] = useState<LaunchRole>("player");
  const active = LAUNCH_ROLES.find((item) => item.id === role) ?? LAUNCH_ROLES[0];

  return (
    <section id="launch" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="App entry"
        title="The 3 Roles & Their Tabs"
        subtitle="Launch screen / role selector for players, owners, food operators, and admin."
        emoji="🧩"
      />
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          {LAUNCH_ROLES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRole(item.id)}
              className={`rounded-3xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                role === item.id ? "border-orange-300 bg-orange-50" : "border-slate-100 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-2xl">
                  {item.emoji}
                </span>
                <span
                  className={`rounded-full bg-gradient-to-r px-2 py-1 text-[10px] font-bold text-white ${item.accent}`}
                >
                  {item.badge}
                </span>
              </div>
              <p className="mt-4 text-sm font-bold text-slate-900">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.subtitle}</p>
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl">
          <div className="border-b border-white/10 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
              {active.badge}
            </p>
            <h3 className="mt-2 text-2xl font-extrabold">{active.title}</h3>
            <p className="mt-2 max-w-xl text-sm text-slate-300">{active.subtitle}</p>
          </div>
          <div className="grid gap-4 p-6 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                Primary actions
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {active.actions.map((action) => (
                  <span
                    key={action}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                  >
                    {action}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 p-4 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-100">
                Admin note
              </p>
              <p className="mt-3 text-sm leading-relaxed text-orange-50">
                Admin remains a web-only control plane layered above the three user roles, with
                banners, users, master data, and audit history.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  PLATFORM SYSTEM MAP                                                */
/* ------------------------------------------------------------------ */

function PlatformSystemsSection() {
  return (
    <section id="systems" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Spec coverage"
        title="The 8 Systems in Detail"
        subtitle="Every major client system has a visible frontend surface here, even when the backend is still stubbed."
        emoji="🧱"
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLATFORM_SYSTEMS.map((system) => (
          <div
            key={system.id}
            className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-2xl">
                {system.emoji}
              </span>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                In UI
              </span>
            </div>
            <p className="mt-4 text-sm font-bold text-slate-900">{system.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{system.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-3xl border border-dashed border-slate-200 bg-white px-5 py-4 text-sm text-slate-500">
        Cross-cutting idea: one source of truth for venue data, role-aware controls, and shared
        UI primitives.
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  COMMERCE / PRICING / PLANS                                         */
/* ------------------------------------------------------------------ */

function CommerceSection() {
  return (
    <section id="commerce" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Payments, pricing & plans"
        title="Commerce"
        subtitle="The spec includes monetization surfaces for players, owners, and the BYV team, so the frontend needs room for all three."
        emoji="💳"
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {COMMERCE_PLANS.map((plan) => (
          <div
            key={plan.name}
            className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm"
          >
            <div className={`bg-gradient-to-r ${plan.accent} p-5 text-white`}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">{plan.note}</p>
              <h3 className="mt-2 text-2xl font-extrabold">{plan.name}</h3>
              <p className="mt-1 text-3xl font-extrabold">{plan.price}</p>
            </div>
            <div className="space-y-3 p-5">
              {plan.bullets.map((bullet) => (
                <div key={bullet} className="flex items-start gap-3 text-sm text-slate-600">
                  <span className="mt-1 h-2 w-2 rounded-full bg-orange-500" />
                  <span>{bullet}</span>
                </div>
              ))}
              <button className="mt-2 w-full rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-orange-300 hover:text-orange-600">
                Compare plan
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
        {["UPI", "Cards", "Wallet", "Split pay"].map((method) => (
          <div key={method} className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
            {method}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  WALK-IN POS SCREEN                                                 */
/* ------------------------------------------------------------------ */

function WalkInPOSSection() {
  const subtotal = POS_ITEMS.reduce((sum, item) => sum + item.qty * item.price, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  return (
    <section id="pos" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Resolve before build"
        title="Walk-In POS Screen"
        subtitle="A spec preview for the venue-side point of sale that handles walk-ins, bookings, and food counters."
        emoji="🧾"
      />
      <div className="grid gap-4 lg:grid-cols-[0.75fr_1.15fr_0.9fr]">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-900">Mode</p>
          <div className="mt-4 flex flex-col gap-2">
            {POS_TABS.map((tab) => (
              <div
                key={tab.id}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                <span className="flex items-center gap-2">
                  <span>{tab.emoji}</span> {tab.label}
                </span>
                <span className="text-xs text-slate-400">Live</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-900">Current ticket</p>
          <div className="mt-4 divide-y divide-slate-100">
            {POS_ITEMS.map((item) => (
              <div key={item.name} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <p className="font-semibold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    Qty {item.qty} · ₹{item.price} each
                  </p>
                </div>
                <p className="font-bold text-slate-900">₹{item.qty * item.price}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl bg-slate-950 p-5 text-white shadow-2xl">
          <p className="text-sm font-bold text-white">Checkout summary</p>
          <div className="mt-4 space-y-3 rounded-2xl bg-white/5 p-4 text-sm text-slate-200">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Service tax</span>
              <span>₹{tax}</span>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 pt-3 text-base font-bold text-white">
              <span>Total</span>
              <span>₹{total}</span>
            </div>
          </div>
          <button className="mt-4 w-full rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-4 py-3 text-sm font-semibold text-white">
            Take Payment
          </button>
          <p className="mt-3 text-xs text-slate-400">
            QR, cash, UPI, and split settlement fit the same cashier flow.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  BUILD COST NOTE + EXTENSIONS                                       */
/* ------------------------------------------------------------------ */

function BuildCostAndExtensionsSection() {
  return (
    <section id="extensions" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Read before quoting"
        title="Build-Cost Note & Extensions"
        subtitle="The spec calls for a clear separation between what is already represented in the frontend and what should be delivered in later phases."
        emoji="📝"
      />
      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-slate-900">Build-cost note</p>
          <div className="mt-4 space-y-3">
            {BUILD_COST_NOTES.map((note) => (
              <div key={note} className="flex items-start gap-3 text-sm text-slate-600">
                <span className="mt-1 h-2 w-2 rounded-full bg-orange-500" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-slate-900">Extensions</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {EXTENSION_CARDS.map((ext) => (
              <div key={ext.title} className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">{ext.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{ext.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FOOTER                                                              */
/* ------------------------------------------------------------------ */

type FooterLink = {
  label: string;
  href: string;
  icon?: React.ReactNode;
};

const FOOTER_COLUMNS: { title: string; items: FooterLink[] }[] = [
  {
    title: "Experiences",
    items: [
      { label: "Box Cricket", href: "/games" },
      { label: "Badminton", href: "/games" },
      { label: "Tournaments", href: "/tournaments" },
      { label: "Community", href: "/community" },
      { label: "Offers", href: "/offers" },
    ],
  },
  {
    title: "Destinations",
    items: [
      { label: "Udaipur", href: "/venues" },
      { label: "Games", href: "/games" },
      { label: "Venues", href: "/venues" },
      { label: "How It Works", href: "/#how-it-works" },
    ],
  },
  {
    title: "Latest Blogs",
    items: [
      { label: "Why Book Slots", href: "/offers" },
      { label: "Play With Friends", href: "/community" },
      { label: "Venue Tips", href: "/venues" },
      { label: "Event Updates", href: "/tournaments" },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "Home", href: "/" },
      { label: "About Us", href: "/#why-book-your-vibe" },
      { label: "Contact Us", href: "mailto:info@bookyourvibe.in" },
      { label: "Vendor Login", href: "/vendor/login" },
    ],
  },
];

const FOOTER_QUICK_LINKS: FooterLink[] = [
  { label: "Community", href: "/community", icon: <MessageSquareMore className="h-4 w-4" /> },
  { label: "Offers", href: "/offers", icon: <Percent className="h-4 w-4" /> },
  { label: "Tournaments", href: "/tournaments", icon: <Trophy className="h-4 w-4" /> },
  { label: "Vendor", href: "/vendor", icon: <Store className="h-4 w-4" /> },
];

function FooterLinkItem({ link }: { link: FooterLink }) {
  const className =
    "group inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white";
  const icon = link.icon ?? <ArrowUpRight className="h-3.5 w-3.5 text-orange-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />;

  if (link.href.startsWith("http") || link.href.startsWith("mailto:") || link.href.startsWith("tel:")) {
    return (
      <a href={link.href} className={className}>
        <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
        <span>{link.label}</span>
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
      <span>{link.label}</span>
    </Link>
  );
}

function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-white/10 bg-[#060a15] text-slate-300">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute right-0 top-24 h-72 w-72 translate-x-1/3 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <BrandLogo
              className="inline-flex"
              boxClassName="border-white/10 bg-white/5 shadow-none"
              logoBoxClassName="h-20 w-20 rounded-2xl sm:h-24 sm:w-24"
              imageClassName="p-2"
              showText={false}
            />

            <p className="max-w-md text-sm leading-6 text-slate-400 sm:text-base">
              Discover curated venues, book real slots, and keep your game moving across the city.
            </p>

            <div className="space-y-2.5 text-sm text-slate-400">
              <a href="mailto:info@bookyourvibe.in" className="flex items-center gap-3 transition hover:text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-orange-300">
                  <Mail className="h-4 w-4" />
                </span>
                <span>info@bookyourvibe.in</span>
              </a>
              <a href="tel:+918319963922" className="flex items-center gap-3 transition hover:text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-orange-300">
                  <PhoneCall className="h-4 w-4" />
                </span>
                <span>+91 83199 63922</span>
              </a>
              <a
                href="https://www.google.com/maps/search/Udaipur,+Rajasthan,+India"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 transition hover:text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-orange-300">
                  <MapPin className="h-4 w-4" />
                </span>
                <span>Udaipur, Rajasthan, India</span>
              </a>
            </div>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="space-y-4">
              <p className="text-sm font-bold uppercase tracking-[0.26em] text-white">{col.title}</p>
              <ul className="space-y-2.5">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <FooterLinkItem link={item} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-5 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs tracking-[0.16em] text-slate-500">
            © 2025 Book Your Vibe. All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            {FOOTER_QUICK_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                aria-label={link.label}
                title={link.label}
                className="group flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:-translate-y-0.5 hover:border-orange-400/30 hover:bg-orange-500/10 hover:text-white"
              >
                {link.icon}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ------------------------------------------------------------------ */
/*  AUTH MODAL SHELL                                                    */
/* ------------------------------------------------------------------ */

function ModalShell({
  children,
  onClose,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  subtitle?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-h-[calc(100dvh-1rem)] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-h-[92vh] sm:rounded-3xl sm:p-8"
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
        >
          ✕
        </button>
        <div className="mb-5 flex items-center gap-2">
          <BrandLogo
            className="gap-2"
            logoBoxClassName="h-9 w-9 rounded-xl"
            imageClassName="p-1"
            showText={false}
          />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-xs font-bold text-slate-600">{children}</label>;
}

const inputClass =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100";

/* ---------------------------- LOGIN MODAL --------------------------- */

function LoginModal({
  onClose,
  onLoginSuccess,
  onSwitchToSignup,
}: {
  onClose: () => void;
  onLoginSuccess: (name: string) => void;
  onSwitchToSignup: () => void;
}) {
  const [method, setMethod] = useState<"mobile" | "email">("mobile");
  const [mobile, setMobile] = useState("");
  const [emailVal, setEmailVal] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const sendOtp = useCallback(() => {
    if (mobile.replace(/\D/g, "").length !== 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    setOtpSent(true);
    // TODO: call /api/auth/send-otp
  }, [mobile]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (method === "mobile") {
        if (!otpSent) {
          sendOtp();
          return;
        }
        if (otp.length !== 6) {
          setError("Enter the 6-digit OTP sent to your mobile.");
          return;
        }
      } else {
        if (!emailVal || !password) {
          setError("Enter both email and password.");
          return;
        }
      }
      setError("");
      // TODO: call /api/auth/login
      onLoginSuccess(method === "mobile" ? `User${mobile.slice(-4)}` : emailVal.split("@")[0]);
    },
    [method, otpSent, otp, emailVal, password, mobile, onLoginSuccess, sendOtp]
  );

  return (
    <ModalShell onClose={onClose} title="Welcome back" subtitle="Login to continue your vibe.">
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
        {(["mobile", "email"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMethod(m);
              setError("");
            }}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              method === m ? "bg-white text-orange-600 shadow" : "text-slate-500"
            }`}
          >
            {m === "mobile" ? "Mobile OTP" : "Email & Password"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {method === "mobile" ? (
          <>
            <div>
              <FieldLabel>Mobile Number</FieldLabel>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  maxLength={10}
                  placeholder="98765 43210"
                  className={inputClass}
                  disabled={otpSent}
                />
                {!otpSent && (
                  <button
                    type="button"
                    onClick={sendOtp}
                    className="whitespace-nowrap rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Send OTP
                  </button>
                )}
              </div>
            </div>
            {otpSent && (
              <div>
                <FieldLabel>Enter OTP</FieldLabel>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  placeholder="6-digit OTP"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Sent to +91 {mobile}.{" "}
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="font-semibold text-orange-600"
                  >
                    Change number
                  </button>
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <FieldLabel>Email</FieldLabel>
              <input
                value={emailVal}
                onChange={(e) => setEmailVal(e.target.value)}
                type="email"
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel>Password</FieldLabel>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className={inputClass}
              />
              <p className="mt-1 text-right text-xs font-semibold text-orange-600">
                Forgot password?
              </p>
            </div>
          </>
        )}

        {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

        <PrimaryButton type="submit" className="w-full">
          {method === "mobile" && !otpSent ? "Continue" : "Login"}
        </PrimaryButton>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> or continue with{" "}
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:border-orange-300"
        >
          <span aria-hidden>🔵</span> Continue with Google
        </button>

        <p className="text-center text-sm text-slate-500">
          New to Book Your Vibe?{" "}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-semibold text-orange-600"
          >
            Create an account
          </button>
        </p>
      </form>
    </ModalShell>
  );
}

/* ---------------------------- SIGNUP MODAL --------------------------- */

const ROLE_OPTIONS: { id: Role; label: string; emoji: string; desc: string }[] = [
  { id: "player", label: "Player", emoji: "🏃", desc: "Book venues, join matches & events" },
  { id: "owner", label: "Venue Owner", emoji: "🏟️", desc: "List your venue, manage bookings" },
  { id: "food", label: "Food Owner", emoji: "🍔", desc: "Manage menu, orders & billing" },
];

function SignupModal({
  onClose,
  onSignupSuccess,
  onSwitchToLogin,
}: {
  onClose: () => void;
  onSignupSuccess: (name: string, role: Role) => void;
  onSwitchToLogin: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>("player");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [emailVal, setEmailVal] = useState("");
  const [password, setPassword] = useState("");
  // owner / food owner extra fields
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("Udaipur");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!role) {
      setError("Please choose a role to continue.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || mobile.replace(/\D/g, "").length !== 10 || !emailVal || !password) {
      setError("Please fill all required fields correctly.");
      return;
    }
    if ((role === "owner" || role === "food") && !businessName) {
      setError("Business / venue name is required for owner accounts.");
      return;
    }
    if (!agree) {
      setError("Please accept the Terms & Privacy Policy to continue.");
      return;
    }
    setError("");
    // TODO: call /api/auth/signup with { role, fullName, mobile, emailVal, password, businessName, city }
    onSignupSuccess(fullName.split(" ")[0], role);
  };

  return (
    <ModalShell
      onClose={onClose}
      title={step === 1 ? "Create your account" : "Just a few details"}
      subtitle={
        step === 1
          ? "Choose how you'll use Book Your Vibe."
          : `Signing up as ${ROLE_OPTIONS.find((r) => r.id === role)?.label}.`
      }
    >
      {step === 1 ? (
        <div className="flex flex-col gap-3">
          {ROLE_OPTIONS.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${
                role === r.id
                  ? "border-orange-500 bg-orange-50"
                  : "border-slate-100 hover:border-orange-200"
              }`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-xl shadow">
                {r.emoji}
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">{r.label}</p>
                <p className="text-xs text-slate-500">{r.desc}</p>
              </div>
              <span
                className={`ml-auto h-5 w-5 rounded-full border-2 ${
                  role === r.id ? "border-orange-500 bg-orange-500" : "border-slate-300"
                }`}
              />
            </button>
          ))}

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

          <PrimaryButton onClick={handleNext} className="mt-2 w-full">
            Continue
          </PrimaryButton>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <button onClick={onSwitchToLogin} className="font-semibold text-orange-600">
              Log in
            </button>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <FieldLabel>Full Name</FieldLabel>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Yashank Rajawat"
              className={inputClass}
            />
          </div>

          {(role === "owner" || role === "food") && (
            <div>
              <FieldLabel>
                {role === "owner" ? "Venue / Business Name" : "Food Outlet Name"}
              </FieldLabel>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={role === "owner" ? "Cricket Arena" : "Vibe Cafe"}
                className={inputClass}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Mobile Number</FieldLabel>
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                maxLength={10}
                placeholder="98765 43210"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel>City</FieldLabel>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={inputClass}
              >
                {["Udaipur", "Jaipur", "Ahmedabad", "Delhi", "Mumbai", "Bangalore"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <FieldLabel>Email</FieldLabel>
            <input
              value={emailVal}
              onChange={(e) => setEmailVal(e.target.value)}
              type="email"
              placeholder="you@example.com"
              className={inputClass}
            />
          </div>

          <div>
            <FieldLabel>Password</FieldLabel>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Create a strong password"
              className={inputClass}
            />
          </div>

          <label className="flex items-start gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5"
            />
            I agree to the <span className="font-semibold text-orange-600">Terms & Conditions</span>{" "}
            and <span className="font-semibold text-orange-600">Privacy Policy</span>.
          </label>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

          <div className="flex flex-col gap-3 sm:flex-row">
            <GhostButton onClick={() => setStep(1)} className="flex-1">
              Back
            </GhostButton>
            <PrimaryButton type="submit" className="flex-1">
              Create Account
            </PrimaryButton>
          </div>
        </form>
      )}
    </ModalShell>
  );
}

/* ---------------------------- ADMIN CONSOLE MODAL --------------------------- */

type Banner = { id: string; title: string; placement: string; active: boolean };
type AdminUser = { id: string; name: string; role: Role; status: "Active" | "Frozen" };

const INITIAL_BANNERS: Banner[] = [
  { id: "b1", title: "Flat 20% Off - Festival Sale", placement: "Player Home", active: true },
  { id: "b2", title: "Pickleball Launch Week", placement: "Offers Tab", active: true },
  { id: "b3", title: "Refer & Earn ₹100", placement: "Player Home", active: false },
];

const INITIAL_USERS: AdminUser[] = [
  { id: "u1", name: "Yashank Rajawat", role: "owner", status: "Active" },
  { id: "u2", name: "Lakshya Raj Audichya", role: "food", status: "Active" },
  { id: "u3", name: "Aman Sharma", role: "player", status: "Active" },
  { id: "u4", name: "Riya Verma", role: "player", status: "Frozen" },
];

function AdminConsoleModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"banners" | "users" | "master" | "audit">("banners");
  const [banners, setBanners] = useState<Banner[]>(INITIAL_BANNERS);
  const [users, setUsers] = useState<AdminUser[]>(INITIAL_USERS);
  const [newBannerTitle, setNewBannerTitle] = useState("");
  const [newBannerPlacement, setNewBannerPlacement] = useState("Player Home");
  const [sports, setSports] = useState<string[]>([
    "Cricket",
    "Badminton",
    "Pickleball",
    "Tennis",
    "Swimming",
  ]);
  const [newSport, setNewSport] = useState("");
  const [auditLog, setAuditLog] = useState<string[]>([
    "Admin created banner 'Flat 20% Off'",
    "Admin froze user Riya Verma",
  ]);

  const logAction = (msg: string) => setAuditLog((prev) => [msg, ...prev]);

  const addBanner = () => {
    if (!newBannerTitle) return;
    const banner: Banner = {
      id: `b${Date.now()}`,
      title: newBannerTitle,
      placement: newBannerPlacement,
      active: true,
    };
    setBanners((prev) => [banner, ...prev]);
    logAction(`Admin created banner '${newBannerTitle}' on ${newBannerPlacement}`);
    setNewBannerTitle("");
    // TODO: POST /api/admin/banners
  };

  const toggleBanner = (id: string) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b))
    );
    const b = banners.find((x) => x.id === id);
    if (b) logAction(`Admin ${b.active ? "disabled" : "enabled"} banner '${b.title}'`);
  };

  const removeBanner = (id: string) => {
    const b = banners.find((x) => x.id === id);
    setBanners((prev) => prev.filter((x) => x.id !== id));
    if (b) logAction(`Admin removed banner '${b.title}'`);
  };

  const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === "Active" ? "Frozen" : "Active" } : u
      )
    );
    const u = users.find((x) => x.id === id);
    if (u) logAction(`Admin ${u.status === "Active" ? "froze" : "unfroze"} user '${u.name}'`);
    // TODO: PATCH /api/admin/users/:id
  };

  const addSport = () => {
    if (!newSport) return;
    setSports((prev) => [...prev, newSport]);
    logAction(`Admin added sport category '${newSport}'`);
    setNewSport("");
  };

  const removeSport = (s: string) => {
    setSports((prev) => prev.filter((x) => x !== s));
    logAction(`Admin removed sport category '${s}'`);
  };

  const roleBadge = (role: Role) => {
    const map: Record<Role, string> = {
      player: "bg-blue-100 text-blue-700",
      owner: "bg-emerald-100 text-emerald-700",
      food: "bg-amber-100 text-amber-700",
    };
    const label: Record<Role, string> = {
      player: "Player",
      owner: "Venue Owner",
      food: "Food Owner",
    };
    return (
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${map[role]}`}>
        {label[role]}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[90vh] sm:rounded-3xl"
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
              Internal · Ops Only
            </p>
            <h2 className="text-xl font-extrabold text-slate-900">Master Admin Console</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          {/* sidebar tabs */}
          <div className="hidden w-48 flex-col gap-1 border-r border-slate-100 p-4 sm:flex">
            {[
              { id: "banners", label: "Banner CMS", icon: "🖼️" },
              { id: "users", label: "User Editor", icon: "👤" },
              { id: "master", label: "Master Data", icon: "🗂️" },
              { id: "audit", label: "Audit Log", icon: "📜" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                  tab === t.id
                    ? "bg-orange-50 text-orange-600"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>

          {/* mobile tab bar */}
          <div className="flex w-full gap-1 overflow-x-auto border-b border-slate-100 p-2 sm:hidden">
            {[
              { id: "banners", label: "Banners" },
              { id: "users", label: "Users" },
              { id: "master", label: "Master Data" },
              { id: "audit", label: "Audit" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  tab === t.id ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {tab === "banners" && (
              <div className="flex flex-col gap-5">
                <div className="rounded-2xl border border-dashed border-orange-300 bg-orange-50 p-4">
                  <p className="mb-3 text-sm font-bold text-slate-800">
                    Add new banner (drag-and-drop image upload simulated)
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      value={newBannerTitle}
                      onChange={(e) => setNewBannerTitle(e.target.value)}
                      placeholder="Banner title"
                      className={`${inputClass} sm:flex-1`}
                    />
                    <select
                      value={newBannerPlacement}
                      onChange={(e) => setNewBannerPlacement(e.target.value)}
                      className={`${inputClass} sm:w-48`}
                    >
                      <option>Player Home</option>
                      <option>Offers Tab</option>
                      <option>Events Tab</option>
                    </select>
                    <PrimaryButton onClick={addBanner}>Add Banner</PrimaryButton>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {banners.map((b) => (
                    <div
                      key={b.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-rose-400 text-white">
                          🖼️
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{b.title}</p>
                          <p className="text-xs text-slate-500">Placement: {b.placement}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          onClick={() => toggleBanner(b.id)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            b.active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {b.active ? "Active" : "Disabled"}
                        </button>
                        <button
                          onClick={() => removeBanner(b.id)}
                          className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "users" && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-500">
                  Edit any field, freeze/unfreeze accounts, or change role assignment.
                </p>
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{u.name}</p>
                        <div className="mt-1">{roleBadge(u.role)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleUserStatus(u.id)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        u.status === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-600"
                      }`}
                    >
                      {u.status}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {tab === "master" && (
              <div className="flex flex-col gap-5">
                <p className="text-sm text-slate-500">
                  Manage sport categories shown across the Player, Owner and Food apps.
                </p>
                <div className="flex gap-2">
                  <input
                    value={newSport}
                    onChange={(e) => setNewSport(e.target.value)}
                    placeholder="New sport / category name"
                    className={`${inputClass} flex-1`}
                  />
                  <PrimaryButton onClick={addSport}>Add</PrimaryButton>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sports.map((s) => (
                    <span
                      key={s}
                      className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700"
                    >
                      {s}
                      <button
                        onClick={() => removeSport(s)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {tab === "audit" && (
              <div className="flex flex-col gap-2">
                <p className="mb-2 text-sm text-slate-500">
                  Read-only trail of every admin action, for compliance & traceability.
                </p>
                {auditLog.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-sm text-slate-700"
                  >
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    {entry}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  ROOT PAGE COMPONENT                                                */
/* ------------------------------------------------------------------ */

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
        onQuickAction={handleQuickAction}
        onViewAllQuickActions={() => router.push("/games")}
      />

      {filteredVenuesNote !== null && (
        <p className="mx-auto -mt-8 max-w-7xl px-4 text-sm text-slate-500 sm:px-6">
          {filteredVenuesNote} venue(s) match &ldquo;{search}&rdquo;
        </p>
      )}

      <LaunchScreenPreview />

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
