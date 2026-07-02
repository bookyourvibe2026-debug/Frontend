"use client";

import { useMemo, useState } from "react";
import { Download, Search } from "lucide-react";
import { Badge } from "@/components/vendor/ui";
import { Toast } from "@/components/admin/Toast";
import { adminBookingsSeed, bookingsStats } from "@/lib/admin-mock-data";

const CSV_HEADERS = [
  "Booking ID",
  "Customer",
  "Listing",
  "Event Date",
  "Collected",
  "B2B Charge",
  "Taxes",
  "Affiliate Amt",
  "Owner Amount",
  "Status",
  "Payment",
];

export default function AdminBookingsPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [paymentFilter, setPaymentFilter] = useState("All Payment");
  const [toast, setToast] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return adminBookingsSeed.filter((b) => {
      const matchesQuery =
        b.customer.toLowerCase().includes(query.toLowerCase()) ||
        b.listingName.toLowerCase().includes(query.toLowerCase()) ||
        b.bookingId.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = statusFilter === "All Status" || b.status === statusFilter.toLowerCase();
      const matchesPayment = paymentFilter === "All Payment" || b.payment === paymentFilter.toLowerCase();
      return matchesQuery && matchesStatus && matchesPayment;
    });
  }, [query, statusFilter, paymentFilter]);

  function handleExport() {
    const rows = filtered.map((b) => [
      b.bookingId,
      b.customer,
      b.listingName,
      b.eventDate,
      b.collected,
      b.b2bCharge,
      b.taxes,
      b.affiliateAmt,
      b.ownerAmount,
      b.status,
      b.payment,
    ]);
    const csv = [CSV_HEADERS, ...rows].map((r) => r.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookings-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    setToast(`Exported ${filtered.length} bookings`);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Bookings Management</h1>
          <p className="mt-0.5 text-xs text-ink-faint">Manage all listing bookings and payments.</p>
        </div>
        <Badge tone="info">
          Total: {bookingsStats.total} | Results: {filtered.length}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Total" value={bookingsStats.total.toLocaleString("en-IN")} />
        <StatTile label="Confirmed" value={bookingsStats.confirmed.toLocaleString("en-IN")} tone="green" />
        <StatTile label="Revenue" value={`₹${bookingsStats.revenue.toLocaleString("en-IN")}`} tone="violet" />
        <StatTile label="Pending" value={bookingsStats.pending.toLocaleString("en-IN")} tone="amber" />
      </div>

      <div className="flex flex-col gap-3 rounded-xl2 border border-surface-border bg-white p-4 shadow-panel lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by customer, listing, or booking ID..."
            className="w-full rounded-lg border border-surface-border bg-cream-200/40 py-2 pl-9 pr-3 text-sm outline-none focus:border-vibe-violet"
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-surface-border bg-white px-3 py-2 text-sm">
          <option>All Status</option>
          <option>Confirmed</option>
          <option>Pending</option>
          <option>Cancelled</option>
        </select>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="rounded-lg border border-surface-border bg-white px-3 py-2 text-sm">
          <option>All Payment</option>
          <option>Completed</option>
          <option>Pending</option>
        </select>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 rounded-lg bg-vibe-lime px-4 py-2 text-sm font-semibold text-vibe-indigo hover:bg-vibe-lime/90"
        >
          <Download size={15} /> Export
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl2 border border-surface-border bg-white shadow-panel">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-surface-border text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
              <th className="px-4 py-3">Booking ID</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Listing</th>
              <th className="px-4 py-3">Event Date</th>
              <th className="px-4 py-3">Collected</th>
              <th className="px-4 py-3">B2B Charge</th>
              <th className="px-4 py-3">Taxes</th>
              <th className="px-4 py-3">Affiliate Amt</th>
              <th className="px-4 py-3">Owner Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Payment</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((b) => (
              <tr key={b.bookingId} className="border-b border-surface-border last:border-0">
                <td className="px-4 py-3 font-mono text-xs text-ink-soft">{b.bookingId}</td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-ink">{b.customer}</p>
                  <p className="text-xs text-ink-faint">{b.email}</p>
                  {b.isAffiliate && <Badge tone="info">Affiliate</Badge>}
                </td>
                <td className="px-4 py-3 text-ink-soft">{b.listingName}</td>
                <td className="px-4 py-3 text-ink-faint">
                  {b.eventDate}
                  <br />
                  <span className="text-[10px]">Booked {b.bookedOn}</span>
                </td>
                <td className="px-4 py-3 font-semibold text-ink">₹{b.collected.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-vibe-coral">₹{b.b2bCharge.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-vibe-coral">₹{b.taxes.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-vibe-coral">₹{b.affiliateAmt.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 font-semibold text-ink">₹{b.ownerAmount.toLocaleString("en-IN")}</td>
                <td className="px-4 py-3">
                  <Badge tone={b.status === "confirmed" ? "success" : b.status === "pending" ? "pending" : "danger"}>{b.status}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={b.payment === "completed" ? "success" : "pending"}>{b.payment}</Badge>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-sm text-ink-faint">
                  No bookings match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-between border-t border-surface-border px-4 py-3 text-xs text-ink-faint">
          <span>
            Showing 1-{filtered.length} of {bookingsStats.total}
          </span>
        </div>
      </div>

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}

const TONE_CLASSES: Record<string, string> = {
  default: "text-ink",
  green: "text-vibe-limeDark",
  violet: "text-vibe-violet",
  amber: "text-vibe-amber",
};

function StatTile({ label, value, tone = "default" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl2 border border-surface-border bg-white p-4 shadow-panel">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold ${TONE_CLASSES[tone]}`}>{value}</p>
    </div>
  );
}
