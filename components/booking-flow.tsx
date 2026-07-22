"use client";

/* ------------------------------------------------------------------ */
/*  BOOKING FLOW                                                       */
/*                                                                     */
/*  Real booking journey against the live backend:                     */
/*    0. auth      -> log in / sign up if not already a player         */
/*    1. review    -> date + start time + contact + price              */
/*    2. confirmed -> real order id + booking pass                     */
/*                                                                     */
/*  Price shown is exactly listing.price — the backend has no slot-    */
/*  quantity or markup concept yet, so we don't pretend it does.       */
/* ------------------------------------------------------------------ */

import { useEffect, useMemo, useState, type MutableRefObject } from "react";
import { CalendarDays, Check, ChevronRight, ChevronLeft, Clock, Download, MapPin, Maximize2, Minimize2, Minus, Share2, ShieldCheck, Users, X, AlertTriangle, Plus, ArrowLeft, ArrowRight } from "lucide-react";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";
import { LoginModal } from "@/components/home/modals/LoginModal";
import { SignupModal } from "@/components/home/modals/SignupModal";
import { createMyBooking } from "@/lib/api/customerBookings";
import { getVenueAvailability, type BookedRange } from "@/lib/api/venues";
import { ApiError } from "@/lib/api/client";
import { categoryLabel } from "@/lib/taxonomy";
import { downloadBookingTicket } from "@/lib/ticket";
import type { Booking, Listing, PaymentMethod } from "@/lib/api/types";

type Step = "review" | "confirmed";

const PAYMENT_METHODS: PaymentMethod[] = ["Cashfree (Online)", "Cash (Offline)"];

/** A slot is Booked when it overlaps any real booked range for the selected date. */
function slotStatusFor(slotStart: number, slotEnd: number, booked: BookedRange[]): "Available" | "Booked" {
  const sStart = slotStart % 1440;
  const sEnd = sStart + (slotEnd - slotStart);
  for (const r of booked) {
    const bStart = time24ToMinutes(r.startTime);
    let bEnd = time24ToMinutes(r.endTime);
    if (bEnd <= bStart) bEnd += 1440; // range crosses midnight
    if (sStart < bEnd && bStart < sEnd) return "Booked";
  }
  return "Available";
}

/* Start times a venue can be booked from. */
const START_TIMES = [
  "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM",
  "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
  "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM",
  "09:00 PM", "10:00 PM",
];

