"use client";

import { useEffect, useState } from "react";
import { CalendarClock, IndianRupee, Ticket, Trophy } from "lucide-react";
import StatCard from "@/components/vendor/StatCard";
import { PageHero } from "@/components/vendor/ui";
import { getVendorEventsDashboard } from "@/lib/api/vendor";
import { ApiError } from "@/lib/api/client";
import { VendorEventsDashboard } from "@/lib/api/types";

export default function VendorEventsDashboardPage() {
  const [dashboard, setDashboard] = useState<VendorEventsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVendorEventsDashboard()
      .then(setDashboard)
      .catch((err) => setError(err instanceof ApiError ? err.describe() : "Failed to load dashboard"));
  }, []);

  const totalTournaments = dashboard
    ? Object.values(dashboard.tournamentsByStatus).reduce((sum, n) => sum + (n ?? 0), 0)
    : 0;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Events Organizer"
        title="Events & tournaments dashboard"
        description="Track your tournaments, registrations, and revenue."
      />

      {error && <p className="rounded-xl2 border border-surface-border bg-white p-6 text-sm text-vibe-coral">{error}</p>}

      {!error && !dashboard && (
        <div className="rounded-xl2 border border-surface-border bg-white p-10 text-center text-sm text-ink-faint">Loading dashboard...</div>
      )}

      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatCard
            label="Revenue"
            value={`₹${dashboard.totalRevenue.toLocaleString("en-IN")}`}
            hint="From paid registrations"
            icon={IndianRupee}
            accent="lime"
          />
          <StatCard
            label="Registrations"
            value={String(dashboard.registrationCount)}
            hint="Paid team registrations"
            icon={Ticket}
            accent="violet"
          />
          <StatCard
            label="Upcoming Tournaments"
            value={String(dashboard.upcomingTournamentCount)}
            hint="Scheduled ahead"
            icon={CalendarClock}
            accent="amber"
          />
          <StatCard
            label="Total Tournaments"
            value={String(totalTournaments)}
            hint="Across all statuses"
            icon={Trophy}
            accent="coral"
          />
        </div>
      )}
    </div>
  );
}
