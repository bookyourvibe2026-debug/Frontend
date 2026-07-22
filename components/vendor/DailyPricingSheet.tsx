"use client";

import { useMemo, useState } from "react";
import { X, Lightbulb, ChevronDown, ChevronUp, Check } from "lucide-react";
import type { TurfSlot } from "@/lib/types";
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

const TWILIGHT_START = 16 * 60;
const TWILIGHT_END = 19 * 60;

export function DailyPricingSheet({
  dateLabel,
  slots,
  onClose,
  onSave,
  onBookSlot,
}: {
  dateLabel: string;
  slots: TurfSlot[];
  onClose: () => void;
  onSave: (nextSlots: TurfSlot[]) => Promise<void> | void;
  /** When provided, each slot row gets a "Book" shortcut that jumps to the booking flow for that slot. */
  onBookSlot?: (slot: TurfSlot) => void;
}) {
  // Device Back closes this sheet instead of leaving the pricing page.
  useBackDismiss(true, onClose);
  const basePrice = useMemo(
    () => (slots.length ? Math.min(...slots.map((s) => s.price)) : 0),
    [slots]
  );

  const presets = useMemo(
    () => ({
      offPeak: roundTo50(basePrice * 0.8),
      standard: basePrice,
      peak: roundTo50(basePrice * 1.5),
    }),
    [basePrice]
  );

  /*
   * Prices are held as strings, not numbers. With a number state, clearing the
   * field ran Number("") → 0, so it snapped back to 0 and you could never empty
   * it to type your own price. Strings let the box go genuinely empty; the value
   * is only coerced on save.
   */
  const [bulkPrice, setBulkPrice] = useState(() => String(basePrice));
  const [selectedPreset, setSelectedPreset] = useState<"offPeak" | "standard" | "peak" | "custom">("standard");
  const [slotOverrides, setSlotOverrides] = useState<Record<string, string>>({});
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [twilightApplied, setTwilightApplied] = useState(false);
  const [saving, setSaving] = useState(false);

  /** Digits only — keeps out "e", "+", "-" that a number input would otherwise accept. */
  const onlyDigits = (v: string) => v.replace(/\D/g, "");

  /** Effective price for a slot, falling back to its existing price when left blank. */
  function priceFor(slot: TurfSlot): number {
    const raw = slotOverrides[slot.startTime] ?? bulkPrice;
    if (raw === "") return slot.price;
    const n = Number(raw);
    return Number.isFinite(n) ? n : slot.price;
  }

  function pickPreset(key: "offPeak" | "standard" | "peak") {
    setSelectedPreset(key);
    setBulkPrice(String(presets[key]));
  }

  function activateTwilightOffer() {
    const next: Record<string, string> = { ...slotOverrides };
    let count = 0;
    for (const slot of slots) {
      const startMin = t24m(slot.startTime);
      if (startMin >= TWILIGHT_START && startMin < TWILIGHT_END) {
        next[slot.startTime] = String(roundTo50(priceFor(slot) * 0.8));
        count += 1;
      }
    }
    setSlotOverrides(next);
    setTwilightApplied(count > 0);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const next = slots.map((s) => ({ ...s, price: priceFor(s) }));
      await onSave(next);
    } finally {
      setSaving(false);
    }
  }

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

        {/* Smart suggestion */}
        <div className="rounded-xl bg-vibe-violet/10 border border-vibe-violet/20 p-4 mb-5">
          <div className="flex items-start gap-2.5">
            <Lightbulb size={18} className="text-vibe-violet shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-extrabold text-vibe-violet uppercase tracking-wide">Smart Suggestion &amp; Offer</p>
              <p className="text-sm text-slate-600 mt-1">
                Historical data predicts an evening drop in occupancy. Running a &ldquo;Twilight 20% Off&rdquo; special from 4 PM – 7
                PM historically boosts revenue by 12%.
              </p>
            </div>
          </div>
          <button
            onClick={activateTwilightOffer}
            className="mt-3 w-full rounded-xl bg-vibe-violet text-white text-sm font-bold py-2.5 hover:bg-vibe-violetSoft transition"
          >
            {twilightApplied ? "Twilight Offer Applied ✓" : 'Activate "Twilight" Offer'}
          </button>
        </div>

        {/* Base price presets */}
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Set Daily Base Price</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <PresetTile label="Off-Peak" price={presets.offPeak} active={selectedPreset === "offPeak"} onClick={() => pickPreset("offPeak")} />
          <PresetTile label="Standard" price={presets.standard} active={selectedPreset === "standard"} onClick={() => pickPreset("standard")} />
          <PresetTile label="Peak / Event" price={presets.peak} active={selectedPreset === "peak"} onClick={() => pickPreset("peak")} />
        </div>

        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Or Set My Price (₹)</p>
        <input
          type="text"
          inputMode="numeric"
          value={bulkPrice}
          placeholder="Enter price"
          onChange={(e) => {
            setSelectedPreset("custom");
            setBulkPrice(onlyDigits(e.target.value));
          }}
          className="w-full rounded-xl border border-surface-border bg-cream-200/40 px-4 py-3 text-sm font-bold outline-none focus:border-vibe-violet mb-4"
        />

        {/* Advanced: per-slot pricing */}
        <button
          onClick={() => setAdvancedOpen((o) => !o)}
          className="flex w-full items-center justify-between text-xs font-bold text-slate-600 py-2 border-t border-slate-100"
        >
          Edit individual slots ({slots.length})
          {advancedOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {advancedOpen && (
          <div className="space-y-1.5 mt-2 mb-2 max-h-56 overflow-y-auto">
            {slots.map((slot) => (
              <div key={slot.startTime} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2">
                <span className="text-xs font-semibold text-slate-600">
                  {to12h(slot.startTime)} – {to12h(slot.endTime)}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400">₹</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={slotOverrides[slot.startTime] ?? bulkPrice}
                    placeholder={String(slot.price)}
                    onChange={(e) =>
                      setSlotOverrides((prev) => ({ ...prev, [slot.startTime]: onlyDigits(e.target.value) }))
                    }
                    className="w-20 rounded-lg border border-surface-border bg-cream-200/40 px-2 py-1.5 text-xs font-bold outline-none focus:border-vibe-violet"
                  />
                  {onBookSlot && !slot.blocked && (
                    <button
                      onClick={() => onBookSlot(slot)}
                      className="rounded-lg bg-vibe-navy px-2.5 py-1.5 text-[10px] font-black text-white transition hover:opacity-90 active:scale-95"
                    >
                      Book
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-3 rounded-xl bg-ink text-white py-3.5 text-sm font-bold hover:bg-ink/90 transition disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Pricing Updates"}
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
