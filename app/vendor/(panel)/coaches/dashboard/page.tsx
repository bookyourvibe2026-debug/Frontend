"use client";

import { useEffect, useState } from "react";
import { CalendarCheck2, IndianRupee, UserRoundCog } from "lucide-react";
import StatCard from "@/components/vendor/StatCard";
import { PageHero } from "@/components/vendor/ui";
import { getVendorCoachesDashboard } from "@/lib/api/vendor";
import { ApiError } from "@/lib/api/client";
import { VendorCoachesDashboard } from "@/lib/api/types";

export default function VendorCoachesDashboardPage() {
  const [dashboard, setDashboard] = useState<VendorCoachesDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVendorCoachesDashboard()
      .then(setDashboard)
      .catch((err) => setError(err instanceof ApiError ? err.describe() : "Failed to load dashboard"));
  }, []);

  const confirmedCount = dashboard?.bookingsByStatus.Confirmed ?? 0;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Coaches"
        title="Coaching business dashboard"
        description="Track your coaches, bookings, and earnings."
      />

      {error && <p className="rounded-xl2 border border-surface-border bg-white p-6 text-sm text-vibe-coral">{error}</p>}

      {!error && !dashboard && (
        <div className="rounded-xl2 border border-surface-border bg-white p-10 text-center text-sm text-ink-faint">Loading dashboard...</div>
      )}

      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <StatCard
            label="Earnings"
            value={`₹${dashboard.totalEarnings.toLocaleString("en-IN")}`}
            hint="From paid bookings"
            icon={IndianRupee}
            accent="lime"
          />
          <StatCard
            label="Confirmed Bookings"
            value={String(confirmedCount)}
            hint={`${dashboard.bookingCount} paid bookings total`}
            icon={CalendarCheck2}
            accent="violet"
          />
          <StatCard
            label="Active Coaches"
            value={String(dashboard.activeCoachCount)}
            hint="On your roster"
            icon={UserRoundCog}
            accent="amber"
          />
        </div>
      )}
    </div>
  );
}
