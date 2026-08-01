"use client";

import { useEffect, useState } from "react";
import { X, Trophy, Building2, Check, Ban, ArrowRight, Sparkles } from "lucide-react";

export interface CourtItem {
  id: string;
  name: string;
  sports: string[];
  active: boolean;
}

function getSportEmoji(sport: string) {
  const l = (sport || "").toLowerCase();
  if (l.includes("cricket")) return "🏏";
  if (l.includes("foot") || l.includes("socc")) return "⚽";
  if (l.includes("badm")) return "🏸";
  if (l.includes("tenn") || l.includes("padel") || l.includes("squash")) return "🎾";
  if (l.includes("basket")) return "🏀";
  if (l.includes("volley")) return "🏐";
  if (l.includes("table") || l.includes("tt")) return "🏓";
  if (l.includes("snooker") || l.includes("pool")) return "🎱";
  if (l.includes("golf")) return "⛳";
  return "🏆";
}

export function SportCourtSelectionModal({
  isOpen,
  sports,
  courts,
  bookedCourtIds,
  slotTime,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  sports: string[];
  courts: CourtItem[];
  bookedCourtIds: string[];
  slotTime: string;
  onClose: () => void;
  onConfirm: (selectedSport: string, selectedCourtId: string) => void;
}) {
  const [selectedSport, setSelectedSport] = useState("");
  const [selectedCourtId, setSelectedCourtId] = useState("");
  const [step, setStep] = useState<"sport" | "court">("sport");

  // Determine available courts for the chosen sport
  const activeCourts = courts.filter((c) => c.active !== false);
  const courtsForSport = activeCourts.filter(
    (c) => !selectedSport || c.sports.length === 0 || c.sports.includes(selectedSport)
  );

  useEffect(() => {
    if (!isOpen) return;

    const initialSport = sports[0] || "";
    setSelectedSport(initialSport);

    const filtered = activeCourts.filter(
      (c) => !initialSport || c.sports.length === 0 || c.sports.includes(initialSport)
    );
    const firstAvailableCourt = filtered.find((c) => !bookedCourtIds.includes(c.id)) || filtered[0];
    setSelectedCourtId(firstAvailableCourt?.id || "");

    // Skip steps if single sport or single court
    if (sports.length <= 1) {
      if (filtered.length <= 1) {
        // Direct auto-confirm if only 1 sport and 1 court
        onConfirm(initialSport, firstAvailableCourt?.id || "");
      } else {
        setStep("court");
      }
    } else {
      setStep("sport");
    }
  }, [isOpen, sports, courts, bookedCourtIds]);

  if (!isOpen) return null;

  const handleSportSelect = (sport: string) => {
    setSelectedSport(sport);
    const validCourts = activeCourts.filter(
      (c) => c.sports.length === 0 || c.sports.includes(sport)
    );
    const available = validCourts.find((c) => !bookedCourtIds.includes(c.id)) || validCourts[0];
    setSelectedCourtId(available?.id || "");

    if (validCourts.length <= 1) {
      // Auto confirm if only 1 court for this sport
      onConfirm(sport, available?.id || "");
    } else {
      setStep("court");
    }
  };

  const handleCourtSelect = (courtId: string) => {
    if (bookedCourtIds.includes(courtId)) return;
    setSelectedCourtId(courtId);
  };

  const handleProceed = () => {
    if (!selectedSport) return;
    onConfirm(selectedSport, selectedCourtId);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-xs p-0 sm:items-center sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl border border-slate-100">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600">
              <Sparkles size={14} />
              <span>Select Venue Booking Details</span>
            </div>
            <h2 className="text-base font-black text-slate-900 mt-0.5">
              {step === "sport" ? "Select Sport" : `Select Court for ${selectedSport}`}
            </h2>
            <p className="text-[11px] font-medium text-slate-500">
              Slot Time: <span className="font-bold text-slate-800">{slotTime}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Step 1: Sport Selection */}
        {step === "sport" && (
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-600 mb-2">Which sport is being booked?</p>
            <div className="grid grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {sports.map((sport) => {
                const sportCourts = activeCourts.filter(
                  (c) => c.sports.length === 0 || c.sports.includes(sport)
                );
                const freeCount = sportCourts.filter((c) => !bookedCourtIds.includes(c.id)).length;
                const isSelected = selectedSport === sport;

                return (
                  <button
                    key={sport}
                    type="button"
                    onClick={() => handleSportSelect(sport)}
                    className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition-all cursor-pointer ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20"
                        : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50"
                    }`}
                  >
                    <span className="text-2xl">{getSportEmoji(sport)}</span>
                    <span className="text-xs font-extrabold text-slate-900 mt-1">{sport}</span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      {freeCount > 0 ? `${freeCount} Court${freeCount > 1 ? "s" : ""} Available` : "Fully Booked"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Court Selection */}
        {step === "court" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold text-slate-600">
                Select Court ({selectedSport})
              </p>
              {sports.length > 1 && (
                <button
                  type="button"
                  onClick={() => setStep("sport")}
                  className="text-[11px] font-bold text-emerald-600 hover:underline cursor-pointer"
                >
                  Change Sport
                </button>
              )}
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {courtsForSport.length === 0 ? (
                <div className="p-4 text-center rounded-2xl border border-dashed border-slate-200 text-xs font-semibold text-slate-500">
                  No courts configured for {selectedSport}.
                </div>
              ) : (
                courtsForSport.map((court) => {
                  const isBooked = bookedCourtIds.includes(court.id);
                  const isSelected = selectedCourtId === court.id;

                  return (
                    <button
                      key={court.id}
                      type="button"
                      disabled={isBooked}
                      onClick={() => handleCourtSelect(court.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition-all ${
                        isBooked
                          ? "border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed"
                          : isSelected
                          ? "border-emerald-500 bg-emerald-50/80 shadow-xs ring-2 ring-emerald-500/20 cursor-pointer"
                          : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-slate-50 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-xl font-extrabold text-xs ${
                            isBooked
                              ? "bg-rose-100 text-rose-600"
                              : isSelected
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <Building2 size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-extrabold text-slate-900">{court.name}</p>
                          <p className="text-[10px] font-medium text-slate-500">
                            {isBooked ? "Booked for this slot" : "Available"}
                          </p>
                        </div>
                      </div>

                      <div>
                        {isBooked ? (
                          <span className="flex items-center gap-1 text-[10px] font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <Ban size={11} /> Booked
                          </span>
                        ) : isSelected ? (
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                            <Check size={14} />
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
          >
            Cancel
          </button>

          {step === "court" && (
            <button
              type="button"
              disabled={!selectedCourtId || bookedCourtIds.includes(selectedCourtId)}
              onClick={handleProceed}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer shadow-xs"
            >
              <span>Continue to Details</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
