"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { Check, ExternalLink, Loader2, Plus, Trash2, Upload, X, Clock3, ChevronLeft, ChevronRight, LayoutGrid, List, Sunrise, Sun, Sunset, Moon, Ban, Crop, ArrowUpDown, Lightbulb, Layers, Grid, LocateFixed } from "lucide-react";
import { uploadAdminImage, uploadVendorImage } from "@/lib/api/uploads";
import { ApiError } from "@/lib/api/client";
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
  TurfSlot,
} from "@/lib/types";
import { ClockSlotsWidget } from "./ClockSlotsWidget";
import { SPORT_CATEGORIES, SportCategory, subCategoriesForCategories, venueOptionsFor, VenueSetting } from "@/lib/taxonomy";
import { usePexelsImage } from "@/lib/pexels";

type Audience = "admin" | "vendor";

const STEPS = [
  { id: 1, label: "Images", hint: "Media uploads" },
  { id: 2, label: "Slots", hint: "Turf time slots" },
  { id: 3, label: "Details", hint: "Name & games / categories" },
  { id: 4, label: "Location", hint: "Venue address & map" },
  { id: 5, label: "Pricing", hint: "Set prices per slot" },
  { id: 6, label: "Publish", hint: "Review details & save" },
] as const;

/** Event-friendly labels for the same step components (BookingStep renders booking
 * setup for events, PricingStep renders participant tiers, etc.). */
const EVENT_STEPS = [
  { id: 1, label: "Event photos", hint: "Poster & banner" },
  { id: 2, label: "Booking", hint: "Dates & timezone" },
  { id: 3, label: "Details", hint: "Name & category" },
  { id: 4, label: "Location", hint: "Venue & map" },
  { id: 5, label: "Pricing", hint: "Rates & add-ons" },
  { id: 6, label: "Launch", hint: "Publish your event" },
] as const;

function stepsFor(type: ListingType) {
  return type === "Event" ? EVENT_STEPS : STEPS;
}

