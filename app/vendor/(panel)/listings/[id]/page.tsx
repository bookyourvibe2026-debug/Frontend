"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Check,
  ClipboardList,
  FileText,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Badge } from "@/components/vendor/ui";
import { getListingsWithOverrides, saveListingOverride } from "@/lib/mock-data";
import { ItineraryStop, Listing, ListingFAQ } from "@/lib/types";

type Tab = "overview" | "registrations";

const TYPE_TONE: Record<Listing["type"], "info" | "success" | "pending"> = {
  Turf: "info",
  Game: "success",
  Event: "pending",
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | undefined>(() =>
    getListingsWithOverrides().find((l) => l.id === params.id)
  );
  const [tab, setTab] = useState<Tab>("overview");
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<Listing | undefined>(listing);

  if (!listing || !draft) {
    return (
      <div className="rounded-xl2 border border-dashed border-surface-border bg-white py-16 text-center">
        <p className="text-sm text-ink-faint">Listing not found.</p>
        <Link href="/vendor/listings" className="mt-3 inline-block text-sm font-semibold text-vibe-violet">
          Back to Listings
        </Link>
      </div>
    );
  }

  function startEdit() {
    setDraft({ ...listing! });
    setEditMode(true);
  }

  function cancelEdit() {
    setDraft({ ...listing! });
    setEditMode(false);
  }

  function saveEdit() {
    if (!draft) return;
    saveListingOverride(listing!.id, draft);
    setListing(draft);
    setEditMode(false);
  }

  async function replaceImage(index: number, file: File) {
    const url = await readFileAsDataUrl(file);
    const images = listing!.images.map((img, i) => (i === index ? { ...img, url } : img));
    saveListingOverride(listing!.id, { images });
    setListing((l) => (l ? { ...l, images } : l));
    setDraft((d) => (d ? { ...d, images } : d));
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <StudioSidebar listing={listing} tab={tab} onTabChange={setTab} />

      <div className="flex-1 min-w-0 space-y-5">
        <Link
          href="/vendor/listings"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-vibe-violet"
        >
          <ArrowLeft size={15} /> Back to Listings
        </Link>

        {tab === "overview" ? (
          <OverviewTab
            listing={listing}
            draft={draft}
            setDraft={setDraft}
            editMode={editMode}
            onStartEdit={startEdit}
            onCancel={cancelEdit}
            onSave={saveEdit}
            onReplaceImage={replaceImage}
          />
        ) : (
          <RegistrationsTab />
        )}
      </div>
    </div>
  );
}

function StudioSidebar({
  listing,
  tab,
  onTabChange,
}: {
  listing: Listing;
  tab: Tab;
  onTabChange: (t: Tab) => void;
}) {
  const cover = listing.images[0]?.url;
  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="rounded-xl2 border border-surface-border bg-white shadow-panel overflow-hidden">
        <div className="relative h-28">
          {cover && <img src={cover} alt={listing.title} className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute top-2 left-2">
            <Badge tone={listing.status === "Active" ? "success" : "neutral"}>{listing.status}</Badge>
          </div>
          <div className="absolute bottom-2 left-3 right-3">
            <p className="text-white text-sm font-semibold leading-tight truncate">{listing.title}</p>
            <p className="text-white/70 text-[11px]">{listing.city}, {listing.state}</p>
          </div>
        </div>

        <div className="p-3">
          <p className="px-1.5 text-[11px] font-semibold tracking-wider text-ink-faint uppercase mb-2">Pages</p>
          <nav className="space-y-1">
            <SidebarNavItem
              icon={<FileText size={15} />}
              label="Package Overview"
              hint={tab === "overview" ? "Current page" : "Open section"}
              active={tab === "overview"}
              onClick={() => onTabChange("overview")}
            />
            <SidebarNavItem
              icon={<ClipboardList size={15} />}
              label="Registrations"
              hint={tab === "registrations" ? "Current page" : "Open section"}
              active={tab === "registrations"}
              onClick={() => onTabChange("registrations")}
            />
          </nav>
        </div>
      </div>
    </aside>
  );
}

