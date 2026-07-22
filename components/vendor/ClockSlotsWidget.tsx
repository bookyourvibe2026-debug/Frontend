"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, X } from "lucide-react";
import { useBackDismiss } from "@/lib/useBackDismiss";

export interface ClockSlotItem {
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  price: number;
  label: string;     // "Morning", etc.
  status: "Available" | "Booked" | "Part Paid" | "Offline Booked" | "Blocked" | "On Hold";
  customerName?: string;
}

/* ─── Vibe Cycle: same 6-colour language as the Bookings Timeline ──────
   available (green) · booked on BYV (red) · walk-in (blue) · pending (amber) ·
   blocked (rose) · closed/no slot (grey) — so a vendor sees identical colours
   whether they're on Timeline or Clock view. */
const TONE_HEX = {
  available: "#10b981",
  onlineBooked: "#ef4444",
  confirmed: "#3b82f6",
  pending: "#f59e0b",
  blocked: "#f43f5e",
  closed: "#94a3b8",
} as const;

type Tone = keyof typeof TONE_HEX;

const STATUS_TONE: Record<ClockSlotItem["status"], Tone> = {
  Available: "available",
  Booked: "onlineBooked",
  "Offline Booked": "confirmed",
  "Part Paid": "pending",
  "On Hold": "pending",
  Blocked: "blocked",
};

const TONE_LEGEND: { tone: Tone; label: string }[] = [
  { tone: "available", label: "Available" },
  { tone: "onlineBooked", label: "Booked on BYV" },
  { tone: "confirmed", label: "Walk-in" },
  { tone: "pending", label: "Pending" },
  { tone: "blocked", label: "Blocked" },
  { tone: "closed", label: "Closed" },
];

/** The stat-card summary stays a simple 3-way split (Available / Booked / Blocked)
 * even though the dial itself now shows the full 6-colour breakdown. */
type SummaryBucket = "available" | "taken" | "blocked";

function summaryBucket(status: ClockSlotItem["status"]): SummaryBucket {
  if (status === "Available") return "available";
  if (status === "Blocked") return "blocked";
  return "taken";
}

const STAT_CARD_CFG: {
  tone: SummaryBucket;
  label: string;
  cls: { box: string; label: string; value: string };
}[] = [
  { tone: "available", label: "Available", cls: { box: "border-emerald-200 bg-emerald-50", label: "text-emerald-600", value: "text-emerald-700" } },
  { tone: "taken", label: "Booked", cls: { box: "border-orange-200 bg-orange-50", label: "text-orange-500", value: "text-orange-700" } },
  { tone: "blocked", label: "Blocked", cls: { box: "border-slate-200 bg-slate-100", label: "text-slate-500", value: "text-slate-700" } },
];

function timeStringToHours(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h + (m || 0) / 60;
}

function slotDurationHrs(slot: ClockSlotItem): number {
  const startH = timeStringToHours(slot.startTime);
  let endH = timeStringToHours(slot.endTime);
  if (endH <= startH) endH += 24;
  return endH - startH;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describePieSegment(
  x: number,
  y: number,
  rIn: number,
  rOut: number,
  startAngle: number,
  endAngle: number
) {
  const startIn = polarToCartesian(x, y, rIn, endAngle);
  const endIn = polarToCartesian(x, y, rIn, startAngle);
  const startOut = polarToCartesian(x, y, rOut, endAngle);
  const endOut = polarToCartesian(x, y, rOut, startAngle);

  if (Math.abs(endAngle - startAngle) >= 360) {
    endAngle = startAngle + 359.99;
  }

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M", startOut.x, startOut.y,
    "A", rOut, rOut, 0, largeArcFlag, 0, endOut.x, endOut.y,
    "L", endIn.x, endIn.y,
    "A", rIn, rIn, 0, largeArcFlag, 1, startIn.x, startIn.y,
    "Z"
  ].join(" ");
}

function toneOf(status: ClockSlotItem["status"]): Tone {
  return STATUS_TONE[status] ?? "available";
}

function statusColor(status: ClockSlotItem["status"]): string {
  return TONE_HEX[toneOf(status)];
}

/** Friendly label matching the Timeline's legend wording, e.g. "Offline Booked" → "Confirmed". */
function toneLabel(status: ClockSlotItem["status"]): string {
  return TONE_LEGEND.find((l) => l.tone === toneOf(status))?.label ?? status;
}

