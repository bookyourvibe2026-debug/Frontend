"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Clock, X, Zap } from "lucide-react";
import { getVendorBookings, getVendorListings, updateVendorListing } from "@/lib/api/vendor";
import { apiListingToMock, mockListingToApiInput } from "@/lib/api/listingAdapter";
import { ApiError } from "@/lib/api/client";
import { Booking, Listing, TurfSlot } from "@/lib/types";

/**
 * Last Min Boost — a real last-minute discount, not a redirect.
 *
 * The vendor picks one of today's still-unbooked upcoming slots and drops its
 * price (10/20/30% or a custom rate). The discount is written as a date
 * override for today, so players booking that slot immediately see the lower
 * price. Slots starting within the boost window are highlighted so the
 * "10 minutes left, nobody booked 7–9" case is one tap away.
 */

type ApiBooking = Booking & { listingId?: string; endTime?: string };

const DISCOUNTS = [10, 20, 30];
/** Slots starting within this many minutes get the "boost window" highlight. */
const BOOST_WINDOW_MIN = 60;

function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function to12h(t: string): string {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  let h = Number(hStr) % 24;
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mStr} ${ap}`;
}

function slotStartDate(dateIso: string, slot: TurfSlot) {
  return new Date(`${dateIso}T${slot.startTime}:00`);
}

function resolveSlotsForDate(listing: Listing, dateIso: string): TurfSlot[] {
  const override = listing.dateOverrides?.find((o) => o.date === dateIso);
  if (override) return override.slots ?? [];
  return listing.slotsList ?? [];
}

export function LastMinBoostSheet({ onClose }: { onClose: () => void }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTurfId, setSelectedTurfId] = useState("");
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [discount, setDiscount] = useState(20);
  const [customPrice, setCustomPrice] = useState("");
  const [applying, setApplying] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const todayIso = useMemo(() => toIso(new Date()), []);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    Promise.all([getVendorListings(), getVendorBookings({ limit: 500 })])
      .then(([l, b]) => {
        const turfs = l.map(apiListingToMock).filter((x) => x.type === "Turf");
        setListings(turfs);
        setSelectedTurfId(turfs[0]?.id ?? "");
        setBookings(b.items as unknown as ApiBooking[]);
      })
      .catch((e) => setError(e instanceof ApiError ? e.describe() : "Failed to load your slots"))
      .finally(() => setLoading(false));
  }, []);

  const selectedTurf = useMemo(() => listings.find((l) => l.id === selectedTurfId), [listings, selectedTurfId]);

  /** Start times ("HH:MM") already taken today for the selected turf. */
  const bookedStarts = useMemo(() => {
    const set = new Set<string>();
    for (const b of bookings) {
      if (b.status === "Cancelled") continue;
      if ((b.listingId ?? b.listing) !== selectedTurfId) continue;
      const start = new Date(b.dateTime);
      if (toIso(start) !== todayIso) continue;
      set.add(`${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`);
    }
    return set;
  }, [bookings, selectedTurfId, todayIso]);

  /** Today's slots that are still open and haven't started yet. */
  const boostableSlots = useMemo(() => {
    if (!selectedTurf) return [];
    return resolveSlotsForDate(selectedTurf, todayIso)
      .filter((s) => !s.blocked && !bookedStarts.has(s.startTime))
      .map((s) => {
        const minsToStart = Math.round((slotStartDate(todayIso, s).getTime() - now) / 60_000);
        return { slot: s, minsToStart, inBoostWindow: minsToStart > 0 && minsToStart <= BOOST_WINDOW_MIN };
      })
      .filter((x) => x.minsToStart > 0)
      .sort((a, b) => a.minsToStart - b.minsToStart);
  }, [selectedTurf, todayIso, bookedStarts, now]);

  const selected = boostableSlots.find((x) => x.slot.startTime === selectedStart) ?? null;
  const boostedPrice = selected
    ? customPrice
      ? Number(customPrice) || 0
      : Math.round((selected.slot.price * (100 - discount)) / 100)
    : 0;

  async function applyBoost() {
    if (!selectedTurf || !selected || applying || boostedPrice <= 0) return;
    setApplying(true);
    try {
      const daySlots = resolveSlotsForDate(selectedTurf, todayIso).map((s) =>
        s.startTime === selected.slot.startTime ? { ...s, price: boostedPrice } : s
      );
      const overrides = [...(selectedTurf.dateOverrides ?? [])];
      const existing = overrides.find((o) => o.date === todayIso);
      const entry = {
        date: todayIso,
        isHoliday: existing?.isHoliday ?? false,
        holidayName: existing?.holidayName ?? "",
        slots: daySlots,
      };
      const idx = overrides.findIndex((o) => o.date === todayIso);
      if (idx > -1) overrides[idx] = entry;
      else overrides.push(entry);

      const saved = await updateVendorListing(selectedTurf.id, mockListingToApiInput({ ...selectedTurf, dateOverrides: overrides }));
      setListings((ls) => ls.map((x) => (x.id === selectedTurf.id ? apiListingToMock(saved) : x)));
      setDone(
        `Boost is live: ${to12h(selected.slot.startTime)} – ${to12h(selected.slot.endTime)} now ₹${boostedPrice.toLocaleString(
          "en-IN"
        )} (was ₹${selected.slot.price.toLocaleString("en-IN")}).`
      );
      setSelectedStart(null);
      setCustomPrice("");
    } catch (e) {
      setError(e instanceof ApiError ? e.describe() : "Couldn't apply the boost. Please try again.");
    }
    setApplying(false);
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#dc2626]">
              <Zap size={18} className="fill-[#dc2626]" />
            </span>
            <div>
              <h3 className="text-[14px] font-black text-slate-900">Last Min Boost</h3>
              <p className="text-[10px] font-medium text-slate-400">
                Drop the price on today&apos;s unbooked slots so they fill up in the final minutes.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
            <X size={16} />
          </button>
        </div>

        {done && (
          <p className="mt-4 rounded-xl bg-emerald-50 px-3 py-2.5 text-[11px] font-bold text-emerald-700">{done}</p>
        )}
        {error && <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2.5 text-[11px] font-bold text-rose-600">{error}</p>}

        {loading ? (
          <div className="py-10 text-center text-sm font-bold text-slate-400">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
            Loading today&apos;s slots…
          </div>
        ) : !selectedTurf ? (
          <p className="py-10 text-center text-sm font-semibold text-slate-500">
            No turf listings found — add a turf to use Last Min Boost.
          </p>
        ) : (
          <>
            {listings.length > 1 && (
              <div className="relative mt-4">
                <select
                  value={selectedTurfId}
                  onChange={(e) => {
                    setSelectedTurfId(e.target.value);
                    setSelectedStart(null);
                  }}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-8 text-xs font-bold text-slate-800 outline-none"
                >
                  {listings.map((l) => (
                    <option key={l.id} value={l.id}>{l.title}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            )}

            <p className="mt-4 text-[10px] font-black uppercase tracking-wide text-slate-400">
              Today&apos;s unbooked slots
            </p>
            {boostableSlots.length === 0 ? (
              <p className="mt-2 rounded-xl border border-dashed border-slate-200 p-6 text-center text-xs font-semibold text-slate-400">
                Nothing left to boost — every remaining slot today is booked or blocked. 🎉
              </p>
            ) : (
              <div className="mt-2 space-y-2">
                {boostableSlots.map(({ slot, minsToStart, inBoostWindow }) => {
                  const isSelected = selectedStart === slot.startTime;
                  return (
                    <button
                      key={slot.startTime}
                      onClick={() => setSelectedStart(isSelected ? null : slot.startTime)}
                      className={`flex w-full items-center justify-between gap-2 rounded-2xl border-2 p-3 text-left transition ${
                        isSelected
                          ? "border-[#dc2626] bg-red-50/60"
                          : inBoostWindow
                          ? "border-amber-300 bg-amber-50/60"
                          : "border-slate-100 bg-white hover:border-slate-200"
                      }`}
                    >
                      <div>
                        <p className="text-[12px] font-black text-slate-900">
                          {to12h(slot.startTime)} – {to12h(slot.endTime)}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <Clock size={9} />
                          {minsToStart < 60 ? `Starts in ${minsToStart} min` : `Starts in ${Math.round(minsToStart / 60)} hr`}
                          {inBoostWindow && (
                            <span className="ml-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-[8px] font-black uppercase text-amber-700">
                              Boost window
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="text-[12px] font-black text-slate-700">₹{slot.price.toLocaleString("en-IN")}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {selected && (
              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Discount</p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {DISCOUNTS.map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setDiscount(d);
                        setCustomPrice("");
                      }}
                      className={`rounded-xl py-2.5 text-[11px] font-black transition ${
                        !customPrice && discount === d ? "bg-[#dc2626] text-white" : "border border-slate-200 bg-white text-slate-600"
                      }`}
                    >
                      {d}% off
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value.replace(/\D/g, ""))}
                  placeholder="Or type a custom price (₹)"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold outline-none focus:border-[#dc2626]"
                />
                <button
                  onClick={applyBoost}
                  disabled={applying || boostedPrice <= 0 || boostedPrice >= selected.slot.price}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl bg-[#dc2626] py-3 text-[11px] font-black text-white transition active:scale-[0.98] disabled:opacity-50"
                >
                  <Zap size={13} className="fill-white" />
                  {applying
                    ? "Applying boost…"
                    : `Boost: ₹${selected.slot.price.toLocaleString("en-IN")} → ₹${boostedPrice.toLocaleString("en-IN")}`}
                </button>
                {boostedPrice >= selected.slot.price && customPrice && (
                  <p className="mt-1.5 text-center text-[9px] font-bold text-rose-500">
                    A boost has to be below the current price of ₹{selected.slot.price.toLocaleString("en-IN")}.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
