"use client";

import { useEffect, useRef, useState } from "react";
import { Lock, MoreVertical, Plus, CalendarPlus, Ban, CircleCheck, Hourglass, XCircle, BadgeCheck } from "lucide-react";

/* ─── Slot model ────────────────────────────────────────────────── */

export type TimelineStatus = "Available" | "Booked" | "Part Paid" | "Offline Booked" | "Blocked" | "On Hold";

export interface TimelineSlot {
  startTime: string;
  endTime: string;
  label: string;
  price: number;
  status: TimelineStatus;
  bookingId?: string;
  customerName?: string;
  phone?: string;
  blockedReason?: string;
  /** Set once the player's QR ticket has been scanned at the gate. */
  arrived?: boolean;
}

/** What the ⋮ menu can trigger on a row. */
export type SlotAction = "create-booking" | "block-slot" | "make-available" | "cancel-booking" | "mark-pending" | "mark-paid";

/* ─── Status → presentation ─────────────────────────────────────── */

/** The five states the legend advertises, derived from the richer internal statuses. */
type Tone = "available" | "confirmed" | "pending" | "blocked" | "closed";

function toneFor(status: TimelineStatus): Tone {
  switch (status) {
    case "Available":
      return "available";
    case "Booked":
    case "Offline Booked":
      return "confirmed";
    case "Part Paid":
    case "On Hold":
      return "pending";
    case "Blocked":
      return "blocked";
    default:
      return "closed";
  }
}

const TONE_STYLES: Record<Tone, { dot: string; card: string; title: string; badge: string; badgeText: string }> = {
  available: {
    dot: "bg-emerald-500",
    card: "border-emerald-100 bg-emerald-50/50",
    title: "text-emerald-700",
    badge: "bg-emerald-100 text-emerald-700",
    badgeText: "Available",
  },
  confirmed: {
    dot: "bg-blue-500",
    card: "border-blue-100 bg-blue-50/60",
    title: "text-slate-900",
    badge: "bg-blue-100 text-blue-700",
    badgeText: "Confirmed",
  },
  pending: {
    dot: "bg-amber-500",
    card: "border-amber-200 bg-amber-50/70",
    title: "text-slate-900",
    badge: "bg-amber-100 text-amber-700",
    badgeText: "Pending",
  },
  blocked: {
    dot: "bg-rose-500",
    card: "border-rose-100 bg-rose-50/60",
    title: "text-rose-700",
    badge: "bg-rose-100 text-rose-700",
    badgeText: "Blocked",
  },
  closed: {
    dot: "bg-slate-400",
    card: "border-slate-200 bg-slate-50",
    title: "text-slate-500",
    badge: "bg-slate-200 text-slate-600",
    badgeText: "Closed",
  },
};

export const TIMELINE_LEGEND: { tone: Tone; label: string }[] = [
  { tone: "available", label: "Available" },
  { tone: "confirmed", label: "Confirmed" },
  { tone: "pending", label: "Pending" },
  { tone: "blocked", label: "Blocked" },
  { tone: "closed", label: "Closed" },
];

