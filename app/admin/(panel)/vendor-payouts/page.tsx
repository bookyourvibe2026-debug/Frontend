"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Search, Wallet } from "lucide-react";
import { Badge } from "@/components/vendor/ui";
import {
  payoutBookingsByVendor,
  payoutCategoriesSeed,
  payoutVendorEntriesSeed,
} from "@/lib/admin-mock-data";
import { PayoutVendorEntry } from "@/lib/types";

type Step = "category" | "vendor" | "bookings";

const STEPS: { id: Step; label: string }[] = [
  { id: "category", label: "Category" },
  { id: "vendor", label: "Vendor" },
  { id: "bookings", label: "Bookings" },
];

export default function VendorPayoutsPage() {
  const [step, setStep] = useState<Step>("category");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<PayoutVendorEntry | null>(null);
  const [typeFilter, setTypeFilter] = useState<"All" | "Standard" | "Affiliate">("All");
  const [statusFilter, setStatusFilter] = useState<"All" | PayoutVendorEntry["status"]>("All");
  const [query, setQuery] = useState("");

  const category = payoutCategoriesSeed.find((c) => c.id === categoryId);

  const entriesForCategory = useMemo(
    () => payoutVendorEntriesSeed.filter((e) => e.categoryId === categoryId),
    [categoryId]
  );

  const filteredEntries = useMemo(() => {
    return entriesForCategory.filter((e) => {
      const matchesType = typeFilter === "All" || e.type === typeFilter;
      const matchesStatus = statusFilter === "All" || e.status === statusFilter;
      const matchesQuery = e.vendorName.toLowerCase().includes(query.toLowerCase());
      return matchesType && matchesStatus && matchesQuery;
    });
  }, [entriesForCategory, typeFilter, statusFilter, query]);

  const totals = useMemo(() => {
    const totalVendors = new Set(entriesForCategory.map((e) => e.vendorId)).size;
    const settledBookings = entriesForCategory.reduce((sum, e) => sum + e.bookingsCount, 0);
    const paidAmount = entriesForCategory.filter((e) => e.status === "Paid").reduce((sum, e) => sum + e.amount, 0);
    return { totalVendors, settledBookings, paidAmount };
  }, [entriesForCategory]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
            <Wallet size={20} className="text-vibe-violet" /> Vendor Payouts
          </h1>
          <p className="mt-0.5 text-xs text-ink-faint">All vendor payout history.</p>
        </div>
        {step !== "category" && (
          <button
            onClick={() => (step === "bookings" ? setStep("vendor") : (setStep("category"), setCategoryId(null)))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border px-3.5 py-2 text-sm font-semibold text-ink-soft hover:bg-cream-300"
          >
            <ArrowLeft size={14} /> Back
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-3">
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                step === s.id ? "bg-vibe-violet text-white" : STEPS.findIndex((x) => x.id === step) > i ? "bg-vibe-limeDark text-white" : "bg-cream-300 text-ink-faint"
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-xs font-semibold uppercase tracking-wide ${step === s.id ? "text-ink" : "text-ink-faint"}`}>{s.label}</span>
            {i < STEPS.length - 1 && <span className="h-px w-8 bg-surface-border" />}
          </div>
        ))}
      </div>

      {step === "category" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {payoutCategoriesSeed.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCategoryId(c.id);
                setStep("vendor");
              }}
              className="rounded-xl2 border border-surface-border bg-white p-5 text-left shadow-panel transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white ${c.color}`}>{c.letter}</span>
              <p className="mt-3 font-semibold text-ink">{c.name}</p>
              <p className="mt-1 text-xs text-ink-faint">{c.subtitle}</p>
              <p className="mt-3 flex items-center gap-1 text-xs font-semibold text-vibe-violet">
                View Payouts <ArrowRight className="h-3.5 w-3.5" />
              </p>
            </button>
          ))}
        </div>
      )}

      {step === "vendor" && category && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatTile label="Total Vendors" value={totals.totalVendors} />
            <StatTile label="Settled Bookings" value={totals.settledBookings} />
            <StatTile label="Paid Amount" value={`₹${totals.paidAmount.toLocaleString("en-IN")}`} tone="green" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(["All", "Standard", "Affiliate"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${typeFilter === t ? "bg-ink text-white" : "bg-white text-ink-soft border border-surface-border"}`}
              >
                {t}
              </button>
            ))}
            <span className="mx-1 h-4 w-px bg-surface-border" />
            {(["All", "Pending", "Processing", "Paid", "Failed", "Cancelled"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${statusFilter === s ? "bg-vibe-violet text-white" : "bg-white text-ink-soft border border-surface-border"}`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="relative max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search vendor name..."
              className="w-full rounded-lg border border-surface-border bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-vibe-violet"
            />
          </div>

          <div className="overflow-x-auto rounded-xl2 border border-surface-border bg-white shadow-panel">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                  <th className="px-4 py-3">Vendor</th>
                  <th className="px-4 py-3">Type / Status</th>
                  <th className="px-4 py-3">Amount / Date</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((e) => (
                  <tr key={e.id} className="border-b border-surface-border last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">{e.vendorName}</p>
                      <p className="text-[11px] text-ink-faint">{e.bookingsCount} bookings</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Badge tone="info">{e.type}</Badge>
                        <Badge tone={e.status === "Paid" ? "success" : e.status === "Pending" ? "pending" : e.status === "Failed" || e.status === "Cancelled" ? "danger" : "neutral"}>
                          {e.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-ink">₹{e.amount.toLocaleString("en-IN")}</p>
                      <p className="text-[11px] text-ink-faint">{e.date}</p>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedVendor(e);
                          setStep("bookings");
                        }}
                        className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-cream-300"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-sm text-ink-faint">
                      No payouts match this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {step === "bookings" && selectedVendor && (
        <div className="rounded-xl2 border border-surface-border bg-white p-5 shadow-panel">
          <p className="font-display font-semibold text-ink">{selectedVendor.vendorName}</p>
          <p className="mb-4 text-xs text-ink-faint">
            {selectedVendor.type} payout · {selectedVendor.status} · ₹{selectedVendor.amount.toLocaleString("en-IN")}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-surface-border text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                  <th className="pb-2">Booking ID</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Listing</th>
                  <th className="pb-2">Owner Amount</th>
                </tr>
              </thead>
              <tbody>
                {(payoutBookingsByVendor[selectedVendor.vendorId] ?? []).map((b) => (
                  <tr key={b.bookingId} className="border-b border-surface-border last:border-0">
                    <td className="py-2 font-mono text-xs text-ink-soft">{b.bookingId}</td>
                    <td className="py-2 text-ink-soft">{b.customer}</td>
                    <td className="py-2 text-ink-soft">{b.listingName}</td>
                    <td className="py-2 font-semibold text-ink">₹{b.ownerAmount.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
                {(payoutBookingsByVendor[selectedVendor.vendorId] ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-xs text-ink-faint">
                      No individual booking breakdown available for this vendor yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, tone = "default" }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-xl2 border border-surface-border bg-white p-4 shadow-panel">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold ${tone === "green" ? "text-vibe-limeDark" : "text-ink"}`}>{value}</p>
    </div>
  );
}