function todayISO() {
  // Local date, NOT toISOString(): UTC lags IST by 5.5 hrs, which kept
  // yesterday visible in the date strip every morning.
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Emoji per sport — mirrors the venue page's grid so both surfaces match. */
function sportEmoji(sportName: string): string {
  const l = sportName.toLowerCase();
  if (l.includes("badminton")) return "🏸";
  if (l.includes("cricket")) return "🏏";
  if (l.includes("turf") || l.includes("football")) return "⚽";
  if (l.includes("pickleball")) return "🏓";
  if (l.includes("tennis")) return "🎾";
  return "🎯";
}

/** Horizontally scrollable game selector — the player always sees (and can change) what they're booking. */
function SportChips({
  listing,
  sport,
  onSelect,
  className = "",
}: {
  listing: Listing;
  sport?: string;
  onSelect: (s: string) => void;
  className?: string;
}) {
  if (!listing.categories || listing.categories.length === 0) return null;
  return (
    <div
      className={`flex gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {listing.categories.map((catId) => {
        const name = categoryLabel(catId);
        const active = sport === name;
        return (
          <button
            key={catId}
            type="button"
            onClick={() => onSelect(name)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-[11px] font-bold transition ${
              active ? "border-[#0b9c65] bg-[#0b9c65] text-white shadow-sm" : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <span>{sportEmoji(name)}</span> {name}
          </button>
        );
      })}
    </div>
  );
}

function to24Hour(time12: string) {
  const [time, meridiem] = time12.split(" ");
  const [hourStr, minute] = time.split(":");
  let hour = Number(hourStr) % 12;
  if (meridiem === "PM") hour += 12;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function minutesToTime12(totalMinutes: number) {
  const hours24 = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${String(hours12).padStart(2, "0")}:${String(mins).padStart(2, "0")} ${meridiem}`;
}

function time24ToMinutes(time24: string) {
  const [h, m] = time24.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime24(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */

export default function BookingFlow({
  listing,
  onClose,
  embedded = false,
  onStateChange,
  payTriggerRef,
  selectedSport,
}: {
  listing: Listing;
  onClose: () => void;
  /** Render inline (no modal chrome, no duplicate submit button) so a parent page can embed this flow directly. */
  embedded?: boolean;
  onStateChange?: (state: { canPay: boolean; submitting: boolean; confirmed: boolean }) => void;
  /** Lets an embedding parent trigger the actual booking submit from its own button. */
  payTriggerRef?: MutableRefObject<(() => void) | null>;
  selectedSport?: string;
}) {
  const { status, customer } = useCustomerAuth();
  const [authView, setAuthView] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<Step>("review");
  const [date, setDate] = useState("");
  const [dateSelected, setDateSelected] = useState(false);
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState<number>(today.getMonth());
  const [visibleYear, setVisibleYear] = useState<number>(today.getFullYear());
  const [durationMin, setDurationMin] = useState(120); // Default 2 hours (120 mins)
  // "All" by default so every time slot shows up before the player narrows down.
  const [activeDaypart, setActiveDaypart] = useState<string>("All");
  const [time, setTime] = useState(START_TIMES[6]);
  const [endTime, setEndTime] = useState(START_TIMES[8]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(-1);
  const [payment, setPayment] = useState<PaymentMethod>(PAYMENT_METHODS[0]);
  const [splitEnabled, setSplitEnabled] = useState(false);
  const [splitCount, setSplitCount] = useState(2);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  // The game being booked — seeded from whatever the player picked outside,
  // but changeable from the chips inside the flow.
  const [sport, setSport] = useState(selectedSport ?? "");
  // Google/OTP signups may have no phone on file — bookings need one, so collect it inline.
  const needsPhone = !customer?.phone;
  const [phone, setPhone] = useState("");
  // Add-ons the player picked — only ones actually configured on the listing.
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const toggleAddOn = (id: string) =>
    setSelectedAddOnIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  // Real booked ranges for the selected date — slots overlapping these are shown as Booked.
  const [bookedRanges, setBookedRanges] = useState<BookedRange[]>([]);

  useEffect(() => {
    if (listing.type !== "Turf" || !date) {
      setBookedRanges([]);
      return;
    }
    let cancelled = false;
    getVenueAvailability(listing._id, date)
      .then((ranges) => { if (!cancelled) setBookedRanges(ranges); })
      .catch(() => { if (!cancelled) setBookedRanges([]); });
    return () => { cancelled = true; };
  }, [listing._id, listing.type, date, step]);

  // Helper to format a Date to ISO (yyyy-mm-dd)
  function localDateISO(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  // Generate all *upcoming* dates for the currently visible month/year — past dates are never bookable.
  const dateOptions = useMemo(() => {
    const list: { iso: string; dayNum: number; weekday: string; monthLabel: string }[] = [];
    const month = visibleMonth;
    const year = visibleYear;
    const minIso = todayISO();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let dnum = 1; dnum <= daysInMonth; dnum++) {
      const d = new Date(year, month, dnum);
      const iso = localDateISO(d);
      if (iso < minIso) continue;
      const dayNum = d.getDate();
      const weekday = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
      const monthLabel = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      list.push({ iso, dayNum, weekday, monthLabel });
    }
    return list;
  }, [visibleMonth, visibleYear]);

  const activeMonthLabel = useMemo(() => {
    return `${new Date(visibleYear, visibleMonth, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
  }, [visibleMonth, visibleYear]);

  // Resolve turf slots vs daily defaults
  const { startMin, endMin, baseHourlyRate, isDateHoliday, holidayReason } = useMemo(() => {
    if (listing.type === "Event" || !date) {
      return { startMin: 360, endMin: 1320, baseHourlyRate: listing.price || 1000, isDateHoliday: false, holidayReason: "" };
    }
    const override = listing.dateOverrides?.find((o) => o.date === date);
    if (override) {
      if (override.isHoliday) {
        return { startMin: 360, endMin: 1320, baseHourlyRate: listing.price || 1000, isDateHoliday: true, holidayReason: override.holidayName || "Holiday" };
      }
      const slotsConfig = override.slots || [];
      if (slotsConfig.length === 0) {
        return { startMin: 360, endMin: 1320, baseHourlyRate: listing.price || 1000, isDateHoliday: false, holidayReason: "" };
      }
      let minVal = 1440;
      let maxVal = 0;
      let sum = 0;
      slotsConfig.forEach((s) => {
        const start = time24ToMinutes(s.startTime);
        const end = time24ToMinutes(s.endTime);
        if (start < minVal) minVal = start;
        const adjustedEnd = end <= start ? end + 1440 : end;
        if (adjustedEnd > maxVal) maxVal = adjustedEnd;
        sum += s.price;
      });
      return { startMin: minVal, endMin: maxVal, baseHourlyRate: Math.round(sum / slotsConfig.length), isDateHoliday: false, holidayReason: "" };
    }

    const slotsConfig = listing.slotsList || [];
    if (slotsConfig.length === 0) {
      return { startMin: 360, endMin: 1320, baseHourlyRate: listing.price || 1000, isDateHoliday: false, holidayReason: "" };
    }
    let minVal = 1440;
    let maxVal = 0;
    let sum = 0;
    slotsConfig.forEach((s) => {
      const start = time24ToMinutes(s.startTime);
      const end = time24ToMinutes(s.endTime);
      if (start < minVal) minVal = start;
      const adjustedEnd = end <= start ? end + 1440 : end;
      if (adjustedEnd > maxVal) maxVal = adjustedEnd;
      sum += s.price;
    });
    return { startMin: minVal, endMin: maxVal, baseHourlyRate: Math.round(sum / slotsConfig.length), isDateHoliday: false, holidayReason: "" };
  }, [listing, date]);

  // The stepper can go all the way up to the venue's full day for the selected
  // date (e.g. 6 AM–11 PM = 1020 mins), in 30-min steps.
  const maxDurationMin = Math.max(30, Math.min(1440, Math.floor((endMin - startMin) / 30) * 30));
  useEffect(() => {
    if (durationMin > maxDurationMin) setDurationMin(maxDurationMin);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxDurationMin]);

  // Generate slots dynamically based on durationMin selection
  const generatedSlots = useMemo(() => {
    if (listing.type !== "Turf" || !date || isDateHoliday) return [];

    const slots: any[] = [];
    // Prefer per-date overrides if present, otherwise use global slotsList
    const override = listing.dateOverrides?.find((o) => o.date === date && !o.isHoliday);
    const slotsConfig = override?.slots && override.slots.length > 0 ? override.slots : (listing.slotsList || []);

    // Vendor-blocked windows count as unavailable, exactly like real bookings.
    const unavailableRanges: BookedRange[] = [
      ...bookedRanges,
      ...slotsConfig
        .filter((c) => c.blocked)
        .map((c) => ({ startTime: c.startTime, endTime: c.endTime, status: "Confirmed" as const })),
    ];

    // If no structured slots config, fall back to continuous window using startMin/endMin
    if (!slotsConfig || slotsConfig.length === 0) {
      let current = startMin;
      let idx = 0;
      while (current + durationMin <= endMin) {
        const slotStart = current;
        const slotEnd = current + durationMin;
        const startTime24 = minutesToTime24(slotStart);
        const endTime24 = minutesToTime24(slotEnd);
        const startTime12 = minutesToTime12(slotStart);
        const endTime12 = minutesToTime12(slotEnd);
        const startHour = Math.floor(slotStart / 60) % 24;
        let label = "Morning";
        if (startHour >= 12 && startHour < 17) label = "Afternoon";
        else if (startHour >= 17 && startHour < 22) label = "Evening";
        else if (startHour >= 22 || startHour < 5) label = "Night";
        const price = Math.round((durationMin / 60) * baseHourlyRate);
        const slotStatus = slotStatusFor(slotStart, slotEnd, unavailableRanges);
        slots.push({
          startTime: startTime24,
          endTime: endTime24,
          startTime12,
          endTime12,
          label,
          price,
          status: slotStatus,
          originalIndex: idx,
        });
        current = slotEnd;
        idx++;
      }
      return slots;
    }

    // Build slots from configured slot windows (per-date or global).
    // Contiguous windows are merged into one continuous range so long durations
    // can span across them — a 6 AM–11 PM venue can take a 1020-min booking.
    const windows = slotsConfig
      .map((cfg) => {
        const start = time24ToMinutes(cfg.startTime);
        let end = time24ToMinutes(cfg.endTime);
        if (end <= start) end += 1440;
        const hourly = typeof cfg.price === "number" && cfg.price > 0 ? cfg.price : baseHourlyRate;
        return { start, end, hourly };
      })
      .sort((a, b) => a.start - b.start);

    const ranges: { start: number; end: number; segments: { start: number; end: number; hourly: number }[] }[] = [];
    for (const w of windows) {
      const last = ranges[ranges.length - 1];
      if (last && w.start <= last.end) {
        last.end = Math.max(last.end, w.end);
        last.segments.push(w);
      } else {
        ranges.push({ start: w.start, end: w.end, segments: [w] });
      }
    }

    let idx = 0;
    for (const range of ranges) {
      // step in 15-minute increments to offer more choices
      let current = range.start;
      while (current + durationMin <= range.end) {
        const slotStart = current;
        const slotEnd = current + durationMin;
        const startTime24 = minutesToTime24(slotStart % 1440);
        const endTime24 = minutesToTime24(slotEnd % 1440);
        const startTime12 = minutesToTime12(slotStart);
        const endTime12 = minutesToTime12(slotEnd);
        const startHour = Math.floor(slotStart / 60) % 24;
        let label = "Morning";
        if (startHour >= 12 && startHour < 17) label = "Afternoon";
        else if (startHour >= 17 && startHour < 22) label = "Evening";
        else if (startHour >= 22 || startHour < 5) label = "Night";

        // Price = each covered window's hourly rate, pro-rated by the minutes used in it.
        let priceRaw = 0;
        for (const seg of range.segments) {
          const overlap = Math.min(seg.end, slotEnd) - Math.max(seg.start, slotStart);
          if (overlap > 0) priceRaw += (overlap / 60) * seg.hourly;
        }
        const price = Math.round(priceRaw);

        const slotStatus = slotStatusFor(slotStart, slotEnd, unavailableRanges);

        slots.push({
          startTime: startTime24,
          endTime: endTime24,
          startTime12,
          endTime12,
          label,
          price,
          status: slotStatus,
          originalIndex: idx,
        });

        idx++;
        current += 15; // advance by 15 minutes for finer granularity
      }
    }
    return slots;
  }, [listing, date, startMin, endMin, durationMin, baseHourlyRate, isDateHoliday, bookedRanges]);

  // Filter generated slots by activeDaypart select filter — "All" shows every time of day.
  const filteredGeneratedSlots = useMemo(() => {
    if (activeDaypart === "All") return generatedSlots;
    return generatedSlots.filter((s) => s.label === activeDaypart);
  }, [generatedSlots, activeDaypart]);

  useEffect(() => {
    // Re-select when the date or duration changes and the current pick is gone/unavailable.
    if (listing.type === "Turf" && date) {
      const currentSlot = generatedSlots[selectedSlotIndex];
      if (currentSlot && currentSlot.status === "Available") return;
      const firstAvail = generatedSlots.find((s) => s.status === "Available");
      setSelectedSlotIndex(firstAvail ? firstAvail.originalIndex : -1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, listing.type, durationMin, bookedRanges]);

  const activePrice = useMemo(() => {
    const addOnsTotal = (listing.addOns ?? [])
      .filter((a) => selectedAddOnIds.includes(a.id))
      .reduce((sum, a) => sum + a.price, 0);
    if (listing.type === "Turf") {
      const activeSlot = generatedSlots[selectedSlotIndex];
      return (activeSlot ? activeSlot.price : 0) + addOnsTotal;
    }
    return listing.price + addOnsTotal;
  }, [listing, generatedSlots, selectedSlotIndex, selectedAddOnIds]);

  const phoneValid = !needsPhone || /^[6-9]\d{9}$/.test(phone);
  const canPay = agreed && phoneValid && !!date && (
    listing.type !== "Turf"
      ? !!time
      : selectedSlotIndex !== -1 && !isDateHoliday && generatedSlots[selectedSlotIndex]?.status === "Available"
  );

  useEffect(() => {
    onStateChange?.({ canPay, submitting, confirmed: step === "confirmed" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canPay, submitting, step]);

  useEffect(() => {
    if (payTriggerRef) payTriggerRef.current = handlePay;
  });

  if (status === "loading") {
    return embedded ? (
      <p className="py-6 text-center text-sm font-semibold text-slate-500">Loading...</p>
    ) : (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-slate-600">Loading...</div>
      </div>
    );
  }

  if (status === "guest") {
    return authView === "login" ? (
      <LoginModal onClose={onClose} onLoggedIn={() => {}} onSwitchToSignup={() => setAuthView("signup")} />
    ) : (
      <SignupModal onClose={onClose} onSignedUp={() => {}} onSwitchToLogin={() => setAuthView("login")} />
    );
  }

  async function handlePay() {
    if (!canPay) return;
    setSubmitting(true);
    setError("");
    try {
      let dateTime = "";
      if (listing.type === "Turf") {
        const activeSlot = generatedSlots[selectedSlotIndex];
        dateTime = new Date(`${date}T${activeSlot.startTime}:00`).toISOString();
      } else {
        dateTime = new Date(`${date}T${to24Hour(time)}:00`).toISOString();
      }
      const created = await createMyBooking({
        listingId: listing._id,
        dateTime,
        payment,
        sport: sport || undefined,
        phone: needsPhone ? phone : undefined,
        addOnIds: selectedAddOnIds.length > 0 ? selectedAddOnIds : undefined,
        durationMinutes: listing.type === "Turf" ? durationMin : undefined
      });
      setBooking(created);
      setStep("confirmed");
    } catch (err) {
      setError(err instanceof ApiError ? err.describe() : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const content = (
    <>
      {step === "review" && (
        <ReviewStep
          embedded={embedded}
          listing={listing}
          date={date}
          setDate={setDate}
          time={time}
          setTime={setTime}
          endTime={endTime}
          setEndTime={setEndTime}
          payment={payment}
          setPayment={setPayment}
          splitEnabled={splitEnabled}
          setSplitEnabled={setSplitEnabled}
          splitCount={splitCount}
          setSplitCount={setSplitCount}
          agreed={agreed}
          setAgreed={setAgreed}
          canPay={canPay}
          submitting={submitting}
          error={error}
          needsPhone={needsPhone}
          phone={phone}
          setPhone={setPhone}
          selectedAddOnIds={selectedAddOnIds}
          onToggleAddOn={toggleAddOn}
          onClose={onClose}
          onPay={handlePay}
          dateOptions={dateOptions}
          activeMonthLabel={activeMonthLabel}
          dateSelected={dateSelected}
          setDateSelected={setDateSelected}
          durationMin={durationMin}
          setDurationMin={setDurationMin}
          maxDurationMin={maxDurationMin}
          activeDaypart={activeDaypart}
          setActiveDaypart={setActiveDaypart}
          generatedSlots={generatedSlots}
          filteredGeneratedSlots={filteredGeneratedSlots}
          isDateHoliday={isDateHoliday}
          holidayReason={holidayReason}
          selectedSlotIndex={selectedSlotIndex}
          setSelectedSlotIndex={setSelectedSlotIndex}
          activePrice={activePrice}
          visibleMonth={visibleMonth}
          visibleYear={visibleYear}
          setVisibleMonth={setVisibleMonth}
          setVisibleYear={setVisibleYear}
          selectedSport={sport}
          onSelectSport={setSport}
        />
      )}

      {step === "confirmed" && booking && (
        <ConfirmedStep listing={listing} booking={booking} onClose={onClose} embedded={embedded} />
      )}
    </>
  );

  if (embedded) return content;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4">
      {content}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STEP — REVIEW & CONFIRM                                            */
/* ------------------------------------------------------------------ */

function ReviewStep(props: {
  embedded: boolean;
  listing: Listing;
  date: string;
  setDate: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  endTime: string;
  setEndTime: (v: string) => void;
  payment: PaymentMethod;
  setPayment: (v: PaymentMethod) => void;
  splitEnabled: boolean;
  setSplitEnabled: (v: boolean) => void;
  splitCount: number;
  setSplitCount: (v: number) => void;
  agreed: boolean;
  setAgreed: (v: boolean) => void;
  canPay: boolean;
  submitting: boolean;
  error: string;
  onClose: () => void;
  onPay: () => void;
  dateOptions: { iso: string; dayNum: number; weekday: string; monthLabel: string }[];
  activeMonthLabel: string;
  dateSelected: boolean;
  setDateSelected: (v: boolean) => void;
  durationMin: number;
  setDurationMin: (v: number) => void;
  maxDurationMin: number;
  activeDaypart: string;
  setActiveDaypart: (v: string) => void;
  generatedSlots: any[];
  filteredGeneratedSlots: any[];
  isDateHoliday: boolean;
  holidayReason: string;
  selectedSlotIndex: number;
  setSelectedSlotIndex: (v: number) => void;
  activePrice: number;
  visibleMonth: number;
  visibleYear: number;
  setVisibleMonth: (v: number | ((n: number) => number)) => void;
  setVisibleYear: (v: number | ((n: number) => number)) => void;
  selectedSport?: string;
  onSelectSport: (s: string) => void;
  needsPhone: boolean;
  phone: string;
  setPhone: (v: string) => void;
  selectedAddOnIds: string[];
  onToggleAddOn: (id: string) => void;
}) {
  const {
    embedded,
    listing,
    date,
    setDate,
    time,
    setTime,
    endTime,
    setEndTime,
    payment,
    setPayment,
    splitEnabled,
    setSplitEnabled,
    splitCount,
    setSplitCount,
    agreed,
    setAgreed,
    canPay,
    submitting,
    error,
    onClose,
    onPay,
    dateOptions,
    activeMonthLabel,
    dateSelected,
    setDateSelected,
    durationMin,
    setDurationMin,
    maxDurationMin,
    activeDaypart,
    setActiveDaypart,
    generatedSlots,
    filteredGeneratedSlots,
    isDateHoliday,
    holidayReason,
    selectedSlotIndex,
    setSelectedSlotIndex,
    activePrice,
    visibleMonth,
    visibleYear,
    setVisibleMonth,
    setVisibleYear,
    selectedSport,
    onSelectSport,
    needsPhone,
    phone,
    setPhone,
    selectedAddOnIds,
    onToggleAddOn,
  } = props;

  const today = new Date();
  const [mobileStep, setMobileStep] = useState<"slots" | "checkout">("slots");
  /** Playo-style toggle between the compact date strip and the full month grid. */
  const [calendarExpanded, setCalendarExpanded] = useState(false);

  const selectedSlot = selectedSlotIndex >= 0 ? generatedSlots[selectedSlotIndex] : undefined;

  // Full month grid (Monday start) matching Image 2
  const monthGrid = useMemo(() => {
    const firstDayIndex = (new Date(visibleYear, visibleMonth, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(visibleYear, visibleMonth + 1, 0).getDate();
    const minIso = todayISO();
    const cells: ({
      iso: string;
      dayNum: number;
      isPast: boolean;
      isWeekend: boolean;
      isHoliday: boolean;
      holidayName?: string;
      price: string;
    } | null)[] = [];

    for (let i = 0; i < firstDayIndex; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(visibleYear, visibleMonth, d);
      const iso = `${visibleYear}-${String(visibleMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayOfWeek = dateObj.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const override = listing.dateOverrides?.find((o) => o.date === iso);
      const isHoliday = Boolean(override?.isHoliday);
      const holidayName = override?.holidayName;

      const baseRate = props.listing?.price || 1000;
      let slotPrice = baseRate;
      if (override?.slots?.length) {
        slotPrice = Math.round(override.slots.reduce((a, b) => a + b.price, 0) / override.slots.length);
      } else if (isWeekend) {
        slotPrice = Math.round(baseRate * 1.2);
      }
      const price = slotPrice >= 1000 ? `₹${(slotPrice / 1000).toFixed(1).replace(/\.0$/, "")}K` : `₹${slotPrice}`;

      cells.push({
        iso,
        dayNum: d,
        isPast: iso < minIso,
        isWeekend,
        isHoliday,
        holidayName,
        price,
      });
    }
    return cells;
  }, [visibleMonth, visibleYear, props.listing]);

  const formatDurationText = (min: number) => {
    const hrs = Math.floor(min / 60);
    const mins = min % 60;
    if (mins === 0) return `${hrs} hrs.`;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div
      className={
        embedded
          ? "w-full"
          : // Full screen on mobile ("page poora khule"); modal-sized on desktop.
            "relative flex h-full w-full max-w-4xl flex-col bg-slate-50 shadow-2xl sm:max-h-[90vh] sm:rounded-3xl"
      }
    >
      {!embedded && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="hidden lg:flex absolute right-3 top-3 z-10 h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500 shadow"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Mobile Header */}
      {!embedded && (
        <div className="p-4 lg:hidden border-b border-slate-100 bg-white">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (mobileStep === "checkout" ? setMobileStep("slots") : onClose())}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {mobileStep === "slots" ? listing.title : "Checkout"}
            </h3>
          </div>
          {/* Game selector in the header — the player picks the sport they're booking. */}
          {mobileStep === "slots" && (
            <SportChips listing={listing} sport={selectedSport} onSelect={onSelectSport} className="mt-3" />
          )}
        </div>
      )}

      <div className={embedded ? "" : "overflow-y-auto p-4 pb-28 sm:p-5"}>
        {!embedded && <h2 className="hidden lg:block text-lg font-extrabold text-slate-900">Review &amp; Confirm Your Booking</h2>}

        <div className="mt-3 flex flex-col gap-3 lg:flex-row">
          {/* LEFT COLUMN */}
          <div className={`flex flex-col gap-3 flex-1 min-w-0 ${mobileStep === "checkout" ? "hidden lg:flex" : "flex"}`}>
            {/* Safety Notice */}
            {!embedded && (
              <div className="lg:hidden flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-800">
                <span className="text-blue-500 font-black text-lg leading-none mt-0.5">✨</span>
                <span><span className="font-bold">Game On! Essential Safety Notice:</span> Appropriate sports shoes are mandatory to utilize this venue for your safety.</span>
              </div>
            )}
            {/* Venue info */}
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-50 to-sky-50 text-xl ring-1 ring-slate-100">
                {sportEmoji(listing.categories[0] ? categoryLabel(listing.categories[0]) : listing.type)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-slate-900">{listing.title}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-slate-400">
                  <MapPin className="h-3 w-3 shrink-0" /> {listing.city}
                  <span className="h-1 w-1 shrink-0 rounded-full bg-slate-300" />
                  <span className="truncate">{listing.categories.map(categoryLabel).join(", ") || listing.type}</span>
                </p>
              </div>
            </div>

            {/* Date & Time section */}
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className={selectedSport ? "text-xl font-extrabold text-slate-900" : "text-base font-extrabold text-slate-900"}>
                {selectedSport ? "Select Slots" : "Select Date & Time"}
              </p>
              {/* Mobile shows the game chips in the page header; desktop/embedded show them here. */}
              <div className={embedded ? "mt-2" : "mt-2 hidden lg:block"}>
                <SportChips listing={listing} sport={selectedSport} onSelect={onSelectSport} />
              </div>

              {/* Month header — year locked to the running year; expand icon opens the full calendar */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={visibleMonth === today.getMonth()}
                    onClick={() => {
                      // prev month — never earlier than the current month, year stays locked
                      if (visibleMonth > today.getMonth()) setVisibleMonth((m) => m - 1);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-lg font-extrabold uppercase tracking-wide text-slate-900">
                    {activeMonthLabel}
                  </span>
                  <button
                    type="button"
                    disabled={visibleMonth === 11}
                    onClick={() => {
                      // next month — stops at December so the year can't roll over
                      if (visibleMonth < 11) setVisibleMonth((m) => m + 1);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setCalendarExpanded((v) => !v)}
                  aria-label={calendarExpanded ? "Collapse calendar" : "Expand calendar"}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-50"
                >
                  {calendarExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </div>

              {calendarExpanded ? (
                /* Full month calendar — matching Image 2 */
                <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-lg">
                  {/* Month Pills Strip */}
                  <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-none border-b border-slate-100 mb-3">
                    {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((mName, mIdx) => {
                      const isCurrentMonth = visibleMonth === mIdx;
                      return (
                        <button
                          key={mName}
                          type="button"
                          onClick={() => setVisibleMonth(mIdx)}
                          className={`rounded-2xl px-3.5 py-1.5 text-xs font-black transition shrink-0 ${
                            isCurrentMonth
                              ? "bg-slate-900 text-white shadow-md"
                              : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {mName}
                        </button>
                      );
                    })}
                  </div>

                  {/* Day Headers */}
                  <div className="grid grid-cols-7 text-center text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
                    {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d, i) => (
                      <span key={`${d}-${i}`}>{d}</span>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {monthGrid.map((cell, i) => {
                      if (!cell) return <div key={`blank-${i}`} className="min-h-[58px]" />;
                      const isSelected = date === cell.iso;

                      let bgClass = "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400";
                      let textClass = "text-slate-900";
                      let badgeClass = "bg-slate-100 text-slate-600 font-bold";

                      if (cell.isPast) {
                        bgClass = "bg-slate-50/50 border-slate-100 text-slate-300 cursor-not-allowed opacity-40";
                        textClass = "text-slate-300";
                        badgeClass = "text-slate-300";
                      } else if (isSelected) {
                        bgClass = "bg-emerald-800 border-emerald-600 text-white shadow-lg ring-2 ring-emerald-400";
                        textClass = "text-white font-black";
                        badgeClass = "bg-emerald-600 text-white font-black";
                      } else if (cell.isHoliday) {
                        bgClass = "bg-amber-50 border-amber-300 text-amber-900";
                        textClass = "text-amber-800 font-black";
                        badgeClass = "bg-amber-200 text-amber-900 font-extrabold";
                      } else if (cell.isWeekend) {
                        bgClass = "bg-rose-50/80 border-rose-200 text-rose-600";
                        textClass = "text-rose-600 font-black";
                        badgeClass = "bg-rose-100 text-rose-700 font-bold";
                      } else {
                        bgClass = "bg-sky-50/50 border-sky-100 text-sky-900";
                        textClass = "text-sky-900 font-bold";
                        badgeClass = "bg-sky-100 text-sky-800 font-semibold";
                      }

                      return (
                        <button
                          key={cell.iso}
                          type="button"
                          disabled={cell.isPast}
                          onClick={() => {
                            setDate(cell.iso);
                            setDateSelected(true);
                          }}
                          className={`flex flex-col items-center justify-between rounded-2xl border p-1.5 min-h-[58px] transition ${bgClass}`}
                        >
                          <span className={`text-xs font-black ${textClass}`}>{cell.dayNum}</span>
                          <span className={`mt-1 rounded-full px-1.5 py-0.5 text-[8.5px] leading-none uppercase ${badgeClass}`}>
                            {isSelected ? `SELECTED ${cell.price}` : cell.holidayName ? cell.holidayName.slice(0, 7) : cell.price}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Calendar Legend Bar — matching Image 2 */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[9px] font-extrabold text-slate-500">
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-sky-400" /> Weekday</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> Weekend</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> Holiday</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-500" /> 3+ day holiday stretch</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-500" /> Corporate booking</span>
                    <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Custom price</span>
                  </div>
                </div>
              ) : (
                /* Compact date strip — weekday over a big date number, dot under the selected day */
                <div className="mt-2 flex gap-3 overflow-x-auto pb-1 scrollbar-none">
                  {dateOptions.map((opt) => {
                    const isSelected = date === opt.iso;
                    return (
                      <button
                        key={opt.iso}
                        type="button"
                        onClick={() => {
                          setDate(opt.iso);
                          setDateSelected(true);
                        }}
                        className="flex w-12 shrink-0 flex-col items-center gap-1"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {opt.weekday}
                        </span>
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg font-extrabold transition ${
                            isSelected ? "bg-brand-600 text-white shadow-md" : "text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {opt.dayNum}
                        </span>
                        <span className={`h-1 w-1 rounded-full ${isSelected ? "bg-brand-600" : "bg-transparent"}`} />
                      </button>
                    );
                  })}
                </div>
              )}

              {!dateSelected ? (
                <div className="mt-4 text-center py-4 bg-slate-50 border border-dashed rounded-2xl">
                  <CalendarDays className="h-6 w-6 mx-auto text-slate-300" />
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">Please select a date above to see time slots.</p>
                </div>
              ) : listing.type === "Turf" ? (
                <>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">Time Slots</span>
                    <select
                      value={activeDaypart}
                      onChange={(e) => setActiveDaypart(e.target.value)}
                      className="text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg outline-none cursor-pointer"
                    >
                      <option value="All">All Times</option>
                      <option value="Morning">Morning</option>
                      <option value="Afternoon">Afternoon</option>
                      <option value="Evening">Evening</option>
                      <option value="Night">Night</option>
                    </select>
                  </div>

                  {isDateHoliday ? (
                    <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 flex items-center gap-2">
                      <AlertTriangle size={14} />
                      <span>Venue Closed: {holidayReason || "Holiday"}</span>
                    </div>
                  ) : (
                    <>
                      {/* Time card — selected range on the left, duration stepper on the right */}
                      <div className="mt-2 flex items-stretch overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <div className="flex flex-1 items-center gap-3 bg-gradient-to-r from-sky-100/80 via-sky-50/60 to-white p-3.5">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sky-600 shadow-sm ring-1 ring-sky-100">
                            <Clock className="h-4 w-4" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Selected time</p>
                            <p className="text-[14px] font-extrabold leading-tight text-slate-800">
                              {selectedSlot ? `${selectedSlot.startTime12} – ${selectedSlot.endTime12}` : "Pick a start time"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 border-l border-slate-100 px-3">
                          <button
                            type="button"
                            disabled={durationMin <= 30}
                            onClick={() => setDurationMin(Math.max(30, durationMin - 30))}
                            aria-label="Decrease duration"
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-16 whitespace-nowrap text-center text-[13px] font-black text-slate-800">{durationMin} min</span>
                          <button
                            type="button"
                            disabled={durationMin >= maxDurationMin}
                            onClick={() => setDurationMin(Math.min(maxDurationMin, durationMin + 30))}
                            aria-label="Increase duration"
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Time ruler — tap a time to set the start; the green band shows the selected range */}
                      {filteredGeneratedSlots.length === 0 ? (
                        <p className="mt-3 py-3 text-center text-xs italic text-slate-500">
                          {activeDaypart === "All" ? "No slots available on this date." : `No slots available for ${activeDaypart}.`}
                        </p>
                      ) : (
                        <div className="mt-3 overflow-x-auto pb-1 scrollbar-none">
                          {(() => {
                            const selStartM = selectedSlot ? time24ToMinutes(selectedSlot.startTime) : -1;
                            const selEndM = selectedSlot ? selStartM + durationMin : -1;
                            const cols = filteredGeneratedSlots.map((slot) => {
                              const m = time24ToMinutes(slot.startTime);
                              return { slot, inRange: selectedSlot ? m >= selStartM && m < selEndM : false };
                            });
                            const lastInRange = cols.reduce((acc, c, i) => (c.inRange ? i : acc), -1);
                            return (
                              <div className="flex min-w-max">
                                {cols.map(({ slot, inRange }, i) => {
                                  const available = slot.status === "Available";
                                  const isStartCol = selectedSlot && slot.originalIndex === selectedSlotIndex;
                                  const isEndCol = i === lastInRange;
                                  return (
                                    <button
                                      key={slot.originalIndex}
                                      type="button"
                                      disabled={!available}
                                      title={available ? `${slot.startTime12} · ₹${slot.price}` : `${slot.startTime12} · ${slot.status}`}
                                      onClick={() => setSelectedSlotIndex(slot.originalIndex)}
                                      className="flex w-[74px] shrink-0 flex-col items-stretch"
                                    >
                                      <span
                                        className={`text-center text-[11px] font-bold ${
                                          !available ? "text-slate-300 line-through" : inRange ? "text-slate-900" : "text-slate-500"
                                        }`}
                                      >
                                        {slot.startTime12}
                                      </span>
                                      <span className="mx-auto mt-1 h-1.5 w-px bg-slate-300" />
                                      {/* Track segment + round slider handles at the range ends */}
                                      <span className="relative mt-1.5 h-2 w-full">
                                        <span
                                          className={`absolute inset-0 ${inRange ? "bg-brand-500" : "bg-slate-200"} ${
                                            isStartCol ? "rounded-l-full" : ""
                                          } ${isEndCol ? "rounded-r-full" : ""}`}
                                        />
                                        {isStartCol && (
                                          <span className="absolute left-0 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-600 shadow" />
                                        )}
                                        {isEndCol && (
                                          <span className="absolute right-0 top-1/2 h-3.5 w-3.5 -translate-y-1/2 translate-x-1/2 rounded-full border-2 border-white bg-brand-600 shadow" />
                                        )}
                                      </span>
                                      <span
                                        className={`mt-2.5 text-center text-[9px] font-bold ${
                                          available ? (inRange ? "text-brand-600" : "text-slate-400") : slot.status === "Booked" ? "text-rose-400" : "text-amber-500"
                                        }`}
                                      >
                                        {available ? `₹${slot.price}` : slot.status}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {selectedSlotIndex !== -1 && generatedSlots[selectedSlotIndex] && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Start time</p>
                            <p className="text-[13px] font-extrabold text-slate-900">{generatedSlots[selectedSlotIndex].startTime12}</p>
                          </div>
                          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                            <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">End time</p>
                            <p className="text-[13px] font-extrabold text-slate-900">{generatedSlots[selectedSlotIndex].endTime12}</p>
                          </div>
                        </div>
                      )}

                    </>
                  )}
                </>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">Start Time *</label>
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                      <Clock className="h-4 w-4 text-brand-500 shrink-0" />
                      <select value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none">
                        {START_TIMES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wide text-slate-500">End Time *</label>
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                      <Clock className="h-4 w-4 text-brand-500 shrink-0" />
                      <select value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full bg-transparent text-xs font-semibold text-slate-800 outline-none">
                        {START_TIMES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          {/* RIGHT COLUMN */}
          <div className={`flex flex-col gap-3 shrink-0 w-full lg:w-80 ${mobileStep === "slots" ? "hidden lg:flex" : "flex"}`}>
            {/* Checkout Header Card */}
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{listing.title}</h3>
                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    {selectedSport ? `${selectedSport} • ` : ""}{listing.type}
                  </p>
                </div>
                {selectedSport && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-lg">
                    {sportEmoji(selectedSport)}
                  </span>
                )}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div className="flex items-start gap-2">
                  <CalendarDays className="h-4 w-4 text-brand-500 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Date</p>
                    <p className="text-xs font-bold text-slate-800">
                      {date ? new Date(date).toLocaleDateString("en-US", { day: "2-digit", month: "short" }) : "Select Date"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-brand-500 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Time</p>
                    <p className="text-xs font-bold text-slate-800">
                      {listing.type === "Turf" && selectedSlotIndex !== -1 ? `${generatedSlots[selectedSlotIndex].startTime12} to ${generatedSlots[selectedSlotIndex].endTime12}` : "Select Time"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Apply Coupon Code */}
            <button type="button" className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 transition hover:bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="text-brand-500 text-lg">🏷️</div>
                <span className="text-sm font-bold text-slate-800">Apply Coupon Code</span>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400" />
            </button>

            {/* Game Reminders */}
            <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4">
              <div>
                <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">Game Reminders <span className="text-orange-500 text-sm">🔔</span></p>
                <p className="text-xs text-slate-500 mt-1">Get an SMS/Push notification 1 hr before your slot.</p>
              </div>
              <div className="relative inline-block w-10 h-6">
                <input type="checkbox" defaultChecked className="peer sr-only" />
                <div className="w-10 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
              </div>
            </div>

            {/* Play Protect */}
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 h-4 w-4 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-600 accent-indigo-600" />
                <div>
                  <p className="text-sm font-bold text-indigo-900 flex items-center gap-1.5">Add Play Protect <ShieldCheck className="h-4 w-4 text-indigo-700" /></p>
                  <p className="text-[11px] text-indigo-700/80 mt-1 font-medium leading-relaxed">Get 100% refund on cancellation &amp; accidental injury cover up to ₹10K.</p>
                  <p className="text-[11px] font-bold text-indigo-900 mt-1.5">+ ₹19 added to total</p>
                </div>
              </label>
            </div>

            {/* Add-ons — only the ones the vendor configured on this package. */}
            {(listing.addOns ?? []).length > 0 && (
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <p className="mb-3 text-sm font-bold text-slate-800">Add-ons</p>
                <div className="space-y-2">
                  {listing.addOns.map((addOn) => {
                    const added = selectedAddOnIds.includes(addOn.id);
                    return (
                      <div key={addOn.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          {addOn.image && (
                            <img
                              src={addOn.image.url}
                              alt={addOn.label}
                              className="h-11 w-11 shrink-0 rounded-lg object-cover"
                            />
                          )}
                          <div>
                            <p className="text-xs font-bold text-slate-800">{addOn.label}</p>
                            <p className="text-[10px] font-semibold text-slate-500">₹{addOn.price.toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => onToggleAddOn(addOn.id)}
                          className={`rounded-md border px-3 py-1 text-[10px] font-bold transition ${
                            added
                              ? "border-brand-500 bg-brand-500 text-white"
                              : "border-brand-400/60 bg-white text-brand-500 hover:bg-brand-50"
                          }`}
                        >
                          {added ? "ADDED" : "ADD"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="hidden lg:block mt-3">
              {needsPhone && (
                <div className="mb-3">
                  <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit mobile number"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none placeholder:font-normal placeholder:text-slate-400 focus:border-brand-500"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">
                    Needed for your booking confirmation — we&apos;ll save it to your profile.
                  </p>
                </div>
              )}
              {error && <p className="mb-3 rounded-lg bg-rose-50 px-3 py-1.5 text-[11px] text-rose-600">{error}</p>}
              {!embedded && (
                <button
                  type="button"
                  disabled={!canPay || submitting}
                  onClick={onPay}
                  className={`w-full rounded-xl py-3 text-xs font-bold uppercase tracking-wide transition ${
                    canPay && !submitting
                      ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/30 hover:scale-[1.01]"
                      : "cursor-not-allowed bg-slate-300 text-white"
                  }`}
                >
                  {submitting ? "Booking..." : "Confirm Booking"}
                </button>
              )}
            </div>
            {embedded && (
              <p className="text-center text-[11px] font-semibold text-slate-500 hidden lg:block">
                {canPay ? "All set — tap Book Now above to confirm." : "Complete the steps above, then Book Now activates."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footers */}
      {!embedded && mobileStep === "slots" && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 flex items-center justify-between z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] rounded-t-3xl">
          <div>
            <p className="text-[10px] font-bold text-[#0b9c65] uppercase">{formatDurationText(durationMin)} • {listing.type}</p>
            <p className="text-2xl font-black text-slate-900">₹{activePrice.toLocaleString("en-IN")}</p>
          </div>
          <button
            onClick={() => setMobileStep("checkout")}
            disabled={!date || (listing.type === "Turf" && selectedSlotIndex === -1)}
            className="rounded-2xl bg-brand-600 hover:bg-brand-700 px-8 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-md shadow-brand-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            CONTINUE
          </button>
        </div>
      )}

      {!embedded && mobileStep === "checkout" && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 flex items-center justify-between z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] rounded-t-3xl">
           <button
            onClick={onPay}
            disabled={!canPay || submitting}
            className="w-full rounded-2xl bg-[#0b9c65] py-4 text-base font-bold tracking-wide text-white shadow-lg shadow-[#0b9c65]/30 flex items-center justify-between px-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>PAY ₹{(activePrice + (agreed ? 19 : 0)).toLocaleString("en-IN")}</span>
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STEP — CONFIRMATION                                                */
/* ------------------------------------------------------------------ */

function ConfirmedStep({ listing, booking, onClose, embedded = false }: { listing: Listing; booking: Booking; onClose: () => void; embedded?: boolean }) {
  const [downloading, setDownloading] = useState(false);

  function shareNow() {
    const message = [
      "My booking is confirmed on Book Your Vibe!",
      `${listing.title} — ${new Date(booking.dateTime).toLocaleString("en-GB")}`,
      `Order ID: ${booking.orderId}`,
    ].join("\n");
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title: "My BYV Booking", text: message }).catch(() => {});
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    }
  }

  async function downloadTicket() {
    if (downloading) return;
    setDownloading(true);
    try {
      await downloadBookingTicket(booking);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className={embedded ? "w-full text-center" : "relative w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl"}>
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <Check className="h-7 w-7" strokeWidth={3} />
      </div>
      <h2 className="mt-3 text-xl font-extrabold text-slate-900">Booking Confirmed!</h2>
      <p className="mt-1 text-sm text-slate-500">Your slot at {listing.title} is locked in.</p>

      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left text-sm">
        <Row label="Order ID" value={<span className="font-mono font-bold">{booking.orderId}</span>} />
        <Row label="Venue" value={`${listing.title} · ${listing.categories.map(categoryLabel).join(", ") || listing.type}`} />
        <Row label="Date & Time" value={new Date(booking.dateTime).toLocaleString("en-GB")} />
        <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
          <span className="font-bold text-slate-900">{booking.paymentStatus === "paid" ? "Paid" : "Payment"}</span>
          <span className="font-extrabold text-emerald-600">₹{booking.totalAmount.toLocaleString("en-IN")}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-xl border-l-4 border-brand-400 bg-brand-50 px-3 py-2 text-left text-[11px] text-slate-600">
        <ShieldCheck className="h-4 w-4 shrink-0 text-brand-500" />
        <span>
          Show Order ID at venue — owner scans it to check you in as <span className="font-bold">{booking.orderId}</span>.
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={shareNow}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 transition hover:border-brand-300 hover:text-brand-600"
        >
          <Share2 className="h-3.5 w-3.5" /> Share Now
        </button>
        <button
          type="button"
          onClick={downloadTicket}
          disabled={downloading}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-60"
        >
          <Download className="h-3.5 w-3.5" /> {downloading ? "Saving..." : "Download"}
        </button>
      </div>

      {!embedded && (
        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:scale-[1.02]"
        >
          Done
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SHARED BITS                                                        */
/* ------------------------------------------------------------------ */

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}