/** "07:00" → "07:00 AM" */
function to12h(t: string): string {
  const [hStr, m] = t.split(":");
  let h = Number(hStr);
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${m} ${ap}`;
}

/* ─── Row action menu ───────────────────────────────────────────── */

function RowMenu({ slot, onAction }: { slot: TimelineSlot; onAction: (s: TimelineSlot, a: SlotAction) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const isBlocked = slot.status === "Blocked";
  const isFree = slot.status === "Available";
  const isBooked = !isFree && !isBlocked;
  const isPending = slot.status === "Part Paid" || slot.status === "On Hold";

  const items: { action: SlotAction; label: string; icon: typeof Plus; tone?: string }[] = [
    // Free slot → book it or take it out of circulation.
    ...(isFree
      ? [
          { action: "create-booking" as SlotAction, label: "Create booking", icon: CalendarPlus },
          { action: "block-slot" as SlotAction, label: "Block slot", icon: Ban, tone: "text-rose-600" },
        ]
      : []),
    // Booked slot → move it between paid/pending, or cancel it.
    ...(isBooked && isPending
      ? [{ action: "mark-paid" as SlotAction, label: "Mark as paid", icon: CircleCheck, tone: "text-emerald-600" }]
      : []),
    ...(isBooked && !isPending
      ? [{ action: "mark-pending" as SlotAction, label: "Mark as pending", icon: Hourglass, tone: "text-amber-600" }]
      : []),
    ...(isBooked
      ? [{ action: "cancel-booking" as SlotAction, label: "Cancel booking", icon: XCircle, tone: "text-rose-600" }]
      : []),
    // Blocked slot → put it back on sale.
    ...(isBlocked
      ? [{ action: "make-available" as SlotAction, label: "Make available", icon: CircleCheck, tone: "text-emerald-600" }]
      : []),
  ];

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        aria-label="Slot actions"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white hover:text-slate-700"
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-30 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          {items.map((it) => (
            <button
              key={it.action}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(false);
                onAction(slot, it.action);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-[11px] font-bold transition hover:bg-slate-50 ${it.tone ?? "text-slate-700"}`}
            >
              <it.icon size={13} /> {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Timeline ──────────────────────────────────────────────────── */

export function BookingsTimeline({
  slots,
  onSlotClick,
  onAction,
}: {
  slots: TimelineSlot[];
  onSlotClick: (slot: TimelineSlot) => void;
  onAction: (slot: TimelineSlot, action: SlotAction) => void;
}) {
  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
        <p className="text-xs font-semibold text-slate-500">No slots match these filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
      {slots.map((slot, i) => {
        const tone = toneFor(slot.status);
        const s = TONE_STYLES[tone];
        const isFree = slot.status === "Available";
        const isBlocked = slot.status === "Blocked";
        const isLast = i === slots.length - 1;

        return (
          <div key={`${slot.startTime}-${i}`} className="flex gap-3 px-3 py-1.5">
            {/* Time rail — shows the slot's full duration, exactly as configured. */}
            <div className="w-[68px] shrink-0 pt-3 text-right">
              <span className="block text-[10px] font-bold leading-tight tabular-nums text-slate-600">
                {to12h(slot.startTime)}
              </span>
              <span className="block text-[9px] font-semibold leading-tight tabular-nums text-slate-400">
                {to12h(slot.endTime)}
              </span>
            </div>

            {/* Dot + connector */}
            <div className="flex w-3 shrink-0 flex-col items-center pt-4">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white ${s.dot}`} />
              {!isLast && <span className="mt-1 w-px flex-1 bg-slate-200" />}
            </div>

            {/* Slot card */}
            <button
              type="button"
              onClick={() => onSlotClick(slot)}
              className={`mb-1 flex flex-1 items-center gap-3 rounded-xl border p-3 text-left transition active:scale-[0.995] ${s.card}`}
            >
              <div className="min-w-0 flex-1">
                {isFree ? (
                  <>
                    <p className={`text-[11px] font-black uppercase tracking-wide ${s.title}`}>Available</p>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-400">Tap to add booking</p>
                  </>
                ) : isBlocked ? (
                  <>
                    <p className={`text-[11px] font-black uppercase tracking-wide ${s.title}`}>Blocked</p>
                    <p className="mt-0.5 text-[10px] font-medium text-slate-400">{slot.blockedReason || "Unavailable"}</p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5">
                      <p className={`truncate text-[12px] font-bold ${s.title}`}>{slot.customerName || "Booked"}</p>
                      {slot.arrived && (
                        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wide text-emerald-700">
                          <BadgeCheck size={8} /> Arrived
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400">
                      {slot.phone ? `${slot.phone} · ` : ""}
                      {slot.status === "Offline Booked" ? "Walk-in" : "Online Booking"}
                    </p>
                  </>
                )}
              </div>

              {!isFree && !isBlocked && (
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wide ${s.badge}`}>
                  {s.badgeText}
                </span>
              )}

              {isFree && (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm">
                  <Plus size={14} />
                </span>
              )}

              {isBlocked && (
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-rose-500 shadow-sm">
                  <Lock size={13} />
                </span>
              )}

              <RowMenu slot={slot} onAction={onAction} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/** Legend strip shown under the timeline. */
export function TimelineLegend() {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-2xl border border-slate-100 bg-white px-3 py-2.5">
      {TIMELINE_LEGEND.map((l) => (
        <span key={l.label} className="flex items-center gap-1.5">
          <span className={`h-2 w-2 rounded-full ${TONE_STYLES[l.tone].dot}`} />
          <span className="text-[9px] font-bold text-slate-500">{l.label}</span>
        </span>
      ))}
    </div>
  );
}
