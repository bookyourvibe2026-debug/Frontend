"use client";

import { useEffect, useMemo, useState } from "react";

export interface ClockSlotItem {
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  price: number;
  label: string;     // "Morning", etc.
  status: "Available" | "Booked" | "Part Paid" | "Offline Booked" | "Blocked" | "On Hold";
  customerName?: string;
}

const STATUS_COLORS: Record<ClockSlotItem["status"], string> = {
  Available: "#10b981",
  Booked: "#f43f5e",
  "Part Paid": "#f59e0b",
  "Offline Booked": "#fb923c",
  "On Hold": "#a855f7",
  Blocked: "#64748b",
};

const STAT_CARD_CFG: {
  status: ClockSlotItem["status"];
  label: string;
  cls: { box: string; label: string; value: string };
}[] = [
  { status: "Available", label: "Available", cls: { box: "border-emerald-200 bg-emerald-50", label: "text-emerald-600", value: "text-emerald-700" } },
  { status: "Booked", label: "Booked", cls: { box: "border-rose-200 bg-rose-50", label: "text-rose-500", value: "text-rose-700" } },
  { status: "Part Paid", label: "Part Paid", cls: { box: "border-amber-200 bg-amber-50", label: "text-amber-600", value: "text-amber-700" } },
  { status: "Offline Booked", label: "Offline", cls: { box: "border-orange-200 bg-orange-50", label: "text-orange-600", value: "text-orange-700" } },
  { status: "On Hold", label: "On Hold", cls: { box: "border-purple-200 bg-purple-50", label: "text-purple-600", value: "text-purple-700" } },
  { status: "Blocked", label: "Blocked", cls: { box: "border-slate-200 bg-slate-100", label: "text-slate-500", value: "text-slate-700" } },
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

function statusColor(status: ClockSlotItem["status"]): string {
  return STATUS_COLORS[status] ?? STATUS_COLORS.Available;
}

export function ClockSlotsWidget({
  slots = [],
  onSelectSlot,
  onSelectHour,
  renderSeeBooking,
}: {
  slots: ClockSlotItem[];
  onSelectSlot?: (slot: ClockSlotItem) => void;
  onSelectHour?: (hour: number) => void;
  renderSeeBooking?: () => React.ReactNode;
}) {
  const [hoveredSlot, setHoveredSlot] = useState<ClockSlotItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [now, setNow] = useState(() => new Date());
  const [half, setHalf] = useState<"AM" | "PM">(() => (new Date().getHours() < 12 ? "AM" : "PM"));

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(id);
  }, []);

  const size = 280;
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

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as SVGElement).tagName === "path") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - center;
    const y = e.clientY - rect.top - center;

    let angleRad = Math.atan2(y, x);
    let angleDeg = (angleRad * 180) / Math.PI + 90;
    if (angleDeg < 0) angleDeg += 360;

    const positionHour = Math.round(angleDeg / 30) % 12;
    onSelectHour?.(toRealHour(positionHour));
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

  const segments = useMemo(() => {
    const result: { slot: ClockSlotItem; pathData: string; color: string; index: number }[] = [];
    slots.forEach((slot, index) => {
      const startH = timeStringToHours(slot.startTime);
      let endH = timeStringToHours(slot.endTime);
      if (endH <= startH) endH += 24;

      // Clip the slot's real-time span to whichever half of the day is currently shown.
      const effStart = Math.max(startH, halfStart);
      const effEnd = Math.min(endH, halfEnd);
      if (effEnd <= effStart) return;

      const startAngle = toFaceAngle(effStart);
      const endAngle = toFaceAngle(effEnd);
      const color = statusColor(slot.status);

      result.push({
        slot,
        pathData: describePieSegment(center, center, innerRadius, outerRadius, startAngle, endAngle),
        color,
        index,
      });
    });
    return result;
  }, [slots, center, innerRadius, outerRadius, halfStart, halfEnd]);

  const stats = useMemo(() => {
    const hrsByStatus: Record<ClockSlotItem["status"], number> = {
      Available: 0, Booked: 0, "Part Paid": 0, "Offline Booked": 0, "On Hold": 0, Blocked: 0,
    };
    for (const s of slots) {
      hrsByStatus[s.status] += slotDurationHrs(s);
    }
    const total = slots.reduce((sum, s) => sum + slotDurationHrs(s), 0) || 24;
    const pct = (hrs: number) => Math.round((hrs / total) * 100);
    return {
      available: slots.filter((s) => s.status === "Available").length,
      booked: slots.filter((s) => s.status === "Booked").length,
      offline: slots.filter((s) => s.status === "Offline Booked").length,
      byStatus: hrsByStatus,
      pctByStatus: {
        Available: pct(hrsByStatus.Available),
        Booked: pct(hrsByStatus.Booked),
        "Part Paid": pct(hrsByStatus["Part Paid"]),
        "Offline Booked": pct(hrsByStatus["Offline Booked"]),
        "On Hold": pct(hrsByStatus["On Hold"]),
        Blocked: pct(hrsByStatus.Blocked),
      } as Record<ClockSlotItem["status"], number>,
    };
  }, [slots]);

  // Real two-handed analog clock — always shows the true wall-clock position (an analog
  // face doesn't visually distinguish AM/PM), ticking every second via a smooth CSS transform.
  const hourHandAngle = ((now.getHours() % 12) + now.getMinutes() / 60) * 30;
  const minuteHandAngle = (now.getMinutes() + now.getSeconds() / 60) * 6;

  return (
    <div className="relative flex flex-col items-center p-4 bg-white rounded-2xl border border-surface-border shadow-panel w-full max-w-sm">
      <div className="text-center mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-vibe-violet">Analog Slot Clock</p>
        <p className="text-[10px] text-ink-faint mt-0.5">Live time · Hover slices for details</p>
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
              onClick={() => onSelectSlot?.(seg.slot)}
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
              onMouseLeave={() => setHoveredSlot(null)}
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
                onSelectHour?.(toRealHour(tick.position));
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
              {hoveredSlot.startTime} - {hoveredSlot.endTime}
            </p>
            <p className="text-[10px] text-slate-300">{hoveredSlot.label}</p>
            <p className="text-[11px] text-slate-200 mt-0.5 font-bold">₹{hoveredSlot.price}</p>
            {hoveredSlot.customerName && <p className="text-[10px] text-slate-300">{hoveredSlot.customerName}</p>}
            <span className="mt-1 text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-center uppercase tracking-wide self-start">
              {hoveredSlot.status}
            </span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-3 text-[9px] font-semibold text-slate-500">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-white border border-slate-300" /> No slot</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS.Available }} /> Available</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS.Booked }} /> Booked</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: STATUS_COLORS["Offline Booked"] }} /> Offline</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-2 w-full mt-4">
        {STAT_CARD_CFG.map(({ status, cls, label }) => (
          <div key={status} className={`rounded-xl border p-2.5 text-center ${cls.box}`}>
            <p className={`text-[9px] font-bold uppercase tracking-wider ${cls.label}`}>{label}</p>
            <p className={`text-lg font-extrabold leading-tight ${cls.value}`}>
              {round1(stats.byStatus[status])}
              <span className={`text-[10px] font-semibold ml-0.5 ${cls.label}`}>hrs</span>
            </p>
            <p className={`text-[9px] font-bold ${cls.label}`}>{stats.pctByStatus[status]}%</p>
          </div>
        ))}
      </div>

      {/* See booking slot */}
      <div className="mt-4">
        {renderSeeBooking ? (
          renderSeeBooking()
        ) : (
          <button
            type="button"
            className="flex items-center gap-2 bg-slate-900 text-white text-sm font-bold px-6 py-3 rounded-full shadow-xl hover:bg-slate-800 transition"
          >
            SEE BOOKING
          </button>
        )}
      </div>
    </div>
  );
}
