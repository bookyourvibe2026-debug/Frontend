"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Zap } from "lucide-react";
import { getVendorBookings, getVendorListings, updateVendorListing } from "@/lib/api/vendor";
import { apiListingToMock, mockListingToApiInput } from "@/lib/api/listingAdapter";
import { ApiError } from "@/lib/api/client";
import { Booking, Listing, TurfSlot } from "@/lib/types";
import { useBackDismiss } from "@/lib/useBackDismiss";

/**
 * Last Min Boost — an auto-discount engine.
 *
 * Instead of hand-picking a slot each time, the vendor sets this once: turn boost on,
 * pick how deep the discount goes (30/40/50%), and how close to the hour it kicks in.
 * Saving persists the preference and immediately drops the price on every still-unbooked,
 * not-yet-started slot for today (written as a date override), so players booking those
 * slots see the lower price straight away. Turning it back off restores those slots to
 * their normal rate.
 */

type ApiBooking = Booking & { listingId?: string; endTime?: string };

const DISCOUNTS = [30, 40, 50];
const TRIGGER_OPTIONS = [10, 15, 30];

interface BoostSettings {
  enabled: boolean;
  discountPct: number;
  triggerMins: number;
}
const DEFAULT_SETTINGS: BoostSettings = { enabled: false, discountPct: 30, triggerMins: 10 };

function settingsKey(turfId: string) {
  return `byv_lastmin_boost_${turfId}`;
}

