"use client";

import { useState } from "react";
import { X, GraduationCap } from "lucide-react";
import { addAcademyToListing } from "@/lib/api/vendor";
import { ApiError } from "@/lib/api/client";
import { SPORTS_CATALOG } from "@/components/home/data";

const WEEKDAYS = [
  { day: 1, label: "Mon" },
  { day: 2, label: "Tue" },
  { day: 3, label: "Wed" },
  { day: 4, label: "Thu" },
  { day: 5, label: "Fri" },
  { day: 6, label: "Sat" },
  { day: 0, label: "Sun" },
];

type PricingMode = "session" | "day" | "month";

/**
 * Shown right after a Turf listing is created — "do you also want to add an
 * academy here?". Creates a linked academy (a Coach record with turfListingId
 * set) with one starter batch, so the vendor doesn't have to leave the flow.
 * They can add more batches / fine-tune later from the full Coaches section.
 */
export function AddAcademyPrompt({
  turfListingId,
  turfTitle,
  onDone,
}: {
  turfListingId: string;
  turfTitle: string;
  /** `added` is true only when an academy was actually created — the caller needs
   * that to know whether the vendor's session now has a new "coaches" vertical. */
  onDone: (added: boolean) => void;
}) {
  const [stage, setStage] = useState<"ask" | "form">("ask");
  const [name, setName] = useState("");
  const [sports, setSports] = useState<string[]>([]);
  const [pricingMode, setPricingMode] = useState<PricingMode>("month");
  const [priceInput, setPriceInput] = useState("");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [startTime, setStartTime] = useState("16:00");
  const [endTime, setEndTime] = useState("18:00");
  const [capacityInput, setCapacityInput] = useState("20");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleSport(id: string) {
    setSports((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }
  function toggleDay(day: number) {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  const price = Number(priceInput) || 0;

  async function handleSave() {
    if (name.trim().length < 2) return setError("Enter the academy's name.");
    if (sports.length === 0) return setError("Pick at least one sport.");
    if (price <= 0) return setError("Enter a price.");
    if (days.length === 0) return setError("Pick at least one day the academy runs.");
    const capacity = Number(capacityInput) || 1;

    setSaving(true);
    setError(null);
    try {
      await addAcademyToListing(turfListingId, {
        name: name.trim(),
        category: sports[0],
        categories: sports,
        batches: [
          {
            name: "Main Batch",
            startTime,
            endTime,
            days,
            capacity,
            // Whichever mode the vendor actually quotes in — priceMonthly/priceYearly
            // stay populated as a fallback plan so enrolment keeps working; the vendor
            // can fine-tune the real monthly/yearly numbers later from Coaches.
            priceMonthly: price,
            priceYearly: price * 10,
            pricingMode,
            pricePerSession: pricingMode === "session" ? price : undefined,
            pricePerDay: pricingMode === "day" ? price : undefined,
          },
        ],
      });
      onDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.describe() : "Couldn't add the academy. You can add it later from Coaches.");
      setSaving(false);
    }
  }

  const field =
    "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-violet-500";

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[88dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        {stage === "ask" ? (
          <div className="text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-100 text-violet-600">
              <GraduationCap size={24} />
            </span>
            <h3 className="mt-3 text-[16px] font-black text-slate-900">Add an academy too?</h3>
            <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-slate-500">
              Run coaching sessions at <span className="font-bold text-slate-700">{turfTitle}</span>? Players will be able to
              book it right alongside the turf.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => onDone(false)}
                className="rounded-xl border border-slate-200 py-3 text-[12px] font-black text-slate-600 transition hover:bg-slate-50"
              >
                Not now
              </button>
              <button
                onClick={() => setStage("form")}
                className="rounded-xl bg-violet-600 py-3 text-[12px] font-black text-white transition hover:bg-violet-700"
              >
                Yes, add academy
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
                  <GraduationCap size={18} />
                </span>
                <div>
                  <h3 className="text-[14px] font-black text-slate-900">Add Academy</h3>
                  <p className="text-[10px] font-medium text-slate-400">at {turfTitle}</p>
                </div>
              </div>
              <button onClick={() => onDone(false)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100">
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {error && <p className="rounded-xl bg-rose-50 px-3 py-2.5 text-[11px] font-bold text-rose-600">{error}</p>}

              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-400">Academy Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Field Club Football Academy" className={field} />
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-400">Sports</label>
                <div className="flex flex-wrap gap-1.5">
                  {SPORTS_CATALOG.map((s) => {
                    const active = sports.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleSport(s.id)}
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition ${
                          active ? "border-violet-500 bg-violet-500 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-400">Pricing</label>
                <div className="flex overflow-hidden rounded-xl border border-slate-200">
                  {([
                    ["session", "Per Game"],
                    ["day", "Per Day"],
                    ["month", "Per Month"],
                  ] as [PricingMode, string][]).map(([mode, label]) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPricingMode(mode)}
                      className={`flex-1 py-2.5 text-[11px] font-black transition ${
                        pricingMode === mode ? "bg-violet-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">₹</span>
                  <input
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value.replace(/\D/g, ""))}
                    inputMode="numeric"
                    placeholder={pricingMode === "session" ? "300" : pricingMode === "day" ? "500" : "2500"}
                    className={`${field} pl-7`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-400">Start Time</label>
                  <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={field} />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-400">End Time</label>
                  <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={field} />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-400">Days</label>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAYS.map((d) => {
                    const active = days.includes(d.day);
                    return (
                      <button
                        key={d.day}
                        type="button"
                        onClick={() => toggleDay(d.day)}
                        className={`h-9 w-11 rounded-lg border text-[11px] font-black transition ${
                          active ? "border-violet-500 bg-violet-500 text-white" : "border-slate-200 bg-white text-slate-600"
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-slate-400">Capacity</label>
                <input
                  value={capacityInput}
                  onChange={(e) => setCapacityInput(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  className={field}
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full rounded-2xl bg-violet-600 py-3 text-[11px] font-black text-white transition hover:bg-violet-700 active:scale-[0.98] disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save Academy"}
              </button>
              <button onClick={() => onDone(false)} className="w-full rounded-2xl py-1.5 text-center text-[11px] font-bold text-slate-400 hover:text-slate-600">
                Skip for now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
