"use client";

import { useMemo, useState } from "react";
import { X, Check } from "lucide-react";
import type { Court, TurfSlot } from "@/lib/types";
import { categoryLabel } from "@/lib/taxonomy";
import { useBackDismiss } from "@/lib/useBackDismiss";

function t24m(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function to12h(t: string) {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  let h = Number(hStr) % 24; // "24:00" (midnight close) → 12:00 AM
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${mStr} ${ap}`;
}
function roundTo50(n: number) {
  return Math.max(0, Math.round(n / 50) * 50);
}
/** Minute-of-day sort key that puts the venue's real day first: anything before 5 AM
 * (a late-night tail like 12–3 AM) sorts *after* the rest of the day — same ordering
 * as the time-of-day pricing tool above, on the page this sheet opens from. */
function dayOrderMinutes(time: string): number {
  const mins = t24m(time);
  return mins < 300 ? mins + 1440 : mins;
}

export function DailyPricingSheet({
  dateLabel,
  slots,
  categories,
  courts,
  initialGame = "all",
  initialCourtId = "all",
  bookedTimes = [],
  onClose,
  onSave,
  onBookSlot,
}: {
  dateLabel: string;
  /** Every row saved for this date across every sport/court tag — not just the ones
   * relevant to the currently selected game/court, so switching combinations up on the
   * pricing page never loses another combination's pricing. */
  slots: TurfSlot[];
  /** Sport category ids this turf offers — shown so the vendor knows which game this
   * sheet is pricing, but not re-selectable here (that choice is made once, above). */
  categories?: string[];
  /** This turf's courts, shown the same read-only way as categories. */
  courts?: Court[];
  /** Game/court the pricing page currently has selected — this sheet always edits
   * exactly that combination, matching what's chosen above it on the page. */
  initialGame?: string;
  initialCourtId?: string;
  /** Already-booked start times for this date (any court, days-ahead bookings included)
   * — those rows are locked so a vendor can never reprice something already sold. */
  bookedTimes?: { startTime: string; courtIds: string[] }[];
  onClose: () => void;
  onSave: (nextSlots: TurfSlot[]) => Promise<void> | void;
  /** When provided, a "Book" shortcut jumps to the booking flow for one selected slot. */
  onBookSlot?: (slot: TurfSlot) => void;
}) {
  // Device Back closes this sheet instead of leaving the pricing page.
  useBackDismiss(true, onClose);

  // Game/court are fixed for the life of this sheet — picked once, above, on the
  // pricing page itself, not re-chosen every time a date is opened.
  const gameLabel = initialGame === "all" ? "All games" : categoryLabel(initialGame);
  const courtLabel = initialCourtId === "all" ? "All courts" : courts?.find((c) => c.id === initialCourtId)?.name ?? "All courts";
  // Courts/slots store the sport's display label ("Cricket"), not its id ("cricket").
  const matchSport = initialGame === "all" ? undefined : categoryLabel(initialGame);
  const matchCourt = initialCourtId === "all" ? undefined : initialCourtId;

  /** True when the currently-selected court (or, under "All courts", any court) is
   * already booked at this start time — repricing it would silently disagree with
   * what a player already paid. */
  function isBookedTime(startTime: string): boolean {
    const entries = bookedTimes.filter((b) => b.startTime === startTime);
    if (entries.length === 0) return false;
    if (!matchCourt) return true;
    return entries.some((b) => b.courtIds.length === 0 || b.courtIds.includes(matchCourt));
  }

  /** Every distinct time range saved for this date, regardless of which game/court tag
   * it belongs to — the fixed menu of rows this sheet edits, day-start-first. */
  const uniqueTimes = useMemo(() => {
    const seen = new Set<string>();
    const list: { startTime: string; endTime: string; label: string }[] = [];
    for (const s of slots) {
      const key = `${s.startTime}-${s.endTime}`;
      if (seen.has(key)) continue;
      seen.add(key);
      list.push({ startTime: s.startTime, endTime: s.endTime, label: s.label });
    }
    return list.sort((a, b) => dayOrderMinutes(a.startTime) - dayOrderMinutes(b.startTime));
  }, [slots]);

  /** The price/blocked state to show for one time range under the current game/court
   * selection — an exact tag match wins, then sport-only, then court-only, then the
   * venue-wide default, mirroring My Listing's Pricing Studio. A combination that's
   * never been priced falls back to a zero placeholder rather than crashing. */
  function getEffectiveSlot(startTime: string, endTime: string, label: string): TurfSlot {
    if (matchSport && matchCourt) {
      const exact = slots.find((s) => s.startTime === startTime && s.endTime === endTime && s.sport === matchSport && s.courtId === matchCourt);
      if (exact) return exact;
    }
    if (matchSport) {
      const sportOnly = slots.find((s) => s.startTime === startTime && s.endTime === endTime && s.sport === matchSport && !s.courtId);
      if (sportOnly) return sportOnly;
    }
    if (matchCourt) {
      const courtOnly = slots.find((s) => s.startTime === startTime && s.endTime === endTime && !s.sport && s.courtId === matchCourt);
      if (courtOnly) return courtOnly;
    }
    const fallback = slots.find((s) => s.startTime === startTime && s.endTime === endTime && !s.sport && !s.courtId);
    if (fallback) return fallback;
    return { startTime, endTime, label, price: 0, blocked: false, sport: matchSport, courtId: matchCourt };
  }

  const effectiveSlots = useMemo(
    () => uniqueTimes.map((t) => getEffectiveSlot(t.startTime, t.endTime, t.label)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [uniqueTimes, slots, matchSport, matchCourt]
  );

  const basePrice = useMemo(() => {
    const priced = effectiveSlots.map((s) => s.price).filter((p) => p > 0);
    return priced.length ? Math.min(...priced) : 0;
  }, [effectiveSlots]);

  const presets = useMemo(
    () => ({
      offPeak: roundTo50(basePrice * 0.8),
      standard: basePrice,
      peak: roundTo50(basePrice * 1.5),
    }),
    [basePrice]
  );

  // One flow, in order: pick slots (or Select all for the whole day) → pick a price →
  // hit Save once. Nothing is written until Save — an unselected slot's price never
  // changes just because a price was typed in.
  const [selectedTimes, setSelectedTimes] = useState<Set<string>>(new Set());
  const [blockedOverrides, setBlockedOverrides] = useState<Record<string, boolean>>({});
  /*
   * Price is held as a string, not a number. With a number state, clearing the field
   * ran Number("") → 0, so it snapped back to 0 and you could never empty it to type
   * your own price. A string lets the box go genuinely empty; only coerced on save.
   */
  const [priceInput, setPriceInput] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<"offPeak" | "standard" | "peak" | "custom" | null>(null);
  const [saving, setSaving] = useState(false);

  const pickableTimes = uniqueTimes.filter((t) => !isBookedTime(t.startTime));
  const allSelected = pickableTimes.length > 0 && pickableTimes.every((t) => selectedTimes.has(t.startTime));

  function toggleTime(startTime: string) {
    setSelectedTimes((prev) => {
      const next = new Set(prev);
      if (next.has(startTime)) next.delete(startTime); else next.add(startTime);
      return next;
    });
  }

  const selectedAllBlocked =
    selectedTimes.size > 0 &&
    [...selectedTimes].every((t) => {
      const opt = uniqueTimes.find((u) => u.startTime === t);
      return opt ? blockedFor(getEffectiveSlot(opt.startTime, opt.endTime, opt.label)) : false;
    });

  function toggleBlockSelected() {
    const nextBlocked = !selectedAllBlocked;
    setBlockedOverrides((prev) => {
      const next = { ...prev };
      for (const t of selectedTimes) next[t] = nextBlocked;
      return next;
    });
  }

  /** Digits only — keeps out "e", "+", "-" that a number input would otherwise accept. */
  const onlyDigits = (v: string) => v.replace(/\D/g, "");

  /** Effective price for a slot at save time. Only a *selected* slot with a real price
   * typed in actually changes — everything else keeps exactly what it already had, so
   * picking a price never silently touches slots you never selected. An already-booked
   * slot never changes here at all, no matter what's selected. */
  function priceFor(slot: TurfSlot): number {
    if (isBookedTime(slot.startTime)) return slot.price;
    if (!selectedTimes.has(slot.startTime)) return slot.price;
    const n = Number(priceInput);
    return priceInput !== "" && Number.isFinite(n) && n > 0 ? n : slot.price;
  }

  /** An already-booked slot stays whatever it was — blocking/unblocking it here would
   * disagree with the booking that's already sitting on it. */
  function blockedFor(slot: TurfSlot): boolean {
    if (isBookedTime(slot.startTime)) return slot.blocked ?? false;
    return blockedOverrides[slot.startTime] ?? slot.blocked ?? false;
  }

  function pickPreset(key: "offPeak" | "standard" | "peak") {
    setSelectedPreset(key);
    setPriceInput(String(presets[key]));
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Upsert into the FULL slot list (every game/court tag), not just this
      // selection's rows — otherwise saving would silently wipe out every other
      // combination's pricing for the day. Only slots actually touched this visit
      // (selected for a price, or block-toggled) are written — every other slot is
      // left completely alone, so its price keeps inheriting from wherever it always
      // did instead of freezing today's inherited number into a new explicit row.
      let nextSlots = [...slots];
      for (const t of uniqueTimes) {
        const wasPriced = selectedTimes.has(t.startTime);
        const wasBlockToggled = t.startTime in blockedOverrides;
        if (!wasPriced && !wasBlockToggled) continue;

        const effective = getEffectiveSlot(t.startTime, t.endTime, t.label);
        const price = priceFor(effective);
        const blocked = blockedFor(effective);
        const idx = nextSlots.findIndex(
          (s) => s.startTime === t.startTime && s.endTime === t.endTime && s.sport === matchSport && s.courtId === matchCourt
        );
        if (idx > -1) {
          nextSlots[idx] = { ...nextSlots[idx], price, blocked };
        } else {
          nextSlots.push({ startTime: t.startTime, endTime: t.endTime, label: t.label, price, blocked, sport: matchSport, courtId: matchCourt });
        }
      }
      await onSave(nextSlots);
    } finally {
      setSaving(false);
    }
  }

  const priceForSelectionLabel = allSelected ? "the whole day" : `${selectedTimes.size} slot${selectedTimes.size === 1 ? "" : "s"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg p-6 shadow-2xl max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">{dateLabel}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Daily Pricing &amp; Offers</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
            <X size={18} />
          </button>
        </div>

        {/* 1. Game + Court — fixed to whatever's picked above on the pricing page;
            change it there, not here, so the two stay in lockstep. */}
        {((categories && categories.length > 0) || (courts && courts.length > 0)) && (
          <div className="mb-4 flex items-center gap-4">
            {categories && categories.length > 0 && (
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Game</p>
                <span className="inline-block rounded-full bg-ink px-3 py-1.5 text-[11px] font-bold text-white">{gameLabel}</span>
              </div>
            )}
            {courts && courts.length > 0 && (
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Court</p>
                <span className="inline-block rounded-full bg-ink px-3 py-1.5 text-[11px] font-bold text-white">{courtLabel}</span>
              </div>
            )}
          </div>
        )}

        {/* 2. Time slots — pick any (or Select all for the whole day). Booked ones
            can't be picked at all. */}
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Time slots ({effectiveSlots.length})</p>
            <button
              onClick={() =>
                setSelectedTimes(allSelected ? new Set() : new Set(pickableTimes.map((t) => t.startTime)))
              }
              className={`rounded-full border px-2.5 py-1 text-[10px] font-black transition ${
                allSelected ? "border-ink bg-ink text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              {allSelected ? "All selected (whole day)" : "Select all · Whole day"}
            </button>
          </div>
          <div className="flex gap-1.5 overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/60 p-2 [scrollbar-width:thin]">
            {uniqueTimes.map((t) => {
              const booked = isBookedTime(t.startTime);
              const selected = selectedTimes.has(t.startTime);
              const slot = getEffectiveSlot(t.startTime, t.endTime, t.label);
              const blocked = !booked && blockedFor(slot);
              return (
                <button
                  key={t.startTime}
                  disabled={booked}
                  onClick={() => toggleTime(t.startTime)}
                  className={`shrink-0 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-[10.5px] font-bold transition ${
                    booked
                      ? "cursor-not-allowed border-rose-100 bg-rose-50 text-rose-400"
                      : selected
                      ? "border-ink bg-ink text-white"
                      : blocked
                      ? "border-slate-200 bg-slate-100 text-slate-400 line-through"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {to12h(t.startTime)} – {to12h(t.endTime)}
                  {booked ? " · Booked" : blocked ? " · Blocked" : ` · ₹${slot.price}`}
                </button>
              );
            })}
            {uniqueTimes.length === 0 && (
              <p className="py-2 text-center text-[11px] text-slate-400">No slots configured for this date.</p>
            )}
          </div>
          {selectedTimes.size > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleBlockSelected}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50"
              >
                {selectedAllBlocked ? "Unblock selected" : "Block selected"}
              </button>
              {onBookSlot && selectedTimes.size === 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const startTime = [...selectedTimes][0];
                    const t = uniqueTimes.find((x) => x.startTime === startTime);
                    if (t) onBookSlot(getEffectiveSlot(t.startTime, t.endTime, t.label));
                  }}
                  className="rounded-lg bg-vibe-navy px-3 py-2 text-[11px] font-bold text-white transition hover:opacity-90"
                >
                  Book
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3. Price for whatever's selected above. */}
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
          Set price for {priceForSelectionLabel}
        </p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <PresetTile label="Off-Peak" price={presets.offPeak} active={selectedPreset === "offPeak"} onClick={() => pickPreset("offPeak")} />
          <PresetTile label="Standard" price={presets.standard} active={selectedPreset === "standard"} onClick={() => pickPreset("standard")} />
          <PresetTile label="Peak / Event" price={presets.peak} active={selectedPreset === "peak"} onClick={() => pickPreset("peak")} />
        </div>

        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Or Set Custom Price (₹)</p>
        <input
          type="text"
          inputMode="numeric"
          value={priceInput}
          placeholder="Enter price"
          onChange={(e) => {
            setSelectedPreset("custom");
            setPriceInput(onlyDigits(e.target.value));
          }}
          className="w-full rounded-xl border border-surface-border bg-cream-200/40 px-4 py-3 text-sm font-bold outline-none focus:border-vibe-violet mb-1"
        />
        {selectedTimes.size === 0 && (
          <p className="mb-3 text-[10.5px] text-slate-400">Pick at least one time slot above before applying a price.</p>
        )}

        {/* 4. One final apply. */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-3 rounded-xl bg-ink text-white py-3.5 text-sm font-bold hover:bg-ink/90 transition disabled:opacity-60"
        >
          {saving
            ? "Saving…"
            : selectedTimes.size > 0 && Number(priceInput) > 0
            ? `Apply ₹${priceInput} to ${priceForSelectionLabel}`
            : "Save Pricing Updates"}
        </button>
      </div>
    </div>
  );
}

function PresetTile({ label, price, active, onClick }: { label: string; price: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-3 text-center transition ${
        active ? "border-emerald-400 ring-1 ring-emerald-300 bg-emerald-50" : "border-slate-200 hover:border-slate-300"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500 flex items-center justify-center gap-1">
        {label}
        {active && <Check size={11} className="text-emerald-600" />}
      </p>
      <p className="text-base font-extrabold text-slate-800 mt-1">₹{price}</p>
    </button>
  );
}
