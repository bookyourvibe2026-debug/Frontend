"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarRange, CalendarDays, ChevronDown, Sofa, Sparkles, TrendingUp, Users, PartyPopper, Trophy, Flame, X } from "lucide-react";
import { SectionCard } from "@/components/vendor/ui";
import { DailyPricingSheet } from "@/components/vendor/DailyPricingSheet";
import { createVendorBooking, getVendorBookings, getVendorListings, updateVendorListing } from "@/lib/api/vendor";
import { apiListingToMock, mockListingToApiInput } from "@/lib/api/listingAdapter";
import { ApiError } from "@/lib/api/client";
import { Booking, Listing, TurfSlot } from "@/lib/types";
import { INDIAN_HOLIDAYS } from "@/components/vendor/PackageStudio";

/** Vendor bookings carry more than the shared mock type models. */
type ApiBooking = Booking & { listingId?: string; sport?: string };

/** The sport tag that marks a multi-day corporate/tournament booking. */
const EVENT_SPORT = "Corporate/Tournament";

type BulkTarget = "weekdays" | "weekends" | "holidays";

const BULK_LABEL: Record<BulkTarget, string> = {
  weekdays: "Weekdays",
  weekends: "Weekends",
  holidays: "Holidays",
};

const ROLLING_WINDOW_DAYS = 182; // ~6 months forward

/**
 * Every date carries a light day-type wash — weekday / weekend / holiday — so the three
 * Bulk Pricing targets are readable straight off the calendar. Bookings, long-weekend
 * stretches and custom rates layer *on top* of that wash rather than replacing it, so a
 * date never loses the one signal that says which bulk rule applies to it.
 */
const DAY_TONE = {
  weekday: {
    cell: "border-sky-100 bg-sky-50/70 hover:border-sky-200 hover:bg-sky-50",
    num: "bg-sky-100/70 text-sky-800",
    price: "border border-sky-200/70 bg-sky-100/60 text-sky-800",
    swatch: "bg-sky-300",
  },
  weekend: {
    cell: "border-rose-100 bg-rose-50/70 hover:border-rose-200 hover:bg-rose-50",
    num: "bg-rose-100/70 text-rose-700",
    price: "border border-rose-200/70 bg-rose-100/60 text-rose-700",
    swatch: "bg-rose-300",
  },
  holiday: {
    cell: "border-amber-200 bg-amber-50/80 hover:border-amber-300 hover:bg-amber-50",
    num: "bg-amber-100/70 text-amber-800",
    price: "border border-amber-200/70 bg-amber-100/60 text-amber-800",
    swatch: "bg-amber-300",
  },
} as const;

/** Bulk Pricing target → the same wash its dates wear on the calendar. */
const BULK_TINT: Record<BulkTarget, string> = {
  weekdays: "border-sky-200 bg-sky-50 text-sky-800 hover:border-sky-300",
  weekends: "border-rose-200 bg-rose-50 text-rose-800 hover:border-rose-300",
  holidays: "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300",
};

/** Icon for each Bulk Pricing target — a quick visual cue on the button. */
const BULK_ICON: Record<BulkTarget, typeof CalendarDays> = {
  weekdays: CalendarDays,
  weekends: Sofa,
  holidays: PartyPopper,
};

function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Resolve the effective slot list for a given date: its override if one exists, else the listing's default slots. */
function resolveSlotsForDate(listing: Listing, dateIso: string): TurfSlot[] {
  const override = listing.dateOverrides?.find((o) => o.date === dateIso);
  if (override) return override.slots ?? [];
  return listing.slotsList ?? [];
}

function minPrice(slots: TurfSlot[]): number | null {
  if (!slots.length) return null;
  return Math.min(...slots.map((s) => s.price));
}

