"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { Check, ExternalLink, Loader2, Plus, Trash2, Upload, X, Clock3, ChevronLeft, ChevronRight, LayoutGrid, List } from "lucide-react";
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

type Audience = "admin" | "vendor";

const STEPS = [
  { id: 1, label: "Images", hint: "Media uploads" },
  { id: 2, label: "Slots", hint: "Turf time slots" },
  { id: 3, label: "Details & Location", hint: "Name, address, categories" },
  { id: 4, label: "Pricing", hint: "Set prices per slot" },
  { id: 5, label: "Publish", hint: "Review details & save" },
] as const;

function formatListedOn(date: Date) {
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function to12h(t: string) {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  let h = Number(hStr);
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${mStr} ${ap}`;
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

function uploadImage(audience: Audience, file: File) {
  return audience === "admin" ? uploadAdminImage(file, "listings") : uploadVendorImage(file, "listings");
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
        {draft.images.length} of 10 uploaded — first image is poster, second is banner
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
  const [venueInput, setVenueInput] = useState(draft.address || "");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [coords, setCoords] = useState<{ lat: string; lon: string } | null>(null);
  const [cityInput, setCityInput] = useState("");

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
        headers: { "Accept-Language": "en" }
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
        <p className="mb-1 text-[11px] font-semibold tracking-wider text-ink-faint uppercase">Basic info</p>
        <p className="text-xs text-ink-faint">Name, location &amp; category</p>
      </div>

      <div>
        <FieldLabel>{draft.type} name (Optional)</FieldLabel>
        <input value={draft.title} onChange={(e) => update("title", e.target.value)} className={inputClass} placeholder="Defaults to your business profile name" />
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

          <p className="mt-1.5 text-[11px] text-ink-faint">
            Start typing to view places suggestions. Selecting a suggestion will autofill coordinate parameters, state, and city.
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
                title="Live Map Preview"
                src={mapEmbedUrl}
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
                loading="lazy"
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

/* ─── Indian Festival / Holiday lookup ──────────────────────────── */
const INDIAN_HOLIDAYS: Record<string, string> = {
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
    let h = Number(hS);
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
    if (isDailyRoutine) {
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

  if (draft.type !== "Turf") {
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
                    }}
                    className={`flex flex-col justify-between items-start rounded-xl p-2 min-h-[75px] border text-left transition ${
                      isSel 
                        ? "border-slate-900 bg-slate-900 text-white shadow-md font-extrabold" 
                        : isHolidayCell
                        ? "border-rose-300 bg-rose-50 hover:bg-rose-100"
                        : hasOvr
                        ? "border-emerald-200 bg-emerald-50/30 hover:border-emerald-300"
                        : (day.isSunday || day.festival)
                        ? "border-rose-100 bg-rose-50/30 hover:border-rose-200 text-rose-900"
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
                {TIME_OPTIONS.map((t) => {
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
/*  STEP 4 — PRICING                                                   */
/* ------------------------------------------------------------------ */

function PricingStep({ draft, update }: StepProps) {
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [priceInput, setPriceInput] = useState<number>(1000);

  const slots = draft.slotsList ?? [];

  // Unpriced slots (price === 0)
  const unpricedSlots = slots.filter((s) => s.price === 0);
  // Priced slots (price > 0)
  const pricedSlots = slots.filter((s) => s.price > 0);

  function handleSetPrice() {
    if (selectedKeys.length === 0) return;
    const nextSlots = slots.map((s) => {
      const key = `${s.startTime}-${s.endTime}`;
      if (selectedKeys.includes(key)) {
        return { ...s, price: priceInput };
      }
      return s;
    });
    update("slotsList", nextSlots);
    setSelectedKeys([]);
  }

  function handleRemovePrice(key: string) {
    const nextSlots = slots.map((s) => {
      if (`${s.startTime}-${s.endTime}` === key) {
        return { ...s, price: 0 };
      }
      return s;
    });
    update("slotsList", nextSlots);
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
      {draft.type === "Turf" && (
        <div className="rounded-xl border border-surface-border bg-cream-200/25 p-5">
          <p className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-1">Slot-by-Slot Pricing</p>
          <p className="text-xs text-ink-faint mb-4">Click to select one or multiple slots below, set their price, and apply. Priced slots will move to the list below.</p>

          {/* Pricing Controls Row */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="w-48">
                <FieldLabel>Enter Price (₹) *</FieldLabel>
                <input type="number" value={priceInput} onChange={(e) => setPriceInput(Number(e.target.value))} className={`${inputClass} text-xs`} />
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
            {unpricedSlots.length === 0 ? (
              <p className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">🎉 All slots have been priced!</p>
            ) : (
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                {(["Morning", "Afternoon", "Evening", "Night", "Mid Night"] as const).map((part) => {
                  const partSlots = unpricedSlots.filter((s) => s.label === part);
                  if (partSlots.length === 0) return null;

                  return (
                    <div key={part}>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{part}</p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                        {partSlots.map((s) => {
                          const key = `${s.startTime}-${s.endTime}`;
                          const isSelected = selectedKeys.includes(key);
                          return (
                            <button key={key} type="button" onClick={() => toggleSelect(key)}
                              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition ${
                                isSelected ? "border-vibe-violet bg-vibe-violet/5 font-extrabold shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                            >
                              <span className="text-xs font-bold text-slate-700 font-mono">{to12h(s.startTime)} - {to12h(s.endTime)}</span>
                              <span className="text-[9px] text-slate-400 uppercase mt-1">{s.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* List of Priced Slots */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">Priced Slots ({pricedSlots.length})</p>
            {pricedSlots.length === 0 ? (
              <p className="text-xs text-ink-faint italic rounded-xl bg-white p-4 border border-slate-100">No slot pricing set yet.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-[220px] overflow-y-auto pr-1">
                {pricedSlots.map((s) => {
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
            )}
          </div>
        </div>
      )}

      {/* Participant tiers */}
      {draft.type !== "Turf" && (
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
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(
    () => initialListing ? initialListing.availableFrom : null
  );

  // Month navigation states
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());

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
    if (step < 5) {
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
    const finalDraft = { ...draft, title: finalTitle };

    if (!finalDraft.category.trim()) {
      setFormError("Category is required.");
      goTo(3); // Details & Location step
      return;
    }
    const hasCity = finalDraft.cityMode === "multiple" ? (finalDraft.cities?.length ?? 0) > 0 : finalDraft.city.trim().length > 0;
    if (!hasCity) {
      setFormError("Choose at least one city.");
      goTo(3); // Details & Location step
      return;
    }
    setFormError(null);
    onSave(finalDraft);
  }

  // Monthly Calendar navigation
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
      days.push({ dayNumber: i, dateStr, festival });
    }
    return days;
  }, [calYear, calMonth]);

  // If in create mode and no date selected, show full calendar view first
  if (mode === "create" && !selectedCalendarDate) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-cream-200">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-vibe-indigo via-vibe-violet to-vibe-violetSoft px-4 py-4 text-white shadow-pop sm:px-8">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">Step 1 · Calendar Selection</p>
            <h2 className="font-display text-lg font-semibold sm:text-xl">Choose Package Start Date</h2>
          </div>
          <button type="button" onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-2 text-sm font-semibold hover:bg-white/20">
            <X size={15} /> Close
          </button>
        </div>

        <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
          <div className="bg-white border border-surface-border rounded-2xl p-6 shadow-panel">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-lg font-bold text-slate-800">
                {new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </h3>
              <div className="flex gap-2">
                <button type="button" onClick={prevMonth} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                  <ChevronLeft size={16} />
                </button>
                <button type="button" onClick={nextMonth} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-2 mb-3 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="py-1">{day}</div>)}
            </div>

            {/* Grid of days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={idx} className="bg-slate-50/20 rounded-xl min-h-[85px] border border-transparent" />;

                const isToday = new Date().toISOString().slice(0, 10) === day.dateStr;

                return (
                  <button key={idx} type="button"
                    onClick={() => {
                      setSelectedCalendarDate(day.dateStr);
                      update("availableFrom", day.dateStr);
                      update("availableTill", day.dateStr);
                    }}
                    className={`flex flex-col justify-between items-start rounded-xl p-3 min-h-[90px] border text-left transition hover:border-vibe-violet hover:shadow-md ${
                      isToday ? "bg-vibe-violet/5 border-vibe-violet/40" : "bg-white border-slate-100"
                    }`}
                  >
                    <span className="text-sm font-extrabold text-slate-800">{day.dayNumber}</span>
                    {day.festival && (
                      <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold mt-1 block truncate w-full">
                        🎉 {day.festival}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
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
          {step === 1 && <PackageStep draft={draft} update={update} audience={audience} />}
          {step === 2 && <BookingStep draft={draft} update={update} />}
          {step === 3 && <LocationStep draft={draft} update={update} />}
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
