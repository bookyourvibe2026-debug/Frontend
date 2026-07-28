"use client";

import { useState } from "react";
import { Check, Clock, ShieldCheck, Trophy, X } from "lucide-react";
import { joinHostedMatch, confirmPlayerPayment } from "@/lib/api/hostedMatches";
import { ApiError } from "@/lib/api/client";
import type { HostedMatch, HostedMatchParticipant } from "@/lib/api/types";

export function PlayerJoinModal({
  match: initialMatch,
  userCustomerId,
  onClose,
  onUpdated,
}: {
  match: HostedMatch;
  userCustomerId?: string;
  onClose: () => void;
  onUpdated: (match: HostedMatch) => void;
}) {
  const [match, setMatch] = useState<HostedMatch>(initialMatch);
  const [playerName, setPlayerName] = useState("");
  const [playerPhone, setPlayerPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [error, setError] = useState("");

  // Check if player has already joined/requested
  const myParticipant = match.participants.find(
    (p) => (userCustomerId && p.customerId === userCustomerId) || (playerPhone && p.phone === playerPhone)
  );

  async function handleSendJoinRequest() {
    setSubmitting(true);
    setError("");
    try {
      const updated = await joinHostedMatch(match.matchId, {
        name: playerName || undefined,
        phone: playerPhone || undefined,
      });
      setMatch(updated);
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.describe() : "Failed to send join request");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmPlayerPayment() {
    if (!myParticipant) return;
    setConfirmingPayment(true);
    setError("");
    try {
      const updated = await confirmPlayerPayment(match.matchId, myParticipant.participantId);
      setMatch(updated);
      onUpdated(updated);
      setPaymentModalOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.describe() : "Entry fee payment failed");
    } finally {
      setConfirmingPayment(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center bg-black/60 backdrop-blur-md p-0 sm:items-center sm:p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-white" />
              <h3 className="text-sm font-extrabold uppercase tracking-wide">Join Match Lobby</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/10 p-1.5 text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs font-bold text-emerald-100 mt-1">{match.sport} Match at {match.date}</p>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Match Overview */}
          <div className="rounded-2xl bg-slate-50 p-3.5 space-y-2">
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Host</span>
              <span className="font-bold text-slate-900">{match.hostName}</span>
            </div>
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Time Slot</span>
              <span className="font-bold text-slate-900">{match.startTime} – {match.endTime}</span>
            </div>
            <div className="flex justify-between text-slate-500 font-medium">
              <span>Entry Fee</span>
              <span className="font-extrabold text-emerald-700">
                {match.entryFeePerPlayer > 0 ? `₹${match.entryFeePerPlayer}` : "Free (₹0)"}
              </span>
            </div>
          </div>

          {/* Participant Status Messages */}
          {myParticipant ? (
            <div className="space-y-3">
              {myParticipant.status === "Pending Approval" && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center space-y-1">
                  <Clock className="h-6 w-6 text-amber-600 mx-auto" />
                  <p className="font-extrabold text-amber-900 text-xs">Request Pending Host Approval</p>
                  <p className="text-[11px] text-amber-700">
                    Host {match.hostName} has been notified. Once approved, you can complete your entry fee payment.
                  </p>
                </div>
              )}

              {myParticipant.status === "Payment Pending" && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center space-y-3">
                  <Check className="h-6 w-6 text-emerald-600 mx-auto" />
                  <div>
                    <p className="font-extrabold text-emerald-950 text-xs">Host Accepted Your Request!</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">
                      Please complete your entry fee of <strong className="text-emerald-950">₹{match.entryFeePerPlayer}</strong> to confirm your spot.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(true)}
                    className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3 font-extrabold text-white shadow-md transition"
                  >
                    PAY ENTRY FEE (₹{match.entryFeePerPlayer})
                  </button>
                </div>
              )}

              {myParticipant.status === "Confirmed" && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center space-y-2">
                  <Check className="h-7 w-7 text-emerald-600 mx-auto" />
                  <p className="font-extrabold text-emerald-950 text-sm">You&apos;re Confirmed!</p>
                  <p className="text-[11px] text-emerald-700">
                    Your spot is locked in. Show up at the venue for your match!
                  </p>
                </div>
              )}

              {myParticipant.status === "Rejected" && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center space-y-1">
                  <X className="h-6 w-6 text-rose-600 mx-auto" />
                  <p className="font-extrabold text-rose-900 text-xs">Request Declined</p>
                  <p className="text-[11px] text-rose-700">The host declined this request.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="mb-1 block font-bold text-slate-500 uppercase">Your Name *</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-semibold text-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-slate-500 uppercase">Mobile Number *</label>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  value={playerPhone}
                  onChange={(e) => setPlayerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3 font-semibold text-slate-800 text-xs"
                />
              </div>

              {error && <p className="rounded-xl bg-rose-50 p-2 text-center text-rose-600 font-semibold">{error}</p>}

              <button
                type="button"
                disabled={submitting || !playerPhone}
                onClick={handleSendJoinRequest}
                className="w-full rounded-2xl bg-emerald-600 hover:bg-emerald-700 py-3.5 font-extrabold uppercase text-white shadow-md shadow-emerald-600/30 transition disabled:opacity-50"
              >
                {submitting ? "Sending..." : "SEND REQUEST TO HOST"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Player Entry Fee Payment Modal */}
      {paymentModalOpen && myParticipant && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-white" />
                  <h3 className="text-sm font-extrabold uppercase tracking-wide">Pay Player Entry Fee</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="rounded-full bg-white/10 p-1.5 text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="rounded-2xl bg-slate-50 p-3.5 space-y-2">
                <div className="flex justify-between font-bold text-emerald-800 bg-emerald-50 p-2.5 rounded-xl">
                  <span>Entry Fee Payable</span>
                  <span className="text-base font-black">₹{match.entryFeePerPlayer.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {error && <p className="rounded-xl bg-rose-50 p-2.5 text-center font-semibold text-rose-600">{error}</p>}

              <button
                type="button"
                disabled={confirmingPayment}
                onClick={handleConfirmPlayerPayment}
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-4 font-extrabold uppercase text-white shadow-lg shadow-emerald-600/30 transition hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {confirmingPayment ? "Confirming Payment..." : `PAY ₹${match.entryFeePerPlayer} TO CONFIRM SPOT`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
