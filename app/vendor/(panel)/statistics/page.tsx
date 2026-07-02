import { TrendingUp, Users, CalendarRange } from "lucide-react";
import { PageHero, SectionCard } from "@/components/vendor/ui";
import StatCard from "@/components/vendor/StatCard";
import { bookings, listings } from "@/lib/mock-data";

export default function StatisticsPage() {
  const totalRevenue = bookings.reduce((s, b) => s + b.yourEarning, 0);

  const byListing = listings.map((l) => {
    const listingBookings = bookings.filter((b) => b.listing === l.title);
    return {
      title: l.title,
      count: listingBookings.length,
      revenue: listingBookings.reduce((s, b) => s + b.yourEarning, 0),
    };
  });

  const maxRevenue = Math.max(1, ...byListing.map((b) => b.revenue));

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Insights"
        title="Statistics"
        description="See how your turfs, games and events are performing over time."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Revenue" value={`₹${totalRevenue.toLocaleString("en-IN")}`} hint="All-time earnings" icon={TrendingUp} accent="violet" />
        <StatCard label="Repeat Customers" value="0" hint="Booked more than once" icon={Users} accent="lime" />
        <StatCard label="Avg. Booking Lead Time" value="2 days" hint="Booking made vs slot date" icon={CalendarRange} accent="amber" />
      </div>

      <SectionCard title="Revenue by Listing" description="Which turfs, games or events are bringing in the most.">
        <div className="space-y-4">
          {byListing.map((l) => (
            <div key={l.title}>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="font-medium text-ink">{l.title}</span>
                <span className="text-ink-faint">
                  ₹{l.revenue.toLocaleString("en-IN")} · {l.count} booking(s)
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-cream-300 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-vibe-violet to-vibe-lime"
                  style={{ width: `${(l.revenue / maxRevenue) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
