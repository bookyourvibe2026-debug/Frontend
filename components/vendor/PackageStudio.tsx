"use client";

import { useRef, useState } from "react";
import { Check, ExternalLink, Plus, Trash2, Upload, X } from "lucide-react";
import { readFileAsDataUrl } from "@/lib/files";
import {
  AddOn,
  BookingType,
  Coupon,
  ItineraryStop,
  Listing,
  ListingFAQ,
  ListingImage,
  ListingType,
  PriceTier,
} from "@/lib/types";

const STEPS = [
  { id: 1, label: "Package", hint: "Photos & cover" },
  { id: 2, label: "Location", hint: "Name, city, category" },
  { id: 3, label: "Booking", hint: "Type, dates, timezone" },
  { id: 4, label: "Pricing", hint: "Rates & add-ons" },
  { id: 5, label: "Launch", hint: "Details & publish" },
] as const;

function formatListedOn(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function emptyListing(type: ListingType): Listing {
  const now = new Date();
  return {
    id: `byv-${now.getTime()}`,
    title: "",
    type,
    category: "",
    subCategory: "",
    price: 0,
    listedOn: formatListedOn(now),
    status: "Inactive",
    trending: false,
    isPrivate: false,
    access: "Vendor Owned",
    images: [],
    country: "India",
    city: "",
    state: "",
    cityMode: "single",
    cities: [],
    address: "",
    startingPoint: "",
    endingPoint: "",
    reportingStartTime: "",
    reportingEndTime: "",
    description: "",
    highlights: [],
    inclusions: [],
    exclusions: [],
    itinerary: [],
    faqs: [],
    tags: [],
    priceTiers: [],
    addOns: [],
    coupons: [],
    bookingType: "Recurring",
    availableFrom: now.toISOString().slice(0, 10),
    availableTill: now.toISOString().slice(0, 10),
    slotsPerDay: 0,
  };
}

type StepProps = {
  draft: Listing;
  update: <K extends keyof Listing>(key: K, value: Listing[K]) => void;
};

const inputClass =
  "w-full rounded-lg border border-surface-border bg-cream-200/40 px-3 py-2.5 text-sm outline-none focus:border-vibe-violet placeholder:text-ink-faint";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
      {children}
    </label>
  );
}

function ToggleGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-surface-border text-xs font-semibold">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 ${
            value === opt.value ? "bg-ink text-white" : "bg-white text-ink-soft hover:bg-cream-300"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function TagField({
  label,
  placeholder,
  values,
  onChange,
  tone,
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (v: string[]) => void;
  tone?: "success" | "danger";
}) {
  const [input, setInput] = useState("");

  function add() {
    if (input.trim()) {
      onChange([...values, input.trim()]);
      setInput("");
    }
  }

  const pillTone =
    tone === "success" ? "bg-lime-100 text-vibe-limeDark" : tone === "danger" ? "bg-rose-100 text-vibe-coral" : "bg-vibe-violet/10 text-vibe-violet";

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder={placeholder}
          className={inputClass}
        />
        <button onClick={add} className="shrink-0 rounded-lg bg-vibe-violet px-4 text-xs font-semibold text-white">
          Add
        </button>
      </div>
      {values.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((v, i) => (
            <span key={i} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${pillTone}`}>
              {v}
              <button onClick={() => onChange(values.filter((_, idx) => idx !== i))}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STEP 1 — PACKAGE PHOTOS                                            */
/* ------------------------------------------------------------------ */

function PhotoBox({
  label,
  tag,
  dims,
  hint,
  image,
  inputRef,
  onFile,
  onRemove,
  outputNote,
}: {
  label: string;
  tag: string;
  dims: string;
  hint: string;
  image?: ListingImage;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (file: File | undefined) => void;
  onRemove?: () => void;
  outputNote: string;
}) {
  return (
    <div className="rounded-xl border border-surface-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-ink">{label}</p>
          <span className="rounded bg-ink px-1.5 py-0.5 text-[10px] font-semibold text-white">{tag}</span>
        </div>
        {onRemove && (
          <button onClick={onRemove} className="text-ink-faint hover:text-vibe-coral">
            <X size={15} />
          </button>
        )}
      </div>
      <p className="mt-1 mb-3 text-xs text-ink-faint">
        {dims} · {hint}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {image ? (
        <div className="relative h-56 overflow-hidden rounded-lg bg-cream-300">
          <img src={image.url} alt={label} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-3 py-2 text-xs font-semibold text-white">
            <span>{label} ready</span>
            <button onClick={() => inputRef.current?.click()} className="underline">
              Replace
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-56 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-surface-border bg-cream-200/50 transition-colors hover:bg-cream-200"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-surface-border bg-white text-vibe-violet">
            <Upload size={16} />
          </span>
          <span className="text-sm font-semibold text-ink">Upload {label.toLowerCase()}</span>
          <span className="text-[11px] text-ink-faint">JPG, PNG or WEBP · max 5 MB</span>
        </button>
      )}

      <p className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-[11px] text-vibe-amber">{outputNote}</p>
      {!image && <p className="mt-2 text-xs text-ink-faint">No {label.toLowerCase()} selected yet</p>}
    </div>
  );
}

function PackageStep({ draft, update }: StepProps) {
  const posterInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const bulkInput = useRef<HTMLInputElement>(null);

  async function appendFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const urls = await Promise.all(Array.from(files).map(readFileAsDataUrl));
    const startIndex = draft.images.length;
    const newImages: ListingImage[] = urls.map((url, i) => ({
      id: `img-${Date.now()}-${i}`,
      url,
      label: startIndex + i === 0 ? "Poster" : startIndex + i === 1 ? "Banner" : `Photo ${startIndex + i + 1}`,
    }));
    update("images", [...draft.images, ...newImages]);
  }

  async function replaceAt(index: number, file: File | undefined) {
    if (!file) return;
    const url = await readFileAsDataUrl(file);
    const images = [...draft.images];
    while (images.length <= index) {
      images.push({
        id: `img-${Date.now()}-${images.length}`,
        url: "",
        label: images.length === 0 ? "Poster" : images.length === 1 ? "Banner" : `Photo ${images.length + 1}`,
      });
    }
    images[index] = { ...images[index], url };
    update("images", images);
  }

  function setAsPoster(index: number) {
    if (index === 0) return;
    const images = [...draft.images];
    [images[0], images[index]] = [images[index], images[0]];
    update("images", images);
  }

  function removeAt(index: number) {
    update("images", draft.images.filter((_, i) => i !== index));
  }

  const poster = draft.images[0];
  const banner = draft.images[1];

  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold tracking-wider text-ink-faint uppercase">Package photos</p>
      <p className="mb-5 text-xs text-ink-faint">
        {draft.images.length} of 10 uploaded — first image is poster, second is banner
      </p>

      <input
        ref={bulkInput}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          appendFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => bulkInput.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          appendFiles(e.dataTransfer.files);
        }}
        className="mb-6 flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-vibe-violet/40 bg-vibe-violet/5 py-8 text-center transition-colors hover:bg-vibe-violet/10"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-white text-vibe-violet shadow-sm">
          <Upload size={16} />
        </span>
        <span className="text-sm font-semibold text-ink">Drop photos here or click to browse</span>
        <span className="text-[11px] text-ink-faint">JPG, PNG or WEBP · max 5 MB each</span>
      </button>

      <div className="grid gap-5 sm:grid-cols-2">
        <PhotoBox
          label="Poster"
          tag="FIRST"
          dims="1080 x 1350 px"
          hint="Aspect Ratio: 4:5 · Best for reach & screen coverage"
          image={poster}
          inputRef={posterInput}
          onFile={(f) => replaceAt(0, f)}
          onRemove={poster ? () => removeAt(0) : undefined}
          outputNote="Output: Auto-optimized to 1080×1350 WEBP."
        />
        <PhotoBox
          label="Banner"
          tag="SECOND"
          dims="1200 x 600 px"
          hint="Landscape cover for listings and hero sections"
          image={banner}
          inputRef={bannerInput}
          onFile={(f) => replaceAt(1, f)}
          onRemove={banner ? () => removeAt(1) : undefined}
          outputNote="Output: Auto-optimized to 1200×630 WEBP. Portrait uploads keep a blurred background frame."
        />
      </div>

      {draft.images.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold text-ink-faint">Existing photos — hover to set poster or remove</p>
          <div className="flex flex-wrap gap-3">
            {draft.images.map((img, i) => (
              <div key={img.id} className="group relative h-28 w-24 overflow-hidden rounded-lg border border-surface-border">
                {img.url && <img src={img.url} alt={img.label} className="h-full w-full object-cover" />}
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-vibe-violet px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    Poster
                  </span>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  {i !== 0 && (
                    <button onClick={() => setAsPoster(i)} className="text-[10px] font-semibold text-white underline">
                      Set as poster
                    </button>
                  )}
                  <button onClick={() => removeAt(i)} className="text-[10px] font-semibold text-white underline">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STEP 2 — LOCATION                                                  */
/* ------------------------------------------------------------------ */

function LocationStep({ draft, update }: StepProps) {
  const [venueInput, setVenueInput] = useState("");
  const [cityInput, setCityInput] = useState("");

  function addVenue() {
    if (venueInput.trim()) {
      update("address", venueInput.trim());
      setVenueInput("");
    }
  }

  function addCity() {
    const v = cityInput.trim();
    if (!v) return;
    if (draft.cityMode === "multiple") {
      if (!(draft.cities ?? []).includes(v)) update("cities", [...(draft.cities ?? []), v]);
    } else {
      update("city", v);
    }
    setCityInput("");
  }

  const mapsUrl = draft.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(draft.address)}`
    : null;

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1 text-[11px] font-semibold tracking-wider text-ink-faint uppercase">Basic info</p>
        <p className="text-xs text-ink-faint">Name, location &amp; category</p>
      </div>

      <div>
        <FieldLabel>Package name *</FieldLabel>
        <input value={draft.title} onChange={(e) => update("title", e.target.value)} className={inputClass} placeholder="e.g. Om Surf School" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <FieldLabel>Destination venue</FieldLabel>
          {draft.address && (
            <div className="mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-vibe-violet/10 px-2.5 py-1 text-xs font-medium text-vibe-violet">
                {draft.address}
                <button onClick={() => update("address", "")}>
                  <X size={12} />
                </button>
              </span>
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={venueInput}
              onChange={(e) => setVenueInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addVenue())}
              placeholder="Type Udaipur, Abu, Abhaneri, Urban Square Mall..."
              className={inputClass}
            />
            <button onClick={addVenue} className="shrink-0 rounded-lg border border-surface-border px-4 text-sm font-semibold text-ink-soft hover:bg-cream-300">
              Add venue
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-ink-faint">
            Select one precise venue to see an instant map preview and confirm the exact event location.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>Country *</FieldLabel>
              <select value={draft.country ?? "India"} onChange={(e) => update("country", e.target.value)} className={inputClass}>
                <option>India</option>
                <option>Sri Lanka</option>
                <option>Nepal</option>
                <option>UAE</option>
              </select>
            </div>
            <div>
              <FieldLabel>State *</FieldLabel>
              <input value={draft.state} onChange={(e) => update("state", e.target.value)} className={inputClass} placeholder="e.g. Rajasthan" />
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between">
              <FieldLabel>Choose city *</FieldLabel>
              <ToggleGroup
                value={draft.cityMode ?? "single"}
                options={[
                  { value: "single", label: "Single city" },
                  { value: "multiple", label: "Multiple cities" },
                ]}
                onChange={(v) => update("cityMode", v)}
              />
            </div>
            <div className="mb-2 flex flex-wrap gap-2">
              {draft.cityMode === "multiple"
                ? (draft.cities ?? []).map((c) => (
                    <span key={c} className="inline-flex items-center gap-1.5 rounded-full bg-vibe-violet/10 px-2.5 py-1 text-xs font-medium text-vibe-violet">
                      {c}
                      <button onClick={() => update("cities", (draft.cities ?? []).filter((x) => x !== c))}>
                        <X size={12} />
                      </button>
                    </span>
                  ))
                : draft.city && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-vibe-violet/10 px-2.5 py-1 text-xs font-medium text-vibe-violet">
                      {draft.city}
                      <button onClick={() => update("city", "")}>
                        <X size={12} />
                      </button>
                    </span>
                  )}
            </div>
            <input
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCity())}
              placeholder="Search and choose city..."
              className={inputClass}
            />
            <p className="mt-1.5 text-[11px] text-ink-faint">
              Choose one city below and we will use it for the main destination preview.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-surface-border bg-cream-200/40 p-4">
          <p className="mb-2 text-[11px] font-semibold tracking-wider text-ink-faint uppercase">Live map preview</p>
          {draft.address ? (
            <>
              <p className="text-sm font-semibold text-ink">{draft.address}</p>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-vibe-violet hover:underline"
                >
                  Open in Maps <ExternalLink size={12} />
                </a>
              )}
            </>
          ) : (
            <p className="text-xs text-ink-faint">Add a destination venue to see a preview.</p>
          )}
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel>Category *</FieldLabel>
          <input value={draft.category} onChange={(e) => update("category", e.target.value)} className={inputClass} placeholder="e.g. Water Adventures" />
        </div>
        <div>
          <FieldLabel>Sub-Category *</FieldLabel>
          <input
            value={draft.subCategory ?? ""}
            onChange={(e) => update("subCategory", e.target.value)}
            className={inputClass}
            placeholder="e.g. Surfing"
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STEP 3 — BOOKING                                                   */
/* ------------------------------------------------------------------ */

