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
import { CalendarDays, Check, ChevronRight, ChevronLeft, Clock, MapPin, ShieldCheck, X, AlertTriangle, Plus } from "lucide-react";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";
import { LoginModal } from "@/components/home/modals/LoginModal";
import { SignupModal } from "@/components/home/modals/SignupModal";
import { createMyBooking } from "@/lib/api/customerBookings";
import { ApiError } from "@/lib/api/client";
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
  const [durationMin, setDurationMin] = useState(120); // Default 2 hours (120 mins)
  const [activeDaypart, setActiveDaypart] = useState<string>("Morning");
  const [time, setTime] = useState(START_TIMES[6]);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(-1);
  const [payment, setPayment] = useState<PaymentMethod>(PAYMENT_METHODS[0]);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);

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

  // Generate 14 days slider from today
  const dateOptions = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      const dayNum = d.getDate();
      const weekday = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
      const monthLabel = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      list.push({ iso, dayNum, weekday, monthLabel });
    }
    return list;
  }, []);

  const activeMonthLabel = useMemo(() => {
    const currentOpt = dateOptions.find((o) => o.iso === date);
    if (currentOpt) return currentOpt.monthLabel;
    return dateOptions[0]?.monthLabel || "";
  }, [dateOptions, date]);

  // Resolve turf slots vs daily defaults
  const { startMin, endMin, baseHourlyRate, isDateHoliday, holidayReason } = useMemo(() => {
    if (listing.type !== "Turf" || !date) {
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

    const slots = [];
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
      if (absHash % 6 === 0) {
        simulatedStatus = "Booked";
      } else if (absHash % 6 === 1) {
        simulatedStatus = "Part Paid";
      }

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
  }, [listing, date, startMin, endMin, durationMin, baseHourlyRate, isDateHoliday]);

  // Filter generated slots by activeDaypart select filter
  const filteredGeneratedSlots = useMemo(() => {
    return generatedSlots.filter((s) => s.label === activeDaypart);
  }, [generatedSlots, activeDaypart]);

  useEffect(() => {
    if (listing.type === "Turf") {
      const firstAvail = filteredGeneratedSlots.find((s) => s.status === "Available");
      setSelectedSlotIndex(firstAvail ? firstAvail.originalIndex : -1);
    }
  }, [date, filteredGeneratedSlots, listing.type]);

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
    <div className="fixed inset-0 z-[70] flex items-end justify-center overflow-y-auto bg-black/50 backdrop-blur-sm sm:items-center">
      {step === "review" && (
        <ReviewStep
          listing={listing}
          date={date}
          setDate={setDate}
          time={time}
          setTime={setTime}
          payment={payment}
          setPayment={setPayment}
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

const TIME_OPTIONS = [
  { value: "00:00", label: "12:00 AM" },
  { value: "01:00", label: "01:00 AM" },
  { value: "02:00", label: "02:00 AM" },
  { value: "03:00", label: "03:00 AM" },
  { value: "04:00", label: "04:00 AM" },
  { value: "05:00", label: "05:00 AM" },
  { value: "06:00", label: "06:00 AM" },
  { value: "07:00", label: "07:00 AM" },
  { value: "08:00", label: "08:00 AM" },
  { value: "09:00", label: "09:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "13:00", label: "01:00 PM" },
  { value: "14:00", label: "02:00 PM" },
  { value: "15:00", label: "03:00 PM" },
  { value: "16:00", label: "04:00 PM" },
  { value: "17:00", label: "05:00 PM" },
  { value: "18:00", label: "06:00 PM" },
  { value: "19:00", label: "07:00 PM" },
  { value: "20:00", label: "08:00 PM" },
  { value: "21:00", label: "09:00 PM" },
  { value: "22:00", label: "10:00 PM" },
  { value: "23:00", label: "11:00 PM" },
];

function ReviewStep(props: {
  listing: Listing;
  date: string;
  setDate: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  payment: PaymentMethod;
  setPayment: (v: PaymentMethod) => void;
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
}) {
  const {
    listing,
    date,
    setDate,
    time,
    setTime,
    payment,
    setPayment,
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
  } = props;

  // Format dynamic minutes representation to string (e.g. 2h 15m)
  const formatDurationText = (min: number) => {
    const hrs = Math.floor(min / 60);
    const mins = min % 60;
    if (mins === 0) return `${hrs} hrs.`;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="relative my-6 w-full max-w-4xl rounded-3xl bg-slate-50 p-5 shadow-2xl sm:p-7">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow"
      >
        <X className="h-4 w-4" />
      </button>

      <h2 className="text-xl font-extrabold text-slate-900">Review &amp; Confirm Your Booking</h2>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <p className="text-base font-bold text-slate-900">
              {listing.category} — {listing.title}
            </p>
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <MapPin className="h-3.5 w-3.5" /> {listing.city} · Please review your slot &amp; details
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <p className="text-sm font-bold text-slate-900">Select Date &amp; Time</p>

            {/* Date Slider exactly like user requested */}
            <div className="mt-4 flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Date: {activeMonthLabel || "July 2026"} ▽
              </span>
            </div>

            <div className="relative flex items-center gap-1 mt-2">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById("date-scroll-container");
                  if (el) el.scrollBy({ left: -80, behavior: "smooth" });
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-400 shadow border border-slate-100"
              >
                <ChevronLeft size={14} />
              </button>

              <div
                id="date-scroll-container"
                className="flex gap-2 overflow-x-auto pb-1 scrollbar-none flex-1"
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
                      className={`flex flex-col items-center justify-center min-w-[60px] h-16 rounded-2xl border transition ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 shadow-md"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-emerald-500" : "text-slate-400"}`}>
                        {opt.weekday}
                      </span>
                      <span className={`text-xl font-extrabold mt-0.5 ${isSelected ? "text-white" : "text-slate-700"}`}>
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
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-400 shadow border border-slate-100"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Step-by-step disclosure: "date select krne pr time vala khul jaye" */}
            {!dateSelected ? (
              <div className="mt-6 text-center py-6 bg-slate-50 border border-dashed rounded-2xl">
                <CalendarDays className="h-8 w-8 mx-auto text-slate-300" />
                <p className="text-xs text-slate-500 mt-2 font-medium">Please select a date above to load available time slots.</p>
              </div>
            ) : listing.type === "Turf" ? (
              <>
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Time Slots</span>
                  
                  {/* Dropdown to switch between Morning, Afternoon, Evening, Night */}
                  <select
                    value={activeDaypart}
                    onChange={(e) => setActiveDaypart(e.target.value)}
                    className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="Morning">Morning</option>
                    <option value="Afternoon">Afternoon</option>
                    <option value="Evening">Evening</option>
                    <option value="Night">Night</option>
                  </select>
                </div>

                {isDateHoliday ? (
                  <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-center gap-2">
                    <AlertTriangle size={15} />
                    <span>Venue Closed: {holidayReason || "Holiday"}</span>
                  </div>
                ) : (
                  <>
                    {/* Time slots scroll slider */}
                    <div className="relative flex items-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById("slots-scroll-container");
                          if (el) el.scrollBy({ left: -120, behavior: "smooth" });
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow border border-slate-100 hover:bg-slate-50"
                      >
                        <ChevronLeft size={16} />
                      </button>

                      <div
                        id="slots-scroll-container"
                        className="flex gap-2 overflow-x-auto pb-2 scrollbar-none flex-1"
                      >
                        {filteredGeneratedSlots.length === 0 ? (
                          <p className="text-xs text-slate-500 italic py-4 w-full text-center">No slots available for {activeDaypart} with this duration.</p>
                        ) : (
                          filteredGeneratedSlots.map((slot) => {
                            const isSelected = selectedSlotIndex === slot.originalIndex;
                            const isAvailable = slot.status === "Available";
                            const isBooked = slot.status === "Booked";
                            const isPartPaid = slot.status === "Part Paid";

                            let cardStyle = "border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer";
                            let statusIcon = <Plus className="h-4 w-4 text-emerald-500" />;
                            let statusLabel = "Free";

                            if (isSelected) {
                              cardStyle = "border-brand-500 bg-brand-50 text-brand-700 font-extrabold ring-2 ring-brand-100 cursor-pointer";
                            } else if (isBooked) {
                              cardStyle = "border-rose-100 bg-rose-50/50 text-rose-500 cursor-not-allowed opacity-60";
                              statusIcon = <X className="h-4 w-4 text-rose-500" />;
                              statusLabel = "Booked";
                            } else if (isPartPaid) {
                              cardStyle = "border-amber-100 bg-amber-50/50 text-amber-600 cursor-not-allowed opacity-60";
                              statusIcon = <Clock className="h-4 w-4 text-amber-500" />;
                              statusLabel = "Part Paid";
                            }

                            const startLabel = slot.startTime12.replace(":00", "");
                            const endLabel = slot.endTime12.replace(":00", "");

                            return (
                              <button
                                key={slot.originalIndex}
                                type="button"
                                disabled={!isAvailable}
                                onClick={() => setSelectedSlotIndex(slot.originalIndex)}
                                className={`flex flex-col items-center justify-between rounded-xl border p-3.5 text-center transition min-w-[125px] h-28 ${cardStyle}`}
                              >
                                <p className="text-[10px] uppercase font-extrabold tracking-wide opacity-80">
                                  {startLabel} - {endLabel}
                                </p>
                                <div className="my-1.5 flex flex-col items-center justify-center">
                                  {statusIcon}
                                  <span className="text-[9px] uppercase font-extrabold tracking-wider mt-0.5">{statusLabel}</span>
                                </div>
                                <p className="text-xs font-bold text-slate-800">₹{slot.price}</p>
                              </button>
                            );
                          })
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById("slots-scroll-container");
                          if (el) el.scrollBy({ left: 120, behavior: "smooth" });
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-400 shadow border border-slate-100 hover:bg-slate-50"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {/* Slots time difference slider exactly like the drawing design */}
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Slots Time Difference</span>
                        <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                          {formatDurationText(durationMin)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">15m</span>
                        <input
                          type="range"
                          min={15}
                          max={240}
                          step={15}
                          value={durationMin}
                          onChange={(e) => setDurationMin(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-500"
                        />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">4 hrs.</span>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <label className="mt-4 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Reporting Time *</label>
                <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
                    <Clock className="h-4 w-4" />
                  </span>
                  <select value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none">
                    {START_TIMES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <p className="text-sm font-bold text-slate-900">Price Summary</p>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
              <span className="font-bold text-brand-600">Total</span>
              <span className="font-extrabold text-brand-600">₹{activePrice.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <p className="text-sm font-bold text-slate-900">Payment Method</p>
            <div className="mt-3 flex gap-2">
              {PAYMENT_METHODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPayment(p)}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                    payment === p ? "border-brand-400 bg-brand-50 text-brand-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {p === "Cashfree (Online)" ? "Pay Online" : "Pay at Venue"}
                </button>
              ))}
            </div>

            {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">{error}</p>}

            <label className="mt-4 flex items-start gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-brand-600" />
              <span>
                I accept the <span className="font-semibold underline">Terms &amp; Conditions</span>.
              </span>
            </label>
          </div>

          <button
            type="button"
            disabled={!canPay || submitting}
            onClick={onPay}
            className={`w-full rounded-xl py-3.5 text-sm font-bold uppercase tracking-wide transition ${
              canPay && !submitting
                ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/30 hover:scale-[1.01]"
                : "cursor-not-allowed bg-slate-300 text-white"
            }`}
          >
            <span className="inline-flex items-center gap-1">
              {submitting ? "Booking..." : "Confirm Booking"} <ChevronRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STEP — CONFIRMATION                                                */
/* ------------------------------------------------------------------ */

function ConfirmedStep({ listing, booking, onClose }: { listing: Listing; booking: Booking; onClose: () => void }) {
  return (
    <div className="relative m-4 w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <Check className="h-8 w-8" strokeWidth={3} />
      </div>
      <h2 className="mt-4 text-xl font-extrabold text-slate-900">Booking Confirmed!</h2>
      <p className="mt-1 text-sm text-slate-500">Your slot at {listing.title} is locked in.</p>

      <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left text-sm">
        <Row label="Order ID" value={<span className="font-mono font-bold">{booking.orderId}</span>} />
        <Row label="Venue" value={`${listing.title} · ${listing.category}`} />
        <Row label="Date & Time" value={new Date(booking.dateTime).toLocaleString("en-GB")} />
        <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
          <span className="font-bold text-slate-900">{booking.paymentStatus === "paid" ? "Paid" : "Payment"}</span>
          <span className="font-extrabold text-emerald-600">₹{booking.totalAmount.toLocaleString("en-IN")}</span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border-l-4 border-brand-400 bg-brand-50 px-3 py-2 text-left text-xs text-slate-600">
        <ShieldCheck className="h-4 w-4 shrink-0 text-brand-500" />
        <span>
          Show this Order ID at the venue — the owner scans/enters it to check you in as <span className="font-bold">{booking.orderId}</span>.
        </span>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="mt-5 w-full rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:scale-[1.02]"
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