export function ClockSlotsWidget({
  slots = [],
  onSelectSlot,
  onSelectHour,
  onLongPressSlot,
  renderSeeBooking,
  autoFullscreen = false,
  onExitFullscreen,
}: {
  slots: ClockSlotItem[];
  onSelectSlot?: (slot: ClockSlotItem) => void;
  onSelectHour?: (hour: number) => void;
  /** Press-and-hold a slice for the quick "book offline / block" sheet. */
  onLongPressSlot?: (slot: ClockSlotItem) => void;
  /** Receives a callback that exits fullscreen — call it before opening any page-level UI. */
  renderSeeBooking?: (closeFullscreen: () => void) => React.ReactNode;
  /** Open fullscreen straight away — the dial is unreadable squeezed into a card on a phone. */
  autoFullscreen?: boolean;
  /** Fired whenever fullscreen is left, so the host page can switch views instead of
   * dropping the vendor back onto the cramped inline dial. */
  onExitFullscreen?: () => void;
}) {
  const [hoveredSlot, setHoveredSlot] = useState<ClockSlotItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [half, setHalf] = useState<"AM" | "PM">(() => (new Date().getHours() < 12 ? "AM" : "PM"));
  const [isFullscreen, setIsFullscreen] = useState(autoFullscreen);

  const exitFullscreen = useCallback(() => {
    setIsFullscreen(false);
    onExitFullscreen?.();
  }, [onExitFullscreen]);

  // Device / browser Back closes the fullscreen dial (and returns to the timeline)
  // instead of navigating off the bookings page. Previously any Back press after
  // opening the dial threw the vendor out to the previous page.
  useBackDismiss(isFullscreen, exitFullscreen);

  /* ── Long-press: press-and-hold a slice for the quick book-offline / block sheet.
        A tap still opens the normal slot modal; the fired flag stops the trailing
        click from double-triggering. ── */
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);
  const startLongPress = (slot: ClockSlotItem) => {
    if (!onLongPressSlot) return;
    longPressFired.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      exitFullscreen();
      onLongPressSlot(slot);
    }, 500);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Scroll lock keyed on fullscreen alone — re-running it would capture "hidden" as the
  // value to restore and leave the page unscrollable after closing.
  useEffect(() => {
    if (!isFullscreen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isFullscreen]);

  // Escape closes fullscreen.
  useEffect(() => {
    if (!isFullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") exitFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen, exitFullscreen]);

  /** Fullscreen fills the phone's width (capped so it stays a sensible size on desktop). */
  const [viewportW, setViewportW] = useState(420);
  useEffect(() => {
    const measure = () => setViewportW(window.innerWidth);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const size = isFullscreen ? Math.max(260, Math.min(400, viewportW - 56)) : 280;
  const center = size / 2;
  const outerRadius = size / 2 - 24;
  const innerRadius = outerRadius * 0.3;
  const halfStart = half === "AM" ? 0 : 12;
  const halfEnd = halfStart + 12;

  // Real 24h hour → position on the 12-position face (0 = top/"12", clockwise 1..11).
  function toFaceAngle(realHour: number) {
    return (realHour - halfStart) * 30;
  }
  // Position on the 12-position face (0-11, 0 = top/"12") → real 24h hour for the active half.
  function toRealHour(positionHour: number) {
    const h = positionHour % 12;
    return halfStart + h;
  }

  // The fullscreen overlay sits above the page's modals, so any selection made
  // while fullscreen must exit fullscreen first or the booking form opens
  // invisibly behind the clock.
  const selectSlot = (slot: ClockSlotItem) => {
    exitFullscreen();
    onSelectSlot?.(slot);
  };
  const selectHour = (hour: number) => {
    exitFullscreen();
    onSelectHour?.(hour);
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as SVGElement).tagName === "path") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - center;
    const y = e.clientY - rect.top - center;

    const angleRad = Math.atan2(y, x);
    let angleDeg = (angleRad * 180) / Math.PI + 90;
    if (angleDeg < 0) angleDeg += 360;

    const positionHour = Math.round(angleDeg / 30) % 12;
    selectHour(toRealHour(positionHour));
  };

  const clockTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i < 12; i++) {
      const angle = i * 30;
      const posOuter = polarToCartesian(center, center, outerRadius + 14, angle);
      const label = i === 0 ? 12 : i;
      ticks.push({ position: i, label, posOuter, angle });
    }
    return ticks;
  }, [center, outerRadius]);

  /** Only the slots that fall inside the currently shown 12-hour half. */
  const activeSlotsList = useMemo(() => {
    const from = half === "AM" ? 0 : 12;
    const to = from + 12;
    return slots.filter((s) => {
      const start = timeStringToHours(s.startTime);
      return start >= from && start < to;
    });
  }, [slots, half]);

  const segments = useMemo(() => {
    const result: { slot: ClockSlotItem; pathData: string; color: string; index: number }[] = [];
    
    for (let h = 0; h < 12; h++) {
      const realHour = half === "AM" ? h : h + 12;
      
      // Find a slot that overlaps with [realHour, realHour + 1]
      const matchingSlot = activeSlotsList.find(s => {
        const start = timeStringToHours(s.startTime);
        let end = timeStringToHours(s.endTime);
        if (end <= start) end += 24;
        return realHour >= start && realHour < end;
      });

      const startAngle = h * 30;
      const endAngle = (h + 1) * 30;
      const color = matchingSlot ? statusColor(matchingSlot.status) : "transparent";

      if (matchingSlot) {
        result.push({
          slot: matchingSlot,
          pathData: describePieSegment(center, center, innerRadius, outerRadius, startAngle, endAngle),
          color,
          index: h,
        });
      }
    }
    return result;
  }, [activeSlotsList, center, innerRadius, outerRadius, half]);

  const stats = useMemo(() => {
    const hrsByTone: Record<SummaryBucket, number> = { available: 0, taken: 0, blocked: 0 };
    for (const s of activeSlotsList) {
      hrsByTone[summaryBucket(s.status)] += slotDurationHrs(s);
    }
    const total = activeSlotsList.reduce((sum, s) => sum + slotDurationHrs(s), 0) || 1;
    const pct = (hrs: number) => Math.round((hrs / total) * 100);
    return {
      byTone: hrsByTone,
      pctByTone: {
        available: pct(hrsByTone.available),
        taken: pct(hrsByTone.taken),
        blocked: pct(hrsByTone.blocked),
      } as Record<SummaryBucket, number>,
    };
  }, [activeSlotsList]);

  // Hands follow the real current time, refreshed every 30s.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const hourHandAngle = ((now.getHours() % 12) + now.getMinutes() / 60) * 30;
  const minuteHandAngle = now.getMinutes() * 6;

  const body = (
    <>
      <div className="relative w-full text-center mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-vibe-violet">Vibe Cycle</p>
        <p className="text-[10px] text-ink-faint mt-0.5">
          {isFullscreen ? "Tap a slice to manage · press & hold to book offline or block" : "Tap the cycle to open it fullscreen"}
        </p>
        <button
          type="button"
          onClick={() => (isFullscreen ? exitFullscreen() : setIsFullscreen(true))}
          aria-label={isFullscreen ? "Exit fullscreen" : "Open Vibe Cycle fullscreen"}
          className="absolute right-0 top-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          {isFullscreen ? <X size={16} /> : <Maximize2 size={14} />}
        </button>
      </div>

      {/* AM / PM toggle */}
      <div className="mb-3 inline-flex overflow-hidden rounded-full border border-surface-border text-[11px] font-bold">
        <button
          type="button"
          onClick={() => setHalf("AM")}
          className={`px-4 py-1.5 transition ${half === "AM" ? "bg-ink text-white" : "bg-white text-ink-soft hover:bg-cream-300"}`}
        >
          AM (Morning)
        </button>
        <button
          type="button"
          onClick={() => setHalf("PM")}
          className={`px-4 py-1.5 transition ${half === "PM" ? "bg-ink text-white" : "bg-white text-ink-soft hover:bg-cream-300"}`}
        >
          PM (Night)
        </button>
      </div>

      <div className="relative">
        {/* Compact mode: the whole cycle is one big tap target that opens fullscreen.
            In fullscreen this layer is gone, so slices/hours become directly interactive. */}
        {!isFullscreen && (
          <button
            type="button"
            aria-label="Open Vibe Cycle fullscreen"
            onClick={() => setIsFullscreen(true)}
            className="absolute inset-0 z-10 cursor-pointer rounded-full"
          />
        )}
        <svg width={size} height={size} className="overflow-visible select-none cursor-crosshair" onClick={handleSvgClick}>
          {/* Outer Dial Face */}
          <circle cx={center} cy={center} r={outerRadius} fill="#ffffff" stroke="#f1f5f9" strokeWidth="2" />

          {/* Slot Slices — solid pie wedges */}
          {segments.map((seg) => (
            <path
              key={seg.index}
              d={seg.pathData}
              fill={seg.color}
              className="cursor-pointer transition-all duration-200 hover:opacity-85"
              stroke="#ffffff"
              strokeWidth="2"
              onClick={() => {
                if (longPressFired.current) return; // consumed by the long-press sheet
                selectSlot(seg.slot);
              }}
              onPointerDown={() => startLongPress(seg.slot)}
              onPointerUp={cancelLongPress}
              onPointerCancel={cancelLongPress}
              onMouseEnter={(e) => {
                setHoveredSlot(seg.slot);
                const rect = e.currentTarget.getBoundingClientRect();
                const parentRect = e.currentTarget.parentElement?.getBoundingClientRect();
                if (parentRect) {
                  setTooltipPos({
                    x: rect.left - parentRect.left + rect.width / 2,
                    y: rect.top - parentRect.top - 10,
                  });
                }
              }}
              onMouseLeave={() => {
                setHoveredSlot(null);
                cancelLongPress();
              }}
            />
          ))}

          {/* Outer ring frame + hour numbers */}
          <circle cx={center} cy={center} r={outerRadius} fill="none" stroke="#e2e8f0" strokeWidth="3" />
          {clockTicks.map((tick) => (
            <text
              key={tick.position}
              x={tick.posOuter.x}
              y={tick.posOuter.y}
              fill="#475569"
              fontSize="12"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
              className="cursor-pointer hover:fill-vibe-violet transition-all"
              onClick={(e) => {
                e.stopPropagation();
                selectHour(toRealHour(tick.position));
              }}
            >
              {tick.label}
            </text>
          ))}

          {/* Center hub */}
          <circle cx={center} cy={center} r={innerRadius} fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />

          {/* Minute hand */}
          <line
            x1={center}
            y1={center}
            x2={center}
            y2={center - innerRadius * 1.9}
            stroke="#334155"
            strokeWidth="2"
            strokeLinecap="round"
            className="pointer-events-none"
            style={{
              transform: `rotate(${minuteHandAngle}deg)`,
              transformOrigin: `${center}px ${center}px`,
              transition: "transform 1s linear",
            }}
          />
          {/* Hour hand */}
          <line
            x1={center}
            y1={center}
            x2={center}
            y2={center - innerRadius * 1.15}
            stroke="#0f172a"
            strokeWidth="4"
            strokeLinecap="round"
            className="pointer-events-none"
            style={{
              transform: `rotate(${hourHandAngle}deg)`,
              transformOrigin: `${center}px ${center}px`,
              transition: "transform 1s linear",
            }}
          />

          {/* Center "+" hub icon */}
          <circle cx={center} cy={center} r={innerRadius * 0.55} fill="#0f172a" className="pointer-events-none" />
          <line x1={center - 7} y1={center} x2={center + 7} y2={center} stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" className="pointer-events-none" />
          <line x1={center} y1={center - 7} x2={center} y2={center + 7} stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" className="pointer-events-none" />
        </svg>

        {/* Floating Tooltip */}
        {hoveredSlot && (
          <div
            className="absolute z-20 pointer-events-none rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-lg -translate-x-1/2 -translate-y-full flex flex-col gap-0.5 border border-slate-700"
            style={{ left: tooltipPos.x, top: tooltipPos.y }}
          >
            <p className="text-vibe-lime font-bold">
              {to12h(hoveredSlot.startTime)} - {to12h(hoveredSlot.endTime)}
            </p>
            <p className="text-[10px] text-slate-300 font-semibold">Status: {toneLabel(hoveredSlot.status)}</p>
            {hoveredSlot.customerName && <p className="text-[10px] text-slate-300">Customer: {hoveredSlot.customerName}</p>}
          </div>
        )}
      </div>

      {/* Legend — same six colours as the Bookings Timeline */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[9px] font-semibold text-slate-500">
        {TONE_LEGEND.map((l) => (
          <span key={l.tone} className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full" style={{ background: TONE_HEX[l.tone] }} /> {l.label}
          </span>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2 w-full mt-4">
        {STAT_CARD_CFG.map(({ tone, cls, label }) => (
          <div key={tone} className={`rounded-xl border p-2.5 text-center ${cls.box}`}>
            <p className={`text-[9px] font-bold uppercase tracking-wider ${cls.label}`}>{label}</p>
            <p className={`text-lg font-extrabold leading-tight ${cls.value}`}>
              {round1(stats.byTone[tone])}
              <span className={`text-[10px] font-semibold ml-0.5 ${cls.label}`}>hrs</span>
            </p>
            <p className={`text-[9px] font-bold ${cls.label}`}>{stats.pctByTone[tone]}%</p>
          </div>
        ))}
      </div>

      {/* See booking slot — only rendered when the host page wires it up; a button
          with no action (e.g. in the Package Studio preview) would just confuse. */}
      {renderSeeBooking && <div className="mt-4">{renderSeeBooking(exitFullscreen)}</div>}
    </>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[70] overflow-y-auto bg-white animate-in fade-in duration-150">
        <div className="flex min-h-full flex-col items-center px-4 pb-10 pt-6">{body}</div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center p-4 bg-white rounded-2xl border border-surface-border shadow-panel w-full max-w-sm">
      {body}
    </div>
  );
}

function to12h(t: string): string {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  let h = Number(hStr) % 24; // "24:00" (midnight close) → 12:00 AM
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mStr} ${ap}`;
}