const BOOKING_TYPES: { value: BookingType; label: string; hint: string }[] = [
  { value: "Recurring", label: "Recurring", hint: "Customer picks any date" },
  { value: "Trips", label: "Trips", hint: "Date range booking" },
  { value: "Courses", label: "Courses", hint: "Fixed start and end dates" },
];

function BookingStep({ draft, update }: StepProps) {
  return (
    <div>
      <div className="mb-5">
        <p className="mb-1 text-[11px] font-semibold tracking-wider text-ink-faint uppercase">Booking setup</p>
        <p className="text-xs text-ink-faint">How customers will book this package</p>
      </div>

      <div className="mb-5 grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel>Starting Point</FieldLabel>
          <input value={draft.startingPoint ?? ""} onChange={(e) => update("startingPoint", e.target.value)} className={inputClass} />
        </div>
        <div>
          <FieldLabel>Ending Point</FieldLabel>
          <input value={draft.endingPoint ?? ""} onChange={(e) => update("endingPoint", e.target.value)} className={inputClass} />
        </div>
      </div>

      <FieldLabel>Booking Type</FieldLabel>
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        {BOOKING_TYPES.map((opt) => (
          <label
            key={opt.value}
            className={`cursor-pointer rounded-xl border px-4 py-3 text-sm ${
              draft.bookingType === opt.value ? "border-vibe-violet bg-vibe-violet/5" : "border-surface-border hover:bg-cream-300"
            }`}
          >
            <input
              type="radio"
              name="bookingType"
              checked={draft.bookingType === opt.value}
              onChange={() => update("bookingType", opt.value)}
              className="mr-2"
            />
            <span className="font-semibold text-ink">{opt.label}</span>
            <p className="ml-5 mt-1 text-[11px] text-ink-faint">{opt.hint}</p>
          </label>
        ))}
      </div>

      <div className="mb-5 grid gap-5 sm:grid-cols-3">
        <div>
          <FieldLabel>Season From</FieldLabel>
          <input type="date" value={draft.availableFrom} onChange={(e) => update("availableFrom", e.target.value)} className={inputClass} />
        </div>
        <div>
          <FieldLabel>Season To</FieldLabel>
          <input type="date" value={draft.availableTill} onChange={(e) => update("availableTill", e.target.value)} className={inputClass} />
        </div>
        <div>
          <FieldLabel>Available Slots</FieldLabel>
          <input
            type="number"
            value={draft.slotsPerDay}
            onChange={(e) => update("slotsPerDay", Number(e.target.value))}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel>Reporting Start Time (optional)</FieldLabel>
          <input
            type="time"
            value={draft.reportingStartTime ?? ""}
            onChange={(e) => update("reportingStartTime", e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <FieldLabel>Reporting End Time (optional)</FieldLabel>
          <input
            type="time"
            value={draft.reportingEndTime ?? ""}
            onChange={(e) => update("reportingEndTime", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STEP 4 — PRICING                                                   */
/* ------------------------------------------------------------------ */

function PricingStep({ draft, update }: StepProps) {
  function updateTier(i: number, patch: Partial<PriceTier>) {
    update("priceTiers", draft.priceTiers.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }
  function addTier() {
    update("priceTiers", [...draft.priceTiers, { id: `tier-${Date.now()}`, label: "", amount: 0 }]);
  }
  function removeTier(i: number) {
    update("priceTiers", draft.priceTiers.filter((_, idx) => idx !== i));
  }

  const addOns = draft.addOns ?? [];
  function updateAddOn(i: number, patch: Partial<AddOn>) {
    update("addOns", addOns.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }
  function addAddOn() {
    update("addOns", [...addOns, { id: `addon-${Date.now()}`, label: "", price: 0 }]);
  }
  function removeAddOn(i: number) {
    update("addOns", addOns.filter((_, idx) => idx !== i));
  }

  const coupons = draft.coupons ?? [];
  function addCoupon() {
    update("coupons", [...coupons, { id: `coupon-${Date.now()}`, code: "", discountPercent: 10 }]);
  }
  function updateCoupon(i: number, patch: Partial<Coupon>) {
    update("coupons", coupons.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function removeCoupon(i: number) {
    update("coupons", coupons.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-1 text-[11px] font-semibold tracking-wider text-ink-faint uppercase">Pricing</p>
        <p className="mb-4 text-xs text-ink-faint">Set participant-wise pricing</p>
        <div className="space-y-3">
          {draft.priceTiers.map((tier, i) => (
            <div key={tier.id} className="grid grid-cols-[1fr_160px_auto] items-end gap-3">
              <div>
                <FieldLabel>Type</FieldLabel>
                <input value={tier.label} onChange={(e) => updateTier(i, { label: e.target.value })} className={inputClass} />
              </div>
              <div>
                <FieldLabel>Amount (₹)</FieldLabel>
                <input
                  type="number"
                  value={tier.amount}
                  onChange={(e) => updateTier(i, { amount: Number(e.target.value) })}
                  className={inputClass}
                />
              </div>
              <button onClick={() => removeTier(i)} className="pb-2.5 text-ink-faint hover:text-vibe-coral">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        <button onClick={addTier} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-vibe-lime px-3 py-2 text-xs font-semibold text-vibe-indigo">
          <Plus size={13} /> Add price
        </button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-xl2 border border-surface-border p-5">
          <p className="text-sm font-semibold text-ink">Add-ons</p>
          <p className="mb-4 text-xs text-ink-faint">Optional extras with charges</p>
          <div className="space-y-3">
            {addOns.map((a, i) => (
              <div key={a.id} className="flex gap-2">
                <input
                  value={a.label}
                  onChange={(e) => updateAddOn(i, { label: e.target.value })}
                  placeholder="e.g. Breakfast, Hotel stay"
                  className={inputClass}
                />
                <input
                  type="number"
                  value={a.price}
                  onChange={(e) => updateAddOn(i, { price: Number(e.target.value) })}
                  placeholder="₹ Price"
                  className={`${inputClass} w-28`}
                />
                <button onClick={() => removeAddOn(i)} className="shrink-0 text-ink-faint hover:text-vibe-coral">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          <button onClick={addAddOn} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-vibe-lime px-3 py-2 text-xs font-semibold text-vibe-indigo">
            <Plus size={13} /> Add extra
          </button>
        </div>

        <div className="rounded-xl2 border border-surface-border p-5">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Coupons &amp; Discounts</p>
            <button
              onClick={addCoupon}
              className="inline-flex items-center gap-1 rounded-full border border-vibe-violet px-3 py-1 text-xs font-semibold text-vibe-violet"
            >
              <Plus size={12} /> Add Coupon
            </button>
          </div>
          <p className="mb-4 text-xs text-ink-faint">Configure multiple promotional codes for this package</p>
          <p className="mb-2 text-[11px] font-semibold tracking-wider text-ink-faint uppercase">Active Coupons</p>
          {coupons.length === 0 ? (
            <p className="rounded-lg bg-cream-200/60 px-3 py-3 text-xs text-ink-faint">
              No coupons have been configured yet. Click Add Coupon to create one.
            </p>
          ) : (
            <div className="space-y-2">
              {coupons.map((c, i) => (
                <div key={c.id} className="flex items-center gap-2">
                  <input
                    value={c.code}
                    onChange={(e) => updateCoupon(i, { code: e.target.value.toUpperCase() })}
                    placeholder="CODE20"
                    className={inputClass}
                  />
                  <div className="flex shrink-0 items-center gap-1">
                    <input
                      type="number"
                      value={c.discountPercent}
                      onChange={(e) => updateCoupon(i, { discountPercent: Number(e.target.value) })}
                      className={`${inputClass} w-16`}
                    />
                    <span className="text-xs text-ink-faint">%</span>
                  </div>
                  <button onClick={() => removeCoupon(i)} className="text-ink-faint hover:text-vibe-coral">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STEP 5 — LAUNCH                                                    */
/* ------------------------------------------------------------------ */

function LaunchStep({ draft, update }: StepProps) {
  function addDay() {
    update("itinerary", [...draft.itinerary, { day: draft.itinerary.length + 1, title: "", description: "" }]);
  }
  function updateDay(i: number, patch: Partial<ItineraryStop>) {
    update("itinerary", draft.itinerary.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function removeDay(i: number) {
    update(
      "itinerary",
      draft.itinerary.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, day: idx + 1 }))
    );
  }

  function addFaq() {
    update("faqs", [...draft.faqs, { question: "", answer: "" }]);
  }
  function updateFaq(i: number, patch: Partial<ListingFAQ>) {
    update("faqs", draft.faqs.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }
  function removeFaq(i: number) {
    update("faqs", draft.faqs.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-semibold tracking-wider text-ink-faint uppercase">Visibility &amp; publishing</p>
          <p className="text-xs text-ink-faint">Choose how this package should appear before you go live</p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <div>
            <p className="mb-1 text-[10px] font-semibold tracking-wider text-ink-faint uppercase">Status</p>
            <ToggleGroup
              value={draft.status}
              options={[
                { value: "Active", label: "Active" },
                { value: "Inactive", label: "Inactive" },
              ]}
              onChange={(v) => update("status", v)}
            />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold tracking-wider text-ink-faint uppercase">Trending</p>
            <ToggleGroup
              value={draft.trending ? "On" : "Off"}
              options={[
                { value: "Off", label: "Off" },
                { value: "On", label: "On" },
              ]}
              onChange={(v) => update("trending", v === "On")}
            />
          </div>
          <div>
            <p className="mb-1 text-[10px] font-semibold tracking-wider text-ink-faint uppercase">Private</p>
            <ToggleGroup
              value={draft.isPrivate ? "On" : "Off"}
              options={[
                { value: "Off", label: "Off" },
                { value: "On", label: "On" },
              ]}
              onChange={(v) => update("isPrivate", v === "On")}
            />
          </div>
        </div>
      </div>

      <div>
        <FieldLabel>Description *</FieldLabel>
        <textarea
          rows={5}
          value={draft.description}
          onChange={(e) => update("description", e.target.value)}
          className={inputClass}
          placeholder="Describe your package — what makes it special, who it's for, and what guests can expect."
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TagField label="Highlights" placeholder="e.g. Stunning Himalayan views" values={draft.highlights} onChange={(v) => update("highlights", v)} />
        <TagField label="Tags" placeholder="e.g. adventure, trekking, camping" values={draft.tags} onChange={(v) => update("tags", v)} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <TagField
          label="Included"
          placeholder="e.g. Professional guide"
          values={draft.inclusions}
          onChange={(v) => update("inclusions", v)}
          tone="success"
        />
        <TagField
          label="Excluded"
          placeholder="e.g. Personal expenses"
          values={draft.exclusions}
          onChange={(v) => update("exclusions", v)}
          tone="danger"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-xl2 border border-surface-border p-5">
          <p className="text-sm font-semibold text-ink">FAQs *</p>
          <p className="mb-4 text-xs text-ink-faint">Common questions &amp; answers</p>
          <div className="space-y-4">
            {draft.faqs.map((f, i) => (
              <div key={i} className="rounded-lg border border-surface-border p-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <FieldLabel>Question</FieldLabel>
                  <button onClick={() => removeFaq(i)} className="text-ink-faint hover:text-vibe-coral">
                    <X size={14} />
                  </button>
                </div>
                <input value={f.question} onChange={(e) => updateFaq(i, { question: e.target.value })} className={`${inputClass} mb-2`} />
                <FieldLabel>Answer</FieldLabel>
                <input value={f.answer} onChange={(e) => updateFaq(i, { answer: e.target.value })} className={inputClass} />
              </div>
            ))}
          </div>
          <button onClick={addFaq} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-vibe-lime px-3 py-2 text-xs font-semibold text-vibe-indigo">
            <Plus size={13} /> Add FAQ
          </button>
        </div>

        <div className="rounded-xl2 border border-surface-border p-5">
          <p className="text-sm font-semibold text-ink">Itinerary</p>
          <p className="mb-4 text-xs text-ink-faint">Day-by-day plan</p>
          <div className="space-y-4">
            {draft.itinerary.map((s, i) => (
              <div key={i} className="rounded-lg border border-surface-border p-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-sm font-semibold text-ink">Day {s.day}</p>
                  <button onClick={() => removeDay(i)} className="text-ink-faint hover:text-vibe-coral">
                    <Trash2 size={14} />
                  </button>
                </div>
                <FieldLabel>Day Title</FieldLabel>
                <input
                  value={s.title}
                  onChange={(e) => updateDay(i, { title: e.target.value })}
                  placeholder={`Day ${s.day}: Introduction`}
                  className={`${inputClass} mb-2`}
                />
                <FieldLabel>Description</FieldLabel>
                <textarea rows={2} value={s.description} onChange={(e) => updateDay(i, { description: e.target.value })} className={inputClass} />
              </div>
            ))}
          </div>
          <button onClick={addDay} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-vibe-lime px-3 py-2 text-xs font-semibold text-vibe-indigo">
            <Plus size={13} /> Add day
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  PACKAGE STUDIO — shared modal for create & edit                    */
/* ------------------------------------------------------------------ */

export function PackageStudio({
  mode,
  initialListing,
  initialType = "Turf",
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  initialListing?: Listing;
  initialType?: ListingType;
  onClose: () => void;
  onSave: (listing: Listing) => void;
}) {
  const [draft, setDraft] = useState<Listing>(() => initialListing ?? emptyListing(initialType));
  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);

  function update<K extends keyof Listing>(key: K, value: Listing[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function goTo(s: number) {
    setStep(s);
    setMaxStep((m) => Math.max(m, s));
  }

  function handlePrimary() {
    if (step < 5) {
      goTo(step + 1);
      return;
    }
    if (!draft.title.trim()) {
      setFormError("Package name is required.");
      goTo(2);
      return;
    }
    if (!draft.category.trim()) {
      setFormError("Category is required.");
      goTo(2);
      return;
    }
    const hasCity = draft.cityMode === "multiple" ? (draft.cities?.length ?? 0) > 0 : draft.city.trim().length > 0;
    if (!hasCity) {
      setFormError("Choose at least one city.");
      goTo(2);
      return;
    }
    setFormError(null);
    onSave(draft);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-cream-200">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-vibe-indigo via-vibe-violet to-vibe-violetSoft px-4 py-4 text-white shadow-pop sm:px-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
            {mode === "edit" ? "Edit Package" : "New Package"}
          </p>
          <h2 className="font-display text-lg font-semibold sm:text-xl">Package Studio</h2>
        </div>
        <button
          onClick={onClose}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-sm font-semibold hover:bg-white/20"
        >
          <X size={15} /> Close
        </button>
      </div>

      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap gap-2">
          {STEPS.map((s) => (
            <button
              key={s.id}
              onClick={() => goTo(s.id)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors ${
                step === s.id ? "border-vibe-violet bg-vibe-violet/5" : "border-surface-border bg-white hover:bg-cream-300"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                  step === s.id ? "bg-vibe-violet text-white" : maxStep > s.id ? "bg-vibe-limeDark text-white" : "bg-cream-300 text-ink-faint"
                }`}
              >
                {maxStep > s.id ? <Check size={12} /> : s.id}
              </span>
              <span>
                <p className="text-xs font-semibold leading-none text-ink">{s.label}</p>
                <p className="mt-0.5 text-[10px] text-ink-faint">{s.hint}</p>
              </span>
            </button>
          ))}
        </div>

        {formError && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-vibe-coral">
            {formError}
          </div>
        )}

        <div className="rounded-xl2 border border-surface-border bg-white p-5 shadow-panel sm:p-6">
          {step === 1 && <PackageStep draft={draft} update={update} />}
          {step === 2 && <LocationStep draft={draft} update={update} />}
          {step === 3 && <BookingStep draft={draft} update={update} />}
          {step === 4 && <PricingStep draft={draft} update={update} />}
          {step === 5 && <LaunchStep draft={draft} update={update} />}
        </div>
      </div>

      <div className="sticky bottom-0 flex items-center justify-between border-t border-surface-border bg-white px-4 py-4 sm:px-8">
        <p className="text-xs text-ink-faint">Step {step} of 5</p>
        <div className="flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="rounded-lg border border-surface-border px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-cream-300"
            >
              Back
            </button>
          )}
          <button onClick={onClose} className="rounded-lg border border-surface-border px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-cream-300">
            Cancel
          </button>
          <button
            onClick={handlePrimary}
            className="rounded-lg bg-vibe-violet px-5 py-2 text-sm font-semibold text-white hover:bg-vibe-violetSoft"
          >
            {step < 5 ? "Save & Next" : mode === "edit" ? "Update Package" : "Create Listing"}
          </button>
        </div>
      </div>
    </div>
  );
}
