"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, Check, CheckCircle2, ChevronDown, Zap } from "lucide-react";
import { getVendorBookings, getVendorListings, updateVendorListing } from "@/lib/api/vendor";
import { apiListingToMock, mockListingToApiInput } from "@/lib/api/listingAdapter";
import { ApiError } from "@/lib/api/client";
import { Booking, Listing, TurfSlot } from "@/lib/types";
import { categoryLabel } from "@/lib/taxonomy";
import { useBackDismiss } from "@/lib/useBackDismiss";
import {
  BOOST_DISCOUNT_PRESETS,
  BOOST_MAX_PCT,
  BOOST_MIN_PCT,
  BOOST_TRIGGER_OPTIONS,
  boostedPrice,
  clampBoostPct,
  type LastMinBoost,
} from "@/lib/lastMinBoost";

/**
 * Last Min Boost — a two-step auto-discount engine.
 *
 *   Step 1  pick the game, then tick the hourly slots to put on offer
 *   Step 2  set how deep the discount goes and how early it appears
 *
 * The rule is saved on the listing (not localStorage — the customer side has to read it)
 * and keyed by slot start time, so it stands every day. Crucially the discount is never
 * written into slot prices: it is derived at read time from the trigger window, which is
 * what makes "10 minutes before the slot" actually mean something. See lib/lastMinBoost.ts.
 */

type ApiBooking = Booking & { listingId?: string; endTime?: string };

const DEFAULT_BOOST: LastMinBoost = {
  enabled: false,
  game: "",
  slotStarts: [],
  discountPct: BOOST_MIN_PCT,
  triggerMins: 10,
};

