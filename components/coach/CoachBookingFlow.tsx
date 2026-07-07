"use client";

import { useState } from "react";
import { Check, ShieldCheck, User, X } from "lucide-react";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";
import { LoginModal } from "@/components/home/modals/LoginModal";
import { SignupModal } from "@/components/home/modals/SignupModal";
import { bookCoachSlot } from "@/lib/api/coaches";
import { ApiError } from "@/lib/api/client";
import type { Coach, CoachBooking, CoachSlot, PaymentMethod } from "@/lib/api/types";

const PAYMENT_METHODS: PaymentMethod[] = ["Cashfree (Online)", "Cash (Offline)"];

export function CoachBookingFlow({ coach, slot, onClose }: { coach: Coach; slot: CoachSlot; onClose: () => void }) {
  const { status } = useCustomerAuth();
  const [authView, setAuthView] = useState<"login" | "signup">("login");
  const [payment, setPayment] = useState<PaymentMethod>(PAYMENT_METHODS[0]);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [booking, setBooking] = useState<CoachBooking | null>(null);

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

  async function handleConfirm() {
    if (!agreed) return;
    setSubmitting(true);
    setError("");
    try {
      const created = await bookCoachSlot({ coachId: coach._id, slotId: slot.id, payment });
      setBooking(created);
    } catch (err) {
      setError(err instanceof ApiError ? err.describe() : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (booking) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm">
        <div className="relative m-4 w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <Check className="h-8 w-8" strokeWidth={3} />
          </div>
          <h2 className="mt-4 text-xl font-extrabold text-slate-900">Session Booked!</h2>
          <p className="mt-1 text-sm text-slate-500">Your slot with {coach.name} is locked in.</p>

          <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left text-sm">
            <Row label="Order ID" value={<span className="font-mono font-bold">{booking.orderId}</span>} />
            <Row label="Coach" value={`${coach.name} · ${coach.category}`} />
            <Row
              label="Date & Time"
              value={`${new Date(booking.slotDate).toLocaleDateString("en-GB")} · ${booking.slotStartTime}–${booking.slotEndTime}`}
            />
            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-2">
              <span className="font-bold text-slate-900">{booking.paymentStatus === "paid" ? "Paid" : "Payment"}</span>
              <span className="font-extrabold text-emerald-600">₹{booking.amount.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl border-l-4 border-brand-400 bg-brand-50 px-3 py-2 text-left text-xs text-slate-600">
            <ShieldCheck className="h-4 w-4 shrink-0 text-brand-500" />
            <span>
              Show this Order ID to the coach — they enter it to check you in as{" "}
              <span className="font-bold">{booking.orderId}</span>.
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
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center overflow-y-auto bg-black/50 backdrop-blur-sm sm:items-center">
      <div className="relative my-6 w-full max-w-lg rounded-3xl bg-slate-50 p-5 shadow-2xl sm:p-7">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 className="text-xl font-extrabold text-slate-900">Confirm Your Session</h2>

        <div className="mt-5 flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-500">
              <User className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">{coach.name}</p>
              <p className="text-xs text-slate-500">
                {coach.category}
                {coach.subCategory ? ` · ${coach.subCategory}` : ""}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm">
            <Row label="Date" value={new Date(slot.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} />
            <Row label="Time" value={`${slot.startTime} – ${slot.endTime}`} />
            <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
              <span className="font-bold text-brand-600">Total</span>
              <span className="font-extrabold text-brand-600">₹{coach.fees.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-4">
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
                  {p === "Cashfree (Online)" ? "Pay Online" : "Pay at Session"}
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
            disabled={!agreed || submitting}
            onClick={handleConfirm}
            className={`w-full rounded-xl py-3.5 text-sm font-bold uppercase tracking-wide transition ${
              agreed && !submitting
                ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-500/30 hover:scale-[1.01]"
                : "cursor-not-allowed bg-slate-300 text-white"
            }`}
          >
            {submitting ? "Booking..." : "Confirm & Book"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}
