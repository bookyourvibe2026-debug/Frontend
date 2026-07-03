"use client";

import { Compass, CalendarCheck2, UserPlus, Activity, Users, Download, ArrowUp } from "lucide-react";
import { Badge } from "@/components/vendor/ui";
import { adminBookingsSeed, dashboardStats, stateBreakdown, topCities } from "@/lib/admin-mock-data";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<Compass size={18} />} label="Total Listings" value={dashboardStats.totalListings} growth={dashboardStats.totalListingsGrowth} />
        <StatCard icon={<CalendarCheck2 size={18} />} label="Total Bookings" value={dashboardStats.totalBookings} growth={dashboardStats.totalBookingsGrowth} />
        <StatCard icon={<UserPlus size={18} />} label="New Users" value={dashboardStats.newUsers} growth={dashboardStats.totalBookingsGrowth} />
      </div>

      <div className="rounded-xl2 border border-surface-border bg-white p-5 shadow-panel">
        <p className="text-[11px] font-bold uppercase tracking-wider text-vibe-violet">Mobile App Insights</p>
        <h2 className="mt-1 font-display text-lg font-semibold text-ink">App downloads &amp; active users ka live snapshot</h2>
        <p className="text-xs text-ink-faint">Active users last 30 days ke app activity data se aate hain.</p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MiniStat icon={<Activity size={16} />} label="Active Users" hint="Last 30 days" value={dashboardStats.activeUsersLast30Days} />
          <MiniStat icon={<Users size={16} />} label="Total Users" hint="Registered + guest users" value={dashboardStats.totalUsers} />
          <MiniStat icon={<Download size={16} />} label="Total Downloads" hint="Tracked via /mobile/downloads" value={dashboardStats.totalDownloads} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-cream-200/60 p-4 text-sm sm:grid-cols-4">
          <BreakdownItem label="Active registered users" value={dashboardStats.activeRegisteredUsers} />
          <BreakdownItem label="Total registered users" value={dashboardStats.totalRegisteredUsers} />
          <BreakdownItem label="Active guest users" value={dashboardStats.activeGuestUsers} />
          <BreakdownItem label="Total guest users" value={dashboardStats.totalGuestUsers} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-xl2 border border-surface-border bg-white p-5 shadow-panel">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-ink">Listing Trends</p>
            <div className="flex gap-2 text-xs">
              <span className="rounded-lg bg-cream-300 px-3 py-1.5 font-semibold text-ink-soft">
                Cities <span className="text-ink">{dashboardStats.cities}</span>
              </span>
              <span className="rounded-lg bg-cream-300 px-3 py-1.5 font-semibold text-ink-soft">
                States <span className="text-ink">{dashboardStats.states}</span>
              </span>
            </div>
          </div>

          <MapPlaceholder />

          <div className="mt-3 flex flex-wrap gap-2">
            {stateBreakdown.map((s) => (
              <span key={s.state} className="rounded-full border border-surface-border bg-white px-3 py-1 text-xs font-semibold text-ink-soft">
                {s.state} ({s.count})
              </span>
            ))}
          </div>

          <div className="mt-3 max-h-40 space-y-2 overflow-y-auto pr-1">
            {topCities.map((c) => (
              <div key={c.city} className="flex items-center justify-between rounded-lg border border-surface-border px-3 py-2 text-sm">
                <div>
                  <p className="font-semibold text-ink">{c.city}</p>
                  <p className="text-[11px] text-ink-faint">{c.state}</p>
                </div>
                <span className="font-semibold text-vibe-violet">{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl2 border border-surface-border bg-white p-5 shadow-panel">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-bold text-ink">Recent Bookings</p>
            <span className="text-xs text-ink-faint">Total: {adminBookingsSeed.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                  <th className="pb-2">Listing</th>
                  <th className="pb-2">Client</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {adminBookingsSeed.map((b) => (
                  <tr key={b.bookingId} className="border-t border-surface-border">
                    <td className="max-w-[160px] truncate py-2 pr-2 font-medium text-ink">{b.listingName}</td>
                    <td className="py-2 pr-2 text-ink-soft">{b.customer}</td>
                    <td className="py-2 pr-2">
                      <Badge tone={b.status === "confirmed" ? "success" : b.status === "pending" ? "pending" : "danger"}>
                        {b.status.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-2 text-ink-faint">{b.eventDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, growth }: { icon: React.ReactNode; label: string; value: number; growth: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl2 border border-surface-border bg-white p-5 shadow-panel">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</p>
        <p className="mt-1 font-display text-2xl font-bold text-ink">{value.toLocaleString("en-IN")}</p>
        <p className="mt-0.5 flex items-center gap-0.5 text-xs font-semibold text-vibe-limeDark">
          <ArrowUp className="h-3 w-3" /> {growth}%
        </p>
      </div>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-vibe-violet/10 text-vibe-violet">{icon}</span>
    </div>
  );
}

function MiniStat({ icon, label, hint, value }: { icon: React.ReactNode; label: string; hint: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-surface-border p-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</p>
        <p className="mt-1 font-display text-xl font-bold text-ink">{value.toLocaleString("en-IN")}</p>
        <p className="mt-0.5 text-[11px] text-ink-faint">{hint}</p>
      </div>
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-300 text-ink-soft">{icon}</span>
    </div>
  );
}

function BreakdownItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-soft">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

function MapPlaceholder() {
  const dots = [
    { top: "30%", left: "42%", size: 18 },
    { top: "45%", left: "38%", size: 12 },
    { top: "55%", left: "50%", size: 14 },
    { top: "38%", left: "58%", size: 10 },
    { top: "62%", left: "44%", size: 9 },
  ];
  return (
    <div className="relative h-48 overflow-hidden rounded-xl border border-surface-border bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.06)_1px,transparent_0)] [background-size:16px_16px]">
      {dots.map((d, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-orange-500/70"
          style={{ top: d.top, left: d.left, width: d.size, height: d.size }}
        />
      ))}
      <span className="absolute bottom-1.5 right-2 text-[9px] text-ink-faint">Illustrative map preview (demo)</span>
    </div>
  );
}
