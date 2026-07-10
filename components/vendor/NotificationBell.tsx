"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { getVendorBookings } from "@/lib/api/vendor";
import { Booking } from "@/lib/types";

const LAST_SEEN_KEY = "byv-vendor-notifications-last-seen";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_DOT: Record<Booking["status"], string> = {
  Confirmed: "bg-emerald-500",
  Pending: "bg-amber-500",
  Cancelled: "bg-rose-500",
  Completed: "bg-slate-400",
};

export function NotificationBell() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState<string>("");

  useEffect(() => {
    setLastSeen(localStorage.getItem(LAST_SEEN_KEY) ?? new Date(0).toISOString());
  }, []);

  useEffect(() => {
    let cancelled = false;
    function poll() {
      getVendorBookings({ limit: 20 })
        .then((res) => {
          if (!cancelled) setBookings(res.items as unknown as Booking[]);
        })
        .catch(() => {});
    }
    poll();
    const id = setInterval(poll, 20_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const notifications = useMemo(() => {
    return [...bookings]
      .filter((b) => (b as any).createdAt)
      .sort((a, b) => new Date((b as any).createdAt).getTime() - new Date((a as any).createdAt).getTime())
      .slice(0, 15);
  }, [bookings]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => new Date((n as any).createdAt).getTime() > new Date(lastSeen).getTime()).length,
    [notifications, lastSeen]
  );

  function handleToggle() {
    setOpen((v) => !v);
    if (!open) {
      const now = new Date().toISOString();
      localStorage.setItem(LAST_SEEN_KEY, now);
      setLastSeen(now);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-cream-300 transition"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-vibe-coral text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button aria-label="Close notifications" className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-40 mt-2 w-80 max-h-96 overflow-y-auto rounded-2xl border border-surface-border bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-surface-border bg-white px-4 py-3">
              <p className="text-xs font-extrabold uppercase tracking-wide text-ink">Notifications</p>
              <span className="text-[10px] text-ink-faint">Live · updates every 20s</span>
            </div>
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-xs text-ink-faint">No recent activity.</p>
            ) : (
              <div className="divide-y divide-surface-border">
                {notifications.map((n) => (
                  <div key={n.orderId} className="flex items-start gap-2.5 px-4 py-3">
                    <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[n.status]}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-ink truncate">
                        {n.status === "Confirmed" ? "New booking" : n.status === "Pending" ? "Pending booking" : n.status === "Cancelled" ? "Booking cancelled" : "Booking completed"}
                        {" · "}
                        <span className="text-ink-soft">{n.customer}</span>
                      </p>
                      <p className="text-[10px] text-ink-faint mt-0.5">
                        ₹{n.totalAmount.toLocaleString("en-IN")} · {n.payment}
                      </p>
                    </div>
                    <span className="shrink-0 text-[10px] text-ink-faint">
                      {(n as any).createdAt ? timeAgo((n as any).createdAt) : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