function loadSettings(turfId: string): BoostSettings {
  try {
    const raw = localStorage.getItem(settingsKey(turfId));
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<BoostSettings>;
    return {
      enabled: Boolean(parsed.enabled),
      discountPct: DISCOUNTS.includes(parsed.discountPct ?? 0) ? parsed.discountPct! : DEFAULT_SETTINGS.discountPct,
      triggerMins: TRIGGER_OPTIONS.includes(parsed.triggerMins ?? 0) ? parsed.triggerMins! : DEFAULT_SETTINGS.triggerMins,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function slotStartDate(dateIso: string, slot: TurfSlot) {
  return new Date(`${dateIso}T${slot.startTime}:00`);
}

function resolveSlotsForDate(listing: Listing, dateIso: string): TurfSlot[] {
  const override = listing.dateOverrides?.find((o) => o.date === dateIso);
  if (override) return override.slots ?? [];
  return listing.slotsList ?? [];
}

/** Discounted price for a slot, rounded and never below ₹1. */
function boostedPrice(basePrice: number, discountPct: number): number {
  return Math.max(1, Math.round((basePrice * (100 - discountPct)) / 100));
}

function to12h(t: string): string {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  let h = Number(hStr) % 24;
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mStr} ${ap}`;
}

/* ─── Custom dropdown ───────────────────────────────────────────────
   The native <select> renders the OS' own list (the grey box in the corner),
   which looks nothing like the rest of the panel. This is a styled replacement:
   a button + a rounded option list, closing on outside-tap. */
function Dropdown<T extends string | number>({
  value,
  options,
  onChange,
  emphasis = false,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  /** Red-accented border, used for the Trigger Time field. */
  emphasis?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onOutside);
    return () => document.removeEventListener("pointerdown", onOutside);
  }, [open]);

  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between rounded-xl border-2 bg-white px-4 py-3 text-left text-sm font-bold text-slate-800 outline-none transition ${
          emphasis ? "border-red-200" : "border-slate-200"
        } ${open ? "border-red-500" : ""}`}
      >
        {current?.label ?? "Select"}
        <ChevronDown size={15} className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-slate-100 bg-white p-1 shadow-xl">
          {options.map((o) => {
            const on = o.value === value;
            return (
              <button
                key={String(o.value)}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-bold transition ${
                  on ? "bg-red-50 text-red-600" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                {o.label}
                {on && <Check size={15} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function LastMinBoostSheet({ onClose }: { onClose: () => void }) {
  // Device Back closes this full-screen sheet instead of leaving the More page.
  useBackDismiss(true, onClose);
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTurfId, setSelectedTurfId] = useState("");

  const [enabled, setEnabled] = useState(DEFAULT_SETTINGS.enabled);
  const [discountPct, setDiscountPct] = useState(DEFAULT_SETTINGS.discountPct);
  const [triggerMins, setTriggerMins] = useState(DEFAULT_SETTINGS.triggerMins);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const todayIso = useMemo(() => toIso(new Date()), []);

  /** Switch turf and pull in that turf's saved boost settings. */
  function selectTurf(id: string) {
    setSelectedTurfId(id);
    if (!id) return;
    const s = loadSettings(id);
    setEnabled(s.enabled);
    setDiscountPct(s.discountPct);
    setTriggerMins(s.triggerMins);
    setDone(null);
  }

  useEffect(() => {
    Promise.all([getVendorListings(), getVendorBookings({ limit: 500 })])
      .then(([l, b]) => {
        const turfs = l.map(apiListingToMock).filter((x) => x.type === "Turf");
        setListings(turfs);
        selectTurf(turfs[0]?.id ?? "");
        setBookings(b.items as unknown as ApiBooking[]);
      })
      .catch((e) => setError(e instanceof ApiError ? e.describe() : "Failed to load your turfs"))
      .finally(() => setLoading(false));
  }, []);

  const selectedTurf = useMemo(() => listings.find((l) => l.id === selectedTurfId), [listings, selectedTurfId]);

  // Re-tick every minute so "upcoming" and the live preview stay honest as slots pass.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

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

  /** Today's still-open, not-yet-started slots — what a boost would actually touch. Each
   * carries its normal (default) price so the preview can show the real before → after. */
  const eligibleSlots = useMemo(() => {
    if (!selectedTurf) return [];
    const defaults = selectedTurf.slotsList ?? [];
    return resolveSlotsForDate(selectedTurf, todayIso)
      .filter((s) => !s.blocked && !bookedStarts.has(s.startTime))
      .filter((s) => slotStartDate(todayIso, s).getTime() > nowMs)
      .map((s) => ({ ...s, basePrice: defaults.find((d) => d.startTime === s.startTime)?.price ?? s.price }))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [selectedTurf, todayIso, bookedStarts, nowMs]);

  async function save() {
    if (!selectedTurf || saving) return;
    setSaving(true);
    setError(null);
    setDone(null);
    try {
      localStorage.setItem(settingsKey(selectedTurf.id), JSON.stringify({ enabled, discountPct, triggerMins }));

      const defaults = selectedTurf.slotsList ?? [];
      const defaultPrice = (start: string) => defaults.find((d) => d.startTime === start)?.price;
      let changed = 0;

      const nextSlots = resolveSlotsForDate(selectedTurf, todayIso).map((s) => {
        const dflt = defaultPrice(s.startTime);
        if (dflt == null) return s; // custom late-night slot with no default — leave alone
        const upcoming = slotStartDate(todayIso, s).getTime() > nowMs;
        const unbooked = !s.blocked && !bookedStarts.has(s.startTime);
        if (enabled) {
          if (upcoming && unbooked) {
            const boosted = boostedPrice(dflt, discountPct);
            if (s.price !== boosted) changed++;
            return { ...s, price: boosted };
          }
          return s;
        }
        // Boost off — restore any slot we'd previously discounted below its normal rate.
        if (upcoming && s.price < dflt) {
          changed++;
          return { ...s, price: dflt };
        }
        return s;
      });

      const overrides = [...(selectedTurf.dateOverrides ?? [])];
      const existing = overrides.find((o) => o.date === todayIso);
      const entry = {
        date: todayIso,
        isHoliday: existing?.isHoliday ?? false,
        holidayName: existing?.holidayName ?? "",
        slots: nextSlots,
      };
      const idx = overrides.findIndex((o) => o.date === todayIso);
      if (idx > -1) overrides[idx] = entry;
      else overrides.push(entry);

      const saved = await updateVendorListing(selectedTurf.id, mockListingToApiInput({ ...selectedTurf, dateOverrides: overrides }));
      setListings((ls) => ls.map((x) => (x.id === selectedTurf.id ? apiListingToMock(saved) : x)));

      setDone(
        enabled
          ? changed > 0
            ? `Boost is on — ${changed} upcoming empty slot${changed === 1 ? "" : "s"} today dropped by ${discountPct}%.`
            : `Boost is on. New empty slots today will drop by ${discountPct}%.`
          : changed > 0
          ? `Boost is off — ${changed} slot${changed === 1 ? "" : "s"} restored to the normal price.`
          : "Boost is off."
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.describe() : "Couldn't save your boost settings. Please try again.");
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#f5f7fa]">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col">
        {/* Header — back arrow + title (matches the reference full-page layout) */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3.5">
          <button onClick={onClose} aria-label="Back" className="rounded-full p-1 text-slate-600 hover:bg-slate-100">
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-base font-black text-slate-900">Last Min Boost</h2>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm font-bold text-slate-400">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
            Loading…
          </div>
        ) : !selectedTurf ? (
          <p className="px-5 py-20 text-center text-sm font-semibold text-slate-500">
            No turf listings found — add a turf to use Last Min Boost.
          </p>
        ) : (
          <div className="flex flex-col gap-5 p-4 sm:p-5">
            {/* ── HERO: auto discount engine + enable toggle ── */}
            <div className="rounded-3xl bg-gradient-to-br from-red-500 to-red-600 p-5 text-white shadow-lg shadow-red-500/20">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                  <Zap size={20} className="fill-white" />
                </span>
                <div>
                  <p className="text-[15px] font-black leading-tight">Last Min Boost</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/70">Auto Discount Engine</p>
                </div>
              </div>
              <p className="mt-3 text-[12px] font-medium leading-relaxed text-white/90">
                Automatically apply a discount to any unbooked slot {triggerMins} minutes before the hour begins.
              </p>

              {/* Enable toggle */}
              <div className="mt-4 rounded-2xl bg-black/15 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px] font-black">Enable Boost</p>
                  <button
                    role="switch"
                    aria-checked={enabled}
                    aria-label="Enable Last Min Boost"
                    onClick={() => setEnabled((v) => !v)}
                    className={`relative flex h-7 w-12 shrink-0 items-center rounded-full transition ${enabled ? "bg-emerald-400" : "bg-white/25"}`}
                  >
                    <span className={`absolute h-5 w-5 rounded-full bg-white shadow transition-all ${enabled ? "left-6" : "left-1"}`} />
                  </button>
                </div>
                <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-white/70">
                  When enabled, empty slots will automatically be discounted to attract last-minute players.
                </p>
              </div>
            </div>

            {/* Turf selector — only when the vendor runs more than one turf */}
            {listings.length > 1 && (
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">Turf</label>
                <Dropdown
                  value={selectedTurfId}
                  onChange={selectTurf}
                  options={listings.map((l) => ({ value: l.id, label: l.title }))}
                />
              </div>
            )}

            {/* ── DISCOUNT SETTINGS ── */}
            <div>
              <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-400">Discount Settings</p>
              <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-slate-400">Discount Percentage</p>
                  <div className="grid grid-cols-3 gap-2">
                    {DISCOUNTS.map((d) => {
                      const on = discountPct === d;
                      return (
                        <button
                          key={d}
                          onClick={() => setDiscountPct(d)}
                          className={`rounded-xl border-2 py-3 text-sm font-black transition ${
                            on ? "border-red-500 bg-red-50 text-red-600" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {d}%
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-slate-400">Trigger Time</p>
                  <Dropdown
                    value={triggerMins}
                    onChange={setTriggerMins}
                    emphasis
                    options={TRIGGER_OPTIONS.map((m) => ({ value: m, label: `${m} mins before slot` }))}
                  />
                </div>
              </div>
            </div>

            {/* Live preview — what saving right now would actually do to today's rates */}
            {enabled && (
              <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4">
                {eligibleSlots.length === 0 ? (
                  <p className="text-center text-[11px] font-bold text-slate-500">
                    No empty upcoming slots left today. New openings will drop by {discountPct}% once boost is saved.
                  </p>
                ) : (
                  <>
                    <p className="text-[11px] font-black text-red-700">
                      {eligibleSlots.length} empty slot{eligibleSlots.length === 1 ? "" : "s"} left today will drop {discountPct}%
                    </p>
                    <div className="mt-2 space-y-1">
                      {eligibleSlots.slice(0, 3).map((s) => (
                        <div key={s.startTime} className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-500">{to12h(s.startTime)} – {to12h(s.endTime)}</span>
                          <span className="text-slate-700">
                            <span className="text-slate-400 line-through">₹{s.basePrice.toLocaleString("en-IN")}</span>{" "}
                            <span className="font-black text-red-600">₹{boostedPrice(s.basePrice, discountPct).toLocaleString("en-IN")}</span>
                          </span>
                        </div>
                      ))}
                      {eligibleSlots.length > 3 && (
                        <p className="text-[10px] font-bold text-slate-400">+{eligibleSlots.length - 3} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {done && (
              <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-center text-[11px] font-bold text-emerald-700">{done}</p>
            )}
            {error && <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-center text-[11px] font-bold text-rose-600">{error}</p>}

            <button
              onClick={save}
              disabled={saving}
              className="w-full rounded-2xl bg-[#dc2626] py-3.5 text-sm font-black text-white shadow-md transition hover:bg-red-700 active:scale-[0.99] disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save Boost Settings"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
