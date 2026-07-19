"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, QrCode } from "lucide-react";
import { PageHero, Badge } from "@/components/vendor/ui";
import { checkInVendorFoodOrder, getVendorFoodOrders, updateVendorFoodOrderStatus } from "@/lib/api/vendor";
import { ApiError } from "@/lib/api/client";
import { FoodOrder, FoodOrderStatus } from "@/lib/api/types";

const STATUS_TONE: Record<FoodOrderStatus, "success" | "pending" | "danger" | "info" | "neutral"> = {
  Pending: "pending",
  Accepted: "info",
  Rejected: "danger",
  Preparing: "info",
  Ready: "success",
  Delivered: "success",
  Cancelled: "neutral",
};

const STATUS_FILTERS: ("All" | FoodOrderStatus)[] = [
  "All",
  "Pending",
  "Accepted",
  "Preparing",
  "Ready",
  "Delivered",
  "Rejected",
  "Cancelled",
];

export default function VendorFoodOrdersPage() {
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"All" | FoodOrderStatus>("All");
  const [scanOrderId, setScanOrderId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ ok: boolean; message: string } | null>(null);

  const refresh = useCallback(() => {
    getVendorFoodOrders({ status: status === "All" ? undefined : status, limit: 200 })
      .then((result) => setOrders(result.items))
      .catch((err) => setError(err instanceof ApiError ? err.describe() : "Failed to load orders"))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleCheckIn(orderId: string) {
    if (!orderId.trim()) return;
    setScanning(true);
    setScanResult(null);
    try {
      const order = await checkInVendorFoodOrder(orderId.trim());
      setScanResult({ ok: true, message: `${order.customerName} — order marked delivered` });
      refresh();
    } catch (err) {
      setScanResult({ ok: false, message: err instanceof ApiError ? err.describe() : "Order not found" });
    } finally {
      setScanning(false);
    }
  }

  async function handleStatusChange(order: FoodOrder, next: FoodOrderStatus) {
    try {
      await updateVendorFoodOrderStatus(order.orderId, next);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.describe() : "Failed to update order");
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Food Owner"
        title="Food orders"
        description="Accept, prepare, and deliver incoming food orders from players."
        right={
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold">
            <ClipboardList size={16} /> {orders.length} Order(s)
          </span>
        }
      />

      <div className="rounded-xl2 border border-surface-border bg-white p-4 shadow-panel sm:p-5">
        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-vibe-violet">
          <QrCode size={13} /> Mark Delivered
        </p>
        <p className="mt-0.5 text-xs text-ink-faint">Enter the Order ID from the customer&apos;s order ticket to mark it delivered.</p>
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
            <CheckCircle2 size={15} /> {scanning ? "Checking..." : "Mark Delivered"}
          </button>
        </div>
        {scanResult && (
          <p className={`mt-2 text-xs font-semibold ${scanResult.ok ? "text-vibe-limeDark" : "text-vibe-coral"}`}>{scanResult.message}</p>
        )}
      </div>

      <div className="rounded-xl2 border border-surface-border bg-white shadow-panel">
        <div className="flex flex-wrap items-center gap-2 p-4 sm:p-5 border-b border-surface-border">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                status === s ? "bg-vibe-violet text-white" : "border border-surface-border text-ink-soft hover:bg-cream-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {error && <p className="px-5 py-3 text-xs text-vibe-coral">{error}</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-ink-faint border-b border-surface-border">
                <th className="px-5 py-3 font-semibold">Order ID</th>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Items</th>
                <th className="px-5 py-3 font-semibold text-right">Total</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-b border-surface-border last:border-0 hover:bg-cream-200/40">
                  <td className="px-5 py-4">
                    <p className="font-mono text-xs font-semibold text-ink">{o.orderId}</p>
                    <p className="text-[11px] text-ink-faint mt-0.5">{new Date(o.createdAt).toLocaleString("en-GB")}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-ink">{o.customerName}</p>
                    <p className="text-[11px] text-ink-faint">{o.phone}</p>
                  </td>
                  <td className="px-5 py-4 text-xs text-ink-soft">
                    {o.items.map((i, idx) => (
                      <p key={idx} className="whitespace-nowrap">
                        {i.name}
                        {i.variantLabel ? ` (${i.variantLabel})` : ""} ×{i.quantity}
                      </p>
                    ))}
                  </td>
                  <td className="px-5 py-4 text-right font-medium text-ink">₹{o.totalAmount.toLocaleString("en-IN")}</td>
                  <td className="px-5 py-4">
                    <Badge tone={STATUS_TONE[o.status]}>{o.status}</Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {o.status === "Pending" && (
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleStatusChange(o, "Accepted")}
                          className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-cream-300"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleStatusChange(o, "Rejected")}
                          className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold text-vibe-coral hover:bg-vibe-coral/10"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                    {o.status === "Accepted" && (
                      <button
                        onClick={() => handleStatusChange(o, "Preparing")}
                        className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-cream-300"
                      >
                        Start Preparing
                      </button>
                    )}
                    {o.status === "Preparing" && (
                      <button
                        onClick={() => handleStatusChange(o, "Ready")}
                        className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-cream-300"
                      >
                        Mark Ready
                      </button>
                    )}
                    {o.status === "Ready" && (
                      <button
                        onClick={() => handleCheckIn(o.orderId)}
                        className="rounded-lg bg-vibe-violet px-3 py-1.5 text-xs font-semibold text-white hover:bg-vibe-violetSoft"
                      >
                        Mark Delivered
                      </button>
                    )}
                    {["Delivered", "Rejected", "Cancelled"].includes(o.status) && <span className="text-ink-faint">—</span>}
                  </td>
                </tr>
              ))}
              {loading && (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-sm text-ink-faint">
                    Loading orders...
                  </td>
                </tr>
              )}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-sm text-ink-faint">
                    No orders match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