function toIso(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toMinutes(t: string) {
  const [h = 0, m = 0] = t.split(":").map(Number);
  return h * 60 + m;
}

function minutesToHHmm(mins: number) {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function to12h(t: string): string {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  let h = Number(hStr) % 24;
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${mStr} ${ap}`;
}

function resolveSlotsForDate(listing: Listing, dateIso: string): TurfSlot[] {
  const override = listing.dateOverrides?.find((o) => o.date === dateIso);
  if (override) return override.isHoliday ? [] : override.slots ?? [];
  return listing.slotsList ?? [];
}

interface HourSlot {
  /** "HH:mm" start — this is what the saved rule is keyed by. */
  start: string;
  end: string;
  price: number;
}

/**
 * The venue's configured windows expanded into the one-hour slots the vendor actually
 * sells (a 06:00–12:00 window becomes six of them), de-duplicated and time-ordered.
 */
function hourlySlots(listing: Listing | undefined, dateIso: string): HourSlot[] {
  if (!listing) return [];
  const byStart = new Map<string, HourSlot>();
  for (const cfg of resolveSlotsForDate(listing, dateIso)) {
    if (cfg.blocked) continue;
    const start = toMinutes(cfg.startTime);
    let end = toMinutes(cfg.endTime);
    if (end <= start) end += 1440; // window runs past midnight
    for (let m = start; m + 60 <= end; m += 60) {
      const key = minutesToHHmm(m);
      if (!byStart.has(key)) byStart.set(key, { start: key, end: minutesToHHmm(m + 60), price: cfg.price });
    }
  }
  return [...byStart.values()].sort((a, b) => a.start.localeCompare(b.start));
}

/* ─── Custom dropdown ───────────────────────────────────────────────
   The native <select> renders the OS' own list, which looks nothing like the
   rest of the panel. This is a styled replacement: a button + a rounded option
   list, closing on outside-tap. */
function Dropdown<T extends string | number>({
  value,
  options,
  onChange,
  emphasis = false,
  placeholder = "Select",
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  /** Red-accented border, used for the Trigger Time field. */
  emphasis?: boolean;
  placeholder?: string;
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
        className={`flex w-full items-center justify-between rounded-xl border-2 bg-white px-4 py-3 text-left text-sm font-bold outline-none transition ${
          emphasis ? "border-red-200" : "border-slate-200"
        } ${open ? "border-red-500" : ""} ${current ? "text-slate-800" : "text-slate-400"}`}
      >
        {current?.label ?? placeholder}
        <ChevronDown size={15} className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-slate-100 bg-white p-1 shadow-xl animate-in fade-in slide-in-from-top-1 duration-150">
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

/** Slide-in toast for save success / failure. */
function Toast({ tone, message }: { tone: "success" | "error"; message: string }) {
  const ok = tone === "success";
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[110] flex justify-center px-4">
      <div
        role="status"
        className={`flex max-w-md items-start gap-2.5 rounded-2xl px-4 py-3 text-[12px] font-bold shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300 ${
          ok ? "bg-emerald-600 text-white shadow-emerald-600/25" : "bg-rose-600 text-white shadow-rose-600/25"
        }`}
      >
        {ok ? <CheckCircle2 size={16} className="mt-px shrink-0" /> : <AlertCircle size={16} className="mt-px shrink-0" />}
        <span className="leading-relaxed">{message}</span>
      </div>
    </div>
  );
}

/** "1 Slots — 2 Discount" progress rail. */
function StepRail({ step }: { step: 1 | 2 }) {
  const items = [
    { n: 1 as const, label: "Slots" },
    { n: 2 as const, label: "Discount" },
  ];
  return (
    <div className="flex items-center gap-2">
      {items.map((it, i) => {
        const done = step > it.n;
        const active = step === it.n;
        return (
          <div key={it.n} className="flex flex-1 items-center gap-2">
            <span
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black transition ${
                done || active ? "bg-red-500 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {done ? <Check size={12} /> : it.n}
            </span>
            <span className={`text-[10px] font-black uppercase tracking-widest ${active ? "text-slate-700" : "text-slate-400"}`}>
              {it.label}
            </span>
            {i === 0 && <span className={`h-0.5 flex-1 rounded-full transition ${step > 1 ? "bg-red-500" : "bg-slate-200"}`} />}
          </div>
        );
      })}
    </div>
  );
}

export function LastMinBoostSheet({ onClose }: { onClose: () => void }) {
  // Device Back steps back through the wizard before it leaves the More page.
  const [step, setStep] = useState<1 | 2>(1);
  useBackDismiss(true, () => (step === 2 ? setStep(1) : onClose()));

  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedTurfId, setSelectedTurfId] = useState("");

  const [enabled, setEnabled] = useState(DEFAULT_BOOST.enabled);
  const [game, setGame] = useState("");
  const [slotStarts, setSlotStarts] = useState<string[]>([]);
  const [discountPct, setDiscountPct] = useState(DEFAULT_BOOST.discountPct);
  /** Raw text of the custom field, so a half-typed "1" doesn't snap to 10. */
  const [customPct, setCustomPct] = useState("");
  const [triggerMins, setTriggerMins] = useState(DEFAULT_BOOST.triggerMins);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  const todayIso = useMemo(() => toIso(new Date()), []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  /** Switch venue and pull in that venue's saved boost rule. */
  function selectTurf(id: string, from: Listing[]) {
    setSelectedTurfId(id);
    const turf = from.find((l) => l.id === id);
    const saved = turf?.lastMinBoost;
    const games = (turf?.categories ?? []).map(categoryLabel);
    setEnabled(saved?.enabled ?? DEFAULT_BOOST.enabled);
    setGame(saved?.game || games[0] || "");
    setSlotStarts(saved?.slotStarts ?? []);
    setDiscountPct(clampBoostPct(saved?.discountPct ?? DEFAULT_BOOST.discountPct));
    setCustomPct("");
    setTriggerMins(saved?.triggerMins ?? DEFAULT_BOOST.triggerMins);
    setStep(1);
  }

  useEffect(() => {
    Promise.all([getVendorListings(), getVendorBookings({ limit: 500 })])
      .then(([l, b]) => {
        const turfs = l.map(apiListingToMock).filter((x) => x.type === "Turf");
        setListings(turfs);
        selectTurf(turfs[0]?.id ?? "", turfs);
        setBookings(b.items as unknown as ApiBooking[]);
      })
      .catch((e) => setLoadError(e instanceof ApiError ? e.describe() : "Failed to load your venues"))
      .finally(() => setLoading(false));
  }, []);

  const selectedTurf = useMemo(() => listings.find((l) => l.id === selectedTurfId), [listings, selectedTurfId]);

  /** Games this venue actually offers — the dropdown never shows anything else. */
  const gameOptions = useMemo(
    () => (selectedTurf?.categories ?? []).map((catId) => categoryLabel(catId)),
    [selectedTurf]
  );

  /** Slot starts already taken today, so the vendor can't put a sold slot on offer. */
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

  const slots = useMemo(() => hourlySlots(selectedTurf, todayIso), [selectedTurf, todayIso]);
  const availableSlots = useMemo(() => slots.filter((s) => !bookedStarts.has(s.start)), [slots, bookedStarts]);

  const toggleSlot = (start: string) =>
    setSlotStarts((prev) => (prev.includes(start) ? prev.filter((s) => s !== start) : [...prev, start]));

  const selectedCount = slotStarts.filter((s) => availableSlots.some((a) => a.start === s)).length;
  const canContinue = !!game && selectedCount > 0;

  /* ── Custom discount ── */
  const customInvalid =
    customPct.trim() !== "" && (Number.isNaN(Number(customPct)) || Number(customPct) < BOOST_MIN_PCT || Number(customPct) > BOOST_MAX_PCT);

  function applyCustom(raw: string) {
    setCustomPct(raw);
    const n = Number(raw);
    if (raw.trim() === "" || Number.isNaN(n)) return;
    if (n >= BOOST_MIN_PCT && n <= BOOST_MAX_PCT) setDiscountPct(Math.round(n));
  }

  async function save() {
    if (!selectedTurf || saving) return;

    // Re-validate here rather than trusting the wizard: the vendor may have sat on this
    // screen while a slot sold, and the backend rejects a boost on a booked slot anyway.
    if (!game) {
      setToast({ tone: "error", message: "Pick a game before saving." });
      setStep(1);
      return;
    }
    const stillAvailable = slotStarts.filter((s) => availableSlots.some((a) => a.start === s));
    if (stillAvailable.length === 0) {
      setToast({ tone: "error", message: "Select at least one available slot." });
      setStep(1);
      return;
    }
    if (stillAvailable.length < slotStarts.length) {
      const lost = slotStarts.length - stillAvailable.length;
      setSlotStarts(stillAvailable);
      setToast({
        tone: "error",
        message: `${lost} slot${lost === 1 ? " was" : "s were"} booked while you were setting this up — removed. Save again to confirm.`,
      });
      setStep(1);
      return;
    }
    if (customInvalid) {
      setToast({ tone: "error", message: `Discount must be between ${BOOST_MIN_PCT}% and ${BOOST_MAX_PCT}%.` });
      return;
    }

    setSaving(true);
    try {
      const boost: LastMinBoost = {
        enabled,
        game,
        slotStarts: stillAvailable.sort((a, b) => a.localeCompare(b)),
        discountPct: clampBoostPct(discountPct),
        triggerMins,
      };
      const saved = await updateVendorListing(
        selectedTurf.id,
        mockListingToApiInput({ ...selectedTurf, lastMinBoost: boost })
      );
      setListings((ls) => ls.map((x) => (x.id === selectedTurf.id ? apiListingToMock(saved) : x)));
      setToast({
        tone: "success",
        message: enabled
          ? `Boost is on — ${boost.slotStarts.length} ${game} slot${boost.slotStarts.length === 1 ? "" : "s"} will drop ${boost.discountPct}%, ${boost.triggerMins} mins before start.`
          : "Settings saved. Boost is currently off, so no deals are live.",
      });
    } catch (e) {
      setToast({
        tone: "error",
        message: e instanceof ApiError ? e.describe() : "Couldn't save your boost settings. Please try again.",
      });
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#f5f7fa]">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col">
        {/* Header — back arrow steps back through the wizard first */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-100 bg-white px-4 py-3.5">
          <button
            onClick={() => (step === 2 ? setStep(1) : onClose())}
            aria-label="Back"
            className="rounded-full p-1 text-slate-600 transition hover:bg-slate-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-base font-black text-slate-900">Last Min Boost</h2>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm font-bold text-slate-400">
            <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
            Loading…
          </div>
        ) : loadError ? (
          <p className="px-5 py-20 text-center text-sm font-semibold text-rose-600">{loadError}</p>
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
                Your chosen slots go on offer at {discountPct}% off, {triggerMins} minutes before they start — only
                while they are still unbooked.
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

            <StepRail step={step} />

            {/* Venue selector — only when the vendor actually runs more than one venue,
                otherwise the game dropdown below is the first thing they touch. */}
            {listings.length > 1 && (
              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">Venue</label>
                <Dropdown
                  value={selectedTurfId}
                  onChange={(id) => selectTurf(id, listings)}
                  options={listings.map((l) => ({ value: l.id, label: l.title }))}
                />
              </div>
            )}

            {step === 1 ? (
              <div key="step-1" className="flex flex-col gap-5 animate-in fade-in slide-in-from-left-3 duration-300">
                {/* ── GAME ── */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-widest text-slate-400">Game</label>
                  {gameOptions.length === 0 ? (
                    <p className="rounded-xl border-2 border-dashed border-slate-200 px-4 py-3 text-[12px] font-bold text-slate-400">
                      No games set on this venue — add sports to it first.
                    </p>
                  ) : (
                    <Dropdown
                      value={game}
                      onChange={setGame}
                      placeholder="Choose a game"
                      options={gameOptions.map((g) => ({ value: g, label: g }))}
                    />
                  )}
                </div>

                {/* ── SLOTS ── */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Available Slots</p>
                    {selectedCount > 0 && (
                      <span className="text-[10px] font-black text-red-600">{selectedCount} selected</span>
                    )}
                  </div>
                  <div className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                    {slots.length === 0 ? (
                      <p className="py-6 text-center text-[12px] font-bold text-slate-400">
                        No slots configured on this venue yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {slots.map((s) => {
                          const booked = bookedStarts.has(s.start);
                          const on = !booked && slotStarts.includes(s.start);
                          return (
                            <button
                              key={s.start}
                              type="button"
                              disabled={booked}
                              onClick={() => toggleSlot(s.start)}
                              aria-pressed={on}
                              className={`rounded-xl border-2 px-2 py-2.5 text-center transition active:scale-[0.98] ${
                                on
                                  ? "border-red-500 bg-red-50 text-red-600"
                                  : booked
                                    ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                              }`}
                            >
                              <span className="block text-[11px] font-black leading-tight">
                                {to12h(s.start)} – {to12h(s.end)}
                              </span>
                              <span
                                className={`mt-0.5 block text-[10px] font-bold ${
                                  on ? "text-red-500" : booked ? "text-slate-300" : "text-slate-400"
                                }`}
                              >
                                {booked ? "Booked" : `₹${s.price.toLocaleString("en-IN")}`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-[10px] font-medium leading-relaxed text-slate-400">
                    Slots already sold today can&apos;t be boosted. Your selection applies every day, and each slot
                    only goes on offer while it is still unbooked.
                  </p>
                </div>

                <button
                  onClick={() => setStep(2)}
                  disabled={!canContinue}
                  className="w-full rounded-2xl bg-[#dc2626] py-3.5 text-sm font-black text-white shadow-md transition hover:bg-red-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Continue
                </button>
              </div>
            ) : (
              <div key="step-2" className="flex flex-col gap-5 animate-in fade-in slide-in-from-right-3 duration-300">
                {/* ── DISCOUNT SETTINGS ── */}
                <div>
                  <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-slate-400">Discount Settings</p>
                  <div className="space-y-4 rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div>
                      <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-slate-400">Discount Percentage</p>
                      <div className="grid grid-cols-5 gap-1.5">
                        {BOOST_DISCOUNT_PRESETS.map((d) => {
                          const on = discountPct === d && customPct.trim() === "";
                          return (
                            <button
                              key={d}
                              onClick={() => {
                                setDiscountPct(d);
                                setCustomPct("");
                              }}
                              className={`rounded-xl border-2 py-3 text-[13px] font-black transition active:scale-[0.98] ${
                                on ? "border-red-500 bg-red-50 text-red-600" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                              }`}
                            >
                              {d}%
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-2.5">
                        <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-400">
                          Or enter a custom discount
                        </label>
                        <div
                          className={`flex items-center gap-2 rounded-xl border-2 bg-white px-4 py-2.5 transition ${
                            customInvalid ? "border-rose-400" : "border-slate-200 focus-within:border-red-500"
                          }`}
                        >
                          <input
                            inputMode="numeric"
                            value={customPct}
                            onChange={(e) => applyCustom(e.target.value.replace(/[^\d]/g, "").slice(0, 2))}
                            placeholder={`${BOOST_MIN_PCT}–${BOOST_MAX_PCT}`}
                            className="w-full bg-transparent text-sm font-bold text-slate-800 outline-none placeholder:font-semibold placeholder:text-slate-300"
                          />
                          <span className="shrink-0 text-sm font-black text-slate-400">%</span>
                        </div>
                        {customInvalid && (
                          <p className="mt-1.5 text-[10px] font-bold text-rose-600">
                            Discount must be between {BOOST_MIN_PCT}% and {BOOST_MAX_PCT}%.
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-[10px] font-black uppercase tracking-wide text-slate-400">Trigger Time</p>
                      <Dropdown
                        value={triggerMins}
                        onChange={setTriggerMins}
                        emphasis
                        options={BOOST_TRIGGER_OPTIONS.map((m) => ({ value: m, label: `${m} mins before slot` }))}
                      />
                      <p className="mt-1.5 text-[10px] font-medium leading-relaxed text-slate-400">
                        A 6:00 PM slot with a {triggerMins}-minute trigger shows its deal to players from{" "}
                        {to12h(minutesToHHmm(18 * 60 - triggerMins))}.
                      </p>
                    </div>
                  </div>
                </div>

                {/* What saving will actually put on offer */}
                <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4">
                  <p className="text-[11px] font-black text-red-700">
                    {selectedCount} {game} slot{selectedCount === 1 ? "" : "s"} will drop {discountPct}%
                  </p>
                  <div className="mt-2 space-y-1">
                    {availableSlots
                      .filter((s) => slotStarts.includes(s.start))
                      .slice(0, 4)
                      .map((s) => (
                        <div key={s.start} className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-slate-500">
                            {to12h(s.start)} – {to12h(s.end)}
                          </span>
                          <span>
                            <span className="text-slate-400 line-through">₹{s.price.toLocaleString("en-IN")}</span>{" "}
                            <span className="font-black text-red-600">
                              ₹{boostedPrice(s.price, discountPct).toLocaleString("en-IN")}
                            </span>
                          </span>
                        </div>
                      ))}
                    {selectedCount > 4 && <p className="text-[10px] font-bold text-slate-400">+{selectedCount - 4} more</p>}
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <button
                    onClick={() => setStep(1)}
                    disabled={saving}
                    className="rounded-2xl border-2 border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-600 transition hover:border-slate-300 active:scale-[0.99] disabled:opacity-60"
                  >
                    Back
                  </button>
                  <button
                    onClick={save}
                    disabled={saving || customInvalid}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#dc2626] py-3.5 text-sm font-black text-white shadow-md transition hover:bg-red-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
                    {saving ? "Saving…" : "Save Boost Settings"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {toast && <Toast tone={toast.tone} message={toast.message} />}
    </div>
  );
}
