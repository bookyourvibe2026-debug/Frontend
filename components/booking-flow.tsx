"use client";

/* ------------------------------------------------------------------ */
/*  BOOKING FLOW                                                       */
/*                                                                     */
/*  Full "Book Now" journey, modeled on the Book-My-Adventure flow     */
/*  but adapted for hourly venue slots:                                */
/*                                                                     */
/*    1. select    -> pick how many 1-hour slots (qty stepper)         */
/*    2. review    -> date + start time + contact + price summary      */
/*    3. confirmed -> order id, ticket note, done                      */
/*                                                                     */
/*  Self-contained client component. Pass a venue + onClose. No route  */
/*  plumbing needed, so it drops into any page that has a venue.       */
/* ------------------------------------------------------------------ */

import { useMemo, useState } from "react";
import { CalendarDays, Clock, Minus, Plus, ShieldCheck, X } from "lucide-react";

export interface BookingVenue {
  id: string;
  name: string;
  area: string;
  sport: string;
  pricePerHour: number;
  status: "Available" | "Filling Fast" | "Full";
  image: string;
}

type Step = "select" | "review" | "confirmed";

const FEE_RATE = 0.03; // "Fees & Taxes" — 3% of subtotal
const MAX_SLOTS = 8;

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

function prettyDate(iso: string) {
  if (!iso) return "Select a date";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function makeOrderId() {
  return "BYV" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

/* ------------------------------------------------------------------ */

export default function BookingFlow({
  venue,
  onClose,
}: {
  venue: BookingVenue;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("select");
  const [slots, setSlots] = useState(1);
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState(START_TIMES[6]); // 12:00 PM default
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [orderId, setOrderId] = useState("");

  const subtotal = venue.pricePerHour * slots;
  const fees = Math.round(subtotal * FEE_RATE);
  const grandTotal = subtotal + fees;

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const phoneOk = /^\d{10}$/.test(phone);
  const canPay =
    name.trim().length > 1 && emailOk && phoneOk && agreed && !!date;

  const inc = () => setSlots((s) => Math.min(MAX_SLOTS, s + 1));
  const dec = () => setSlots((s) => Math.max(1, s - 1));

  const handlePay = () => {
    if (!canPay) return;
    setOrderId(makeOrderId());
    setStep("confirmed");
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center overflow-y-auto bg-black/50 backdrop-blur-sm sm:items-center">
      {step === "select" && (
        <SelectStep
          venue={venue}
          slots={slots}
          subtotal={subtotal}
          onInc={inc}
          onDec={dec}
          onCancel={onClose}
          onContinue={() => setStep("review")}
        />
      )}

      {step === "review" && (
        <ReviewStep
          venue={venue}
          slots={slots}
          date={date}
          time={time}
          name={name}
          email={email}
          phone={phone}
          agreed={agreed}
          subtotal={subtotal}
          fees={fees}
          grandTotal={grandTotal}
          emailOk={emailOk || email === ""}
          phoneOk={phoneOk || phone === ""}
          canPay={canPay}
          onInc={inc}
          onDec={dec}
          setDate={setDate}
          setTime={setTime}
          setName={setName}
          setEmail={setEmail}
          setPhone={setPhone}
          setAgreed={setAgreed}
          onBack={() => setStep("select")}
          onClose={onClose}
          onPay={handlePay}
        />
      )}

      {step === "confirmed" && (
        <ConfirmedStep
          venue={venue}
          slots={slots}
          date={date}
          time={time}
          grandTotal={grandTotal}
          orderId={orderId}
          name={name}
          onClose={onClose}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STEP 1 — SELECT SLOTS                                              */
/* ------------------------------------------------------------------ */

function SelectStep({
  venue,
  slots,
  subtotal,
  onInc,
  onDec,
  onCancel,
  onContinue,
}: {
  venue: BookingVenue;
  slots: number;
  subtotal: number;
  onInc: () => void;
  onDec: () => void;
  onCancel: () => void;
  onContinue: () => void;
}) {
  return (
    <div className="relative m-4 w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl">
      <p className="text-lg font-extrabold text-slate-900">Select Slots</p>
      <p className="mt-0.5 text-xs text-slate-400">
        {venue.name} · {venue.sport}
      </p>

      <div className="mt-5 flex items-center justify-between border-b border-slate-100 pb-5">
        <div>
          <p className="text-sm font-semibold text-slate-900">1 Hour Slot</p>
          <p className="text-xs text-slate-400">₹{venue.pricePerHour}</p>
        </div>
        <Stepper value={slots} onInc={onInc} onDec={onDec} />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-900">Total Amount</p>
        <p className="text-lg font-extrabold text-orange-600">
          ₹{subtotal.toLocaleString("en-IN")}
        </p>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition hover:scale-[1.02]"
        >
          Continue ›
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STEP 2 — REVIEW & CONFIRM                                          */
/* ------------------------------------------------------------------ */

function ReviewStep(props: {
  venue: BookingVenue;
  slots: number;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  agreed: boolean;
  subtotal: number;
  fees: number;
  grandTotal: number;
  emailOk: boolean;
  phoneOk: boolean;
  canPay: boolean;
  onInc: () => void;
  onDec: () => void;
  setDate: (v: string) => void;
  setTime: (v: string) => void;
  setName: (v: string) => void;
  setEmail: (v: string) => void;
  setPhone: (v: string) => void;
  setAgreed: (v: boolean) => void;
  onBack: () => void;
  onClose: () => void;
  onPay: () => void;
}) {
  const {
    venue, slots, date, time, name, email, phone, agreed,
    subtotal, fees, grandTotal, emailOk, phoneOk, canPay,
    onInc, onDec, setDate, setTime, setName, setEmail, setPhone,
    setAgreed, onBack, onClose, onPay,
  } = props;

  const slotsLeft = useMemo(
    () => (venue.status === "Filling Fast" ? 6 : 50),
    [venue.status]
  );

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

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-slate-400 transition hover:text-orange-600"
        >
          ‹ Back
        </button>
        <h2 className="text-xl font-extrabold text-slate-900">
          Review &amp; Confirm Your Booking
        </h2>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <p className="text-base font-bold text-slate-900">
              {venue.sport} — {venue.name}
            </p>
            <p className="text-xs text-slate-400">
              📍 {venue.area} · Please review your slot &amp; details
            </p>
          </div>

          {/* Date & time */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <p className="text-sm font-bold text-slate-900">Select Date &amp; Time</p>

            <label className="mt-4 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Select Date *
            </label>
            <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                <CalendarDays className="h-4 w-4" />
              </span>
              <input
                type="date"
                value={date}
                min={todayISO()}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
              />
            </div>

            <label className="mt-4 block text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Reporting Time *
            </label>
            <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                <Clock className="h-4 w-4" />
              </span>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
              >
                {START_TIMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Slots */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            <div className="flex items-center gap-2 border-l-4 border-orange-500 px-5 py-3">
              <p className="text-sm font-bold text-slate-900">Select Slots</p>
            </div>
            <div className="flex items-center justify-between px-5 pb-5">
              <div>
                <p className="text-sm font-semibold text-slate-900">1 Hour Slot</p>
                <p className="text-xs text-slate-400">
                  ₹{venue.pricePerHour.toLocaleString("en-IN")} only
                </p>
              </div>
              <div className="flex items-center gap-6">
                <Stepper value={slots} onInc={onInc} onDec={onDec} />
                <p className="w-20 text-right text-sm font-bold text-slate-900">
                  ₹{subtotal.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-4">
          {/* Price summary */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <p className="text-sm font-bold text-slate-900">Price Summary</p>
            <div className="mt-4 space-y-2 text-sm">
              <Row
                label={`1 Hour Slot (${slots})`}
                value={`₹${subtotal.toLocaleString("en-IN")}.00`}
              />
              <Row label="Fees & Taxes" value={`₹${fees.toLocaleString("en-IN")}.00`} />
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
                <span className="font-bold text-orange-600">Grand Total</span>
                <span className="font-extrabold text-orange-600">
                  ₹{grandTotal.toLocaleString("en-IN")}.00
                </span>
              </div>
            </div>
          </div>

          {/* Contact details */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-900">Contact Details</p>
              <span className="text-[11px] font-bold text-emerald-600">
                ● {slotsLeft} SLOTS AVAILABLE
              </span>
            </div>

            <div className="mt-3 rounded-lg border-l-4 border-orange-400 bg-orange-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
              <span className="font-bold text-slate-800">NOTE:</span> After successful
              payment, downloading your ticket is{" "}
              <span className="font-bold underline">compulsory</span> for verification at
              the venue.
            </div>

            <div className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
              />
              <div>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-orange-400 ${
                    emailOk ? "border-slate-200" : "border-rose-300"
                  }`}
                />
                {!emailOk && (
                  <p className="mt-1 text-[11px] text-rose-500">Enter a valid email.</p>
                )}
              </div>
              <div>
                <div
                  className={`flex items-center rounded-xl border px-3 ${
                    phoneOk ? "border-slate-200" : "border-rose-300"
                  }`}
                >
                  <span className="mr-2 border-r border-slate-200 pr-2 text-sm font-semibold text-slate-600">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="10-digit number"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))
                    }
                    className="w-full py-3 text-sm outline-none"
                  />
                </div>
                {!phoneOk && (
                  <p className="mt-1 text-[11px] text-rose-500">
                    Enter a 10-digit mobile number.
                  </p>
                )}
              </div>

              <label className="flex items-start gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-orange-600"
                />
                <span>
                  I accept the{" "}
                  <span className="font-semibold underline">Terms &amp; Conditions</span>.
                </span>
              </label>
            </div>
          </div>

          <button
            type="button"
            disabled={!canPay}
            onClick={onPay}
            className={`w-full rounded-xl py-3.5 text-sm font-bold uppercase tracking-wide transition ${
              canPay
                ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md shadow-orange-500/30 hover:scale-[1.01]"
                : "cursor-not-allowed bg-slate-300 text-white"
            }`}
          >
            Proceed to Payment ›
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STEP 3 — CONFIRMATION                                              */
/* ------------------------------------------------------------------ */

function ConfirmedStep({
  venue,
  slots,
  date,
  time,
  grandTotal,
  orderId,
  name,
  onClose,
}: {
  venue: BookingVenue;
  slots: number;
  date: string;
  time: string;
  grandTotal: number;
  orderId: string;
  name: string;
  onClose: () => void;
}) {
  return (
    <div className="relative m-4 w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl">
        ✅
      </div>
      <h2 className="mt-4 text-xl font-extrabold text-slate-900">Booking Confirmed!</h2>
      <p className="mt-1 text-sm text-slate-500">
        {name ? `${name.split(" ")[0]}, your` : "Your"} slot at {venue.name} is locked in.
      </p>

      <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left text-sm">
        <Row label="Order ID" value={<span className="font-mono font-bold">{orderId}</span>} />
        <Row label="Venue" value={`${venue.name} · ${venue.sport}`} />
        <Row label="Date" value={prettyDate(date)} />
        <Row label="Time" value={`${time} · ${slots} hr${slots > 1 ? "s" : ""}`} />
        <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
          <span className="font-bold text-slate-900">Paid</span>
          <span className="font-extrabold text-emerald-600">
            ₹{grandTotal.toLocaleString("en-IN")}.00
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 rounded-xl border-l-4 border-orange-400 bg-orange-50 px-3 py-2 text-left text-xs text-slate-600">
        <ShieldCheck className="h-4 w-4 shrink-0 text-orange-500" />
        <span>
          Downloading your ticket is <span className="font-bold">compulsory</span> for
          check-in at the venue.
        </span>
      </div>

      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Download Ticket
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition hover:scale-[1.02]"
        >
          Done
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  SHARED BITS                                                        */
/* ------------------------------------------------------------------ */

function Stepper({
  value,
  onInc,
  onDec,
}: {
  value: number;
  onInc: () => void;
  onDec: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onDec}
        aria-label="Decrease"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-5 text-center text-sm font-bold text-slate-900">{value}</span>
      <button
        type="button"
        onClick={onInc}
        aria-label="Increase"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600 transition hover:bg-orange-200"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
