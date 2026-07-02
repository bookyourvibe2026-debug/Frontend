"use client";

import { useMemo, useState } from "react";
import { Download, Eye, Plus, Search, SlidersHorizontal } from "lucide-react";
import { PageHero, Badge } from "@/components/vendor/ui";
import CreateBookingModal from "@/components/vendor/CreateBookingModal";
import { bookings as initialBookings } from "@/lib/mock-data";
import { Booking, BookingStatus } from "@/lib/types";

const STATUS_TONE: Record<BookingStatus, "success" | "pending" | "danger" | "info"> = {
  Confirmed: "success",
  Pending: "pending",
  Cancelled: "danger",
  Completed: "info",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [status, setStatus] = useState<"All" | BookingStatus>("All");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchesStatus = status === "All" || b.status === status;
      const q = query.toLowerCase();
      const matchesQuery =
        b.orderId.toLowerCase().includes(q) ||
        b.customer.toLowerCase().includes(q) ||
        b.listing.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [bookings, status, query]);

  const totals = filtered.reduce(
    (acc, b) => ({
      total: acc.total + b.totalAmount,
      earnings: acc.earnings + b.yourEarning,
    }),
    { total: 0, earnings: 0 }
  );

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Bookings"
        title="Bookings management"
        description="Track every reservation across your turfs, games and events in one place."
        right={
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-white text-vibe-violet font-semibold text-sm px-4 py-2.5 hover:bg-white/90 transition-colors"
          >
            <Plus size={16} /> Create Booking
          </button>
        }
      />

      <div className="rounded-xl2 border border-surface-border bg-white shadow-panel">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between p-4 sm:p-5 border-b border-surface-border">
          <div className="relative w-full lg:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Order ID / customer / listing"
              className="w-full rounded-lg border border-surface-border pl-9 pr-3 py-2.5 text-sm outline-none focus:border-vibe-violet"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="rounded-lg border border-surface-border px-3 py-2.5 text-sm outline-none focus:border-vibe-violet"
            >
              {["All", "Confirmed", "Pending", "Completed", "Cancelled"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-2.5 text-sm text-ink-soft hover:bg-cream-300">
              <SlidersHorizontal size={14} /> Filters
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-2.5 text-sm text-ink-soft hover:bg-cream-300">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-xs text-ink-faint border-b border-surface-border bg-cream-200/50">
          <span>Showing {filtered.length} of {bookings.length}</span>
          <span>
            Total ₹{totals.total.toLocaleString("en-IN")} &nbsp;|&nbsp; Your Earnings{" "}
            <span className="font-semibold text-ink">
              ₹{totals.earnings.toLocaleString("en-IN")}
            </span>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-ink-faint border-b border-surface-border">
                <th className="px-5 py-3 font-semibold">Order ID</th>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Listing</th>
                <th className="px-5 py-3 font-semibold text-right">Total Amount</th>
                <th className="px-5 py-3 font-semibold text-right">Your Earning</th>
                <th className="px-5 py-3 font-semibold">Payment</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.orderId} className="border-b border-surface-border last:border-0 hover:bg-cream-200/40">
                  <td className="px-5 py-4">
                    <p className="font-mono text-xs font-semibold text-ink">{b.orderId}</p>
                    <p className="text-[11px] text-ink-faint mt-0.5">{b.dateTime}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink">{b.customer}</p>
                    <p className="text-[11px] text-ink-faint">{b.phone}</p>
                  </td>
                  <td className="px-5 py-4 text-ink-soft">{b.listing}</td>
                  <td className="px-5 py-4 text-right font-medium text-ink">
                    ₹{b.totalAmount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-vibe-limeDark">
                    ₹{b.yourEarning.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone="info">{b.payment}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={STATUS_TONE[b.status]}>{b.status}</Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button className="h-8 w-8 rounded-lg border border-surface-border inline-flex items-center justify-center text-ink-soft hover:text-vibe-violet hover:border-vibe-violet">
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-14 text-center text-sm text-ink-faint">
                    No bookings match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateBookingModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(booking) => setBookings((prev) => [booking, ...prev])}
      />
    </div>
  );
}
