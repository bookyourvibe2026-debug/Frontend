"use client";

import { useState } from "react";
import { ArrowLeft, Sparkles, Upload, X } from "lucide-react";
import Link from "next/link";

const STEPS = [
  { id: 1, label: "Listing", hint: "Photos & cover" },
  { id: 2, label: "Location", hint: "Name, city, category" },
  { id: 3, label: "Booking", hint: "Type, dates, timings" },
  { id: 4, label: "Pricing", hint: "Rates & add-ons" },
  { id: 5, label: "Launch", hint: "Details & publish" },
] as const;

export default function NewListingPage() {
  const [step, setStep] = useState(1);
  const next = () => setStep((s) => Math.min(5, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/vendor/listings"
            className="h-9 w-9 rounded-full border border-surface-border flex items-center justify-center text-ink-soft hover:text-vibe-violet hover:border-vibe-violet transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-display font-semibold text-lg text-ink">New Listing</h1>
            <p className="text-xs text-ink-faint">
              Hey Book Your Vibes, let&apos;s get you live 🎉
            </p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-vibe-violet text-white text-sm font-semibold px-4 py-2 hover:bg-vibe-violetSoft transition-colors">
          <Sparkles size={15} /> Fill with AI
        </button>
      </div>

      {/* Stepper */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STEPS.map((s) => (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors ${
              step === s.id
                ? "border-vibe-violet bg-vibe-violet/5"
                : "border-surface-border bg-white hover:bg-cream-300"
            }`}
          >
            <span
              className={`h-6 w-6 rounded-full flex items-center justify-center text-[11px] font-semibold ${
                step === s.id
                  ? "bg-vibe-violet text-white"
                  : "bg-cream-300 text-ink-faint"
              }`}
            >
              {s.id}
            </span>
            <span>
              <p className="text-xs font-semibold text-ink leading-none">{s.label}</p>
              <p className="text-[10px] text-ink-faint mt-0.5">{s.hint}</p>
            </span>
          </button>
        ))}
      </div>

      <div className="rounded-xl2 border border-surface-border bg-white shadow-panel p-6">
        {step === 1 && <PhotosStep />}
        {step === 2 && <DetailsStep />}
        {step === 3 && <BookingStep />}
        {step === 4 && <PricingStep />}
        {step === 5 && <LaunchStep />}
      </div>

      <div className="flex items-center justify-between mt-5">
        <p className="text-xs text-ink-faint">Step {step} of 5</p>
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={back}
              className="rounded-lg border border-surface-border px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-cream-300"
            >
              Back
            </button>
          )}
          <button
            onClick={step < 5 ? next : undefined}
            className="rounded-lg bg-vibe-violet px-5 py-2 text-sm font-semibold text-white hover:bg-vibe-violetSoft transition-colors"
          >
            {step < 5 ? "Save & Next" : "Create Listing"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold tracking-wider text-ink-faint uppercase mb-1.5">
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-lg border border-surface-border bg-cream-200/40 px-3 py-2.5 text-sm outline-none focus:border-vibe-violet placeholder:text-ink-faint";

function PhotosStep() {
  return (
    <div>
      <h3 className="font-display font-semibold text-ink mb-1">Listing photos</h3>
      <p className="text-xs text-ink-faint mb-5">
        0 of 2 uploaded — first image is poster, second is banner
      </p>
      <div className="grid sm:grid-cols-2 gap-5">
        <UploadBox label="Poster" tag="FIRST" dims="1080 × 1350 px" hint="Aspect Ratio 4:5 — best for reach & screen coverage" />
        <UploadBox label="Banner" tag="SECOND" dims="1200 × 600 px" hint="Landscape cover for listing pages and hero sections" />
      </div>
    </div>
  );
}

function UploadBox({
  label,
  tag,
  dims,
  hint,
}: {
  label: string;
  tag: string;
  dims: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-surface-border p-4">
      <div className="flex items-center gap-2 mb-1">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <span className="text-[10px] font-semibold bg-ink text-white rounded px-1.5 py-0.5">
          {tag}
        </span>
      </div>
      <p className="text-xs text-ink-faint mb-3">{dims}</p>
      <div className="h-56 rounded-lg border border-dashed border-surface-border flex flex-col items-center justify-center text-center gap-2 bg-cream-200/50">
        <span className="h-9 w-9 rounded-full bg-white border border-surface-border flex items-center justify-center text-vibe-violet">
          <Upload size={16} />
        </span>
        <p className="text-sm font-semibold text-ink">Upload {label.toLowerCase()}</p>
        <p className="text-[11px] text-ink-faint">JPG, PNG or WEBP · max 5 MB</p>
      </div>
      <p className="mt-2 text-[11px] text-vibe-amber bg-amber-50 rounded-md px-2 py-1.5">
        {hint}
      </p>
    </div>
  );
}

function DetailsStep() {
  return (
    <div>
      <h3 className="font-display font-semibold text-ink mb-1">Basic info</h3>
      <p className="text-xs text-ink-faint mb-5">Name, location & category</p>
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="sm:col-span-2">
          <FieldLabel>Listing Name *</FieldLabel>
          <input className={inputClass} placeholder="e.g. GreenTurf Box Cricket Arena" />
        </div>
        <div>
          <FieldLabel>Listing Type *</FieldLabel>
          <select className={inputClass}>
            <option>Turf</option>
            <option>Game</option>
            <option>Event</option>
          </select>
        </div>
        <div>
          <FieldLabel>Category *</FieldLabel>
          <input className={inputClass} placeholder="e.g. 5-a-side Football" />
        </div>
        <div>
          <FieldLabel>City *</FieldLabel>
          <input className={inputClass} placeholder="e.g. Jaipur" />
        </div>
        <div>
          <FieldLabel>State *</FieldLabel>
          <input className={inputClass} placeholder="e.g. Rajasthan" />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>Venue Address</FieldLabel>
          <input className={inputClass} placeholder="Full address for map preview" />
        </div>
      </div>
    </div>
  );
}

function BookingStep() {
  return (
    <div>
      <h3 className="font-display font-semibold text-ink mb-1">Booking setup</h3>
      <p className="text-xs text-ink-faint mb-5">How customers will book this</p>
      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        {["Slot Booking", "Fixed Date Event", "Membership / Pass"].map((opt, i) => (
          <label
            key={opt}
            className={`rounded-xl border px-4 py-3 cursor-pointer text-sm ${
              i === 0
                ? "border-vibe-violet bg-vibe-violet/5"
                : "border-surface-border hover:bg-cream-300"
            }`}
          >
            <input type="radio" name="bookingType" defaultChecked={i === 0} className="mr-2" />
            <span className="font-semibold text-ink">{opt}</span>
            <p className="text-[11px] text-ink-faint mt-1 ml-5">
              {i === 0
                ? "Customer picks a slot & duration"
                : i === 1
                ? "One-time event with fixed date"
                : "Recurring access pass"}
            </p>
          </label>
        ))}
      </div>
      <div className="grid sm:grid-cols-3 gap-5">
        <div>
          <FieldLabel>Available From</FieldLabel>
          <input type="date" className={inputClass} />
        </div>
        <div>
          <FieldLabel>Available Till</FieldLabel>
          <input type="date" className={inputClass} />
        </div>
        <div>
          <FieldLabel>Slots per day</FieldLabel>
          <input type="number" className={inputClass} placeholder="0" />
        </div>
      </div>
    </div>
  );
}

function PricingStep() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display font-semibold text-ink mb-1">Pricing</h3>
        <p className="text-xs text-ink-faint mb-4">Set slot / entry-wise pricing</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input className={inputClass} defaultValue="Per Hour" />
          <input className={inputClass} placeholder="e.g. 1200" />
        </div>
        <button className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-vibe-lime text-vibe-indigo text-xs font-semibold px-3 py-2">
          + Add price
        </button>
      </div>

      <div>
        <h3 className="font-display font-semibold text-ink mb-1">Add-ons</h3>
        <p className="text-xs text-ink-faint mb-4">Optional extras with charges</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <input className={inputClass} placeholder="e.g. Extra Lighting, DJ Setup" />
          <input className={inputClass} placeholder="₹ Price" />
        </div>
        <button className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-vibe-lime text-vibe-indigo text-xs font-semibold px-3 py-2">
          + Add extra
        </button>
      </div>
    </div>
  );
}

function LaunchStep() {
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display font-semibold text-ink mb-1">Visibility & publishing</h3>
          <p className="text-xs text-ink-faint">Choose how this listing should appear before it goes live</p>
        </div>
        <div className="inline-flex rounded-lg border border-surface-border overflow-hidden">
          {(["Active", "Inactive"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 text-xs font-semibold ${
                status === s ? "bg-ink text-white" : "bg-white text-ink-soft"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <FieldLabel>Description *</FieldLabel>
        <textarea
          rows={5}
          className={inputClass}
          placeholder="Describe your listing — what makes it special, who it's for, and what guests can expect."
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <TagInput label="Highlights" placeholder="e.g. Floodlit turf, free parking" />
        <TagInput label="Tags" placeholder="e.g. cricket, football, night-play" />
      </div>
    </div>
  );
}

function TagInput({ label, placeholder }: { label: string; placeholder: string }) {
  const [tags, setTags] = useState<string[]>([]);
  const [value, setValue] = useState("");

  const addTag = () => {
    if (value.trim()) {
      setTags((t) => [...t, value.trim()]);
      setValue("");
    }
  };

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
          className={inputClass}
          placeholder={placeholder}
        />
        <button
          onClick={addTag}
          className="rounded-lg bg-vibe-violet text-white text-xs font-semibold px-4"
        >
          Add
        </button>
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {tags.map((t, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-vibe-violet/10 text-vibe-violet text-xs font-medium px-2.5 py-1"
            >
              {t}
              <button onClick={() => setTags((ts) => ts.filter((_, idx) => idx !== i))}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
