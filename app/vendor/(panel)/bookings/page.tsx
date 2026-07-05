"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Download, Plus, QrCode, Search, SlidersHorizontal } from "lucide-react";
import { PageHero, Badge } from "@/components/vendor/ui";
import CreateBookingModal from "@/components/vendor/CreateBookingModal";
import { checkInVendorBooking, getVendorBookings } from "@/lib/api/vendor";
import { ApiError } from "@/lib/api/client";
import { Booking, BookingStatus } from "@/lib/api/types";

const STATUS_TONE: Record<BookingStatus, "success" | "pending" | "danger" | "info"> = {
  Confirmed: "success",
  Pending: "pending",
  Cancelled: "danger",
  Completed: "info",
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"All" | BookingStatus>("All");
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [scanOrderId, setScanOrderId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ ok: boolean; message: string } | null>(null);

  const refresh = useCallback(() => {
    getVendorBookings({ status: status === "All" ? undefined : status, limit: 200 })
      .then((result) => setBookings(result.items))
      .catch((err) => setError(err instanceof ApiError ? err.describe() : "Failed to load bookings"))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return bookings.filter(
      (b) => b.orderId.toLowerCase().includes(q) || b.customerName.toLowerCase().includes(q)
    );
  }, [bookings, query]);

  const totals = filtered.reduce(
    (acc, b) => ({
      total: acc.total + b.totalAmount,
      earnings: acc.earnings + b.vendorEarning,
    }),
    { total: 0, earnings: 0 }
  );

  function handleExport() {
    const rows = filtered.map((b) => [b.orderId, b.customerName, b.phone, b.dateTime, b.totalAmount, b.vendorEarning, b.payment, b.status]);
    const csv = [["Order ID", "Customer", "Phone", "Date/Time", "Total", "Your Earning", "Payment", "Status"], ...rows]
      .map((r) => r.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookings-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCheckIn(orderId: string) {
    if (!orderId.trim()) return;
    setScanning(true);
    setScanResult(null);
    try {
      const booking = await checkInVendorBooking(orderId.trim());
      setScanResult({ ok: true, message: `${booking.customerName} — ${booking.checkedInAt ? "checked in" : "confirmed"} for ${new Date(booking.dateTime).toLocaleString("en-GB")}` });
      refresh();
    } catch (err) {
      setScanResult({ ok: false, message: err instanceof ApiError ? err.describe() : "Booking not found" });
    } finally {
      setScanning(false);
    }
  }

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

      <div className="rounded-xl2 border border-surface-border bg-white p-4 shadow-panel sm:p-5">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-vibe-violet">
          <QrCode size={13} /> Check-in
        </p>
        <p className="mt-0.5 text-xs text-ink-faint">Enter the Order ID from the player&apos;s QR pass to check them in at the gate.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={scanOrderId}
            onChange={(e) => setScanOrderId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCheckIn(scanOrderId)}
            placeholder="e.g. BYV-MR7FB67W-1EFF26"
            className="flex-1 rounded-lg border border-surface-border px-3 py-2.5 text-sm font-mono outline-none focus:border-vibe-violet"
          />
          <button
            onClick={() => handleCheckIn(scanOrderId)}
            disabled={scanning}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-vibe-violet px-5 py-2.5 text-sm font-semibold text-white hover:bg-vibe-violetSoft disabled:opacity-60"
          >
            <CheckCircle2 size={15} /> {scanning ? "Checking..." : "Check In"}
          </button>
        </div>
        {scanResult && (
          <p className={`mt-2 text-xs font-semibold ${scanResult.ok ? "text-vibe-limeDark" : "text-vibe-coral"}`}>{scanResult.message}</p>
        )}
      </div>

      <div className="rounded-xl2 border border-surface-border bg-white shadow-panel">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between p-4 sm:p-5 border-b border-surface-border">
          <div className="relative w-full lg:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Order ID / customer"
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
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-2.5 text-sm text-ink-soft hover:bg-cream-300"
            >
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {error && <p className="px-5 py-3 text-xs text-vibe-coral">{error}</p>}

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
                <th className="px-5 py-3 font-semibold text-right">Total Amount</th>
                <th className="px-5 py-3 font-semibold text-right">Your Earning</th>
                <th className="px-5 py-3 font-semibold">Payment</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Check-in</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b._id} className="border-b border-surface-border last:border-0 hover:bg-cream-200/40">
                  <td className="px-5 py-4">
                    <p className="font-mono text-xs font-semibold text-ink">{b.orderId}</p>
                    <p className="text-[11px] text-ink-faint mt-0.5">{new Date(b.dateTime).toLocaleString("en-GB")}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink">{b.customerName}</p>
                    <p className="text-[11px] text-ink-faint">{b.phone}</p>
                  </td>
                  <td className="px-5 py-4 text-right font-medium text-ink">
                    ₹{b.totalAmount.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-vibe-limeDark">
                    ₹{b.vendorEarning.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone="info">{b.payment}</Badge>
                  </td>
                  <td className="px-5 py-4">
                    <Badge tone={STATUS_TONE[b.status]}>{b.status}</Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {b.checkedIn ? (
                      <Badge tone="success">
                        <CheckCircle2 size={11} /> Checked in
                      </Badge>
                    ) : b.status === "Confirmed" ? (
                      <button
                        onClick={() => handleCheckIn(b.orderId)}
                        className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-cream-300"
                      >
                        Check In
                      </button>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-sm text-ink-faint">
                    Loading bookings...
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center text-sm text-ink-faint">
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
        onCreate={() => refresh()}
      />
    </div>
  );
}
