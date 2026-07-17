"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Sparkles, TrendingUp, Users, PartyPopper, ThumbsUp } from "lucide-react";
import { PageHero, SectionCard } from "@/components/vendor/ui";
import { DailyPricingSheet } from "@/components/vendor/DailyPricingSheet";
import { getVendorListings, updateVendorListing } from "@/lib/api/vendor";
import { apiListingToMock, mockListingToApiInput } from "@/lib/api/listingAdapter";
import { ApiError } from "@/lib/api/client";
import { Listing, TurfSlot } from "@/lib/types";
import { INDIAN_HOLIDAYS } from "@/components/vendor/PackageStudio";

type BulkTarget = "weekdays" | "weekends" | "holidays";

const BULK_LABEL: Record<BulkTarget, string> = {
  weekdays: "Weekdays",
  weekends: "Weekends",
  holidays: "Holidays",
};

const ROLLING_WINDOW_DAYS = 182; // ~6 months forward

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
  }, []);

  const selectedTurf = useMemo(() => listings.find((l) => l.id === selectedTurfId), [listings, selectedTurfId]);

  // Auto-dismiss the toast after a few seconds.
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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
          {/* Hand pricing over to BYV — mirrors the "Let BYV handle this" action on notifications. */}
          <div className={`rounded-2xl border-2 p-4 transition ${byvManaged ? "border-indigo-300 bg-indigo-50/60" : "border-slate-200 bg-white"}`}>
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${byvManaged ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-600"}`}>
                <Sparkles size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-900">Dynamic Pricing by BYV</p>
                <p className="text-[11px] font-medium text-slate-500">
                  {byvManaged
                    ? "BYV is managing this turf's rates — weekends, holidays and peak hours adjust automatically."
                    : "Let the BYV team adjust your rates for demand, weekends and holidays."}
                </p>
              </div>
              <button
                onClick={toggleByvManaged}
                className={`shrink-0 rounded-xl px-3.5 py-2.5 text-[11px] font-black transition active:scale-[0.97] ${
                  byvManaged ? "bg-indigo-600 text-white" : "border border-indigo-200 bg-indigo-50 text-indigo-600"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <ThumbsUp size={12} /> {byvManaged ? "BYV is handling this" : "Let BYV handle this"}
                </span>
              </button>
            </div>
          </div>

          <SectionCard title="Bulk Pricing" description="Applies as a rolling rule for the next 6 months.">
            <div className="grid grid-cols-3 gap-2">
              {(["weekdays", "weekends", "holidays"] as BulkTarget[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setBulkTarget(bulkTarget === t ? null : t)}
                  className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                    bulkTarget === t ? "border-ink bg-ink text-white" : "border-surface-border bg-white text-ink-soft hover:border-ink/30"
                  }`}
                >
                  {BULK_LABEL[t]}
                </button>
              ))}
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
          </SectionCard>

          <SectionCard title={`${monthNames[calMonth]} ${calYear}`}>
            <div className="flex gap-1.5 overflow-x-auto pb-3 mb-3 scrollbar-none">
              {monthNames.map((name, idx) => (
                <button
                  key={name}
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
                const isPeak = day.isWeekend || day.isHoliday;
                const hasOverride = selectedTurf?.dateOverrides?.some((o) => o.date === day.dateStr);

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
                        : hasOverride
                        ? "border-2 border-teal-400 bg-teal-50/40 hover:bg-teal-50 hover:border-teal-500 scale-[1.02] z-10"
                        : isPeak
                        ? "border-rose-100 bg-rose-50/40 hover:bg-rose-50"
                        : "border-slate-100 bg-white hover:border-slate-200"
                    }`}
                  >
                    {/* Date Number Display */}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                      isSelected 
                        ? "bg-[#005e4b] text-white shadow-md"
                        : hasOverride
                        ? "text-teal-800 bg-teal-100/50"
                        : isPeak 
                        ? "text-rose-600" 
                        : "text-slate-500"
                    }`}>
                      {day.dayNumber}
                    </div>

                    {/* Price / Status Tag */}
                    {price !== null && (
                      <span className={`text-[9px] font-black uppercase tracking-wider mt-1 px-1.5 py-0.5 rounded-md ${
                        isSelected 
                          ? "text-[#005e4b] scale-95" 
                          : hasOverride
                          ? "bg-teal-100 text-teal-800 border border-teal-200"
                          : isPeak 
                          ? "bg-rose-50 text-rose-600 border border-rose-100" 
                          : "text-slate-400"
                      }`}>
                        {isSelected ? `Selected` : ""} {formatPrice(price)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </SectionCard>

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
        </>
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
