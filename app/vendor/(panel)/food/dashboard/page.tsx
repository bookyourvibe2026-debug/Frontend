"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock3, IndianRupee, ListOrdered, PackageCheck } from "lucide-react";
import StatCard from "@/components/vendor/StatCard";
import { PageHero } from "@/components/vendor/ui";
import { getVendorFoodDashboard } from "@/lib/api/vendor";
import { ApiError } from "@/lib/api/client";
import { VendorFoodDashboard } from "@/lib/api/types";

const PERIODS: { value: "day" | "week" | "month" | "year"; label: string }[] = [
  { value: "day", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

export default function VendorFoodDashboardPage() {
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year">("day");
  const [dashboard, setDashboard] = useState<VendorFoodDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    getVendorFoodDashboard(period)
      .then(setDashboard)
      .catch((err) => setError(err instanceof ApiError ? err.describe() : "Failed to load dashboard"));
  }, [period]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const pendingCount = dashboard?.ordersByStatus.Pending ?? 0;
  const totalOrders = dashboard ? Object.values(dashboard.ordersByStatus).reduce((sum, n) => sum + (n ?? 0), 0) : 0;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Food Owner"
        title="Food revenue dashboard"
        description="Track incoming orders and revenue for your food business."
        right={
          <div className="flex gap-1.5 rounded-xl bg-white/10 p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  period === p.value ? "bg-white text-vibe-violet" : "text-white/80"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
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
            hint={`Delivered orders, ${PERIODS.find((p) => p.value === period)?.label.toLowerCase()}`}
            icon={IndianRupee}
            accent="lime"
          />
          <StatCard
            label="Delivered Orders"
            value={String(dashboard.deliveredOrderCount)}
            hint="Completed & billed"
            icon={PackageCheck}
            accent="violet"
          />
          <StatCard
            label="Pending Orders"
            value={String(pendingCount)}
            hint="Awaiting your response"
            icon={Clock3}
            accent="amber"
          />
          <StatCard
            label="Total Orders (All Time)"
            value={String(dashboard.allTimeOrderCount)}
            hint={`${totalOrders} in selected period`}
            icon={ListOrdered}
            accent="coral"
          />
        </div>
      )}
    </div>
  );
}
