"use client";

import Link from "next/link";
import { ArrowRight, Building2, Calendar, MapPin, Swords, Users } from "lucide-react";
import { PrimaryButton, SectionHeading } from "./ui";

export function CommunityMatches({
  onJoin,
  onViewAll,
  onLaunchChallenge,
}: {
  onJoin: () => void;
  onViewAll: () => void;
  onLaunchChallenge: () => void;
}) {
  return (
    <section id="community" className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
      <SectionHeading
        eyebrow="Open right now"
        title="Community Matches & Upcoming Booking"
        subtitle="Find active players, keep an eye on your next slot, and challenge a player when you're ready."
        actionLabel="View All"
        onAction={onViewAll}
      />
      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Link
          href="/profile"
          className="group relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-left text-white shadow-xl shadow-slate-900/10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(249,115,22,0.34),transparent_34%),radial-gradient(circle_at_80%_100%,rgba(16,185,129,0.18),transparent_38%)]" />
          <div className="relative flex items-start justify-between gap-5">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-500/35 bg-orange-500/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-orange-300">
                <Calendar className="h-4 w-4" /> Upcoming Booking
              </span>
              <h3 className="mt-5 text-2xl font-black uppercase leading-tight">Cricket Arena · May 27</h3>
              <p className="mt-2 max-w-md text-sm font-medium text-slate-400">
                7:00 – 9:00 PM · 2 Courts booked · 10 players confirmed. Check in with your QR pass when you arrive.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <Building2 className="h-4 w-4 text-orange-400" />
                <Users className="h-4 w-4 text-emerald-300" />
                <span className="text-xs font-bold uppercase tracking-wide">2 Courts</span>
                <span className="text-xs font-bold uppercase tracking-wide">10 Players</span>
                <span className="inline-flex items-center gap-1 text-xs font-black uppercase tracking-wide text-orange-400">
                  View Details <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </div>
            </div>
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-500/30">
              <Calendar className="h-7 w-7" />
            </span>
          </div>
        </Link>

        <div className="flex flex-col gap-3 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between lg:flex-col lg:items-stretch">
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
              Open Match
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">Badminton Doubles</p>
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5" /> Shobhagpura · 1.2 km
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-brand-600">Today, 8:00 PM</p>
              <p className="text-xs text-slate-500">₹100 / Player</p>
            </div>
            <PrimaryButton onClick={onJoin}>Join Now</PrimaryButton>
          </div>
          <button
            type="button"
            onClick={onLaunchChallenge}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 py-2 text-xs font-bold text-slate-600 transition hover:border-brand-300 hover:text-brand-600"
          >
            <Swords className="h-3.5 w-3.5" /> Or Challenge a Player
          </button>
        </div>
      </div>
    </section>
  );
}
