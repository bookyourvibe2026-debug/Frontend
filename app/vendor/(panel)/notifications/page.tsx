"use client";

import { useEffect, useMemo, useState } from "react";
import { getVendorBookings, getVendorListings, updateVendorBookingStatus } from "@/lib/api/vendor";
import { apiListingToMock } from "@/lib/api/listingAdapter";
import { Booking, Listing } from "@/lib/types";
import {
  Bell,
  Phone,
  MessageSquare,
  CheckCircle2,
  SlidersHorizontal,
  CheckCheck,
  Settings,
  History,
  ThumbsUp,
  CalendarDays,
} from "lucide-react";
import { MessageTemplatesModal, type MessageTemplateContext } from "@/components/vendor/MessageTemplatesModal";
import { NotificationRow, type RowTone, type BookingSource } from "@/components/vendor/notifications/NotificationRow";

/** Vendor bookings carry more than the shared mock type models. */
type ApiBooking = Booking & {
  listingId?: string;
  customerName?: string;
  phone?: string;
  checkedIn?: boolean;
  checkedInAt?: string | null;
  endTime?: string;
};

type Tab = "All" | "Today" | "Tomorrow" | "Payments" | "Past";
const TABS: Tab[] = ["All", "Today", "Tomorrow", "Payments", "Past"];

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Relative label from now, e.g. "in 15 min" / "Just now" / "2 hr ago". */
function relative(target: Date, now: number) {
  const diff = target.getTime() - now;
  const mins = Math.round(Math.abs(diff) / 60_000);
  if (mins < 1) return "Just now";
  const fmt = mins < 60 ? `${mins} min` : mins < 1440 ? `${Math.round(mins / 60)} hr` : `${Math.round(mins / 1440)} day`;
  return diff > 0 ? `in ${fmt}` : `${fmt} ago`;
}

