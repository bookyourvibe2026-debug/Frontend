"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  ClipboardList,
  Clock3,
  IndianRupee,
  ListOrdered,
  PackageCheck,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { MpinGate } from "@/components/vendor/MpinGate";
import { getVendorFoodDashboard } from "@/lib/api/vendor";
import { ApiError } from "@/lib/api/client";
import { VendorFoodDashboard } from "@/lib/api/types";

const PERIODS: { value: "day" | "week" | "month" | "year"; label: string }[] = [
  { value: "day", label: "Today" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

const STATUS_DOT: Record<string, string> = {
  Delivered: "bg-emerald-500",
  Pending: "bg-amber-500",
  Accepted: "bg-sky-500",
  Preparing: "bg-violet-500",
  Ready: "bg-teal-500",
  Rejected: "bg-rose-500",
  Cancelled: "bg-slate-400",
};

function timeAgo(iso: string) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function VendorFoodDashboardPage() {
  return (
    <MpinGate title="Food Dashboard">
      <FoodDashboardContent />
    </MpinGate>
  );
}

function FoodDashboardContent() {
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year">("day");
  const [d, setD] = useState<VendorFoodDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getVendorFoodDashboard(period)
      .then(setD)
      .catch((err) => setError(err instanceof ApiError ? err.describe() : "Failed to load dashboard"));
  }, [period]);

  const chart = useMemo(() => d?.chart ?? [], [d]);
  const maxOrders = useMemo(() => Math.max(1, ...chart.map((c) => c.orders)), [chart]);
  const pending = d?.ordersByStatus.Pending ?? 0;
  const latest = d?.recentOrders?.[0];

  const PRIMARY = [
    { key: "rev", label: "Revenue", value: `₹${(d?.totalRevenue ?? 0).toLocaleString("en-IN")}`, hint: "Delivered orders", icon: IndianRupee, ring: "from-emerald-50", tint: "text-emerald-600", bar: "bg-emerald-500" },
    { key: "delivered", label: "Delivered", value: String(d?.deliveredOrderCount ?? 0), hint: "Completed & billed", icon: PackageCheck, ring: "from-violet-50", tint: "text-vibe-violet", bar: "bg-vibe-violet" },
    { key: "pending", label: "Pending", value: String(pending), hint: "Awaiting your response", icon: Clock3, ring: "from-amber-50", tint: "text-amber-600", bar: "bg-amber-500" },
    { key: "all", label: "All-time Orders", value: String(d?.allTimeOrderCount ?? 0), hint: "Since you joined", icon: ListOrdered, ring: "from-rose-50", tint: "text-rose-600", bar: "bg-rose-500" },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-vibe-indigo via-vibe-violet to-vibe-violetSoft p-5 text-white shadow-pop">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-vibe-lime/20 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-vibe-lime shadow-[0_0_8px_rgba(190,242,100,0.9)]" /> Food Report
            </p>
            <h1 className="mt-1 font-display text-2xl font-semibold leading-tight">Food Dashboard</h1>
            <p className="text-xs text-white/70">Orders, revenue & kitchen ops — secured behind your MPIN.</p>
          </div>
        </div>
        <div className="relative mt-4 inline-flex overflow-hidden rounded-full bg-white/10 p-1 text-xs font-bold">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-full px-3.5 py-1.5 transition ${
                period === p.value ? "bg-white text-vibe-violet" : "text-white/80 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="rounded-xl2 border border-surface-border bg-white p-6 text-sm text-vibe-coral">{error}</p>}

      {latest && (
        <div className="flex items-center gap-3 rounded-2xl border border-vibe-violet/20 bg-vibe-violet/5 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-vibe-violet/15 text-vibe-violet"><Bell size={16} /></div>
          <p className="text-sm text-ink">
            <span className="font-semibold">{latest.customerName}</span> ordered{" "}
            <span className="font-semibold">
              {latest.items[0]?.name}
              {latest.items.length > 1 ? ` +${latest.items.length - 1} more` : ""}
            </span>
            <span className="text-ink-faint"> · ₹{latest.totalAmount.toLocaleString("en-IN")} · {timeAgo(latest.createdAt)}</span>
          </p>
        </div>
      )}

      {/* Primary stats */}
      <div className="grid grid-cols-2 gap-3">
        {PRIMARY.map((s) => (
          <div key={s.key} className="relative overflow-hidden rounded-2xl border border-surface-border bg-white p-4 shadow-panel">
            <div className={`absolute right-0 top-0 h-14 w-14 bg-gradient-to-bl ${s.ring} to-transparent`} />
            <div className="relative mb-2 flex items-center justify-between">
              <p className={`text-[10px] font-extrabold uppercase tracking-wider ${s.tint}`}>{s.label}</p>
              <s.icon size={16} className={s.tint} />
            </div>
            <p className="relative text-2xl font-black text-ink">{d ? s.value : "—"}</p>
            <p className="relative mt-1 text-[11px] text-ink-faint">{s.hint}</p>
            <div className={`absolute inset-x-0 bottom-0 h-1 ${s.bar}`} />
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/vendor/food/profile" className="flex flex-col items-center gap-2 rounded-2xl border border-surface-border bg-white p-4 text-center shadow-panel transition hover:bg-cream-200/50">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-vibe-violet/10 text-vibe-violet"><Store size={20} /></span>
          <span className="text-xs font-semibold text-ink">Restaurants</span>
        </Link>
        <Link href="/vendor/food/menu" className="flex flex-col items-center gap-2 rounded-2xl border border-surface-border bg-white p-4 text-center shadow-panel transition hover:bg-cream-200/50">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-50 text-amber-600"><UtensilsCrossed size={20} /></span>
          <span className="text-xs font-semibold text-ink">Menu</span>
        </Link>
        <Link href="/vendor/food/orders" className="flex flex-col items-center gap-2 rounded-2xl border border-surface-border bg-white p-4 text-center shadow-panel transition hover:bg-cream-200/50">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><ClipboardList size={20} /></span>
          <span className="text-xs font-semibold text-ink">Orders</span>
        </Link>
      </div>

      {/* Orders trend */}
      <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-panel">
        <div className="mb-4">
          <h2 className="font-display font-semibold text-ink">Orders Trend</h2>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Last 14 days</p>
        </div>
        <div className="flex h-36 items-end gap-1.5">
          {chart.map((pt, i) => {
            const h = Math.max(4, (pt.orders / maxOrders) * 120);
            return (
              <div key={pt.date} className="group flex flex-1 flex-col items-center justify-end gap-1.5">
                <div className="relative w-full">
                  <div className="w-full rounded-t-md bg-vibe-violet/80 transition-all group-hover:bg-vibe-violet" style={{ height: `${h}px` }} />
                  <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100">
                    {pt.orders} order{pt.orders === 1 ? "" : "s"} · ₹{pt.revenue.toLocaleString("en-IN")}
                  </div>
                </div>
                <span className="h-3 text-[9px] font-semibold text-ink-faint">{i % 2 === 0 ? pt.label.split(" ")[0] : ""}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent orders */}
      <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-panel">
        <h2 className="mb-4 flex items-center gap-2 font-display font-semibold text-ink">
          <ClipboardList size={16} className="text-vibe-violet" /> Recent Orders
          <span className="rounded-full bg-cream-300 px-2 py-0.5 text-[11px] font-semibold text-ink-faint">Top 8</span>
        </h2>
        {!d ? (
          <p className="py-8 text-center text-sm text-ink-faint">Loading…</p>
        ) : d.recentOrders.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-cream-300 text-ink-faint"><ClipboardList size={22} /></div>
            <p className="text-sm text-ink-faint">No orders yet — build your menu so customers can order.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-surface-border text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                  <th className="py-2 pr-3 text-left">Customer</th>
                  <th className="py-2 px-3 text-left">Items</th>
                  <th className="py-2 px-3 text-right">Total</th>
                  <th className="py-2 px-3 text-left">Status</th>
                  <th className="py-2 pl-3 text-right">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {d.recentOrders.map((o) => (
                  <tr key={o.orderId} className="hover:bg-cream-200/50">
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-vibe-violet/10 text-xs font-bold uppercase text-vibe-violet">
                          {o.customerName?.charAt(0) || "?"}
                        </div>
                        <span className="font-semibold text-ink">{o.customerName}</span>
                      </div>
                    </td>
                    <td className="max-w-[180px] truncate px-3 text-ink-soft">
                      {o.items.map((it) => `${it.name}${it.variantLabel ? ` (${it.variantLabel})` : ""} ×${it.quantity}`).join(", ")}
                    </td>
                    <td className="px-3 text-right font-semibold text-ink">₹{o.totalAmount.toLocaleString("en-IN")}</td>
                    <td className="px-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-soft">
                        <span className={`h-2 w-2 rounded-full ${STATUS_DOT[o.status] ?? "bg-slate-400"}`} />
                        {o.status}
                      </span>
                    </td>
                    <td className="pl-3 text-right text-xs text-ink-faint">{timeAgo(o.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
