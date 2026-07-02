"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { listings } from "@/lib/mock-data";
import { Booking } from "@/lib/types";

const PAYMENT_METHODS: Booking["payment"][] = ["Cashfree (Online)", "Cash (Offline)", "UPI"];
const STATUSES: Booking["status"][] = ["Confirmed", "Pending", "Completed", "Cancelled"];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (booking: Booking) => void;
}

function emptyState() {
  return {
    customer: "",
    phone: "",
    listing: listings[0]?.title ?? "",
    date: "",
    time: "",
    totalAmount: "",
    payment: PAYMENT_METHODS[0],
    status: STATUSES[0],
  };
}

function makeOrderId() {
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BYV-MAN-${rand}`;
}

export default function CreateBookingModal({ open, onClose, onCreate }: Props) {
  const [form, setForm] = useState(emptyState());
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!open) return null;

  function update<K extends keyof ReturnType<typeof emptyState>>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validate() {
    const e: Record<string, string> = {};
    if (!form.customer.trim()) e.customer = "Customer name is required.";
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = "Enter a valid 10-digit phone number.";
    if (!form.listing) e.listing = "Select a listing.";
    if (!form.date) e.date = "Select a date.";
    if (!form.time) e.time = "Select a time.";
    const amount = Number(form.totalAmount);
    if (!amount || amount <= 0) e.totalAmount = "Enter a valid amount.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;

    const totalAmount = Number(form.totalAmount);
    const platformFee = Math.round(totalAmount * 0.03);
    const [year, month, day] = form.date.split("-");
    const dateTime = `${day}/${month}/${year} | ${form.time}`;

    onCreate({
      orderId: makeOrderId(),
      customer: form.customer.trim(),
      phone: form.phone,
      listing: form.listing,
      dateTime,
      totalAmount,
      platformFee,
      yourEarning: totalAmount - platformFee,
      payment: form.payment as Booking["payment"],
      status: form.status as Booking["status"],
    });

    setForm(emptyState());
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl2 bg-white shadow-pop">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="font-display font-semibold text-ink text-lg">Create Booking</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-8 w-8 rounded-lg inline-flex items-center justify-center text-ink-faint hover:bg-cream-300"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Customer Name" error={errors.customer}>
              <input
                value={form.customer}
                onChange={(e) => update("customer", e.target.value)}
                className={inputClass(!!errors.customer)}
                placeholder="Aarav Mehta"
              />
            </FormField>
            <FormField label="Phone Number" error={errors.phone}>
              <input
                value={form.phone}
                onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                className={inputClass(!!errors.phone)}
                placeholder="9812345670"
              />
            </FormField>
          </div>

          <FormField label="Listing" error={errors.listing}>
            <select
              value={form.listing}
              onChange={(e) => update("listing", e.target.value)}
              className={inputClass(!!errors.listing)}
            >
              {listings.map((l) => (
                <option key={l.id} value={l.title}>
                  {l.title}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Date" error={errors.date}>
              <input
                type="date"
                value={form.date}
                onChange={(e) => update("date", e.target.value)}
                className={inputClass(!!errors.date)}
              />
            </FormField>
            <FormField label="Time" error={errors.time}>
              <input
                type="time"
                value={form.time}
                onChange={(e) => update("time", e.target.value)}
                className={inputClass(!!errors.time)}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Total Amount (₹)" error={errors.totalAmount}>
              <input
                value={form.totalAmount}
                onChange={(e) => update("totalAmount", e.target.value.replace(/\D/g, ""))}
                className={inputClass(!!errors.totalAmount)}
                placeholder="1200"
              />
            </FormField>
            <FormField label="Payment Method">
              <select
                value={form.payment}
                onChange={(e) => update("payment", e.target.value)}
                className={inputClass(false)}
              >
                {PAYMENT_METHODS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Status">
            <select
              value={form.status}
              onChange={(e) => update("status", e.target.value)}
              className={inputClass(false)}
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </FormField>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-cream-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-vibe-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-vibe-violet/90"
            >
              Create Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `w-full rounded-lg border ${
    hasError ? "border-vibe-coral" : "border-surface-border"
  } px-3 py-2.5 text-sm outline-none focus:border-vibe-violet`;
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-soft mb-1.5">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-vibe-coral">{error}</p>}
    </div>
  );
}
