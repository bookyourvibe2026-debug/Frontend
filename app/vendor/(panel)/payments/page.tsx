"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { PageHero } from "@/components/vendor/ui";
import StatCard from "@/components/vendor/StatCard";
import { Banknote, PiggyBank, Landmark, CircleDollarSign } from "lucide-react";
import { settledPayments } from "@/lib/mock-data";

export default function PaymentsPage() {
  const [tab, setTab] = useState<"online" | "offline">("online");

  const totalOnline = settledPayments.reduce((s, p) => s + p.yourEarning, 0);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Earnings"
        title="Payment settled"
        description="Track your online earnings, offline collections and pending settlements."
        right={
          <button className="inline-flex items-center gap-2 rounded-xl bg-white text-vibe-violet font-semibold text-sm px-4 py-2.5 hover:bg-white/90 transition-colors">
            <Download size={16} /> Export
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Offline Collection"
          value="₹0.00"
          hint="Direct cash payments collected at the venue"
          icon={Banknote}
          accent="amber"
        />
        <StatCard
          label="Total Online Earnings"
          value={`₹${totalOnline.toLocaleString("en-IN")}`}
          hint="Customer payments minus platform fee & tax"
          icon={CircleDollarSign}
          accent="violet"
        />
        <StatCard
          label="Amount Settled"
          value={`₹${totalOnline.toLocaleString("en-IN")}`}
          hint="Paid into your bank account"
          icon={PiggyBank}
          accent="lime"
        />
        <StatCard
          label="Remaining Settlement"
          value="₹0.00"
          hint="Pending transfer to your bank"
          icon={Landmark}
          accent="coral"
        />
      </div>

      <div className="rounded-xl2 border border-surface-border bg-white shadow-panel">
        <div className="flex gap-1 p-3 border-b border-surface-border">
          {(["online", "offline"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t ? "bg-vibe-violet text-white" : "text-ink-soft hover:bg-cream-300"
              }`}
            >
              {t === "online" ? "Online Bookings" : "Offline Collections"}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-ink-faint border-b border-surface-border">
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Listing Name</th>
                <th className="px-5 py-3 font-semibold">Order ID</th>
                <th className="px-5 py-3 font-semibold text-right">Total Amount</th>
                <th className="px-5 py-3 font-semibold text-right">Platform Fee</th>
                <th className="px-5 py-3 font-semibold text-right">Your Earning</th>
              </tr>
            </thead>
            <tbody>
              {tab === "online" ? (
                settledPayments.length > 0 ? (
                  settledPayments.map((p) => (
                    <tr key={p.orderId} className="border-b border-surface-border last:border-0 hover:bg-cream-200/40">
                      <td className="px-5 py-4 text-ink-soft">{p.date}</td>
                      <td className="px-5 py-4 font-medium text-ink">{p.listingName}</td>
                      <td className="px-5 py-4 font-mono text-xs text-ink-soft">{p.orderId}</td>
                      <td className="px-5 py-4 text-right text-ink">
                        ₹{p.totalAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-4 text-right text-ink-faint">
                        ₹{p.platformFee.toLocaleString("en-IN")}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-vibe-limeDark">
                        ₹{p.yourEarning.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))
                ) : (
                  <EmptyRow />
                )
              ) : (
                <EmptyRow />
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function EmptyRow() {
  return (
    <tr>
      <td colSpan={6} className="px-5 py-14 text-center text-sm text-ink-faint">
        No settlements yet — they will show up here once a payout is processed.
      </td>
    </tr>
  );
}
