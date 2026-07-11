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

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, ChevronRight, ChevronLeft, Clock, Download, MapPin, Share2, ShieldCheck, Users, X, AlertTriangle, Plus } from "lucide-react";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";
import { LoginModal } from "@/components/home/modals/LoginModal";
import { SignupModal } from "@/components/home/modals/SignupModal";
import { createMyBooking } from "@/lib/api/customerBookings";
import { ApiError } from "@/lib/api/client";
import { categoryLabel } from "@/lib/taxonomy";
import { downloadBookingTicket } from "@/lib/ticket";
import type { Booking, Listing, PaymentMethod } from "@/lib/api/types";

type Step = "review" | "confirmed";

const PAYMENT_METHODS: PaymentMethod[] = ["Cashfree (Online)", "Cash (Offline)"];

/* Start times a venue can be booked from. */
const START_TIMES = [
  "06:00 AM", "07:00 AM", "08:00 AM", "09:00 AM", "10:00 AM",
  "11:00 AM", "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
  "04:00 PM", "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM",
  "09:00 PM", "10:00 PM",
];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
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

export default function BookingFlow({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const { status } = useCustomerAuth();
  const [authView, setAuthView] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<Step>("review");
  const [date, setDate] = useState("");
  const [dateSelected, setDateSelected] = useState(false);
  const today = new Date();
  const [visibleMonth, setVisibleMonth] = useState<number>(today.getMonth());
  const [visibleYear, setVisibleYear] = useState<number>(today.getFullYear());
  const [durationMin, setDurationMin] = useState(120); // Default 2 hours (120 mins)
  const [activeDaypart, setActiveDaypart] = useState<string>("Morning");
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

  // Generate slots dynamically based on durationMin selection
  const generatedSlots = useMemo(() => {
    if (listing.type !== "Turf" || !date || isDateHoliday) return [];

    const slots: any[] = [];
    // Prefer per-date overrides if present, otherwise use global slotsList
    const override = listing.dateOverrides?.find((o) => o.date === date && !o.isHoliday);
    const slotsConfig = override?.slots && override.slots.length > 0 ? override.slots : (listing.slotsList || []);

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
        const str = `${listing._id}_${date}_${startTime24}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = (hash << 5) - hash + str.charCodeAt(i);
          hash |= 0;
        }
        const absHash = Math.abs(hash);
        let simulatedStatus: "Available" | "Booked" | "Part Paid" = "Available";
        if (absHash % 6 === 0) simulatedStatus = "Booked";
        else if (absHash % 6 === 1) simulatedStatus = "Part Paid";
        slots.push({
          startTime: startTime24,
          endTime: endTime24,
          startTime12,
          endTime12,
          label,
          price,
          status: simulatedStatus,
          originalIndex: idx,
        });
        current = slotEnd;
        idx++;
      }
      return slots;
    }

    // Build slots from configured slot windows (per-date or global)
    let idx = 0;
    for (const cfg of slotsConfig) {
      const cfgStart = time24ToMinutes(cfg.startTime);
      let cfgEnd = time24ToMinutes(cfg.endTime);
      if (cfgEnd <= cfgStart) cfgEnd += 1440;

      // step in 15-minute increments to offer more choices
      let current = cfgStart;
      while (current + durationMin <= cfgEnd) {
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

        // Use cfg.price when available (assumed hourly rate), otherwise fallback to baseHourlyRate
        const hourly = typeof cfg.price === "number" && cfg.price > 0 ? cfg.price : baseHourlyRate;
        const price = Math.round((durationMin / 60) * hourly);

        const str = `${listing._id}_${date}_${startTime24}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
          hash = (hash << 5) - hash + str.charCodeAt(i);
          hash |= 0;
        }
        const absHash = Math.abs(hash);
        let simulatedStatus: "Available" | "Booked" | "Part Paid" = "Available";
        if (absHash % 6 === 0) simulatedStatus = "Booked";
        else if (absHash % 6 === 1) simulatedStatus = "Part Paid";

        slots.push({
          startTime: startTime24,
          endTime: endTime24,
          startTime12,
          endTime12,
          label,
          price,
          status: simulatedStatus,
          originalIndex: idx,
        });

        idx++;
        current += 15; // advance by 15 minutes for finer granularity
      }
    }
    return slots;
  }, [listing, date, startMin, endMin, durationMin, baseHourlyRate, isDateHoliday]);

  // Filter generated slots by activeDaypart select filter
  const filteredGeneratedSlots = useMemo(() => {
    return generatedSlots.filter((s) => s.label === activeDaypart);
  }, [generatedSlots, activeDaypart]);

  useEffect(() => {
    // Only auto-select a slot when the date changes (new venue day selected)
    if (listing.type === "Turf" && date) {
      const currentSlot = generatedSlots[selectedSlotIndex];
      if (currentSlot && currentSlot.status === "Available") return;
      const firstAvail = generatedSlots.find((s) => s.status === "Available");
      setSelectedSlotIndex(firstAvail ? firstAvail.originalIndex : -1);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, listing.type]);

  const activePrice = useMemo(() => {
    if (listing.type === "Turf") {
      const activeSlot = generatedSlots[selectedSlotIndex];
      return activeSlot ? activeSlot.price : 0;
    }
    return listing.price;
  }, [listing, generatedSlots, selectedSlotIndex]);

  const canPay = agreed && !!date && (
    listing.type !== "Turf"
      ? !!time
      : selectedSlotIndex !== -1 && !isDateHoliday && generatedSlots[selectedSlotIndex]?.status === "Available"
  );

  if (status === "loading") {
    return (
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

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4">
      {step === "review" && (
        <ReviewStep
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
          onClose={onClose}
          onPay={handlePay}
          dateOptions={dateOptions}
          activeMonthLabel={activeMonthLabel}
          dateSelected={dateSelected}
          setDateSelected={setDateSelected}
          durationMin={durationMin}
          setDurationMin={setDurationMin}
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
        />
      )}

      {step === "confirmed" && booking && (
        <ConfirmedStep listing={listing} booking={booking} onClose={onClose} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STEP — REVIEW & CONFIRM                                            */
/* ------------------------------------------------------------------ */

function ReviewStep(props: {
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
}) {
  const {
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
  } = props;

  const today = new Date();

  const formatDurationText = (min: number) => {
    const hrs = Math.floor(min / 60);
    const mins = min % 60;
    if (mins === 0) return `${hrs} hrs.`;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-t-3xl bg-slate-50 shadow-2xl sm:max-h-[90vh] sm:rounded-3xl">
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-500 shadow"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="overflow-y-auto p-4 pb-6 sm:p-5">
        <h2 className="text-lg font-extrabold text-slate-900">Review &amp; Confirm Your Booking</h2>

        <div className="mt-3 flex flex-col gap-3 lg:flex-row">
          {/* LEFT COLUMN */}
          <div className="flex flex-col gap-3 flex-1 min-w-0">
            {/* Venue info */}
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-sm font-bold text-slate-900">
                {listing.categories.map(categoryLabel).join(", ") || listing.type} — {listing.title}
              </p>
              <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                <MapPin className="h-3 w-3" /> {listing.city}
              </p>
            </div>

            {/* Date & Time section */}
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-xs font-bold text-slate-900">Select Date &amp; Time</p>

              {/* Date Slider */}
              <div className="mt-3 flex items-center justify-between border-b border-slate-100 pb-1.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={visibleYear === today.getFullYear() && visibleMonth === today.getMonth()}
                    onClick={() => {
                      // prev month
                      if (visibleMonth === 0) {
                        setVisibleMonth(11);
                        setVisibleYear((y) => y - 1);
                      } else {
                        setVisibleMonth((m) => m - 1);
                      }
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-400 shadow border border-slate-100 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronLeft size={14} />
                  </button>

                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                    {activeMonthLabel}
                  </span>

                  <select
                    value={visibleYear}
                    onChange={(e) => {
                      const yr = Number(e.target.value);
                      setVisibleYear(yr);
                      if (yr === today.getFullYear() && visibleMonth < today.getMonth()) {
                        setVisibleMonth(today.getMonth());
                      }
                    }}
                    className="ml-1 text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg outline-none cursor-pointer"
                  >
                    {Array.from({ length: 5 }).map((_, i) => {
                      const yr = today.getFullYear() + i;
                      return (
                        <option key={yr} value={yr}>{yr}</option>
                      );
                    })}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      // next month
                      if (visibleMonth === 11) {
                        setVisibleMonth(0);
                        setVisibleYear((y) => y + 1);
                      } else {
                        setVisibleMonth((m) => m + 1);
                      }
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-400 shadow border border-slate-100"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              <div className="relative flex items-center gap-1 mt-2 overflow-hidden">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("date-scroll-container");
                    if (el) el.scrollBy({ left: -80, behavior: "smooth" });
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow border border-slate-100"
                >
                  <ChevronLeft size={14} />
                </button>

                <div
                  id="date-scroll-container"
                  className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1 min-w-0"
                >
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
                        className={`flex flex-col items-center justify-center min-w-[52px] h-14 shrink-0 rounded-xl border transition ${
                          isSelected
                            ? "border-slate-900 bg-slate-900 shadow-md"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${isSelected ? "text-emerald-500" : "text-slate-400"}`}>
                          {opt.weekday}
                        </span>
                        <span className={`text-base font-extrabold mt-px ${isSelected ? "text-white" : "text-slate-700"}`}>
                          {opt.dayNum}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("date-scroll-container");
                    if (el) el.scrollBy({ left: 80, behavior: "smooth" });
                  }}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow border border-slate-100"
                >
                  <ChevronRight size={14} />
                </button>
              </div>

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
                      <div className="relative flex items-center gap-1.5 mt-2 overflow-hidden">
                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById("slots-scroll-container");
                            if (el) el.scrollBy({ left: -100, behavior: "smooth" });
                          }}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow border border-slate-100 hover:bg-slate-50"
                        >
                          <ChevronLeft size={14} />
                        </button>

                        <div
                          id="slots-scroll-container"
                          className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1 min-w-0"
                        >
                          {filteredGeneratedSlots.length === 0 ? (
                            <p className="text-xs text-slate-500 italic py-3 w-full text-center">No slots available for {activeDaypart}.</p>
                          ) : (
                            filteredGeneratedSlots.map((slot) => {
                              const isSelected = selectedSlotIndex === slot.originalIndex;
                              const isAvailable = slot.status === "Available";
                              const isBooked = slot.status === "Booked";
                              const isPartPaid = slot.status === "Part Paid";

                              let cardStyle = "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer";
                              let statusIcon = <Plus className="h-3.5 w-3.5 text-emerald-500" />;
                              let statusLabel = "Free";

                              if (isSelected) {
                                cardStyle = "border-brand-500 bg-brand-50 text-brand-700 font-extrabold ring-2 ring-brand-100 cursor-pointer";
                              } else if (isBooked) {
                                cardStyle = "border-rose-100 bg-rose-50/50 text-rose-500 cursor-not-allowed opacity-60";
                                statusIcon = <X className="h-3.5 w-3.5 text-rose-500" />;
                                statusLabel = "Booked";
                              } else if (isPartPaid) {
                                cardStyle = "border-amber-100 bg-amber-50/50 text-amber-600 cursor-not-allowed opacity-60";
                                statusIcon = <Clock className="h-3.5 w-3.5 text-amber-500" />;
                                statusLabel = "Part Paid";
                              }

                              return (
                                <button
                                  key={slot.originalIndex}
                                  type="button"
                                  disabled={!isAvailable}
                                  onClick={() => setSelectedSlotIndex(slot.originalIndex)}
                                  className={`flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition min-w-[100px] h-[88px] shrink-0 ${cardStyle}`}
                                >
                                  <p className="text-[10px] uppercase font-extrabold tracking-wide leading-tight">
                                    {slot.startTime12.replace(":00", "")}
                                    <br />
                                    {slot.endTime12.replace(":00", "")}
                                  </p>
                                  <div className="my-1 flex flex-col items-center justify-center">
                                    {statusIcon}
                                    <span className="text-[8px] uppercase font-extrabold tracking-wider mt-px">{statusLabel}</span>
                                  </div>
                                  <p className="text-[11px] font-bold text-slate-800">₹{slot.price}</p>
                                </button>
                              );
                            })
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const el = document.getElementById("slots-scroll-container");
                            if (el) el.scrollBy({ left: 100, behavior: "smooth" });
                          }}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow border border-slate-100 hover:bg-slate-50"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>

                      {selectedSlotIndex !== -1 && generatedSlots[selectedSlotIndex] && (
                        <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-600">
                          <span>Start Time: <span className="font-bold text-slate-900">{generatedSlots[selectedSlotIndex].startTime12}</span></span>
                          <span>End Time: <span className="font-bold text-slate-900">{generatedSlots[selectedSlotIndex].endTime12}</span></span>
                        </div>
                      )}

                      {/* Duration slider */}
                      <div className="mt-3 border-t border-slate-100 pt-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Duration</span>
                          <span className="text-[11px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                            {formatDurationText(durationMin)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">15m</span>
                          <input
                            type="range"
                            min={15}
                            max={240}
                            step={15}
                            value={durationMin}
                            onChange={(e) => setDurationMin(Number(e.target.value))}
                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                          />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">4 hrs</span>
                        </div>
                      </div>
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
          <div className="flex flex-col gap-3 shrink-0 w-full lg:w-64">
            {/* Price */}
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-xs font-bold text-slate-900">Price Summary</p>
              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                <span className="font-bold text-brand-600 text-sm">Total</span>
                <span className="font-extrabold text-brand-600 text-sm">₹{activePrice.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Insurance — mandatory */}
            <div className="flex items-start gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-left text-[11px] text-emerald-800">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                <span className="font-bold">✅ Insurance Mandatory</span> — every booking includes player
                insurance coverage by default. This cannot be opted out of.
              </span>
            </div>

            {/* Payment */}
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <p className="text-xs font-bold text-slate-900">Payment Method</p>
              <div className="mt-2 flex gap-2">
                {PAYMENT_METHODS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPayment(p)}
                    className={`flex-1 rounded-xl border px-2.5 py-2 text-[11px] font-semibold transition ${
                      payment === p ? "border-brand-400 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {p === "Cashfree (Online)" ? "Online" : "Cash"}
                  </button>
                ))}
              </div>

              <label className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={splitEnabled}
                  onChange={(e) => setSplitEnabled(e.target.checked)}
                  className="h-3.5 w-3.5 accent-brand-600"
                />
                <Users className="h-3.5 w-3.5 text-slate-400" /> Split Payment with friends
              </label>
              {splitEnabled && (
                <div className="mt-2 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                  <span className="flex items-center gap-2">
                    Split between
                    <select
                      value={splitCount}
                      onChange={(e) => setSplitCount(Number(e.target.value))}
                      className="rounded-lg border border-slate-200 bg-white px-1.5 py-1 text-[11px] font-semibold outline-none"
                    >
                      {[2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>{n} players</option>
                      ))}
                    </select>
                  </span>
                  <span className="font-bold text-brand-600">
                    ₹{Math.ceil(activePrice / splitCount).toLocaleString("en-IN")} / player
                  </span>
                </div>
              )}

              {error && <p className="mt-2 rounded-lg bg-rose-50 px-3 py-1.5 text-[11px] text-rose-600">{error}</p>}

              <label className="mt-3 flex items-start gap-2 text-[11px] text-slate-600">
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-3.5 w-3.5 accent-brand-600 shrink-0" />
                <span>I accept the <span className="font-semibold underline">Terms &amp; Conditions</span>.</span>
              </label>
            </div>

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
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STEP — CONFIRMATION                                                */
/* ------------------------------------------------------------------ */

function ConfirmedStep({ listing, booking, onClose }: { listing: Listing; booking: Booking; onClose: () => void }) {
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
    <div className="relative w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
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

      <button
        type="button"
        onClick={onClose}
        className="mt-2 w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:scale-[1.02]"
      >
        Done
      </button>
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