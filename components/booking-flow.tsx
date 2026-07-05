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

import { useState } from "react";
import { CalendarDays, Check, ChevronRight, Clock, MapPin, ShieldCheck, X } from "lucide-react";
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

/* ------------------------------------------------------------------ */

export default function BookingFlow({ listing, onClose }: { listing: Listing; onClose: () => void }) {
  const { status } = useCustomerAuth();
  const [authView, setAuthView] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<Step>("review");
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState(START_TIMES[6]);
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

  const canPay = agreed && !!date;

  async function handlePay() {
    if (!canPay) return;
    setSubmitting(true);
    setError("");
    try {
      const dateTime = new Date(`${date}T${to24Hour(time)}:00`).toISOString();
      const created = await createMyBooking({ listingId: listing._id, dateTime, payment });
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
          time={time}
          payment={payment}
          agreed={agreed}
          canPay={canPay}
          submitting={submitting}
          error={error}
          setDate={setDate}
          setTime={setTime}
          setPayment={setPayment}
          setAgreed={setAgreed}
          onClose={onClose}
          onPay={handlePay}
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
  time: string;
  payment: PaymentMethod;
  agreed: boolean;
  canPay: boolean;
  submitting: boolean;
  error: string;
  setDate: (v: string) => void;
  setTime: (v: string) => void;
  setPayment: (v: PaymentMethod) => void;
  setAgreed: (v: boolean) => void;
  onClose: () => void;
  onPay: () => void;
}) {
  const { listing, date, time, payment, agreed, canPay, submitting, error, setDate, setTime, setPayment, setAgreed, onClose, onPay } = props;

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

            <label className="mt-4 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Select Date *</label>
            <div className="mt-1.5 flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-500">
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
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5">
            <p className="text-sm font-bold text-slate-900">Price Summary</p>
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
              <span className="font-bold text-brand-600">Total</span>
              <span className="font-extrabold text-brand-600">₹{listing.price.toLocaleString("en-IN")}</span>
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
