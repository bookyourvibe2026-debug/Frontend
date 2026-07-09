"use client";

import { useMemo, useState } from "react";

export interface ClockSlotItem {
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  price: number;
  label: string;     // "Morning", etc.
  status: "Available" | "Booked" | "Part Paid";
}

function timeStringToHours(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h + (m || 0) / 60;
}

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeDonutSegment(
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

  // If it's a full circle, approximate it
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

export function ClockSlotsWidget({
  slots = [],
  onSelectSlot,
  onSelectHour,
}: {
  slots: ClockSlotItem[];
  onSelectSlot?: (slot: ClockSlotItem) => void;
  onSelectHour?: (hour: number) => void;
}) {
  const [hoveredSlot, setHoveredSlot] = useState<ClockSlotItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const size = 300;
  const center = size / 2;
  const outerRadius = size / 2 - 20;
  const innerRadius = outerRadius - 45;

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    // If we click directly on a path (existing segment), don't trigger new hour selection
    if ((e.target as SVGElement).tagName === "path") {
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - center;
    const y = e.clientY - rect.top - center;

    let angleRad = Math.atan2(y, x);
    let angleDeg = (angleRad * 180) / Math.PI + 90;
    if (angleDeg < 0) angleDeg += 360;

    const hourFloat = angleDeg / 15;
    const hour = Math.round(hourFloat) % 24;
    onSelectHour?.(hour);
  };

  const clockTicks = useMemo(() => {
    const ticks = [];
    for (let i = 0; i < 24; i += 2) {
      const angle = i * 15; // 360 / 24 = 15 deg per hour
      const posOuter = polarToCartesian(center, center, outerRadius + 8, angle);
      ticks.push({ hour: i, posOuter, angle });
    }
    return ticks;
  }, [center, outerRadius]);

  const segments = useMemo(() => {
    return slots.map((slot, index) => {
      const startH = timeStringToHours(slot.startTime);
      let endH = timeStringToHours(slot.endTime);
      if (endH <= startH) endH += 24; // wraps around midnight

      const startAngle = startH * 15;
      const endAngle = endH * 15;

      let color = "#10b981"; // green: Available
      if (slot.status === "Booked") color = "#f43f5e"; // red/rose: Booked
      if (slot.status === "Part Paid") color = "#eab308"; // yellow: Part Paid

      const pathData = describeDonutSegment(
        center,
        center,
        innerRadius,
        outerRadius,
        startAngle,
        endAngle
      );

      return {
        slot,
        pathData,
        color,
        index,
      };
    });
  }, [slots, center, innerRadius, outerRadius]);

  const stats = useMemo(() => {
    const total = slots.length;
    const booked = slots.filter((s) => s.status === "Booked").length;
    const partPaid = slots.filter((s) => s.status === "Part Paid").length;
    const available = slots.filter((s) => s.status === "Available").length;
    return { total, booked, partPaid, available };
  }, [slots]);

  return (
    <div className="relative flex flex-col items-center p-4 bg-white rounded-2xl border border-surface-border shadow-panel w-full max-w-sm">
      <div className="text-center mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-vibe-violet">Circular Slot Dial</p>
        <p className="text-[10px] text-ink-faint mt-0.5">24-Hour Layout · Hover slices for details</p>
      </div>

      <div className="relative">
        <svg width={size} height={size} className="overflow-visible select-none cursor-crosshair" onClick={handleSvgClick}>
          {/* Outer Dial Face */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="2"
          />
          {/* Inner Ring Frame */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="1"
          />

          {/* Clock Hour Numbers */}
          {clockTicks.map((tick) => (
            <text
              key={tick.hour}
              x={tick.posOuter.x}
              y={tick.posOuter.y}
              fill="#94a3b8"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
              dominantBaseline="middle"
              className="cursor-pointer hover:fill-vibe-violet hover:scale-125 transition-all"
              onClick={(e) => {
                e.stopPropagation();
                onSelectHour?.(tick.hour);
              }}
            >
              {tick.hour}
            </text>
          ))}

          {/* Hour grid lines (subtle radiating spokes) */}
          {clockTicks.map((tick) => {
            const innerPt = polarToCartesian(center, center, innerRadius - 4, tick.angle);
            const outerPt = polarToCartesian(center, center, outerRadius + 2, tick.angle);
            return (
              <line
                key={`line-${tick.hour}`}
                x1={innerPt.x}
                y1={innerPt.y}
                x2={outerPt.x}
                y2={outerPt.y}
                stroke="#f1f5f9"
                strokeWidth="1"
              />
            );
          })}

          {/* Slots Slices */}
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

          {/* Center Information Dashboard */}
          <circle cx={center} cy={center} r={innerRadius - 8} fill="#fcfcfd" />
          <foreignObject
            x={center - innerRadius + 12}
            y={center - innerRadius + 12}
            width={(innerRadius - 12) * 2}
            height={(innerRadius - 12) * 2}
          >
            <div className="flex flex-col items-center justify-center h-full text-center leading-none">
              <span className="text-3xl font-extrabold text-slate-800">{stats.available}</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">Available</span>
              <div className="mt-3 flex gap-2 text-[9px] font-semibold text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#f43f5e]" />
                  {stats.booked} Booked
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[#eab308]" />
                  {stats.partPaid} Part
                </span>
              </div>
            </div>
          </foreignObject>
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
            <span className="mt-1 text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-center uppercase tracking-wide self-start">
              {hoveredSlot.status}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