export default function NotificationsPage() {
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [read, setRead] = useState<Set<string>>(new Set());
  /** Bookings the vendor handed to BYV to chase (local until a backend field exists). */
  const [handled, setHandled] = useState<Set<string>>(new Set());
  const [historyFor, setHistoryFor] = useState<string | null>(null);
  const [messageCtx, setMessageCtx] = useState<MessageTemplateContext | null>(null);

  // Lazy initialiser — Date.now() must not run during render.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    Promise.all([getVendorBookings({ limit: 100 }), getVendorListings()])
      .then(([b, l]) => {
        setBookings(b.items as unknown as ApiBooking[]);
        setListings(l.map(apiListingToMock));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const courtName = (b: ApiBooking) =>
    listings.find((l) => l.id === b.listingId || l.id === b.listing)?.title;

  /** How many times each phone number has booked at this venue. */
  const playCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of bookings) {
      const key = b.phone ?? b.customerName ?? b.customer;
      if (!key) continue;
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    return m;
  }, [bookings]);

  const rows = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    return bookings
      .filter((b) => b.status !== "Cancelled")
      .map((b) => {
        const start = new Date(b.dateTime);
        const end = b.endTime
          ? new Date(`${start.toISOString().slice(0, 10)}T${b.endTime}:00`)
          : new Date(start.getTime() + 60 * 60_000);

        const isTomorrow = isSameDay(start, tomorrow);
        const isToday = isSameDay(start, today);
        const isPast = end.getTime() < now;
        const paidInFull = b.paymentStatus === "paid";

        // Colour precedence: payment state first, then tomorrow's bookings.
        let tone: RowTone = "neutral";
        let statusLine = "Booking Confirmed";
        if (!paidInFull) {
          tone = "partial";
          statusLine = "Payment Pending";
        } else if (isTomorrow) {
          tone = "tomorrow";
          statusLine = "Booking Confirmed";
        } else if (paidInFull) {
          tone = "paid";
          statusLine = b.checkedIn ? "QR Check-in Completed" : "Booking Confirmed";
        }
        if (b.checkedIn) statusLine = "QR Check-in Completed";
        if (b.status === "Pending") statusLine = "Booking request";

        const source: BookingSource = b.payment === "Cash (Offline)" ? "F" : "O";
        const name = b.customerName ?? b.customer ?? "Guest";

        return {
          booking: b,
          key: b.orderId,
          name,
          statusLine,
          tone,
          source,
          start,
          end,
          isToday,
          isTomorrow,
          isPast,
          paidInFull,
          playedTimes: playCounts.get(b.phone ?? name) ?? 1,
        };
      })
      .sort((a, z) => a.start.getTime() - z.start.getTime());
  }, [bookings, now, playCounts]);

  const counts = useMemo(
    () => ({
      All: rows.length,
      Today: rows.filter((r) => r.isToday && !r.isPast).length,
      Tomorrow: rows.filter((r) => r.isTomorrow).length,
      Payments: rows.filter((r) => !r.paidInFull).length,
      Past: rows.filter((r) => r.isPast).length,
    }),
    [rows]
  );

  const visible = useMemo(() => {
    switch (tab) {
      case "Today":
        return rows.filter((r) => r.isToday && !r.isPast);
      case "Tomorrow":
        return rows.filter((r) => r.isTomorrow);
      case "Payments":
        return rows.filter((r) => !r.paidInFull);
      case "Past":
        return rows.filter((r) => r.isPast);
      default:
        return rows;
    }
  }, [rows, tab]);

  async function acknowledge(orderId: string) {
    try {
      await updateVendorBookingStatus(orderId, "Confirmed");
      setBookings((prev) => prev.map((b) => (b.orderId === orderId ? { ...b, status: "Confirmed" } : b)));
    } catch {
      alert("Failed to acknowledge booking");
    }
  }

  /** Past bookings for one customer — the "Booking History" drill-down. */
  const historyRows = useMemo(() => {
    if (!historyFor) return [];
    return bookings
      .filter((b) => (b.phone ?? b.customerName ?? b.customer) === historyFor)
      .sort((a, z) => new Date(z.dateTime).getTime() - new Date(a.dateTime).getTime());
  }, [historyFor, bookings]);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12 font-sans text-slate-800">
      {/* Header */}
      <div className="mx-[-16px] mt-[-24px] mb-4 flex items-center gap-3 rounded-b-2xl bg-white px-5 py-4 shadow-sm sm:mx-[-24px]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <Bell size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-[16px] font-black tracking-tight text-slate-900">Notifications</h1>
          <p className="text-[10px] font-medium text-slate-400">Stay updated on your bookings &amp; venue</p>
        </div>
        <HeaderAction icon={SlidersHorizontal} label="Filter" onClick={() => setTab(tab === "Payments" ? "All" : "Payments")} />
        <HeaderAction icon={CheckCheck} label="Mark all read" onClick={() => setRead(new Set(rows.map((r) => r.key)))} />
        <HeaderAction icon={Settings} label="Settings" href="/vendor/profile" />
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((t) => {
          const active = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] font-black transition ${
                active ? "bg-emerald-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              {t}
              <span
                className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[8px] font-black ${
                  active ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {counts[t]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mb-2.5 flex items-center gap-2">
        <CalendarDays size={13} className="text-slate-400" />
        <h2 className="text-[11px] font-black text-slate-700">Upcoming Bookings &amp; Activity</h2>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-sm font-bold text-slate-400">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
          Loading…
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-10 text-center text-sm font-bold text-slate-400">
          Nothing here right now.
        </div>
      ) : (
        visible.map((r, i) => (
          <NotificationRow
            key={r.key}
            name={r.name}
            statusLine={r.statusLine}
            timeRange={`${fmtTime(r.start)} – ${fmtTime(r.end)}`}
            courtName={courtName(r.booking)}
            when={relative(r.start, now)}
            tone={r.tone}
            source={r.source}
            playedTimes={r.playedTimes}
            amount={!r.paidInFull ? r.booking.totalAmount : undefined}
            amountNote={!r.paidInFull ? `Due ${relative(r.start, now)}` : undefined}
            isLast={i === visible.length - 1}
            expanded={expanded === r.key}
            unread={!read.has(r.key)}
            onToggle={() => {
              setExpanded(expanded === r.key ? null : r.key);
              setRead((prev) => new Set(prev).add(r.key));
            }}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                {r.booking.phone && (
                  <a
                    href={`tel:${r.booking.phone}`}
                    className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-[10px] font-black text-slate-700"
                  >
                    <Phone size={10} className="text-slate-400" /> {r.booking.phone}
                  </a>
                )}
                <span className="text-[9px] font-black tracking-wide text-slate-400">ID: {r.booking.orderId}</span>
              </div>

              {r.booking.checkedIn && (
                <p className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-[9px] font-black text-emerald-700">
                  Checked in{r.booking.checkedInAt ? ` at ${fmtTime(new Date(r.booking.checkedInAt))}` : ""}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {r.booking.status === "Pending" ? (
                  <button
                    onClick={() => acknowledge(r.booking.orderId)}
                    className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-[10px] font-black text-white transition active:scale-[0.97]"
                  >
                    Acknowledge
                  </button>
                ) : (
                  <span className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-50 py-2.5 text-[10px] font-black text-emerald-600">
                    <CheckCircle2 size={12} /> Confirmed
                  </span>
                )}

                <button
                  onClick={() =>
                    setMessageCtx({
                      customerName: r.name,
                      phone: r.booking.phone ?? "",
                      orderId: r.booking.orderId,
                      timeLabel: `${fmtTime(r.start)} - ${fmtTime(r.end)}`,
                      dateLabel: r.start.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "long" }),
                      totalAmount: r.booking.totalAmount,
                      paymentStatus: r.booking.paymentStatus,
                    })
                  }
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-[10px] font-black text-white transition active:scale-[0.97]"
                >
                  <MessageSquare size={11} /> Message
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    setHandled((prev) => {
                      const next = new Set(prev);
                      if (next.has(r.key)) next.delete(r.key);
                      else next.add(r.key);
                      return next;
                    })
                  }
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[10px] font-black transition active:scale-[0.97] ${
                    handled.has(r.key)
                      ? "bg-indigo-600 text-white"
                      : "border border-indigo-200 bg-indigo-50 text-indigo-600"
                  }`}
                >
                  <ThumbsUp size={11} /> {handled.has(r.key) ? "BYV is handling this" : "Let BYV handle this 👍"}
                </button>

                <button
                  onClick={() => setHistoryFor(r.booking.phone ?? r.name)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white py-2.5 text-[10px] font-black text-slate-600 transition active:scale-[0.97]"
                >
                  <History size={11} /> Booking History
                </button>
              </div>
            </div>
          </NotificationRow>
        ))
      )}

      {/* Booking history drill-down */}
      {historyFor && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setHistoryFor(null)}>
          <div className="max-h-[80dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[14px] font-black text-slate-900">Booking History</h3>
            <p className="mt-0.5 text-[10px] font-medium text-slate-400">
              {historyRows.length} booking{historyRows.length === 1 ? "" : "s"} at your venue.
            </p>
            <div className="mt-3 space-y-2">
              {historyRows.map((b) => (
                <div key={b.orderId} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-black text-slate-800">
                      {new Date(b.dateTime).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase ${
                        b.status === "Cancelled" ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] font-medium text-slate-400">
                    {fmtTime(new Date(b.dateTime))} · ₹{b.totalAmount} · {b.payment}
                  </p>
                </div>
              ))}
            </div>
            <button onClick={() => setHistoryFor(null)} className="mt-4 w-full rounded-2xl bg-slate-100 py-3 text-[11px] font-black uppercase tracking-wide text-slate-600">
              Close
            </button>
          </div>
        </div>
      )}

      {messageCtx && <MessageTemplatesModal ctx={messageCtx} onClose={() => setMessageCtx(null)} />}
    </div>
  );
}

function HeaderAction({
  icon: Icon,
  label,
  onClick,
  href,
}: {
  icon: typeof Bell;
  label: string;
  onClick?: () => void;
  href?: string;
}) {
  const cls = "flex flex-col items-center gap-0.5 text-slate-400 transition hover:text-slate-700";
  const body = (
    <>
      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200">
        <Icon size={13} />
      </span>
      <span className="text-[7px] font-bold">{label}</span>
    </>
  );
  return href ? (
    <a href={href} className={cls}>
      {body}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls} aria-label={label}>
      {body}
    </button>
  );
}