function formatPrice(price: number): string {
  if (price >= 1000) {
    return `₹${(price / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return `₹${price}`;
}

export default function PriceSettingPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedTurfId, setSelectedTurfId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyingBulk, setApplyingBulk] = useState(false);
  const [applyingPeak, setApplyingPeak] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const todayIso = useMemo(() => toIso(new Date()), []);
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  const [bulkTarget, setBulkTarget] = useState<BulkTarget | null>(null);
  // Held as a string so the field can be cleared. Number state coerced ""→0, which
  // snapped the box back to 0 and forced values like "0300".
  const [bulkPriceInput, setBulkPriceInput] = useState("1000");
  const bulkPrice = Number(bulkPriceInput) || 0;

  const [activeDate, setActiveDate] = useState<string | null>(null);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [eventSheetOpen, setEventSheetOpen] = useState(false);

  /** Vendor opted in to BYV managing this turf's dynamic pricing (local until a backend field exists). */
  const [byvManaged, setByvManaged] = useState(false);
  useEffect(() => {
    if (!selectedTurfId) return;
    setByvManaged(localStorage.getItem(`byv_dynamic_pricing_${selectedTurfId}`) === "1");
  }, [selectedTurfId]);
  function toggleByvManaged() {
    const next = !byvManaged;
    setByvManaged(next);
    localStorage.setItem(`byv_dynamic_pricing_${selectedTurfId}`, next ? "1" : "0");
    setToast(
      next
        ? "BYV will now manage dynamic pricing for this turf — demand-based rates on weekends, holidays and peak hours."
        : "You're back to managing this turf's pricing yourself."
    );
  }

  useEffect(() => {
    getVendorListings()
      .then((l) => {
        const mapped = l.map(apiListingToMock).filter((x) => x.type === "Turf");
        setListings(mapped);
        const withSlots = mapped.find((t) => (t.slotsList?.length ?? 0) > 0);
        setSelectedTurfId((withSlots ?? mapped[0])?.id ?? "");
      })
      .catch((e) => setError(e instanceof ApiError ? e.describe() : "Failed to load"))
      .finally(() => setLoading(false));
    refreshBookings();
  }, []);

  function refreshBookings() {
    getVendorBookings({ limit: 500 })
      .then((b) => setBookings(b.items as unknown as ApiBooking[]))
      .catch(() => {});
  }

  /** Dates (ISO) on which the selected turf has a corporate/tournament booking, with the organiser's name. */
  const eventDates = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of bookings) {
      if (b.status === "Cancelled") continue;
      if (b.sport !== EVENT_SPORT) continue;
      if ((b.listingId ?? b.listing) !== selectedTurfId) continue;
      m.set(toIso(new Date(b.dateTime)), b.customer ?? "Event");
    }
    return m;
  }, [bookings, selectedTurfId]);

  const selectedTurf = useMemo(() => listings.find((l) => l.id === selectedTurfId), [listings, selectedTurfId]);

  // Auto-dismiss the toast after a few seconds.
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  /** Keep the horizontal month strip showing the month the grid is actually on —
   * it used to open parked on January while the grid showed July. */
  const monthStripRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    monthStripRef.current
      ?.querySelector<HTMLElement>(`[data-month="${calMonth}"]`)
      ?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [calMonth]);

  const calendarDays = useMemo(() => {
    // Week starts Monday so Sat & Sun sit next to each other at the end of the row.
    const firstDayIndex = (new Date(calYear, calMonth, 1).getDay() + 6) % 7;
    const lastDay = new Date(calYear, calMonth + 1, 0).getDate();
    const days: ({ dayNumber: number; dateStr: string; isWeekend: boolean; isPast: boolean; isHoliday: boolean } | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let i = 1; i <= lastDay; i++) {
      const date = new Date(calYear, calMonth, i);
      const dateStr = toIso(date);
      const dow = date.getDay();
      days.push({
        dayNumber: i,
        dateStr,
        isWeekend: dow === 0 || dow === 6,
        isPast: dateStr < todayIso,
        isHoliday: Boolean(INDIAN_HOLIDAYS[dateStr]),
      });
    }
    return days;
  }, [calYear, calMonth, todayIso]);

  /** Dates that are part of a run of 3+ consecutive calendar-day holidays (e.g. a long weekend
   * stretch) — flagged so those cells can be visually called out beyond a single-day holiday. */
  const holidayStreakDates = useMemo(() => {
    const set = new Set<string>();
    let run: string[] = [];
    const flushRun = () => {
      if (run.length >= 3) run.forEach((d) => set.add(d));
      run = [];
    };
    for (const day of calendarDays) {
      if (day && day.isHoliday) run.push(day.dateStr);
      else flushRun();
    }
    flushRun();
    return set;
  }, [calendarDays]);

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear((y) => y - 1); } else setCalMonth((m) => m - 1);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear((y) => y + 1); } else setCalMonth((m) => m + 1);
  }

  /** Writes a dateOverride (all slots at `price`) for a single date, preserving that date's existing slot times. */
  function buildOverrideEntry(listing: Listing, dateIso: string, price: number) {
    const slots = resolveSlotsForDate(listing, dateIso).map((s) => ({ ...s, price }));
    const existing = listing.dateOverrides?.find((o) => o.date === dateIso);
    return { date: dateIso, isHoliday: existing?.isHoliday ?? false, holidayName: existing?.holidayName ?? "", slots };
  }

  async function applyBulkPrice() {
    if (!selectedTurf || !bulkTarget || applyingBulk) return;
    const turf = selectedTurf;
    const target = bulkTarget;
    setApplyingBulk(true);
    try {
      const overrides = [...(turf.dateOverrides ?? [])];
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      let matched = 0;
      let firstMatch: { year: number; month: number } | null = null;
      for (let i = 0; i < ROLLING_WINDOW_DAYS; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dateStr = toIso(d);
        const dow = d.getDay();
        const isHolidayDay = Boolean(INDIAN_HOLIDAYS[dateStr]);
        const matches =
          target === "weekdays" ? dow >= 1 && dow <= 5 :
          target === "weekends" ? dow === 0 || dow === 6 :
          isHolidayDay;
        if (!matches) continue;
        matched++;
        if (!firstMatch) firstMatch = { year: d.getFullYear(), month: d.getMonth() };
        const entry = buildOverrideEntry(turf, dateStr, bulkPrice);
        entry.isHoliday = target === "holidays" ? true : entry.isHoliday;
        if (target === "holidays" && !entry.holidayName) entry.holidayName = INDIAN_HOLIDAYS[dateStr] ?? "";
        const idx = overrides.findIndex((o) => o.date === dateStr);
        if (idx > -1) overrides[idx] = entry; else overrides.push(entry);
      }

      // Nothing matched — tell the vendor instead of silently doing nothing.
      if (matched === 0) {
        setToast(
          target === "holidays"
            ? "No holidays fall in the next 6 months, so there was nothing to update."
            : `No ${BULK_LABEL[target].toLowerCase()} fall in the next 6 months.`
        );
        setApplyingBulk(false);
        return;
      }

      const updated = { ...turf, dateOverrides: overrides };
      // Optimistic update so the calendar reflects the change instantly.
      setListings((ls) => ls.map((x) => (x.id === turf.id ? updated : x)));
      // Jump the calendar to the first affected month so the change is visible.
      if (firstMatch) { setCalYear(firstMatch.year); setCalMonth(firstMatch.month); }
      setBulkTarget(null);
      setToast(`Applied ${formatPrice(bulkPrice)} to ${matched} ${BULK_LABEL[target].toLowerCase()} for the next 6 months.`);

      const saved = await updateVendorListing(turf.id, mockListingToApiInput(updated));
      setListings((ls) => ls.map((x) => (x.id === turf.id ? apiListingToMock(saved) : x)));
    } catch {
      // Roll the optimistic change back to the last known-good listing.
      setListings((ls) => ls.map((x) => (x.id === turf.id ? turf : x)));
      setToast("Couldn't save that rate. Please check your connection and try again.");
    }
    setApplyingBulk(false);
  }

  async function saveDailyPricing(nextSlots: TurfSlot[]) {
    if (!selectedTurf || !activeDate) return;
    try {
      const overrides = [...(selectedTurf.dateOverrides ?? [])];
      const existing = overrides.find((o) => o.date === activeDate);
      const entry = { date: activeDate, isHoliday: existing?.isHoliday ?? false, holidayName: existing?.holidayName ?? "", slots: nextSlots };
      const idx = overrides.findIndex((o) => o.date === activeDate);
      if (idx > -1) overrides[idx] = entry; else overrides.push(entry);
      const updated = { ...selectedTurf, dateOverrides: overrides };
      const saved = await updateVendorListing(selectedTurf.id, mockListingToApiInput(updated));
      setListings((ls) => ls.map((x) => (x.id === selectedTurf.id ? apiListingToMock(saved) : x)));
      setActiveDate(null);
    } catch {
      alert("Failed to save pricing");
    }
  }

  async function applyPeakPricingTemplate() {
    if (!selectedTurf || applyingPeak) return;
    const turf = selectedTurf;
    setApplyingPeak(true);
    try {
      const overrides = [...(turf.dateOverrides ?? [])];
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      let matched = 0;
      for (let i = 0; i < ROLLING_WINDOW_DAYS; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dateStr = toIso(d);
        const dow = d.getDay();
        const isPeak = dow === 0 || dow === 6 || Boolean(INDIAN_HOLIDAYS[dateStr]);
        if (!isPeak) continue;
        matched++;
        const entry = buildOverrideEntry(turf, dateStr, 1200);
        const idx = overrides.findIndex((o) => o.date === dateStr);
        if (idx > -1) overrides[idx] = entry; else overrides.push(entry);
      }
      const updated = { ...turf, dateOverrides: overrides };
      // Optimistic update so the calendar reflects the change instantly.
      setListings((ls) => ls.map((x) => (x.id === turf.id ? updated : x)));
      setToast(`Peak Pricing applied to ${matched} weekend & holiday dates.`);
      const saved = await updateVendorListing(turf.id, mockListingToApiInput(updated));
      setListings((ls) => ls.map((x) => (x.id === turf.id ? apiListingToMock(saved) : x)));
    } catch {
      setListings((ls) => ls.map((x) => (x.id === turf.id ? turf : x)));
      setToast("Couldn't apply the Peak Pricing template. Please try again.");
    }
    setApplyingPeak(false);
  }

  if (error) return <div className="p-10 text-center text-vibe-coral text-sm">{error}</div>;
  if (loading) return <div className="p-10 text-center text-ink-faint text-sm">Loading pricing…</div>;

  const activeDateSlots = activeDate && selectedTurf ? resolveSlotsForDate(selectedTurf, activeDate) : [];
  const activeDateLabel = activeDate
    ? new Date(activeDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric" })
    : "";

  return (
    <div className="space-y-6">
      {/* Toast / feedback banner */}
      {toast && (
        <div className="fixed inset-x-0 bottom-24 z-50 flex justify-center px-4 pointer-events-none">
          <div className="pointer-events-auto max-w-md rounded-2xl bg-ink text-white text-xs font-bold px-4 py-3 shadow-xl">
            {toast}
          </div>
        </div>
      )}

      {/* Turf selector header */}
      {listings.length > 1 && (
        <div className="flex items-center gap-3">
          <p className="text-sm font-bold text-slate-700">Turf:</p>
          <div className="relative">
            <select
              value={selectedTurfId}
              onChange={(e) => setSelectedTurfId(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-white text-slate-800 text-xs font-bold px-4 py-2.5 pr-8 outline-none shadow-sm"
            >
              {listings.map((l) => (
                <option key={l.id} value={l.id}>{l.title}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      )}

      {!selectedTurf ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center bg-white">
          <p className="text-sm font-semibold text-slate-500">No Turf listings found. Add a Turf listing to set pricing.</p>
        </div>
      ) : (
        <>
          {/* Bulk Pricing — pared back to just the three targets (heading + rolling-rule
              subtext removed per request); each button is iconed and carries its day-type wash. */}
          <div className="rounded-xl2 border border-surface-border bg-surface-card shadow-panel p-5 sm:p-6">
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-ink-faint">Set prices in bulk</p>
            <div className="grid grid-cols-3 gap-2">
              {(["weekdays", "weekends", "holidays"] as BulkTarget[]).map((t) => {
                const Icon = BULK_ICON[t];
                return (
                  <button
                    key={t}
                    onClick={() => setBulkTarget(bulkTarget === t ? null : t)}
                    className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border px-3 py-3.5 text-sm font-bold transition ${
                      bulkTarget === t ? "border-ink bg-ink text-white" : BULK_TINT[t]
                    }`}
                  >
                    <Icon size={18} />
                    {BULK_LABEL[t]}
                  </button>
                );
              })}
            </div>
            {bulkTarget && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={bulkPriceInput}
                  onChange={(e) => setBulkPriceInput(e.target.value.replace(/\D/g, ""))}
                  placeholder="Enter price"
                  className="flex-1 rounded-xl border border-surface-border bg-cream-200/40 px-4 py-2.5 text-sm font-bold outline-none focus:border-vibe-violet"
                />
                <button
                  onClick={applyBulkPrice}
                  disabled={applyingBulk || bulkPrice <= 0}
                  className="rounded-xl bg-vibe-violet text-white text-sm font-bold px-5 py-2.5 hover:bg-vibe-violetSoft transition disabled:opacity-60"
                >
                  {applyingBulk ? "Applying…" : `Apply to all ${BULK_LABEL[bulkTarget]}`}
                </button>
              </div>
            )}
          </div>

          <SectionCard title={`${monthNames[calMonth]} ${calYear}`}>
            <div ref={monthStripRef} className="flex gap-1.5 overflow-x-auto pb-3 mb-3 scrollbar-none">
              {monthNames.map((name, idx) => (
                <button
                  key={name}
                  data-month={idx}
                  onClick={() => setCalMonth(idx)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    idx === calMonth ? "bg-vibe-navy text-white" : "bg-cream-200 text-ink-soft hover:bg-cream-300"
                  }`}
                >
                  {name.slice(0, 3)}
                </button>
              ))}
              <button onClick={prevMonth} className="shrink-0 rounded-full px-2.5 py-1.5 text-xs font-bold bg-cream-200 text-ink-soft hover:bg-cream-300">‹</button>
              <button onClick={nextMonth} className="shrink-0 rounded-full px-2.5 py-1.5 text-xs font-bold bg-cream-200 text-ink-soft hover:bg-cream-300">›</button>
            </div>

            <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d}>{d}</div>)}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={idx} className="min-h-[70px]" />;
                const slots = resolveSlotsForDate(selectedTurf, day.dateStr);
                const price = minPrice(slots);
                const isSelected = activeDate === day.dateStr;
                const isEvent = eventDates.has(day.dateStr);
                const inStreak = holidayStreakDates.has(day.dateStr);
                const isHolidayOnly = day.isHoliday;
                const hasOverride = selectedTurf?.dateOverrides?.some((o) => o.date === day.dateStr);
                // The day-type wash the date always wears, before any overlay.
                const tone = DAY_TONE[isHolidayOnly ? "holiday" : day.isWeekend ? "weekend" : "weekday"];
                // A custom rate is a ring on top of the wash, not a replacement for it.
                const overrideRing = hasOverride ? " ring-2 ring-teal-300 ring-offset-1" : "";

                return (
                  <button
                    key={idx}
                    disabled={day.isPast}
                    onClick={() => setActiveDate(day.dateStr)}
                    className={`flex flex-col items-center justify-center rounded-2xl p-1.5 min-h-[72px] border transition-all ${
                      day.isPast
                        ? "border-slate-100 bg-slate-50/50 opacity-30 cursor-not-allowed"
                        : isSelected
                        ? "border-2 border-[#005e4b] bg-[#005e4b]/5 text-[#005e4b] ring-4 ring-[#005e4b]/15 scale-105 z-10"
                        : isEvent
                        ? "border-2 border-violet-400 bg-violet-50/60 hover:bg-violet-50 hover:border-violet-500 scale-[1.02] z-10" + overrideRing
                        : inStreak
                        ? "border-2 border-orange-400 bg-orange-50/70 hover:bg-orange-50 hover:border-orange-500 scale-[1.02] z-10" + overrideRing
                        : tone.cell + overrideRing
                    }`}
                  >
                    {/* Date Number Display */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isSelected
                        ? "bg-[#005e4b] text-white shadow-md"
                        : isEvent
                        ? "text-violet-800 bg-violet-100/60"
                        : inStreak
                        ? "text-orange-800 bg-orange-100/60"
                        : tone.num
                    }`}>
                      {day.dayNumber}
                    </div>

                    {/* Price / Status Tag */}
                    {price !== null && (
                      <span className={`text-[9px] font-black uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded-md ${
                        isSelected
                          ? "text-[#005e4b] scale-95"
                          : isEvent
                          ? "bg-violet-100 text-violet-800 border border-violet-200"
                          : inStreak
                          ? "bg-orange-100 text-orange-800 border border-orange-200"
                          : hasOverride
                          ? "bg-teal-100 text-teal-800 border border-teal-200"
                          : tone.price
                      }`}>
                        {isSelected ? `Selected` : ""} {formatPrice(price)}
                      </span>
                    )}

                    {/* Corporate / tournament booking marker */}
                    {isEvent && (
                      <span
                        title={eventDates.get(day.dateStr)}
                        className="mt-0.5 flex items-center gap-0.5 rounded border border-violet-200 bg-violet-100 px-1 text-[7px] font-black uppercase tracking-wide text-violet-700"
                      >
                        <Trophy size={7} /> Corporate
                      </span>
                    )}

                    {/* 3+ day holiday stretch — called out beyond a single-day holiday */}
                    {!isEvent && inStreak && (
                      <span
                        title={INDIAN_HOLIDAYS[day.dateStr]}
                        className="mt-0.5 flex items-center gap-0.5 rounded border border-orange-200 bg-orange-100 px-1 text-[7px] font-black uppercase tracking-wide text-orange-700"
                      >
                        <Flame size={7} /> Long Weekend
                      </span>
                    )}

                    {/* Single-day holiday */}
                    {!isEvent && !inStreak && isHolidayOnly && (
                      <span
                        title={INDIAN_HOLIDAYS[day.dateStr]}
                        className="mt-0.5 flex items-center gap-0.5 rounded border border-amber-200 bg-amber-100 px-1 text-[7px] font-black uppercase tracking-wide text-amber-700"
                      >
                        <PartyPopper size={7} /> Holiday
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-slate-100 pt-3">
              {[
                { swatch: DAY_TONE.weekday.swatch, label: "Weekday" },
                { swatch: DAY_TONE.weekend.swatch, label: "Weekend" },
                { swatch: DAY_TONE.holiday.swatch, label: "Holiday" },
                { swatch: "bg-orange-400", label: "3+ day holiday stretch" },
                { swatch: "bg-violet-400", label: "Corporate booking" },
                { swatch: "bg-teal-400", label: "Custom price" },
              ].map((l) => (
                <span key={l.label} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500">
                  <span className={`h-2 w-2 rounded-full ${l.swatch}`} /> {l.label}
                </span>
              ))}
            </div>
          </SectionCard>

          {/* ── CORPORATE / TOURNAMENT BOOKING — sits under the calendar, since the dates
                it blocks show up as events on the month grid right above it ── */}
          <div className="relative overflow-hidden rounded-3xl border border-violet-100 bg-white p-5 shadow-sm">
            <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-violet-100/70 blur-2xl" />
            <div className="relative flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-md shadow-violet-600/30">
                <Trophy size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[15px] font-black text-slate-900">Corporate / Tournament</p>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-violet-700">
                    Multi-day
                  </span>
                </div>
                <p className="mt-1 text-[11px] font-medium leading-relaxed text-slate-500">
                  Block a 2–3 day (or longer) booking in one go — it reserves those dates and shows as an event on the calendar above.
                </p>
                <button
                  onClick={() => setEventSheetOpen(true)}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-[11px] font-black text-white transition hover:bg-violet-700 active:scale-[0.97]"
                >
                  <CalendarRange size={13} /> Take a Booking
                </button>
              </div>
            </div>
          </div>

          {/* ── INSIGHTS & OPPORTUNITIES ── */}
          <div className="bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 border border-slate-100 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="text-indigo-500" size={18} />
              <h2 className="text-sm font-extrabold text-slate-900">Insights & Opportunities</h2>
            </div>

            <div className="space-y-3">
              {/* Alert 1 */}
              <div className="border-l-4 border-rose-500 bg-rose-50/20 rounded-r-2xl p-4 flex gap-3.5">
                <div className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center shrink-0 text-rose-500 border border-rose-100/55">
                  <TrendingUp size={16} />
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs font-black text-rose-950">Long Weekend Alert!</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-bold">
                    <strong className="text-rose-700">May 1st, 2nd, & 3rd</strong> is a continuous 3-day holiday stretch (Labor Day + Weekend). Demand will surge.
                  </p>
                  <span className="inline-block bg-rose-100/70 border border-rose-200 text-rose-700 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                    Expected Demand: +85%
                  </span>
                </div>
              </div>

              {/* Alert 2 */}
              <div className="border-l-4 border-amber-500 bg-amber-50/20 rounded-r-2xl p-4 flex gap-3.5">
                <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center shrink-0 text-amber-500 border border-amber-100/55">
                  <Users size={16} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-amber-950">Corporate League Alert</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-bold">
                    <strong className="text-amber-700">May 1st</strong> has peak corporate bookings. Maximize revenue on remainder slots.
                  </p>
                </div>
              </div>

              {/* Alert 3 */}
              <div className="border-l-4 border-cyan-500 bg-cyan-50/20 rounded-r-2xl p-4 flex gap-3.5">
                <div className="w-10 h-10 bg-cyan-50 rounded-full flex items-center justify-center shrink-0 text-cyan-500 border border-cyan-100/55">
                  <PartyPopper size={16} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-cyan-950">Upcoming Holidays</p>
                  <div className="space-y-1">
                    <p className="text-[11px] text-slate-600 leading-relaxed font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> May 1 - Labor Day
                    </p>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> May 21 - Local Festival
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={applyPeakPricingTemplate}
              disabled={applyingPeak}
              className="w-full bg-[#3f3ebd] hover:bg-[#3433a3] text-white rounded-2xl py-3.5 text-xs font-black shadow-sm transition active:scale-[0.98] disabled:opacity-60"
            >
              {applyingPeak ? "Applying peak pricing..." : "Apply \"Peak Pricing\" Template"}
            </button>
          </div>

          {/* ── DYNAMIC PRICING BY BYV — hand pricing over to the BYV team ── */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-5 shadow-lg">
            <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-fuchsia-400/20 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
                  <Sparkles size={20} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-black text-white">Dynamic Pricing by BYV</p>
                  <p className="text-[11px] font-medium text-indigo-100">
                    {byvManaged
                      ? "BYV is managing this turf's rates — weekends, holidays and peak hours adjust automatically."
                      : "Let the BYV team adjust your rates for demand, weekends and holidays."}
                  </p>
                </div>
                {/* On/off switch — replaces the old "tap to take back control" button */}
                <button
                  role="switch"
                  aria-checked={byvManaged}
                  aria-label="Toggle BYV dynamic pricing"
                  onClick={toggleByvManaged}
                  className={`relative flex h-7 w-12 shrink-0 items-center rounded-full transition ${
                    byvManaged ? "bg-emerald-400" : "bg-white/25"
                  }`}
                >
                  <span
                    className={`absolute h-5 w-5 rounded-full bg-white shadow transition-all ${byvManaged ? "left-6" : "left-1"}`}
                  />
                </button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                {["Demand surges", "Weekends", "Holidays"].map((chip) => (
                  <span key={chip} className="rounded-xl bg-white/10 px-2 py-2 text-[9px] font-bold uppercase tracking-wide text-indigo-100">
                    {chip}
                  </span>
                ))}
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-[11px] font-black text-white">
                <span className={`h-2 w-2 rounded-full ${byvManaged ? "bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.9)]" : "bg-white/40"}`} />
                {byvManaged ? "ON — BYV is handling your pricing" : "OFF — you're managing pricing yourself"}
              </p>
            </div>
          </div>
        </>
      )}

      {eventSheetOpen && selectedTurf && (
        <EventBookingSheet
          turf={selectedTurf}
          onClose={() => setEventSheetOpen(false)}
          onCreated={(days, firstDate) => {
            setEventSheetOpen(false);
            refreshBookings();
            const d = new Date(firstDate + "T00:00:00");
            setCalYear(d.getFullYear());
            setCalMonth(d.getMonth());
            setToast(`Booked ${days} day${days === 1 ? "" : "s"} — marked as "Event" on the calendar.`);
          }}
        />
      )}

      {activeDate && selectedTurf && (
        <DailyPricingSheet
          dateLabel={activeDateLabel}
          slots={activeDateSlots}
          onClose={() => setActiveDate(null)}
          onSave={saveDailyPricing}
          onBookSlot={(slot) => {
            const q = new URLSearchParams({
              date: activeDate,
              start: slot.startTime,
              end: slot.endTime,
              price: String(slot.price),
            });
            window.location.href = `/vendor/bookings?${q.toString()}`;
          }}
        />
      )}
    </div>
  );
}

/** Longest event we'll book in one go — guards against a mistyped year-long range. */
const MAX_EVENT_DAYS = 14;

/**
 * Multi-day corporate/tournament booking. Creates one confirmed offline booking
 * per day spanning the turf's full operating hours, tagged so the calendar can
 * mark those dates as "Event".
 */
function EventBookingSheet({
  turf,
  onClose,
  onCreated,
}: {
  turf: Listing;
  onClose: () => void;
  onCreated: (days: number, firstDate: string) => void;
}) {
  const todayIso = toIso(new Date());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [startDate, setStartDate] = useState(todayIso);
  const [endDate, setEndDate] = useState(todayIso);
  const [amountInput, setAmountInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dayList = useMemo(() => {
    const days: string[] = [];
    if (!startDate || !endDate || endDate < startDate) return days;
    const d = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");
    while (d <= end && days.length <= MAX_EVENT_DAYS) {
      days.push(toIso(d));
      d.setDate(d.getDate() + 1);
    }
    return days;
  }, [startDate, endDate]);

  const amountPerDay = Number(amountInput) || 0;

  async function handleSubmit() {
    if (name.trim().length < 2) return setError("Enter the organisation or customer name.");
    if (!/^[6-9]\d{9}$/.test(phone)) return setError("Enter a valid 10-digit phone number.");
    if (dayList.length === 0) return setError("The end date must be on or after the start date.");
    if (dayList.length > MAX_EVENT_DAYS) return setError(`Bookings can span at most ${MAX_EVENT_DAYS} days.`);
    if (amountPerDay <= 0) return setError("Enter the amount per day.");

    setSaving(true);
    setError(null);
    try {
      for (const dateIso of dayList) {
        const daySlots = [...resolveSlotsForDate(turf, dateIso)].sort((a, b) => a.startTime.localeCompare(b.startTime));
        const dayStart = daySlots[0]?.startTime ?? "06:00";
        const dayEnd = daySlots[daySlots.length - 1]?.endTime ?? "22:00";
        await createVendorBooking({
          listingId: turf.id,
          customerName: name.trim(),
          phone,
          sport: EVENT_SPORT,
          dateTime: new Date(`${dateIso}T${dayStart}:00`).toISOString(),
          endTime: dayEnd,
          totalAmount: amountPerDay,
          payment: "Cash (Offline)",
          status: "Confirmed",
        });
      }
      onCreated(dayList.length, dayList[0]);
    } catch (e) {
      setError(e instanceof ApiError ? e.describe() : "Couldn't create the booking. Please try again.");
      setSaving(false);
    }
  }

  const field =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-violet-500";

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
              <Trophy size={18} />
            </span>
            <div>
              <h3 className="text-[14px] font-black text-slate-900">Corporate / Tournament Booking</h3>
              <p className="text-[10px] font-medium text-slate-400">{turf.title} — books the full day for each selected date.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {error && <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-[11px] font-bold text-rose-600">{error}</p>}
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-400">Organisation / Customer Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Corporate League" className={field} />
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-400">Phone Number</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              inputMode="numeric"
              placeholder="9812345670"
              className={field}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-400">From</label>
              <input type="date" value={startDate} min={todayIso} onChange={(e) => setStartDate(e.target.value)} className={field} />
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-400">To</label>
              <input type="date" value={endDate} min={startDate || todayIso} onChange={(e) => setEndDate(e.target.value)} className={field} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-400">Amount per day (₹)</label>
            <input
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              placeholder="15000"
              className={field}
            />
          </div>

          {dayList.length > 0 && (
            <p className="rounded-xl bg-violet-50 px-3 py-2.5 text-[11px] font-bold text-violet-700">
              {dayList.length} day{dayList.length === 1 ? "" : "s"}
              {amountPerDay > 0 ? ` · Total ₹${(amountPerDay * dayList.length).toLocaleString("en-IN")}` : ""}
            </p>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-violet-600 py-3 text-[11px] font-black text-white transition hover:bg-violet-700 active:scale-[0.98] disabled:opacity-60"
          >
            <CalendarRange size={13} /> {saving ? "Booking…" : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