function formatListedOn(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function to12h(t: string) {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  let h = Number(hStr) % 24; // "24:00" (midnight close) → 12:00 AM
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${mStr} ${ap}`;
}

/** Starter template for new venue packages — vendors edit or remove whatever doesn't apply.
 * Events start blank since Included/Excluded mean trip inclusions there, not venue facilities. */
const DEFAULT_PACKAGE_DESCRIPTION =
  "A well-maintained venue with a quality playing surface and proper lighting. " +
  "Perfect for casual games, regular practice sessions and small tournaments. " +
  "Easy to reach, with an on-ground team ready to help you get started.";
const DEFAULT_AMENITIES_PROVIDED = ["Washrooms", "Parking", "Floodlights", "Drinking Water", "First Aid Kit", "Seating Area"];
const DEFAULT_AMENITIES_NOT_PROVIDED = ["Equipment Rental", "Cafeteria"];

/** Common venue facilities offered as one-tap chips in the Amenities step (either column).
 * The vendor can still type anything custom — these just save the usual ones. */
const AMENITY_SUGGESTIONS = [
  "Washrooms", "Parking", "Floodlights", "Drinking Water", "First Aid Kit", "Seating Area",
  "Changing Rooms", "Showers", "Lockers", "CCTV", "Wi-Fi", "Cafeteria", "Equipment Rental",
  "Shoe Rental", "Coaching", "Air Conditioning", "Shaded Area", "Spectator Seating",
  "Sound System", "Scoreboard", "Wheelchair Access",
];
/** For Events, "Included / Excluded" are trip inclusions, not venue facilities. */
const EVENT_INCLUSION_SUGGESTIONS = [
  "Professional guide", "Equipment", "Refreshments", "Transport", "Insurance", "Photography", "Certificate",
];

function emptyListing(type: ListingType): Listing {
  const now = new Date();
  const isEvent = type === "Event";
  return {
    id: `byv-${now.getTime()}`,
    title: "",
    type,
    categories: [],
    subCategories: [],
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
    description: isEvent ? "" : DEFAULT_PACKAGE_DESCRIPTION,
    highlights: [],
    inclusions: isEvent ? [] : [...DEFAULT_AMENITIES_PROVIDED],
    exclusions: isEvent ? [] : [...DEFAULT_AMENITIES_NOT_PROVIDED],
    itinerary: [],
    faqs: [],
    tags: [],
    technicalSpecs: [],
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

function uploadImage(audience: Audience, file: File) {
  return audience === "admin" ? uploadAdminImage(file, "listings") : uploadVendorImage(file, "listings");
}

/** The top-level `price` shown on listing cards / detail pages isn't edited directly anywhere in
 * this form — it must be derived from the per-slot pricing (Step 5) so customers and vendors see
 * the real "starting from" price instead of the 0 the draft is initialized with. */
function computeStartingPrice(listing: Listing): number {
  if (listing.type === "Event") {
    const amounts = listing.priceTiers.map((t) => t.amount).filter((a) => a > 0);
    return amounts.length ? Math.min(...amounts) : 0;
  }
  const allSlots = [
    ...(listing.slotsList ?? []),
    ...((listing.dateOverrides ?? []).flatMap((o) => o.slots ?? [])),
  ];
  const pricedSlots = allSlots.filter((s) => s.price > 0 && !s.blocked).map((s) => s.price);
  return pricedSlots.length ? Math.min(...pricedSlots) : 0;
}

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
  suggestions = [],
}: {
  label: string;
  placeholder: string;
  values: string[];
  onChange: (v: string[]) => void;
  tone?: "success" | "danger";
  /** Common options offered as one-tap chips, so the vendor can pick instead of typing. */
  suggestions?: string[];
}) {
  const [input, setInput] = useState("");

  function add(raw?: string) {
    const v = (raw ?? input).trim();
    if (!v) return;
    // Case-insensitive de-dupe so "Parking" isn't added twice.
    if (!values.some((x) => x.toLowerCase() === v.toLowerCase())) onChange([...values, v]);
    if (raw === undefined) setInput("");
  }

  const pillTone =
    tone === "success" ? "bg-lime-100 text-vibe-limeDark" : tone === "danger" ? "bg-rose-100 text-vibe-coral" : "bg-vibe-violet/10 text-vibe-violet";

  // Only suggest what hasn't been added yet.
  const openSuggestions = suggestions.filter((s) => !values.some((v) => v.toLowerCase() === s.toLowerCase()));

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
        <button onClick={() => add()} className="shrink-0 rounded-lg bg-vibe-violet px-4 text-xs font-semibold text-white">
          Add
        </button>
      </div>

      {/* One-tap common options */}
      {openSuggestions.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {openSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-surface-border bg-white px-2.5 py-1 text-xs font-medium text-ink-soft transition hover:border-vibe-violet/50 hover:text-vibe-violet"
            >
              <Plus size={11} /> {s}
            </button>
          ))}
        </div>
      )}

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
  uploading,
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
  uploading?: boolean;
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

      {uploading ? (
        <div className="flex h-56 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-surface-border bg-cream-200/50">
          <Loader2 size={20} className="animate-spin text-vibe-violet" />
          <span className="text-xs font-semibold text-ink-faint">Uploading...</span>
        </div>
      ) : image ? (
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
      {!image && !uploading && <p className="mt-2 text-xs text-ink-faint">No {label.toLowerCase()} selected yet</p>}
    </div>
  );
}

function PackageStep({ draft, update, audience }: StepProps & { audience: Audience }) {
  const posterInput = useRef<HTMLInputElement>(null);
  const bannerInput = useRef<HTMLInputElement>(null);
  const bulkInput = useRef<HTMLInputElement>(null);
  const [uploadingSlots, setUploadingSlots] = useState<Set<number>>(new Set());
  const [bulkUploading, setBulkUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function appendFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setBulkUploading(true);
    try {
      const results = await Promise.all(Array.from(files).map((f) => uploadImage(audience, f)));
      const startIndex = draft.images.length;
      const newImages: ListingImage[] = results.map((r, i) => ({
        id: `img-${Date.now()}-${i}`,
        url: r.url,
        label: startIndex + i === 0 ? "Poster" : startIndex + i === 1 ? "Banner" : `Photo ${startIndex + i + 1}`,
      }));
      update("images", [...draft.images, ...newImages]);
    } catch (err) {
      setError(err instanceof ApiError ? err.describe() : "Upload failed");
    } finally {
      setBulkUploading(false);
    }
  }

  async function replaceAt(index: number, file: File | undefined) {
    if (!file) return;
    setError(null);
    setUploadingSlots((prev) => new Set(prev).add(index));
    try {
      const result = await uploadImage(audience, file);
      const images = [...draft.images];
      while (images.length <= index) {
        images.push({
          id: `img-${Date.now()}-${images.length}`,
          url: "",
          label: images.length === 0 ? "Poster" : images.length === 1 ? "Banner" : `Photo ${images.length + 1}`,
        });
      }
      images[index] = { ...images[index], url: result.url };
      update("images", images);
    } catch (err) {
      setError(err instanceof ApiError ? err.describe() : "Upload failed");
    } finally {
      setUploadingSlots((prev) => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }
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
        {draft.images.length} of 10 uploaded — poster shows on listing cards, banner + gallery photos become the scrolling carousel on the detail page
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-vibe-coral">{error}</div>
      )}



      <div className="grid gap-5 sm:grid-cols-2">
        <PhotoBox
          label="Poster"
          tag="FIRST"
          dims="1080 x 1350 px"
          hint="Aspect Ratio: 4:5 · Best for reach & screen coverage"
          image={poster}
          uploading={uploadingSlots.has(0)}
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
          uploading={uploadingSlots.has(1)}
          inputRef={bannerInput}
          onFile={(f) => replaceAt(1, f)}
          onRemove={banner ? () => removeAt(1) : undefined}
          outputNote="Output: Auto-optimized to 1200×630 WEBP. Portrait uploads keep a blurred background frame."
        />
      </div>

      <div className="mt-6">
        <p className="mb-1 text-sm font-semibold text-ink">Gallery photos</p>
        <p className="mb-3 text-xs text-ink-faint">
          Shown as a scrolling banner on the listing&apos;s detail page — add 2 to 4 for the best carousel.
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
          disabled={bulkUploading || draft.images.length >= 10}
          className="inline-flex items-center gap-2 rounded-lg border border-dashed border-surface-border bg-cream-200/50 px-4 py-2.5 text-xs font-semibold text-ink transition-colors hover:bg-cream-200 disabled:opacity-50"
        >
          {bulkUploading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <Upload size={14} /> Add gallery photos
            </>
          )}
        </button>
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
/*  STEP 3 — DETAILS                                                   */
/* ------------------------------------------------------------------ */

/** Shared fallback for any sport we don't have artwork for — the brand splash. */
const SPORT_FALLBACK_IMAGE = "/splash.jpeg";

function CategoryPhoto({ cat }: { cat: SportCategory }) {
  const { url } = usePexelsImage(`${cat.label} sport court`);
  const [errored, setErrored] = useState(false);
  const preferred = url ?? cat.image;
  const src = errored || !preferred ? SPORT_FALLBACK_IMAGE : preferred;
  return (
    <img
      src={src}
      alt={cat.label}
      onError={() => setErrored(true)}
      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
    />
  );
}

function SubCategoryPhoto({ sub }: { sub: { id: string; label: string } }) {
  const { url } = usePexelsImage(`${sub.label} sport`);
  const [errored, setErrored] = useState(false);
  const src = errored || !url ? SPORT_FALLBACK_IMAGE : url;
  return (
    <img
      src={src}
      alt={sub.label}
      onError={() => setErrored(true)}
      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
    />
  );
}

function DetailsStep({ draft, update }: StepProps) {
  const gameVenue: VenueSetting = draft.gameVenue ?? "both";
  const categoryOptions = draft.type === "Game" ? venueOptionsFor(gameVenue) : SPORT_CATEGORIES;

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1 text-[11px] font-semibold tracking-wider text-ink-faint uppercase">Basic info</p>
        <p className="text-xs text-ink-faint">Name this listing, then set its type &amp; category.</p>
      </div>

      <div>
        <FieldLabel>Listing name *</FieldLabel>
        <input
          value={draft.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="e.g. BABA Turf & Sports Arena"
          className={inputClass}
        />
        <p className="mt-1.5 text-[11px] text-ink-faint">
          Pre-filled from your business profile — edit it if this venue has its own name.
        </p>
      </div>

      {draft.type !== "Event" && (
        <div>
          <FieldLabel>Listing type *</FieldLabel>
          <ToggleGroup
            value={draft.type as "Turf" | "Game"}
            options={[
              { value: "Turf", label: "Turf" },
              { value: "Game", label: "Game" },
            ]}
            onChange={(v) => update("type", v)}
          />
        </div>
      )}

      {draft.type === "Game" && (
        <div>
          <FieldLabel>Indoor / Outdoor *</FieldLabel>
          <ToggleGroup
            value={gameVenue}
            options={[
              { value: "indoor", label: "Indoor" },
              { value: "outdoor", label: "Outdoor" },
              { value: "both", label: "Both" },
            ]}
            onChange={(v) => update("gameVenue", v)}
          />
          <p className="mt-1.5 text-[11px] text-ink-faint">
            Choose Indoor to only show indoor games, Outdoor for outdoor-only, or Both for the full list.
          </p>
        </div>
      )}

      <div>
        <FieldLabel>Category * (select all that apply)</FieldLabel>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {categoryOptions.map((cat) => {
            const isSelected = draft.categories.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  const next = isSelected
                    ? draft.categories.filter((c) => c !== cat.id)
                    : [...draft.categories, cat.id];
                  update("categories", next);
                  const validSubIds = new Set(subCategoriesForCategories(next).map((s) => s.id));
                  update("subCategories", draft.subCategories.filter((s) => validSubIds.has(s)));
                }}
                className={`group relative aspect-[4/3] overflow-hidden rounded-2xl border-2 text-left shadow-sm transition ${
                  isSelected ? "border-vibe-violet ring-2 ring-vibe-violet/30" : "border-surface-border hover:border-vibe-violet/50"
                }`}
              >
                <div className="h-full w-full bg-cream-300">
                  <CategoryPhoto cat={cat} />
                </div>
                {/* Scrim keeps the label readable over any photo, incl. the splash fallback */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                {isSelected && <div className="pointer-events-none absolute inset-0 bg-vibe-violet/25" />}
                <span className="absolute inset-x-0 bottom-0 px-2.5 py-2 text-sm font-bold text-white drop-shadow-sm">
                  {cat.label}
                </span>
                {isSelected && (
                  <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-vibe-violet text-white shadow">
                    <Check size={12} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {draft.categories.length > 0 && (
        <div>
          <FieldLabel>Sub-Category (select all that apply)</FieldLabel>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {subCategoriesForCategories(draft.categories).map((sub) => {
              const isSelected = draft.subCategories.includes(sub.id);
              return (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() =>
                    update(
                      "subCategories",
                      isSelected
                        ? draft.subCategories.filter((s) => s !== sub.id)
                        : [...draft.subCategories, sub.id]
                    )
                  }
                  className={`group relative aspect-[4/3] overflow-hidden rounded-2xl border-2 text-left shadow-sm transition ${
                    isSelected ? "border-vibe-lime ring-2 ring-vibe-lime/40" : "border-surface-border hover:border-vibe-lime/50"
                  }`}
                >
                  <div className="h-full w-full bg-cream-300">
                    <SubCategoryPhoto sub={sub} />
                  </div>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  {isSelected && <div className="pointer-events-none absolute inset-0 bg-vibe-lime/25" />}
                  <span className={`absolute inset-x-0 bottom-0 px-2.5 py-2 text-xs font-bold drop-shadow-sm ${isSelected ? "text-white" : "text-white"}`}>
                    {sub.label}
                  </span>
                  {isSelected && (
                    <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-vibe-lime text-vibe-indigo shadow">
                      <Check size={12} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STEP 4 — LOCATION                                                  */
/* ------------------------------------------------------------------ */

function LocationStep({ draft, update }: StepProps) {
  const [venueInput, setVenueInput] = useState(draft.address || "");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [coords, setCoords] = useState<{ lat: string; lon: string } | null>(null);
  const [cityInput, setCityInput] = useState("");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);

  /** Fill address / city / state from the device's GPS — the Zomato/Instamart "use current location" flow. */
  function useCurrentLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocError("Your browser doesn't support location access.");
      return;
    }
    setLocError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setCoords({ lat: String(latitude), lon: String(longitude) });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            { headers: { "Accept-Language": "en" }, referrerPolicy: "origin" }
          );
          const data = await res.json();
          if (data?.display_name) {
            update("address", data.display_name);
            setVenueInput(data.display_name);
          }
          const addr = data?.address;
          if (addr) {
            if (addr.state) update("state", addr.state);
            const cityName = addr.city || addr.town || addr.village || addr.suburb || addr.county;
            if (cityName) {
              if (draft.cityMode === "multiple") {
                if (!(draft.cities ?? []).includes(cityName)) update("cities", [...(draft.cities ?? []), cityName]);
              } else {
                update("city", cityName);
              }
            }
          }
        } catch {
          // We still have the pin + coordinates even if the address lookup fails.
          setLocError("Pinned your location, but couldn't fetch the full address — type it in if needed.");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Allow location access in your browser to use this."
            : "Couldn't get your location. Please try again."
        );
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  }

  // Nominatim Autocomplete debounced search
  useEffect(() => {
    if (venueInput.length < 3) {
      setSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      setLoadingSuggestions(true);
      const countryCodes: Record<string, string> = {
        "India": "in",
        "Sri Lanka": "lk",
        "Nepal": "np",
        "UAE": "ae",
      };
      const cc = countryCodes[draft.country ?? "India"] || "in";

      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(venueInput)}&countrycodes=${cc}&limit=5&addressdetails=1`, {
        // Nominatim requires a Referer or identifying User-Agent to accept a request;
        // some browsers/extensions drop Referer on cross-origin fetches by default,
        // causing a silent 403 — force it via referrerPolicy.
        headers: { "Accept-Language": "en" },
        referrerPolicy: "origin",
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSuggestions(data);
          }
        })
        .catch((err) => console.error(err))
        .finally(() => setLoadingSuggestions(false));
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [venueInput]);

  function handleSelectSuggestion(item: any) {
    const address = item.display_name;
    const lat = item.lat;
    const lon = item.lon;

    update("address", address);
    setVenueInput(address);
    setCoords({ lat, lon });
    setSuggestions([]);

    const addr = item.address;
    if (addr) {
      if (addr.state) {
        update("state", addr.state);
      }
      if (addr.city || addr.town || addr.village || addr.suburb) {
        const cityName = addr.city || addr.town || addr.village || addr.suburb;
        if (draft.cityMode === "multiple") {
          update("cities", [cityName]);
        } else {
          update("city", cityName);
        }
      }
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

  const mapEmbedUrl = coords
    ? `https://maps.google.com/maps?q=${coords.lat},${coords.lon}&t=&z=16&ie=UTF8&iwloc=&output=embed`
    : draft.address
    ? `https://maps.google.com/maps?q=${encodeURIComponent(draft.address)}&t=&z=16&ie=UTF8&iwloc=&output=embed`
    : null;

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1 text-[11px] font-semibold tracking-wider text-ink-faint uppercase">Venue location</p>
        <p className="text-xs text-ink-faint">Search for your venue to auto-fill coordinates, state, and city.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative">
          <FieldLabel>Destination venue *</FieldLabel>
          <div className="relative">
            <input
              value={venueInput}
              onChange={(e) => setVenueInput(e.target.value)}
              placeholder="Search venue (e.g. Urban Square Mall, Udaipur...)"
              className={inputClass}
            />
            {loadingSuggestions && (
              <span className="absolute right-3 top-3 text-[10px] text-ink-faint font-bold animate-pulse">Searching...</span>
            )}
          </div>

          {/* Autocomplete Dropdown List */}
          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 z-20 mt-1 rounded-xl border border-slate-200 bg-white shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(item)}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition leading-tight"
                >
                  {item.display_name}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-vibe-violet/30 bg-vibe-violet/5 px-3 py-2 text-xs font-bold text-vibe-violet transition hover:bg-vibe-violet/10 disabled:opacity-60"
          >
            {locating ? <Loader2 size={13} className="animate-spin" /> : <LocateFixed size={13} />}
            {locating ? "Getting your location…" : "Use my current location"}
          </button>
          {locError && <p className="mt-1.5 text-[11px] font-semibold text-vibe-coral">{locError}</p>}

          <p className="mt-1.5 text-[11px] text-ink-faint">
            Start typing to view places suggestions, or use your current location. Selecting a suggestion autofills the coordinates, state, and city.
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
              Choose city for the main destination details.
            </p>
          </div>
        </div>

        {/* Live Interactive Map Preview */}
        <div className="rounded-xl border border-surface-border bg-cream-200/40 p-4 flex flex-col min-h-[350px]">
          <div className="mb-3">
            <p className="text-[11px] font-semibold tracking-wider text-ink-faint uppercase">Live map preview</p>
            {coords && (
              <p className="text-[10px] text-vibe-violet font-extrabold mt-1">
                📍 Lat: {Number(coords.lat).toFixed(6)} · Lng: {Number(coords.lon).toFixed(6)}
              </p>
            )}
          </div>

          <div className="flex-1 w-full rounded-xl overflow-hidden min-h-[220px] bg-cream-300 relative border border-slate-200">
            {mapEmbedUrl ? (
              <iframe
                key={mapEmbedUrl}
                title="Live Map Preview"
                src={mapEmbedUrl}
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-xs text-ink-faint p-4 text-center">
                <span>No venue selected yet.</span>
                <span className="text-[10px] mt-1">Start typing a venue name on the left to load map preview.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STEP 2 — SLOTS / BOOKING                                           */
/* ------------------------------------------------------------------ */

const BOOKING_TYPES: { value: BookingType; label: string; hint: string }[] = [
  { value: "Recurring", label: "Recurring", hint: "Customer picks any date" },
  { value: "Trips", label: "Trips", hint: "Date range booking" },
  { value: "Courses", label: "Courses", hint: "Fixed start and end dates" },
];

const TIME_OPTIONS = [
  { value: "00:00", label: "12:00 AM" },
  { value: "01:00", label: "01:00 AM" },
  { value: "02:00", label: "02:00 AM" },
  { value: "03:00", label: "03:00 AM" },
  { value: "04:00", label: "04:00 AM" },
  { value: "05:00", label: "05:00 AM" },
  { value: "06:00", label: "06:00 AM" },
  { value: "07:00", label: "07:00 AM" },
  { value: "08:00", label: "08:00 AM" },
  { value: "09:00", label: "09:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "13:00", label: "01:00 PM" },
  { value: "14:00", label: "02:00 PM" },
  { value: "15:00", label: "03:00 PM" },
  { value: "16:00", label: "04:00 PM" },
  { value: "17:00", label: "05:00 PM" },
  { value: "18:00", label: "06:00 PM" },
  { value: "19:00", label: "07:00 PM" },
  { value: "20:00", label: "08:00 PM" },
  { value: "21:00", label: "09:00 PM" },
  { value: "22:00", label: "10:00 PM" },
  { value: "23:00", label: "11:00 PM" },
];

/** "Closes At" choices: same hours minus 00:00 (a venue can't close when the day starts), plus 24:00 so the last slot can run until midnight. */
const END_TIME_OPTIONS = [...TIME_OPTIONS.slice(1), { value: "24:00", label: "12:00 AM" }];

/* ─── Indian Festival / Holiday lookup ──────────────────────────── */
export const INDIAN_HOLIDAYS: Record<string, string> = {
  "2026-01-01": "New Year's Day",
  "2026-01-02": "Guru Gobind Singh Jayanti",
  "2026-01-14": "Makar Sankranti",
  "2026-01-26": "Republic Day",
  "2026-02-15": "Maha Shivaratri",
  "2026-03-17": "Holi",
  "2026-03-20": "Eid al-Fitr",
  "2026-04-01": "Mahavir Jayanti",
  "2026-04-02": "Ram Navami",
  "2026-04-03": "Good Friday",
  "2026-04-14": "Ambedkar Jayanti",
  "2026-05-01": "Labour Day",
  "2026-05-12": "Buddha Purnima",
  "2026-05-27": "Eid al-Adha",
  "2026-06-26": "Muharram",
  "2026-08-15": "Independence Day",
  "2026-08-19": "Janmashtami",
  "2026-08-26": "Milad un-Nabi",
  "2026-08-28": "Raksha Bandhan",
  "2026-09-14": "Ganesh Chaturthi",
  "2026-10-02": "Gandhi Jayanti",
  "2026-10-20": "Dussehra",
  "2026-11-01": "Diwali",
  "2026-11-05": "Bhai Dooj",
  "2026-11-24": "Guru Nanak Jayanti",
  "2026-12-25": "Christmas",
  "2026-12-31": "New Year Eve",
};

function BookingStep({ draft, update }: StepProps) {
  const [slotPrice, setSlotPrice] = useState(1000);
  const [bulkDuration, setBulkDuration] = useState("60");
  const [bulkStartTime, setBulkStartTime] = useState("06:00");
  const [bulkEndTime, setBulkEndTime] = useState("22:00");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [cardSize, setCardSize] = useState<"S" | "M" | "L">("M");

  const isDailyRoutine = draft.dailyRoutine ?? true;
  const [selectedDate, setSelectedDate] = useState("");
  const [isHoliday, setIsHoliday] = useState(false);
  const [holidayName, setHolidayName] = useState("");

  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };
  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
    const lastDay = new Date(calYear, calMonth + 1, 0).getDate();
    const days = [];

    // empty slots for padding
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    // actual days of the month
    for (let i = 1; i <= lastDay; i++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      const festival = INDIAN_HOLIDAYS[dateStr] || null;
      const isSunday = (firstDayIndex + i - 1) % 7 === 0;
      days.push({ dayNumber: i, dateStr, festival, isSunday });
    }
    return days;
  }, [calYear, calMonth]);

  // Tooltip helper detailing configured/available slots
  function getTooltipText(dateStr: string) {
    const dayOverride = (draft.dateOverrides ?? []).find((o) => o.date === dateStr);
    const isHolidayCell = dayOverride?.isHoliday;
    const slots = dayOverride ? (dayOverride.slots ?? []) : (draft.slotsList ?? []);
    const typeLabel = dayOverride 
      ? isHolidayCell ? "Closed / Holiday" : "Custom Override Slots" 
      : "Default Slots (Daily Routine)";
    
    let text = `${dateStr}\n---------------------\nType: ${typeLabel}\nTotal Slots: ${slots.length}\n`;
    if (isHolidayCell) {
      text += `Reason: ${dayOverride?.holidayName || "Holiday"}\n`;
    } else if (slots.length > 0) {
      text += `\nSlots List:\n${slots.map(s => `• ${to12h(s.startTime)} - ${to12h(s.endTime)}`).join("\n")}`;
    } else {
      text += "\nNo slots configured.";
    }
    return text;
  }

  const festivalToday = INDIAN_HOLIDAYS[selectedDate] || "";

  /* derive the active slot list (daily or date-specific override fallback to daily) */
  const dailySlots: TurfSlot[] = draft.slotsList ?? [];
  const override = (draft.dateOverrides ?? []).find((o) => o.date === selectedDate);
  const activeSlots: TurfSlot[] = isDailyRoutine
    ? dailySlots
    : selectedDate
    ? override
      ? override.slots ?? []
      : dailySlots // starts with copy of default slots for easier customization
    : [];

  /* helpers */
  function t24m(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
  function m2t(m: number) { return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; }
  function to12h(t: string) {
    if (!t) return "";
    const [hS, mS] = t.split(":");
    let h = Number(hS) % 24; // "24:00" (midnight close) → 12:00 AM
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${String(h).padStart(2, "0")}:${mS} ${ap}`;
  }
  function dayPart(mins: number) {
    const h = Math.floor(mins / 60) % 24;
    if (h >= 5 && h < 12) return "Morning";
    if (h >= 12 && h < 17) return "Afternoon";
    if (h >= 17 && h < 21) return "Evening";
    return "Night";
  }
  function fmtDur(mins: number) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}hr${h > 1 ? "s" : ""}`;
    return `${h}h ${m}m`;
  }

  /* persist slots into draft */
  function save(nextSlots: TurfSlot[]) {
    if (isDailyRoutine && !selectedDate) {
      update("slotsList", nextSlots);
      update("slotsPerDay", nextSlots.length);
    } else {
      if (!selectedDate) return;
      const existing = draft.dateOverrides ?? [];
      const idx = existing.findIndex((o) => o.date === selectedDate);
      const entry = { date: selectedDate, isHoliday, holidayName, slots: nextSlots };
      if (idx > -1) {
        const next = [...existing]; next[idx] = { ...next[idx], slots: nextSlots };
        update("dateOverrides", next);
      } else {
        update("dateOverrides", [...existing, entry]);
      }
      // `slotsPerDay` is a required summary stat on the backend. When the vendor only ever
      // configures date-specific slots (never touches the Global Default), it would otherwise
      // stay stuck at 0 and fail listing creation — so keep it in sync with whatever slots exist.
      if (dailySlots.length === 0 && nextSlots.length > 0) {
        update("slotsPerDay", nextSlots.length);
      }
    }
  }

  function generateBulkSlots() {
    if (!isDailyRoutine && !selectedDate) { alert("Please select a date first."); return; }
    const dur = parseInt(bulkDuration);
    const newSlots: TurfSlot[] = [];
    let cur = t24m(bulkStartTime);
    const end = t24m(bulkEndTime);
    while (cur + dur <= end) {
      newSlots.push({ startTime: m2t(cur), endTime: m2t(cur + dur), label: dayPart(cur), price: 0 });
      cur += dur;
    }
    save(newSlots);
  }

  function deleteSlot(i: number) { save(activeSlots.filter((_, idx) => idx !== i)); }
  function updateSlotPrice(i: number, price: number) { save(activeSlots.map((s, idx) => idx === i ? { ...s, price } : s)); }

  /* clock click — toggle a slot at that hour using current duration */
  const handleSelectHour = (hour: number) => {
    if (!isDailyRoutine && !selectedDate) { alert("Please select a date first."); return; }
    const startStr = m2t(hour * 60);
    const dur = parseInt(bulkDuration);
    const endStr = m2t(hour * 60 + dur);
    const existIdx = activeSlots.findIndex((s) => s.startTime === startStr);
    if (existIdx > -1) {
      deleteSlot(existIdx);
    } else {
      save([...activeSlots, { startTime: startStr, endTime: endStr, label: dayPart(hour * 60), price: 0 }]);
    }
  };

  /* save holiday flag for a date */
  function saveHoliday() {
    if (!selectedDate) return;
    const existing = draft.dateOverrides ?? [];
    const idx = existing.findIndex((o) => o.date === selectedDate);
    if (idx > -1) {
      const next = [...existing]; next[idx] = { ...next[idx], isHoliday, holidayName };
      update("dateOverrides", next);
    } else {
      update("dateOverrides", [...existing, { date: selectedDate, isHoliday, holidayName, slots: [] }]);
    }
  }

  const selectedOverrideDate = selectedDate;

  if (draft.type === "Event") {
    return (
      <div>
        <div className="mb-5">
          <p className="mb-1 text-[11px] font-semibold tracking-wider text-ink-faint uppercase">Booking setup</p>
          <p className="text-xs text-ink-faint">How customers will book this package</p>
        </div>
        <div className="mb-5 grid gap-5 sm:grid-cols-2">
          <div><FieldLabel>Starting Point</FieldLabel><input value={draft.startingPoint ?? ""} onChange={(e) => update("startingPoint", e.target.value)} className={inputClass} /></div>
          <div><FieldLabel>Ending Point</FieldLabel><input value={draft.endingPoint ?? ""} onChange={(e) => update("endingPoint", e.target.value)} className={inputClass} /></div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════
     TURF — Step 3: Slot Configuration  (professional rebuild)
  ════════════════════════════════════════════════════════════════ */
  const clockSlots = activeSlots.map((s) => ({ ...s, status: "Available" as const }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">

      {/* ── LEFT PANEL ─────────────────────────────────────── */}
      <div className="flex flex-col gap-5">
        {/* ── MONTHLY CALENDAR SELECTOR ── */}
        <div className="rounded-2xl border-2 border-surface-border bg-white p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Select Calendar Date</p>
              <p className="text-[10px] text-ink-faint">Click a date to edit its timings. Hover for summary.</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Reset to global default button */}
              {selectedDate && (
                <button 
                  type="button" 
                  onClick={() => {
                    setSelectedDate("");
                    update("dailyRoutine", true);
                  }} 
                  className="text-[10px] font-bold text-slate-500 hover:text-vibe-violet bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition"
                >
                  ⚙️ Edit Global Default
                </button>
              )}
              <div className="flex items-center gap-2">
                <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                  <ChevronLeft size={14} />
                </button>
                <span className="text-xs font-extrabold text-slate-700 min-w-[100px] text-center uppercase tracking-wide">
                  {new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
                <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

            {/* Weekdays row */}
            <div className="grid grid-cols-7 gap-1.5 mb-2 text-center text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => <div key={d}>{d}</div>)}
            </div>

            {/* Calendar grid cells */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={idx} className="bg-slate-50/20 rounded-lg min-h-[60px]" />;

                const isSel = selectedDate === day.dateStr;
                const hasOvr = (draft.dateOverrides ?? []).some((o) => o.date === day.dateStr);
                const dayOverride = (draft.dateOverrides ?? []).find((o) => o.date === day.dateStr);
                const isHolidayCell = dayOverride?.isHoliday;

                return (
                  <button
                    key={idx}
                    type="button"
                    title={getTooltipText(day.dateStr)}
                    onClick={() => {
                      setSelectedDate(day.dateStr);
                      setIsHoliday(dayOverride?.isHoliday ?? false);
                      setHolidayName(dayOverride?.holidayName ?? day.festival ?? "");
                      update("dailyRoutine", false);
                    }}
                    className={`flex flex-col justify-between items-start rounded-xl p-2 min-h-[75px] border text-left transition ${
                      isSel 
                        ? "border-slate-900 bg-slate-900 text-white shadow-md font-extrabold" 
                        : isHolidayCell
                        ? "border-rose-300 bg-rose-50 hover:bg-rose-100"
                        : hasOvr
                        ? "border-emerald-200 bg-emerald-50/30 hover:border-emerald-300"
                        : day.festival
                        ? "border-rose-100 bg-rose-50/30 hover:border-rose-200 text-rose-900"
                        : day.isSunday
                        ? "border-amber-200 bg-amber-50/40 hover:border-amber-300 text-amber-900"
                        : "border-slate-100 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={`text-xs font-extrabold ${isSel ? "text-white" : "text-slate-800"}`}>
                        {day.dayNumber}
                      </span>
                      {hasOvr && !isSel && (
                        <span className={`w-2 h-2 rounded-full ${isHolidayCell ? "bg-rose-500" : "bg-emerald-500 animate-pulse"}`} />
                      )}
                    </div>
                    
                    {/* Small text indicator & Festival name */}
                    <div className="w-full mt-2 flex flex-col gap-0.5">
                      {day.festival && !isSel && (
                        <span className="text-[7px] truncate font-bold text-rose-500 bg-rose-100/50 px-1 py-0.5 rounded uppercase leading-none">
                          {day.festival}
                        </span>
                      )}
                      {!day.festival && day.isSunday && !isSel && (
                        <span className="text-[7px] truncate font-bold text-amber-600 bg-amber-100/60 px-1 py-0.5 rounded uppercase leading-none">
                          Sunday
                        </span>
                      )}
                      <span className="text-[8px] truncate uppercase font-semibold leading-tight tracking-tight">
                        {isHolidayCell 
                          ? "🚫 Closed" 
                          : hasOvr 
                          ? `✨ Custom` 
                          : "⚙️ Default"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected override holiday / reset controls */}
            {selectedDate && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isHoliday}
                      onChange={(e) => {
                        setIsHoliday(e.target.checked);
                        if (!e.target.checked) setHolidayName("");
                      }}
                      className="w-4 h-4 rounded border-slate-300 accent-vibe-violet focus:ring-0"
                    />
                    <span className="text-xs font-bold text-slate-700">Mark {selectedDate} as Holiday/Closed</span>
                  </label>
                  {isHoliday && (
                    <input
                      type="text"
                      placeholder="e.g. Diwali, Maintenance..."
                      value={holidayName}
                      onChange={(e) => setHolidayName(e.target.value)}
                      className={`${inputClass} text-xs py-1.5 w-48`}
                    />
                  )}
                  {isHoliday && (
                    <button type="button" onClick={saveHoliday} className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[10px] font-bold uppercase transition">Save Holiday</button>
                  )}
                </div>

                {override && (
                  <button
                    type="button"
                    onClick={() => {
                      update("dateOverrides", (draft.dateOverrides ?? []).filter((o) => o.date !== selectedDate));
                      setIsHoliday(false);
                      setHolidayName("");
                    }}
                    className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-2 rounded-lg font-bold uppercase transition"
                  >
                    🗑️ Reset to Default Slots
                  </button>
                )}
              </div>
            )}
          </div>

        {/* ── SLOT GENERATOR ── */}
        {(!selectedDate || (selectedDate && !isHoliday)) && (
          <div className="rounded-2xl border-2 border-surface-border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {!selectedDate ? "⚙️ Configuration: Global Default Slots" : `📅 Editing: Slots for ${selectedDate}`}
                </p>
              </div>

              {selectedDate && (
                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm hover:bg-slate-100 transition">
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={(e) => {
                      if (e.target.checked) {
                        update("slotsList", activeSlots);
                        update("slotsPerDay", activeSlots.length);
                        update("dailyRoutine", true);
                        setSelectedDate("");
                        alert("🎉 Current slots have been saved as the Global Default layout!");
                      }
                    }}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-0 accent-emerald-500"
                  />
                  <span className="text-xs font-extrabold text-slate-700">Set as Global Default</span>
                </label>
              )}
            </div>

            <p className="text-[11px] font-bold text-ink uppercase tracking-wide mb-3 border-t border-slate-100 pt-3">
              Slot Generator
            </p>

            {/* Duration slider */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-semibold text-ink-faint uppercase tracking-wide">Slot Duration</p>
                <span className="text-sm font-extrabold text-vibe-violet bg-vibe-violet/10 px-2 py-0.5 rounded-lg">{fmtDur(parseInt(bulkDuration))}</span>
              </div>
              <input type="range" min="15" max="180" step="15" value={bulkDuration} onChange={(e) => setBulkDuration(e.target.value)} className="w-full h-2 accent-vibe-violet cursor-pointer" />
            </div>

            {/* Opens At Hour Cards */}
            <div className="mb-4">
              <FieldLabel>Opens At *</FieldLabel>
              <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto border border-slate-100 rounded-lg p-2 bg-slate-50/50">
                {TIME_OPTIONS.map((t) => {
                  const isSelected = bulkStartTime === t.value;
                  return (
                    <button key={t.value} type="button" onClick={() => setBulkStartTime(t.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${isSelected ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Closes At Hour Cards */}
            <div className="mb-4">
              <FieldLabel>Closes At *</FieldLabel>
              <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto border border-slate-100 rounded-lg p-2 bg-slate-50/50">
                {END_TIME_OPTIONS.map((t) => {
                  const isSelected = bulkEndTime === t.value;
                  return (
                    <button key={t.value} type="button" onClick={() => setBulkEndTime(t.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${isSelected ? "bg-slate-900 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end">
              <button type="button" onClick={generateBulkSlots}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-vibe-violet px-6 py-2.5 text-xs font-bold text-white hover:opacity-90 transition">
                <Plus size={13} /> Generate Slots
              </button>
            </div>
            <p className="text-[10px] text-ink-faint mt-3">💡 You can also click any hour on the clock dial to the right to toggle that slot individually.</p>
          </div>
        )}

        {/* ── SLOT LIST TABLE & DYNAMIC GRID ─────────────────── */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-[11px] font-bold text-ink uppercase tracking-wider">
                {!selectedDate ? `Global Default Slots (${activeSlots.length})` : `Slots for ${selectedDate} (${activeSlots.length})`}
              </p>
              {selectedDate && (draft.dateOverrides ?? []).some((o) => o.date === selectedDate) && (
                <button type="button" onClick={() => { update("dateOverrides", (draft.dateOverrides ?? []).filter((o) => o.date !== selectedDate)); setSelectedDate(""); }}
                  className="text-[10px] text-vibe-coral font-bold uppercase hover:underline">Clear Override</button>
              )}
            </div>

            {activeSlots.length > 0 && (
              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <button type="button" onClick={() => setViewMode("grid")} className={`flex items-center justify-center p-1.5 transition ${viewMode === "grid" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600"}`}>
                    <LayoutGrid size={13} />
                  </button>
                  <button type="button" onClick={() => setViewMode("list")} className={`flex items-center justify-center p-1.5 transition ${viewMode === "list" ? "bg-slate-900 text-white" : "text-slate-400 hover:text-slate-600"}`}>
                    <List size={13} />
                  </button>
                </div>

                {/* Size Toggle (only in Grid mode) */}
                {viewMode === "grid" && (
                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                    {(["S", "M", "L"] as const).map((sz) => (
                      <button key={sz} type="button" onClick={() => setCardSize(sz)} className={`px-2 py-1 text-[10px] font-bold transition ${cardSize === sz ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-700 bg-white"}`}>
                        {sz}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {activeSlots.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center bg-white">
              <Clock3 size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs text-ink-faint font-medium">
                {!selectedDate
                  ? "No global default slots configured yet."
                  : "No slots configured yet — use the generator or clock dial."}
              </p>
            </div>
            ) : viewMode === "list" ? (
              <div className="rounded-xl border border-surface-border bg-white shadow-sm overflow-hidden max-h-[320px] overflow-y-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="sticky top-0 bg-slate-50 z-10">
                    <tr className="border-b border-surface-border text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-3 py-2.5">#</th>
                      <th className="px-3 py-2.5">Time Range</th>
                      <th className="px-3 py-2.5">Dur.</th>
                      <th className="px-3 py-2.5">Label</th>
                      <th className="px-3 py-2.5 w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {activeSlots.map((slot, i) => {
                      const durMins = t24m(slot.endTime) - t24m(slot.startTime);
                      const labelColor = slot.label === "Morning" ? "bg-amber-100 text-amber-700" : slot.label === "Afternoon" ? "bg-sky-100 text-sky-700" : slot.label === "Evening" ? "bg-orange-100 text-orange-700" : "bg-indigo-100 text-indigo-700";
                      return (
                        <tr key={i} className="border-b border-surface-border last:border-0 hover:bg-cream-200/30 group">
                          <td className="px-3 py-2 text-slate-400 font-semibold">{i + 1}</td>
                          <td className="px-3 py-2 font-bold text-slate-800">{to12h(slot.startTime)} – {to12h(slot.endTime)}</td>
                          <td className="px-3 py-2 text-slate-500">{fmtDur(durMins)}</td>
                          <td className="px-3 py-2"><span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${labelColor}`}>{slot.label}</span></td>
                          <td className="px-3 py-2 text-right">
                            <button type="button" onClick={() => deleteSlot(i)} className="opacity-0 group-hover:opacity-100 p-1 text-ink-faint hover:text-vibe-coral transition">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* GRID VIEW CATEGORIZED BY DAY PARTS */
              <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                {(["Morning", "Afternoon", "Evening", "Night", "Mid Night"] as const).map((part) => {
                  const partSlots = activeSlots
                    .map((s, idx) => ({ ...s, originalIndex: idx }))
                    .filter((s) => s.label === part);

                  if (partSlots.length === 0) return null;

                  const sizeH = cardSize === "S" ? "h-20" : cardSize === "M" ? "h-24" : "h-28";
                  const gridCols = cardSize === "S" ? "grid-cols-4 sm:grid-cols-5" : cardSize === "M" ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3";

                  return (
                    <div key={part} className="border-b border-slate-100 pb-3 last:border-0">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{part}</p>
                      <div className={`grid ${gridCols} gap-2`}>
                        {partSlots.map((slot) => {
                          return (
                            <div key={slot.originalIndex} className={`flex flex-col items-center justify-center p-2 rounded-xl border border-slate-200 bg-white relative hover:shadow transition-shadow group ${sizeH}`}>
                              <span className="text-xs font-bold text-slate-700 font-mono">
                                {slot.startTime} - {slot.endTime}
                              </span>
                              <span className="text-[9px] text-slate-400 uppercase mt-1">
                                {slot.label}
                              </span>

                              <button type="button" onClick={() => deleteSlot(slot.originalIndex)}
                                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-vibe-coral transition">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
      </div>

      {/* ── RIGHT PANEL: CLOCK ─────────────────────────────── */}
      <div className="flex flex-col items-center gap-4 lg:border-l lg:border-surface-border lg:pl-6">
        <div className="w-full">
          <p className="text-[11px] font-bold text-ink uppercase tracking-wider mb-0.5 text-center">24-Hour Dial</p>
          <p className="text-[10px] text-ink-faint text-center mb-3">Click an hour to toggle · Duration controls slot length</p>
          <ClockSlotsWidget slots={clockSlots} onSelectHour={handleSelectHour} />
        </div>

        {activeSlots.length > 0 && (
          <div className="w-full rounded-2xl bg-slate-900 p-4 text-white">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Summary</p>
            <div className="grid grid-cols-2 gap-3">
              <div><p className="text-[10px] text-slate-400">Total Slots</p><p className="text-2xl font-extrabold">{activeSlots.length}</p></div>
              <div><p className="text-[10px] text-slate-400">Avg Price</p><p className="text-2xl font-extrabold">₹{Math.round(activeSlots.reduce((a, s) => a + s.price, 0) / activeSlots.length).toLocaleString()}</p></div>
              <div><p className="text-[10px] text-slate-400">Opens</p><p className="text-sm font-bold">{to12h(activeSlots[0]?.startTime)}</p></div>
              <div><p className="text-[10px] text-slate-400">Closes</p><p className="text-sm font-bold">{to12h(activeSlots[activeSlots.length - 1]?.endTime)}</p></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  STEP 5 — PRICING                                                   */
/* ------------------------------------------------------------------ */

const DAY_PART_QUERIES: Record<string, string> = {
  Morning: "sunrise sports court",
  Afternoon: "bright sunny sports field",
  Evening: "sunset sports field",
  Night: "stadium lights night",
  "Mid Night": "night sky stars",
};

const DAY_PART_ICONS: Record<string, typeof Sun> = {
  Morning: Sunrise,
  Afternoon: Sun,
  Evening: Sunset,
  Night: Moon,
  "Mid Night": Moon,
};

function DayPartGroup({ part, children }: { part: string; children: React.ReactNode }) {
  const { url } = usePexelsImage(DAY_PART_QUERIES[part] ?? part);
  const Icon = DAY_PART_ICONS[part] ?? Sun;
  return (
    <div
      className="rounded-xl p-3"
      style={
        url
          ? {
              backgroundImage: `linear-gradient(rgba(15,23,42,.6),rgba(15,23,42,.6)), url(${url})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }
          : undefined
      }
    >
      <p className={`mb-1.5 flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest ${url ? "text-white" : "text-slate-400"}`}>
        <Icon size={11} /> {part}
      </p>
      {children}
    </div>
  );
}

function AddOnRow({
  addOn,
  audience,
  onChange,
  onRemove,
}: {
  addOn: AddOn;
  audience: Audience;
  onChange: (patch: Partial<AddOn>) => void;
  onRemove: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadImage(audience, file);
      onChange({
        image: { id: `addon-img-${Date.now()}`, url: result.url, label: addOn.label || "Add-on" },
      });
    } catch {
      // upload failed — leave the add-on without a photo
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex gap-2">
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-surface-border bg-cream-200/50 text-vibe-violet transition-colors hover:bg-cream-200"
        title={addOn.image ? "Replace photo" : "Add photo"}
      >
        {uploading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : addOn.image ? (
          <img src={addOn.image.url} alt={addOn.label || "Add-on"} className="h-full w-full object-cover" />
        ) : (
          <Upload size={16} />
        )}
      </button>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex gap-2">
          <input
            value={addOn.label}
            onChange={(e) => onChange({ label: e.target.value })}
            placeholder="e.g. Breakfast, Hotel stay"
            className={inputClass}
          />
          <input
            type="number"
            value={addOn.price}
            onChange={(e) => onChange({ price: Number(e.target.value) })}
            placeholder="₹ Price"
            className={`${inputClass} w-28`}
          />
          <button onClick={onRemove} className="shrink-0 text-ink-faint hover:text-vibe-coral">
            <X size={16} />
          </button>
        </div>
        {addOn.image && (
          <button
            type="button"
            onClick={() => onChange({ image: undefined })}
            className="self-start text-[11px] font-semibold text-ink-faint hover:text-vibe-coral"
          >
            Remove photo
          </button>
        )}
      </div>
    </div>
  );
}

function PricingStep({ draft, update, audience }: StepProps & { audience: Audience }) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  // Held as a string so the field can actually be cleared. As a number, clearing it
  // coerced ""→0 and the box snapped back to a stuck "0".
  const [priceInput, setPriceInput] = useState<string>("1000");
  const [activeSource, setActiveSource] = useState<string>("default");

  /* slots can live in two places: the global default list, or per-date overrides */
  const defaultSlots = draft.slotsList ?? [];
  const overrideSources = (draft.dateOverrides ?? []).filter((o) => !o.isHoliday && (o.slots ?? []).length > 0);

  const sources: { id: string; label: string }[] = [
    ...(defaultSlots.length > 0 ? [{ id: "default", label: "Global Default" }] : []),
    ...overrideSources.map((o) => ({
      id: o.date,
      label: new Date(`${o.date}T00:00:00`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    })),
  ];

  const sourceId = sources.some((s) => s.id === activeSource) ? activeSource : sources[0]?.id ?? "default";

  const slots: TurfSlot[] =
    sourceId === "default"
      ? defaultSlots
      : (draft.dateOverrides ?? []).find((o) => o.date === sourceId)?.slots ?? [];

  function saveSlots(nextSlots: TurfSlot[]) {
    if (sourceId === "default") {
      update("slotsList", nextSlots);
    } else {
      update(
        "dateOverrides",
        (draft.dateOverrides ?? []).map((o) => (o.date === sourceId ? { ...o, slots: nextSlots } : o))
      );
    }
  }

  // Blocked slots (unavailable — excluded from pricing entirely)
  const blockedSlots = slots.filter((s) => s.blocked);
  // Unpriced slots (price === 0, not blocked)
  const unpricedSlots = slots.filter((s) => s.price === 0 && !s.blocked);
  // Priced slots (price > 0, not blocked)
  const pricedSlots = slots.filter((s) => s.price > 0 && !s.blocked);

  function toggleBlockSlot(key: string, blocked: boolean) {
    const nextSlots = slots.map((s) =>
      `${s.startTime}-${s.endTime}` === key ? { ...s, blocked } : s
    );
    saveSlots(nextSlots);
    setSelectedKeys((prev) => prev.filter((k) => k !== key));
  }

  function handleSetPrice() {
    if (selectedKeys.length === 0) return;
    const nextSlots = slots.map((s) => {
      const key = `${s.startTime}-${s.endTime}`;
      if (selectedKeys.includes(key)) {
        return { ...s, price: Number(priceInput) || 0 };
      }
      return s;
    });
    saveSlots(nextSlots);
    setSelectedKeys([]);
  }

  function handleRemovePrice(key: string) {
    const nextSlots = slots.map((s) => {
      if (`${s.startTime}-${s.endTime}` === key) {
        return { ...s, price: 0 };
      }
      return s;
    });
    saveSlots(nextSlots);
    setSelectedKeys((prev) => prev.filter((k) => k !== key));
  }

  function toggleSelect(key: string) {
    setSelectedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  function selectAll() {
    setSelectedKeys(unpricedSlots.map((s) => `${s.startTime}-${s.endTime}`));
  }

  function deselectAll() {
    setSelectedKeys([]);
  }

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
      {/* ── TURF SLOT PRICING SELECTOR ── */}
      {draft.type !== "Event" && (
        <div className="rounded-xl border border-surface-border bg-cream-200/25 p-5">
          <p className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-1">Slot-by-Slot Pricing</p>
          <p className="text-xs text-ink-faint mb-4">Click to select one or multiple slots below, set their price, and apply. Priced slots will move to the list below.</p>

          {/* Slot source tabs — global default + per-date override lists */}
          {sources.length > 1 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {sources.map((src) => (
                <button
                  key={src.id}
                  type="button"
                  onClick={() => {
                    setActiveSource(src.id);
                    setSelectedKeys([]);
                  }}
                  className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold transition ${
                    sourceId === src.id
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {src.id === "default" ? "⚙️ " : "📅 "}
                  {src.label}
                </button>
              ))}
            </div>
          )}
          {sources.length > 0 && sourceId !== "default" && (
            <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-semibold text-vibe-amber">
              You are pricing the custom slots for {sources.find((s) => s.id === sourceId)?.label} only.
            </p>
          )}

          {/* Pricing Controls Row */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-48">
                <FieldLabel>Enter Price (₹) *</FieldLabel>
                <input inputMode="numeric" value={priceInput} onChange={(e) => setPriceInput(e.target.value.replace(/\D/g, ""))} placeholder="0" className={`${inputClass} text-xs`} />
              </div>
              <button type="button" onClick={handleSetPrice} disabled={selectedKeys.length === 0}
                className="rounded-xl bg-vibe-violet px-5 py-2.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50 transition">
                Apply Price ({selectedKeys.length} selected)
              </button>
            </div>

            {unpricedSlots.length > 0 && (
              <div className="flex gap-2">
                <button type="button" onClick={selectAll} className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg font-bold uppercase transition">Select All</button>
                <button type="button" onClick={deselectAll} className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg font-bold uppercase transition">Deselect All</button>
              </div>
            )}
          </div>

          {/* Unpriced slots selector cards */}
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Select Slots to Price ({unpricedSlots.length})</p>
            {slots.length === 0 ? (
              <p className="text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                No slots generated yet. Go back to the Slots step (Step 2) and generate slots first.
              </p>
            ) : unpricedSlots.length === 0 ? (
              <p className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">🎉 All slots have been priced!</p>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {(["Morning", "Afternoon", "Evening", "Night", "Mid Night"] as const).map((part) => {
                  const partSlots = unpricedSlots.filter((s) => s.label === part);
                  if (partSlots.length === 0) return null;

                  return (
                    <DayPartGroup key={part} part={part}>
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                        {partSlots.map((s) => {
                          const key = `${s.startTime}-${s.endTime}`;
                          const isSelected = selectedKeys.includes(key);
                          return (
                            <div key={key} className="group relative">
                              <button type="button" onClick={() => toggleSelect(key)}
                                className={`flex w-full flex-col items-center justify-center p-3 rounded-xl border-2 transition ${
                                  isSelected ? "border-vibe-violet bg-vibe-violet/5 font-extrabold shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                                }`}
                              >
                                <span className="text-xs font-bold text-slate-700 font-mono">{to12h(s.startTime)} - {to12h(s.endTime)}</span>
                                <span className="text-[9px] text-slate-400 uppercase mt-1">{s.label}</span>
                              </button>
                              <button
                                type="button"
                                title="Block this slot"
                                onClick={(e) => { e.stopPropagation(); toggleBlockSlot(key, true); }}
                                className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-white opacity-0 transition group-hover:flex group-hover:opacity-100 hover:bg-vibe-coral"
                              >
                                <Ban size={11} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </DayPartGroup>
                  );
                })}
              </div>
            )}
          </div>

          {/* List of Priced Slots */}
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Priced Slots ({pricedSlots.length})</p>
            {pricedSlots.length === 0 ? (
              <p className="text-xs text-ink-faint italic rounded-xl bg-white p-4 border border-slate-100">No slot pricing set yet.</p>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {(["Morning", "Afternoon", "Evening", "Night", "Mid Night"] as const).map((part) => {
                  const partSlots = pricedSlots.filter((s) => s.label === part);
                  if (partSlots.length === 0) return null;
                  return (
                    <DayPartGroup key={part} part={part}>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {partSlots.map((s) => {
                          const key = `${s.startTime}-${s.endTime}`;
                          return (
                            <div key={key} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white text-xs">
                              <div>
                                <p className="font-extrabold text-slate-800">{to12h(s.startTime)} - {to12h(s.endTime)}</p>
                                <p className="text-[9px] text-vibe-violet font-extrabold uppercase mt-0.5">₹{s.price} · {s.label}</p>
                              </div>
                              <button type="button" onClick={() => handleRemovePrice(key)} className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-vibe-coral rounded-lg">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </DayPartGroup>
                  );
                })}
              </div>
            )}
          </div>

          {/* Blocked slots */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Blocked Slots ({blockedSlots.length})</p>
            {blockedSlots.length === 0 ? (
              <p className="text-xs text-ink-faint italic rounded-xl bg-white p-4 border border-slate-100">No slots blocked. Hover a slot above and tap the ban icon to block it.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[220px] overflow-y-auto pr-1">
                {blockedSlots.map((s) => {
                  const key = `${s.startTime}-${s.endTime}`;
                  return (
                    <div key={key} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-100 text-xs">
                      <div>
                        <p className="font-extrabold text-slate-600">{to12h(s.startTime)} - {to12h(s.endTime)}</p>
                        <p className="text-[9px] text-slate-400 font-extrabold uppercase mt-0.5">Blocked · {s.label}</p>
                      </div>
                      <button type="button" onClick={() => toggleBlockSlot(key, false)} className="rounded-lg px-2 py-1 text-[10px] font-bold text-vibe-violet hover:bg-vibe-violet/10">
                        Unblock
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Participant tiers */}
      {draft.type === "Event" && (
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
      )}


      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-xl2 border border-surface-border p-5">
          <p className="text-sm font-semibold text-ink">Add-ons</p>
          <p className="mb-4 text-xs text-ink-faint">Optional extras with charges — add a photo to drive impulse buys</p>
          <div className="space-y-3">
            {addOns.map((a, i) => (
              <AddOnRow
                key={a.id}
                addOn={a}
                audience={audience}
                onChange={(patch) => updateAddOn(i, patch)}
                onRemove={() => removeAddOn(i)}
              />
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
/*  STEP 6 — LAUNCH                                                    */
/* ------------------------------------------------------------------ */

function LaunchStep({ draft, update }: StepProps) {
  const specs = draft.technicalSpecs ?? [];

  function addSpec() {
    update("technicalSpecs", [...specs, { label: "", value: "", icon: "crop", color: "purple" }]);
  }
  function updateSpec(i: number, patch: Partial<any>) {
    update("technicalSpecs", specs.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function removeSpec(i: number) {
    update("technicalSpecs", specs.filter((_, idx) => idx !== i));
  }

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
          {draft.type === "Event" && (
            <>
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
            </>
          )}
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

      <div>
        <p className="mb-1 text-[11px] font-semibold tracking-wider text-ink-faint uppercase">Amenities</p>
        <p className="mb-3 text-xs text-ink-faint">
          {draft.type === "Event" ? "What's included in the package price, and what's not." : "What facilities you provide at the venue, and what you don't."}
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <TagField
            label={draft.type === "Event" ? "Included" : "Amenities Provided"}
            placeholder={draft.type === "Event" ? "e.g. Professional guide" : "e.g. Washrooms, Parking, Floodlights"}
            values={draft.inclusions}
            onChange={(v) => update("inclusions", v)}
            tone="success"
            suggestions={draft.type === "Event" ? EVENT_INCLUSION_SUGGESTIONS : AMENITY_SUGGESTIONS}
          />
          <TagField
            label={draft.type === "Event" ? "Excluded" : "Not Provided"}
            placeholder={draft.type === "Event" ? "e.g. Personal expenses" : "e.g. Equipment rental, Cafeteria"}
            values={draft.exclusions}
            onChange={(v) => update("exclusions", v)}
            tone="danger"
            suggestions={draft.type === "Event" ? EVENT_INCLUSION_SUGGESTIONS : AMENITY_SUGGESTIONS}
          />
        </div>
      </div>

      <div className="rounded-xl2 border border-surface-border p-5">
        <p className="text-sm font-semibold text-ink">Technical Specifications</p>
        <p className="mb-4 text-xs text-ink-faint">
          Define technical metrics for this turf (e.g. Ground Dimensions, Vertical Clearance, Floodlights, Pitch Conditions, Nets etc.)
        </p>
        <div className="space-y-4">
          {specs.map((spec, i) => (
            <div key={i} className="flex flex-wrap items-center gap-4 rounded-xl border border-surface-border p-4 bg-cream-100/50">
              <div className="flex-1 min-w-[150px]">
                <FieldLabel>Specification Title</FieldLabel>
                <input
                  type="text"
                  value={spec.label}
                  onChange={(e) => updateSpec(i, { label: e.target.value })}
                  placeholder="e.g. Ground Dimensions"
                  className={inputClass}
                  required
                />
              </div>
              <div className="flex-[2] min-w-[200px]">
                <FieldLabel>Specification Value / Detail</FieldLabel>
                <input
                  type="text"
                  value={spec.value}
                  onChange={(e) => updateSpec(i, { value: e.target.value })}
                  placeholder="e.g. Massive 12,500 sq.ft arena..."
                  className={inputClass}
                  required
                />
              </div>
              <div className="w-40">
                <FieldLabel>Icon</FieldLabel>
                <select
                  value={spec.icon}
                  onChange={(e) => updateSpec(i, { icon: e.target.value })}
                  className={inputClass}
                >
                  <option value="crop">Dimensions (Crop)</option>
                  <option value="arrow-up-down">Clearance (Arrow)</option>
                  <option value="lightbulb">Floodlights (Bulb)</option>
                  <option value="layers">Pitch Conditions (Layers)</option>
                  <option value="grid">Nets Gap (Grid)</option>
                </select>
              </div>
              <div className="w-32">
                <FieldLabel>Color Theme</FieldLabel>
                <select
                  value={spec.color || "purple"}
                  onChange={(e) => updateSpec(i, { color: e.target.value })}
                  className={inputClass}
                >
                  <option value="purple">Purple</option>
                  <option value="blue">Blue</option>
                  <option value="orange">Orange</option>
                  <option value="green">Green</option>
                  <option value="pink">Pink</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => removeSpec(i)}
                className="mt-5 text-ink-faint hover:text-vibe-coral shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {specs.length === 0 && (
            <p className="text-xs text-ink-faint italic py-2 text-center bg-cream-100 rounded-xl">No technical specifications added yet.</p>
          )}
        </div>
        <button
          type="button"
          onClick={addSpec}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-vibe-lime px-3 py-2 text-xs font-semibold text-vibe-indigo"
        >
          <Plus size={13} /> Add Specification
        </button>
      </div>

      {draft.type === "Event" && (
        <>
          <div className="grid gap-5 sm:grid-cols-2">
            <TagField label="Highlights" placeholder="e.g. Stunning Himalayan views" values={draft.highlights} onChange={(v) => update("highlights", v)} />
            <TagField label="Tags" placeholder="e.g. adventure, trekking, camping" values={draft.tags} onChange={(v) => update("tags", v)} />
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
        </>
      )}
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
  audience = "vendor",
  onClose,
  onSave,
}: {
  mode: "create" | "edit";
  initialListing?: Listing;
  initialType?: ListingType;
  audience?: Audience;
  onClose: () => void;
  onSave: (listing: Listing) => void;
}) {
  const [draft, setDraft] = useState<Listing>(() => initialListing ?? emptyListing(initialType));

  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [formError, setFormError] = useState<string | null>(null);
  const [vendorProfile, setVendorProfile] = useState<any>(null);

  useEffect(() => {
    import("@/lib/api/auth").then((auth) => {
      auth.restoreVendorSession().then((profile) => {
        if (profile) {
          setVendorProfile(profile);
          setDraft((d) => {
            if (!d.title) {
              const name = ("businessName" in profile)
                ? (profile as any).businessName
                : ("holderName" in profile)
                ? (profile as any).holderName
                : "";
              return { ...d, title: name || "" };
            }
            return d;
          });
        }
      });
    });
  }, []);

  function update<K extends keyof Listing>(key: K, value: Listing[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function goTo(s: number) {
    setStep(s);
    setMaxStep((m) => Math.max(m, s));
  }

  function handlePrimary() {
    if (step < 6) {
      goTo(step + 1);
      return;
    }

    const profileName = vendorProfile
      ? ("businessName" in vendorProfile
        ? (vendorProfile as any).businessName
        : ("holderName" in vendorProfile
          ? (vendorProfile as any).holderName
          : ""))
      : "";

    // Auto fallback for empty listing title to vendor profile business name
    const finalTitle = draft.title.trim() || profileName || `Udaipur ${draft.type} Club`;
    const startingPrice = computeStartingPrice(draft);
    const finalDraft = { ...draft, title: finalTitle, price: startingPrice };

    if (finalDraft.categories.length === 0) {
      setFormError("Select at least one category.");
      goTo(3); // Details step
      return;
    }
    const hasCity = finalDraft.cityMode === "multiple" ? (finalDraft.cities?.length ?? 0) > 0 : finalDraft.city.trim().length > 0;
    if (!hasCity) {
      setFormError("Choose at least one city.");
      goTo(4); // Location step
      return;
    }
    if (finalDraft.type !== "Event" && (finalDraft.slotsPerDay ?? 0) <= 0) {
      setFormError("Generate at least one time slot before publishing.");
      goTo(2); // Slots step
      return;
    }
    if (startingPrice <= 0) {
      setFormError(
        finalDraft.type === "Event"
          ? "Set a price for at least one participant tier before publishing."
          : "Set a price for at least one slot before publishing."
      );
      goTo(5); // Pricing step
      return;
    }
    setFormError(null);
    onSave(finalDraft);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-cream-200">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-vibe-indigo via-vibe-violet to-vibe-violetSoft px-4 py-4 text-white shadow-pop sm:px-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">
            {draft.type === "Event"
              ? mode === "edit" ? "Edit Event" : "New Event"
              : mode === "edit" ? "Edit Package" : "New Package"}
          </p>
          <h2 className="font-display text-lg font-semibold sm:text-xl">
            {draft.type === "Event" ? "Event Studio" : "Package Studio"}
          </h2>
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
          {stepsFor(draft.type).map((s) => (
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
          {step === 1 && <PackageStep draft={draft} update={update} audience={audience} />}
          {step === 2 && <BookingStep draft={draft} update={update} />}
          {step === 3 && <DetailsStep draft={draft} update={update} />}
          {step === 4 && <LocationStep draft={draft} update={update} />}
          {step === 5 && <PricingStep draft={draft} update={update} audience={audience} />}
          {step === 6 && <LaunchStep draft={draft} update={update} />}
        </div>
      </div>

      <div className="sticky bottom-0 flex items-center justify-between border-t border-surface-border bg-white px-4 py-4 sm:px-8">
        <p className="text-xs text-ink-faint">Step {step} of 6</p>
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
            {step < 6
              ? "Save & Next"
              : mode === "edit"
              ? draft.type === "Event" ? "Update Event" : "Update Package"
              : draft.type === "Event" ? "Publish Event" : "Create Listing"}
          </button>
        </div>
      </div>
    </div>
  );
}
