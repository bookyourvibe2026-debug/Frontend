"use client";

import { useState } from "react";
import { X, User, Phone, Building2, IndianRupee, Clock, Trophy, Users, UtensilsCrossed } from "lucide-react";
import { TimeField } from "@/components/vendor/TimeField";
import { useBackDismiss } from "@/lib/useBackDismiss";

export type AddBookingPayment = "Cash (Offline)" | "UPI";

export interface AddBookingValues {
  customerName: string;
  phone: string;
  courtId: string;
  price: string;
  startTime: string;
  endTime: string;
  sport: string;
  numberOfPlayers: string;
  foodIncluded: boolean;
  payment: AddBookingPayment;
}

/**
 * Add Booking — customer name, number, court, price, timing, sport.
 * Timing/price arrive prefilled when opened from a slot, and stay editable.
 *
 * Render this conditionally: mounting seeds the form from `initial`, so each
 * open picks up the current slot's price/timing without an effect.
 */
export function AddBookingSheet({
  courts,
  sports,
  initial,
  submitting,
  onClose,
  onSubmit,
}: {
  courts: { id: string; title: string }[];
  sports: string[];
  initial: Partial<AddBookingValues>;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (values: AddBookingValues) => void;
}) {
  // Device Back closes the sheet instead of leaving the bookings page.
  useBackDismiss(true, onClose);
  const [form, setForm] = useState<AddBookingValues>({
    customerName: initial.customerName ?? "",
    phone: initial.phone ?? "",
    courtId: initial.courtId ?? courts[0]?.id ?? "",
    price: initial.price ?? "",
    // The picker always shows a concrete time, so seed sensible defaults when the
    // sheet is opened blank (rather than from a tapped slot) — an empty value would
    // otherwise read as 12:00 AM yet still fail the "Set the timing" check.
    startTime: initial.startTime ?? "06:00",
    endTime: initial.endTime ?? "07:00",
    sport: initial.sport ?? sports[0] ?? "",
    numberOfPlayers: initial.numberOfPlayers ?? "",
    foodIncluded: initial.foodIncluded ?? false,
    payment: initial.payment ?? "Cash (Offline)",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof AddBookingValues>(k: K, v: AddBookingValues[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  function validate() {
    const e: Record<string, string> = {};
    if (!form.customerName.trim()) e.customerName = "Enter the customer's name.";
    // Backend expects an Indian mobile number.
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = "Enter a valid 10-digit mobile number.";
    if (!form.courtId) e.courtId = "Pick a court.";
    if (!form.startTime || !form.endTime) e.startTime = "Set the timing.";
    if (form.price === "" || Number(form.price) < 0) e.price = "Enter a valid price.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;
    onSubmit(form);
  }

  const inputCls = (bad?: boolean) =>
    `w-full rounded-xl border bg-white px-3 py-2.5 text-[12px] font-semibold text-slate-800 outline-none transition focus:border-vibe-violet ${
      bad ? "border-rose-300" : "border-slate-200"
    }`;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-black text-slate-900">Add Booking</h2>
            <p className="mt-0.5 text-[10px] font-medium text-slate-400">Walk-in or phone booking.</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <X size={15} />
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Customer Name" icon={User} error={errors.customerName}>
            <input
              value={form.customerName}
              onChange={(e) => update("customerName", e.target.value)}
              placeholder="e.g. Rahul Sharma"
              className={inputCls(!!errors.customerName)}
            />
          </Field>

          <Field label="Mobile Number" icon={Phone} error={errors.phone}>
            <input
              inputMode="numeric"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit number"
              className={inputCls(!!errors.phone)}
            />
          </Field>

          <Field label="Court" icon={Building2} error={errors.courtId}>
            <select
              value={form.courtId}
              onChange={(e) => update("courtId", e.target.value)}
              className={inputCls(!!errors.courtId)}
            >
              {courts.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </Field>

          <Field label="Sport" icon={Trophy}>
            {sports.length > 0 ? (
              <select value={form.sport} onChange={(e) => update("sport", e.target.value)} className={inputCls()}>
                {sports.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <input
                value={form.sport}
                onChange={(e) => update("sport", e.target.value)}
                placeholder="e.g. Cricket"
                className={inputCls()}
              />
            )}
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="No. of Players" icon={Users}>
              <input
                inputMode="numeric"
                value={form.numberOfPlayers}
                onChange={(e) => update("numberOfPlayers", e.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="e.g. 10"
                className={inputCls()}
              />
            </Field>
            <Field label="Food & Beverage" icon={UtensilsCrossed}>
              <button
                type="button"
                onClick={() => update("foodIncluded", !form.foodIncluded)}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-[12px] font-black transition ${
                  form.foodIncluded ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500"
                }`}
              >
                {form.foodIncluded ? "Included" : "Not included"}
                <span className={`relative flex h-5 w-9 items-center rounded-full transition ${form.foodIncluded ? "bg-emerald-500" : "bg-slate-300"}`}>
                  <span className={`absolute h-4 w-4 rounded-full bg-white shadow transition-all ${form.foodIncluded ? "left-[18px]" : "left-0.5"}`} />
                </span>
              </button>
            </Field>
          </div>

          <Field label="Timing" icon={Clock} error={errors.startTime}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <TimeField value={form.startTime} onChange={(v) => update("startTime", v)} />
              <span className="text-[10px] font-bold text-slate-400">to</span>
              <TimeField value={form.endTime} onChange={(v) => update("endTime", v)} />
            </div>
          </Field>

          <Field label="Price" icon={IndianRupee} error={errors.price}>
            <input
              inputMode="numeric"
              value={form.price}
              onChange={(e) => update("price", e.target.value.replace(/\D/g, ""))}
              placeholder="0"
              className={inputCls(!!errors.price)}
            />
          </Field>

          <Field label="Payment Mode" icon={IndianRupee}>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "Cash (Offline)", label: "Cash" },
                { value: "UPI", label: "Online / UPI" },
              ] as { value: AddBookingPayment; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update("payment", opt.value)}
                  className={`rounded-xl border py-2.5 text-[11px] font-black transition active:scale-[0.97] ${
                    form.payment === opt.value
                      ? "border-vibe-navy bg-vibe-navy text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="mt-5 w-full rounded-2xl bg-vibe-navy py-3.5 text-[12px] font-black uppercase tracking-wide text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save Booking"}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  error,
  children,
}: {
  label: string;
  icon: typeof User;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
        <Icon size={11} /> {label}
      </label>
      {children}
      {error && <p className="mt-1 text-[9px] font-bold text-rose-500">{error}</p>}
    </div>
  );
}
