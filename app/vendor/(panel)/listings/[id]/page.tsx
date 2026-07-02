"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Camera, ClipboardList, FileText, Pencil } from "lucide-react";
import { Badge } from "@/components/vendor/ui";
import { PackageStudio } from "@/components/vendor/PackageStudio";
import { getListingsWithOverrides, saveListingOverride } from "@/lib/mock-data";
import { readFileAsDataUrl } from "@/lib/files";
import { Listing } from "@/lib/types";

type Tab = "overview" | "registrations";

const TYPE_TONE: Record<Listing["type"], "info" | "success" | "pending"> = {
  Turf: "info",
  Game: "success",
  Event: "pending",
};

export default function ListingDetailPage() {
  const params = useParams<{ id: string }>();
  const [listing, setListing] = useState<Listing | undefined>(() =>
    getListingsWithOverrides().find((l) => l.id === params.id)
  );
  const [tab, setTab] = useState<Tab>("overview");
  const [studioOpen, setStudioOpen] = useState(false);

  if (!listing) {
    return (
      <div className="rounded-xl2 border border-dashed border-surface-border bg-white py-16 text-center">
        <p className="text-sm text-ink-faint">Listing not found.</p>
        <Link href="/vendor/listings" className="mt-3 inline-block text-sm font-semibold text-vibe-violet">
          Back to Listings
        </Link>
      </div>
    );
  }

  async function replaceImage(index: number, file: File) {
    const url = await readFileAsDataUrl(file);
    const images = listing!.images.map((img, i) => (i === index ? { ...img, url } : img));
    saveListingOverride(listing!.id, { images });
    setListing((l) => (l ? { ...l, images } : l));
  }

  function handleStudioSave(updated: Listing) {
    saveListingOverride(updated.id, updated);
    setListing(updated);
    setStudioOpen(false);
  }

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <StudioSidebar listing={listing} tab={tab} onTabChange={setTab} />

      <div className="min-w-0 flex-1 space-y-5">
        <Link href="/vendor/listings" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-vibe-violet">
          <ArrowLeft size={15} /> Back to Listings
        </Link>

        {tab === "overview" ? (
          <OverviewTab listing={listing} onEdit={() => setStudioOpen(true)} onReplaceImage={replaceImage} />
        ) : (
          <RegistrationsTab />
        )}
      </div>

      {studioOpen && (
        <PackageStudio mode="edit" initialListing={listing} onClose={() => setStudioOpen(false)} onSave={handleStudioSave} />
      )}
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
    <aside className="w-full shrink-0 lg:w-72">
      <div className="overflow-hidden rounded-xl2 border border-surface-border bg-white shadow-panel">
        <div className="relative h-28">
          {cover && <img src={cover} alt={listing.title} className="h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute left-2 top-2">
            <Badge tone={listing.status === "Active" ? "success" : "neutral"}>{listing.status}</Badge>
          </div>
          <div className="absolute bottom-2 left-3 right-3">
            <p className="truncate text-sm font-semibold leading-tight text-white">{listing.title}</p>
            <p className="text-[11px] text-white/70">
              {listing.city}, {listing.state}
            </p>
          </div>
        </div>

        <div className="p-3">
          <p className="mb-2 px-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Pages</p>
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
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors ${
        active ? "bg-vibe-violet/10 text-vibe-violet" : "text-ink-soft hover:bg-cream-300"
      }`}
    >
      <span className={active ? "text-vibe-violet" : "text-ink-faint"}>{icon}</span>
      <span>
        <p className="text-sm font-semibold leading-none">{label}</p>
        <p className="mt-1 text-[11px] text-ink-faint">{hint}</p>
      </span>
    </button>
  );
}

function OverviewTab({
  listing,
  onEdit,
  onReplaceImage,
}: {
  listing: Listing;
  onEdit: () => void;
  onReplaceImage: (index: number, file: File) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">Package Overview</h1>
          <p className="mt-0.5 text-xs text-ink-faint">What guests see, plus pricing &amp; details you can edit.</p>
        </div>
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 rounded-lg bg-vibe-violet px-3.5 py-2 text-sm font-semibold text-white hover:bg-vibe-violetSoft"
        >
          <Pencil size={14} /> Edit Details
        </button>
      </div>

      <ImageGallery images={listing.images} onReplace={onReplaceImage} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-xl2 border border-surface-border bg-white p-5 shadow-panel">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Pricing</p>
          <p className="font-display text-2xl font-semibold text-ink">
            ₹{listing.price.toLocaleString("en-IN")}
            <span className="text-xs font-normal text-ink-faint"> /slot</span>
          </p>
        </div>

        <div className="rounded-xl2 border border-surface-border bg-white p-5 shadow-panel">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Basic Information</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoField label="Category">
              <span className="font-medium text-ink">{listing.category}</span>
            </InfoField>
            <InfoField label="Type">
              <Badge tone={TYPE_TONE[listing.type]}>{listing.type}</Badge>
            </InfoField>
            <InfoField label="City">
              <span className="font-medium text-ink">{listing.city}</span>
            </InfoField>
            <InfoField label="State">
              <span className="font-medium text-ink">{listing.state}</span>
            </InfoField>
            <InfoField label="Listed On">
              <span className="font-medium text-ink">{listing.listedOn}</span>
            </InfoField>
            <InfoField label="Access">
              <span className="font-medium text-ink">{listing.access}</span>
            </InfoField>
          </div>
          <div className="mt-3">
            <p className="mb-1 text-[11px] text-ink-faint">Address</p>
            <p className="text-sm text-ink-soft">{listing.address}</p>
          </div>
        </div>
      </div>

      <TagsCard title="Highlights" items={listing.highlights} />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <TagsCard title="Includes" tone="success" items={listing.inclusions} />
        <TagsCard title="Excludes" tone="danger" items={listing.exclusions} />
      </div>

      <ItineraryCard stops={listing.itinerary} />

      <FaqCard faqs={listing.faqs} />

      <div className="rounded-xl2 border border-surface-border bg-white p-5 shadow-panel">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Description</p>
        <p className="text-sm leading-relaxed text-ink-soft">{listing.description}</p>
      </div>

      <TagsCard title="Tags" items={listing.tags} pillStyle />
    </div>
  );
}

function InfoField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] text-ink-faint">{label}</p>
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
    <div className="rounded-xl2 border border-surface-border bg-white p-4 shadow-panel">
      <div className="relative h-64 overflow-hidden rounded-xl bg-cream-300 sm:h-80">
        {activeImage && <img src={activeImage.url} alt={activeImage.label} className="h-full w-full object-cover" />}
        <button
          onClick={() => fileInputs.current[active]?.click()}
          className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-2 text-xs font-semibold text-white hover:bg-black/75"
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
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${
                i === active ? "border-vibe-violet" : "border-transparent"
              }`}
            >
              <img src={img.url} alt={img.label} className="h-full w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-black/50 py-0.5 text-center text-[9px] font-semibold text-white">
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
  tone,
  pillStyle,
}: {
  title: string;
  items: string[];
  tone?: "success" | "danger";
  pillStyle?: boolean;
}) {
  const textTone = tone === "success" ? "text-vibe-limeDark" : tone === "danger" ? "text-vibe-coral" : "text-ink-soft";

  return (
    <div className="rounded-xl2 border border-surface-border bg-white p-5 shadow-panel">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{title}</p>

      {pillStyle ? (
        <div className="flex flex-wrap gap-2">
          {items.map((t, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full bg-vibe-violet/10 px-2.5 py-1 text-xs font-medium text-vibe-violet">
              {t}
            </span>
          ))}
          {items.length === 0 && <p className="text-xs text-ink-faint">Nothing added yet.</p>}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((t, i) => (
            <li key={i} className={`flex items-center gap-2 text-sm ${textTone}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {t}
            </li>
          ))}
          {items.length === 0 && <p className="text-xs text-ink-faint">Nothing added yet.</p>}
        </ul>
      )}
    </div>
  );
}

function ItineraryCard({ stops }: { stops: Listing["itinerary"] }) {
  return (
    <div className="rounded-xl2 border border-surface-border bg-white p-5 shadow-panel">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Itinerary</p>
      <div className="space-y-3">
        {stops.map((s, i) => (
          <div key={i} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-vibe-violet/10 text-xs font-semibold text-vibe-violet">
              {s.day}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">{s.title}</p>
              <p className="mt-0.5 text-xs text-ink-faint">{s.description}</p>
            </div>
          </div>
        ))}
        {stops.length === 0 && <p className="text-xs text-ink-faint">No itinerary added yet.</p>}
      </div>
    </div>
  );
}

function FaqCard({ faqs }: { faqs: Listing["faqs"] }) {
  return (
    <div className="rounded-xl2 border border-surface-border bg-white p-5 shadow-panel">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">FAQs</p>
      <div className="space-y-4">
        {faqs.map((f, i) => (
          <div key={i}>
            <p className="text-sm font-semibold text-ink">{f.question}</p>
            <p className="mt-0.5 text-xs text-ink-faint">{f.answer}</p>
          </div>
        ))}
        {faqs.length === 0 && <p className="text-xs text-ink-faint">No FAQs added yet.</p>}
      </div>
    </div>
  );
}

function RegistrationsTab() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-semibold text-ink">Registrations</h1>
        <p className="mt-0.5 text-xs text-ink-faint">Manage registrations and booking verifications for this listing.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Total Online Earnings" value="₹0" hint="Vendor's cut from online bookings (fees excluded)" />
        <StatTile label="Total Offline Earnings" value="₹0" hint="Full cash collected directly from customers" />
        <StatTile label="Settled Online Amount" value="₹0" hint="Amount already paid to the vendor's account" />
        <StatTile label="Remaining Online" value="₹0" hint="Pending amount to be settled to vendor" />
      </div>

      <div className="flex flex-col items-center gap-2 rounded-xl2 border border-dashed border-surface-border bg-white py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-300 text-ink-faint">
          <ClipboardList size={20} />
        </div>
        <p className="font-display font-semibold text-ink">No upcoming events or trips</p>
        <p className="max-w-sm text-xs text-ink-faint">
          Booking verification options will appear here once future event or trip dates are available for this listing.
        </p>
      </div>
    </div>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl2 border border-surface-border bg-white p-4 shadow-panel">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</p>
      <p className="mt-1.5 font-display text-xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-[11px] text-ink-faint">{hint}</p>
    </div>
  );
}