function SidebarNavItem({
  icon,
  label,
  hint,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors ${
        active ? "bg-vibe-violet/10 text-vibe-violet" : "text-ink-soft hover:bg-cream-300"
      }`}
    >
      <span className={active ? "text-vibe-violet" : "text-ink-faint"}>{icon}</span>
      <span>
        <p className="text-sm font-semibold leading-none">{label}</p>
        <p className="text-[11px] text-ink-faint mt-1">{hint}</p>
      </span>
    </button>
  );
}

function OverviewTab({
  listing,
  draft,
  setDraft,
  editMode,
  onStartEdit,
  onCancel,
  onSave,
  onReplaceImage,
}: {
  listing: Listing;
  draft: Listing;
  setDraft: React.Dispatch<React.SetStateAction<Listing | undefined>>;
  editMode: boolean;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onReplaceImage: (index: number, file: File) => void;
}) {
  function update<K extends keyof Listing>(key: K, value: Listing[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  const view = editMode ? draft : listing;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-semibold text-xl text-ink">Package Overview</h1>
          <p className="text-xs text-ink-faint mt-0.5">
            What guests see, plus pricing &amp; details you can edit.
          </p>
        </div>
        {editMode ? (
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border px-3.5 py-2 text-sm font-semibold text-ink-soft hover:bg-cream-300"
            >
              <X size={14} /> Cancel
            </button>
            <button
              onClick={onSave}
              className="inline-flex items-center gap-1.5 rounded-lg bg-vibe-violet px-3.5 py-2 text-sm font-semibold text-white hover:bg-vibe-violetSoft"
            >
              <Check size={14} /> Save Changes
            </button>
          </div>
        ) : (
          <button
            onClick={onStartEdit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-vibe-violet px-3.5 py-2 text-sm font-semibold text-white hover:bg-vibe-violetSoft"
          >
            <Pencil size={14} /> Edit Details
          </button>
        )}
      </div>

      <ImageGallery images={listing.images} onReplace={onReplaceImage} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="rounded-xl2 border border-surface-border bg-white shadow-panel p-5">
          <p className="text-[11px] font-semibold tracking-wider text-ink-faint uppercase mb-3">Pricing</p>
          {editMode ? (
            <div className="flex items-center gap-2">
              <span className="text-ink-faint">₹</span>
              <input
                type="number"
                value={draft.price}
                onChange={(e) => update("price", Number(e.target.value))}
                className="w-32 rounded-lg border border-surface-border px-3 py-2 text-lg font-semibold outline-none focus:border-vibe-violet"
              />
              <span className="text-xs text-ink-faint">/slot</span>
            </div>
          ) : (
            <p className="text-2xl font-display font-semibold text-ink">
              ₹{listing.price.toLocaleString("en-IN")}
              <span className="text-xs font-normal text-ink-faint"> /slot</span>
            </p>
          )}
        </div>

        <div className="rounded-xl2 border border-surface-border bg-white shadow-panel p-5">
          <p className="text-[11px] font-semibold tracking-wider text-ink-faint uppercase mb-3">Basic Information</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoField label="Category">
              {editMode ? (
                <input value={draft.category} onChange={(e) => update("category", e.target.value)} className={fieldInput} />
              ) : (
                <span className="font-medium text-ink">{listing.category}</span>
              )}
            </InfoField>
            <InfoField label="Type">
              <Badge tone={TYPE_TONE[listing.type]}>{listing.type}</Badge>
            </InfoField>
            <InfoField label="City">
              {editMode ? (
                <input value={draft.city} onChange={(e) => update("city", e.target.value)} className={fieldInput} />
              ) : (
                <span className="font-medium text-ink">{listing.city}</span>
              )}
            </InfoField>
            <InfoField label="State">
              {editMode ? (
                <input value={draft.state} onChange={(e) => update("state", e.target.value)} className={fieldInput} />
              ) : (
                <span className="font-medium text-ink">{listing.state}</span>
              )}
            </InfoField>
            <InfoField label="Listed On">
              <span className="font-medium text-ink">{listing.listedOn}</span>
            </InfoField>
            <InfoField label="Access">
              <span className="font-medium text-ink">{listing.access}</span>
            </InfoField>
          </div>
          <div className="mt-3">
            <p className="text-[11px] text-ink-faint mb-1">Address</p>
            {editMode ? (
              <input value={draft.address} onChange={(e) => update("address", e.target.value)} className={fieldInput} />
            ) : (
              <p className="text-sm text-ink-soft">{listing.address}</p>
            )}
          </div>
        </div>
      </div>

      <TagsCard
        title="Highlights"
        items={view.highlights}
        editMode={editMode}
        onChange={(items) => update("highlights", items)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <TagsCard
          title="Includes"
          tone="success"
          items={view.inclusions}
          editMode={editMode}
          onChange={(items) => update("inclusions", items)}
        />
        <TagsCard
          title="Excludes"
          tone="danger"
          items={view.exclusions}
          editMode={editMode}
          onChange={(items) => update("exclusions", items)}
        />
      </div>

      <ItineraryCard
        stops={view.itinerary}
        editMode={editMode}
        onChange={(stops) => update("itinerary", stops)}
      />

      <FaqCard faqs={view.faqs} editMode={editMode} onChange={(faqs) => update("faqs", faqs)} />

      <div className="rounded-xl2 border border-surface-border bg-white shadow-panel p-5">
        <p className="text-[11px] font-semibold tracking-wider text-ink-faint uppercase mb-3">Description</p>
        {editMode ? (
          <textarea
            rows={4}
            value={draft.description}
            onChange={(e) => update("description", e.target.value)}
            className={fieldInput}
          />
        ) : (
          <p className="text-sm text-ink-soft leading-relaxed">{listing.description}</p>
        )}
      </div>

      <TagsCard
        title="Tags"
        items={view.tags}
        editMode={editMode}
        onChange={(items) => update("tags", items)}
        pillStyle
      />
    </div>
  );
}

const fieldInput =
  "w-full rounded-lg border border-surface-border bg-cream-200/40 px-3 py-2 text-sm outline-none focus:border-vibe-violet";

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] text-ink-faint mb-1">{label}</p>
      {children}
    </div>
  );
}

function ImageGallery({
  images,
  onReplace,
}: {
  images: Listing["images"];
  onReplace: (index: number, file: File) => void;
}) {
  const [active, setActive] = useState(0);
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({});

  const activeImage = images[active] ?? images[0];

  return (
    <div className="rounded-xl2 border border-surface-border bg-white shadow-panel p-4">
      <div className="relative rounded-xl overflow-hidden h-64 sm:h-80 bg-cream-300">
        {activeImage && <img src={activeImage.url} alt={activeImage.label} className="h-full w-full object-cover" />}
        <button
          onClick={() => fileInputs.current[active]?.click()}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-black/60 text-white text-xs font-semibold px-3 py-2 hover:bg-black/75"
        >
          <Camera size={14} /> Change photo
        </button>
        <input
          ref={(el) => {
            fileInputs.current[active] = el;
          }}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onReplace(active, file);
            e.target.value = "";
          }}
        />
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={`relative h-16 w-24 shrink-0 rounded-lg overflow-hidden border-2 ${
                i === active ? "border-vibe-violet" : "border-transparent"
              }`}
            >
              <img src={img.url} alt={img.label} className="h-full w-full object-cover" />
              <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[9px] font-semibold text-center py-0.5">
                {img.label}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TagsCard({
  title,
  items,
  editMode,
  onChange,
  tone,
  pillStyle,
}: {
  title: string;
  items: string[];
  editMode: boolean;
  onChange: (items: string[]) => void;
  tone?: "success" | "danger";
  pillStyle?: boolean;
}) {
  const [value, setValue] = useState("");

  function add() {
    if (value.trim()) {
      onChange([...items, value.trim()]);
      setValue("");
    }
  }

  function remove(i: number) {
    onChange(items.filter((_, idx) => idx !== i));
  }

  const textTone = tone === "success" ? "text-vibe-limeDark" : tone === "danger" ? "text-vibe-coral" : "text-ink-soft";

  return (
    <div className="rounded-xl2 border border-surface-border bg-white shadow-panel p-5">
      <p className="text-[11px] font-semibold tracking-wider text-ink-faint uppercase mb-3">{title}</p>

      {pillStyle ? (
        <div className="flex flex-wrap gap-2">
          {items.map((t, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-vibe-violet/10 text-vibe-violet text-xs font-medium px-2.5 py-1"
            >
              {t}
              {editMode && (
                <button onClick={() => remove(i)}>
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
          {items.length === 0 && !editMode && <p className="text-xs text-ink-faint">Nothing added yet.</p>}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((t, i) => (
            <li key={i} className={`flex items-center justify-between gap-2 text-sm ${textTone}`}>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {t}
              </span>
              {editMode && (
                <button onClick={() => remove(i)} className="text-ink-faint hover:text-vibe-coral">
                  <X size={13} />
                </button>
              )}
            </li>
          ))}
          {items.length === 0 && !editMode && <p className="text-xs text-ink-faint">Nothing added yet.</p>}
        </ul>
      )}

      {editMode && (
        <div className="flex gap-2 mt-3">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
            placeholder={`Add to ${title.toLowerCase()}...`}
            className={fieldInput}
          />
          <button onClick={add} className="rounded-lg bg-vibe-violet text-white text-xs font-semibold px-4 shrink-0">
            Add
          </button>
        </div>
      )}
    </div>
  );
}

function ItineraryCard({
  stops,
  editMode,
  onChange,
}: {
  stops: ItineraryStop[];
  editMode: boolean;
  onChange: (stops: ItineraryStop[]) => void;
}) {
  function update(i: number, patch: Partial<ItineraryStop>) {
    onChange(stops.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function addStop() {
    onChange([...stops, { day: stops.length + 1, title: "", description: "" }]);
  }

  function removeStop(i: number) {
    onChange(stops.filter((_, idx) => idx !== i));
  }

  return (
    <div className="rounded-xl2 border border-surface-border bg-white shadow-panel p-5">
      <p className="text-[11px] font-semibold tracking-wider text-ink-faint uppercase mb-3">Itinerary</p>
      <div className="space-y-3">
        {stops.map((s, i) => (
          <div key={i} className="flex gap-3">
            <span className="h-7 w-7 shrink-0 rounded-full bg-vibe-violet/10 text-vibe-violet text-xs font-semibold flex items-center justify-center">
              {s.day}
            </span>
            <div className="flex-1 min-w-0">
              {editMode ? (
                <div className="space-y-1.5">
                  <input
                    value={s.title}
                    onChange={(e) => update(i, { title: e.target.value })}
                    placeholder="Stop title"
                    className={fieldInput}
                  />
                  <div className="flex gap-2">
                    <input
                      value={s.description}
                      onChange={(e) => update(i, { description: e.target.value })}
                      placeholder="Description"
                      className={fieldInput}
                    />
                    <button onClick={() => removeStop(i)} className="text-ink-faint hover:text-vibe-coral shrink-0">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold text-ink">{s.title}</p>
                  <p className="text-xs text-ink-faint mt-0.5">{s.description}</p>
                </>
              )}
            </div>
          </div>
        ))}
        {stops.length === 0 && !editMode && <p className="text-xs text-ink-faint">No itinerary added yet.</p>}
      </div>
      {editMode && (
        <button
          onClick={addStop}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-vibe-lime text-vibe-indigo text-xs font-semibold px-3 py-2"
        >
          <Plus size={13} /> Add stop
        </button>
      )}
    </div>
  );
}

function FaqCard({
  faqs,
  editMode,
  onChange,
}: {
  faqs: ListingFAQ[];
  editMode: boolean;
  onChange: (faqs: ListingFAQ[]) => void;
}) {
  function update(i: number, patch: Partial<ListingFAQ>) {
    onChange(faqs.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }

  function addFaq() {
    onChange([...faqs, { question: "", answer: "" }]);
  }

  function removeFaq(i: number) {
    onChange(faqs.filter((_, idx) => idx !== i));
  }

  return (
    <div className="rounded-xl2 border border-surface-border bg-white shadow-panel p-5">
      <p className="text-[11px] font-semibold tracking-wider text-ink-faint uppercase mb-3">FAQs</p>
      <div className="space-y-4">
        {faqs.map((f, i) => (
          <div key={i}>
            {editMode ? (
              <div className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    value={f.question}
                    onChange={(e) => update(i, { question: e.target.value })}
                    placeholder="Question"
                    className={fieldInput}
                  />
                  <button onClick={() => removeFaq(i)} className="text-ink-faint hover:text-vibe-coral shrink-0">
                    <Trash2 size={16} />
                  </button>
                </div>
                <input
                  value={f.answer}
                  onChange={(e) => update(i, { answer: e.target.value })}
                  placeholder="Answer"
                  className={fieldInput}
                />
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-ink">{f.question}</p>
                <p className="text-xs text-ink-faint mt-0.5">{f.answer}</p>
              </>
            )}
          </div>
        ))}
        {faqs.length === 0 && !editMode && <p className="text-xs text-ink-faint">No FAQs added yet.</p>}
      </div>
      {editMode && (
        <button
          onClick={addFaq}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-vibe-lime text-vibe-indigo text-xs font-semibold px-3 py-2"
        >
          <Plus size={13} /> Add FAQ
        </button>
      )}
    </div>
  );
}

function RegistrationsTab() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-semibold text-xl text-ink">Registrations</h1>
        <p className="text-xs text-ink-faint mt-0.5">
          Manage registrations and booking verifications for this listing.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatTile label="Total Online Earnings" value="₹0" hint="Vendor's cut from online bookings (fees excluded)" />
        <StatTile label="Total Offline Earnings" value="₹0" hint="Full cash collected directly from customers" />
        <StatTile label="Settled Online Amount" value="₹0" hint="Amount already paid to the vendor's account" />
        <StatTile label="Remaining Online" value="₹0" hint="Pending amount to be settled to vendor" />
      </div>

      <div className="rounded-xl2 border border-dashed border-surface-border bg-white py-16 flex flex-col items-center text-center gap-2">
        <div className="h-12 w-12 rounded-full bg-cream-300 flex items-center justify-center text-ink-faint">
          <ClipboardList size={20} />
        </div>
        <p className="font-display font-semibold text-ink">No upcoming events or trips</p>
        <p className="text-xs text-ink-faint max-w-sm">
          Booking verification options will appear here once future event or trip dates are available for this
          listing.
        </p>
      </div>
    </div>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl2 border border-surface-border bg-white shadow-panel p-4">
      <p className="text-[11px] font-semibold tracking-wider text-ink-faint uppercase">{label}</p>
      <p className="mt-1.5 font-display text-xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-[11px] text-ink-faint">{hint}</p>
    </div>
  );
}
