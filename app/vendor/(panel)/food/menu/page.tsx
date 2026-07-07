"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Loader2, Pencil, Plus, Trash2, UtensilsCrossed, X } from "lucide-react";
import { PageHero, SectionCard, Badge } from "@/components/vendor/ui";
import { Toast } from "@/components/admin/Toast";
import {
  createVendorMenuItem,
  deleteVendorMenuItem,
  getVendorProfile,
  listVendorMenu,
  updateVendorMenuItem,
  updateVendorProfile,
  type MenuItemInput,
} from "@/lib/api/vendor";
import { uploadVendorImage } from "@/lib/api/uploads";
import { ApiError } from "@/lib/api/client";
import { MenuItem, Vendor } from "@/lib/api/types";

const emptyDraft: MenuItemInput = {
  name: "",
  description: "",
  price: 0,
  category: "General",
  inStock: true,
  prepTimeMins: undefined,
  photo: undefined,
};

export default function VendorMenuPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<MenuItemInput>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [posterUploading, setPosterUploading] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    listVendorMenu()
      .then(setItems)
      .catch((err) => setToast(err instanceof ApiError ? err.describe() : "Failed to load menu"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    getVendorProfile()
      .then(setVendor)
      .catch((err) => setToast(err instanceof ApiError ? err.describe() : "Failed to load store branding"));
  }, [refresh]);

  async function handleBrandingUpload(kind: "banner" | "poster", file: File | undefined) {
    if (!file) return;
    const setUploadingFlag = kind === "banner" ? setBannerUploading : setPosterUploading;
    setUploadingFlag(true);
    try {
      const { url } = await uploadVendorImage(file, `vendor-${kind}`);
      const updated = await updateVendorProfile(kind === "banner" ? { banner: url } : { poster: url });
      setVendor(updated);
      setToast(`${kind === "banner" ? "Banner" : "Poster"} updated`);
    } catch (err) {
      setToast(err instanceof ApiError ? err.describe() : `Failed to upload ${kind}`);
    } finally {
      setUploadingFlag(false);
    }
  }

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadVendorImage(file, "menu");
      setDraft((d) => ({ ...d, photo: result.url }));
    } catch (err) {
      setToast(err instanceof ApiError ? err.describe() : "Photo upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleEdit(item: MenuItem) {
    setEditingId(item._id);
    setDraft({
      name: item.name,
      description: item.description ?? "",
      price: item.price,
      category: item.category,
      inStock: item.inStock,
      prepTimeMins: item.prepTimeMins,
      photo: item.photo,
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setDraft(emptyDraft);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit() {
    if (!draft.name.trim() || draft.price < 0) {
      setToast("Enter an item name and a valid price.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateVendorMenuItem(editingId, draft);
        setToast(`"${draft.name}" updated`);
      } else {
        await createVendorMenuItem(draft);
        setToast(`"${draft.name}" added to your menu`);
      }
      setEditingId(null);
      setDraft(emptyDraft);
      if (fileInputRef.current) fileInputRef.current.value = "";
      refresh();
    } catch (err) {
      setToast(err instanceof ApiError ? err.describe() : "Failed to save menu item");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStock(item: MenuItem) {
    try {
      await updateVendorMenuItem(item._id, { inStock: !item.inStock });
      refresh();
    } catch (err) {
      setToast(err instanceof ApiError ? err.describe() : "Failed to update item");
    }
  }

  async function handleDelete(item: MenuItem) {
    if (!window.confirm(`Remove "${item.name}" from your menu?`)) return;
    try {
      await deleteVendorMenuItem(item._id);
      setToast(`Removed "${item.name}"`);
      refresh();
    } catch (err) {
      setToast(err instanceof ApiError ? err.describe() : "Failed to remove item");
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Food Owner"
        title="Menu management"
        description="Add items, set prices and photos, and mark items available or out of stock in one tap."
        right={
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold">
            <UtensilsCrossed size={16} /> {items.length} Item(s)
          </span>
        }
      />

      <SectionCard
        title="Store Banner & Poster"
        description="Banner shows on your card in the food listing page; poster shows at the top of your store page."
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <BrandingUploadBox
            label="Banner"
            hint="Landscape · shown on your listing card"
            image={vendor?.banner}
            uploading={bannerUploading}
            inputRef={bannerInputRef}
            onFile={(f) => handleBrandingUpload("banner", f)}
          />
          <BrandingUploadBox
            label="Poster"
            hint="Portrait · shown on your store page"
            image={vendor?.poster}
            uploading={posterUploading}
            inputRef={posterInputRef}
            onFile={(f) => handleBrandingUpload("poster", f)}
          />
        </div>
      </SectionCard>

      <div ref={formRef}>
      <SectionCard
        title={editingId ? "Edit Menu Item" : "Add Menu Item"}
        description={editingId ? "Update details or upload a photo, then save." : "Fill item details and upload a photo (optional)."}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Item Name" placeholder="Paneer Tikka Roll" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} />
          <Input label="Category" placeholder="Snacks" value={draft.category ?? ""} onChange={(v) => setDraft((d) => ({ ...d, category: v }))} />
          <Input
            label="Price (₹)"
            placeholder="150"
            value={String(draft.price || "")}
            onChange={(v) => setDraft((d) => ({ ...d, price: Number(v.replace(/\D/g, "")) || 0 }))}
          />
          <Input
            label="Prep Time (mins)"
            placeholder="10"
            value={draft.prepTimeMins ? String(draft.prepTimeMins) : ""}
            onChange={(v) => setDraft((d) => ({ ...d, prepTimeMins: v ? Number(v.replace(/\D/g, "")) : undefined }))}
          />
          <div className="sm:col-span-2">
            <Input
              label="Description"
              placeholder="Grilled paneer, mint chutney, onions"
              value={draft.description ?? ""}
              onChange={(v) => setDraft((d) => ({ ...d, description: v }))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-semibold tracking-wider text-ink-faint uppercase mb-1.5">Photo</label>
            <div className="flex items-center gap-3">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="text-sm" />
              {uploading && <Loader2 size={16} className="animate-spin text-vibe-violet" />}
              {draft.photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={draft.photo} alt="Preview" className="h-10 w-10 rounded-lg object-cover" />
              )}
            </div>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving || uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-vibe-violet px-5 py-2.5 text-sm font-semibold text-white hover:bg-vibe-violetSoft disabled:opacity-60"
          >
            <Plus size={16} /> {saving ? "Saving..." : editingId ? "Save Changes" : "Add Item"}
          </button>
          {editingId && (
            <button
              onClick={handleCancelEdit}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-surface-border px-5 py-2.5 text-sm font-semibold text-ink-faint hover:bg-surface-hover disabled:opacity-60"
            >
              <X size={16} /> Cancel
            </button>
          )}
        </div>
      </SectionCard>
      </div>

      <SectionCard title="Your Menu" description="Tap the availability badge to toggle in-stock / out-of-stock.">
        <div className="divide-y divide-surface-border">
          {items.map((item) => (
            <div key={item._id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="flex items-center gap-3 min-w-0">
                {item.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.photo} alt={item.name} className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-vibe-violet/10 text-vibe-violet">
                    <UtensilsCrossed size={18} />
                  </span>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-ink text-sm truncate">{item.name}</p>
                  <p className="text-xs text-ink-faint">
                    {item.category} · ₹{item.price}
                    {item.prepTimeMins ? ` · ~${item.prepTimeMins} min` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggleStock(item)}>
                  <Badge tone={item.inStock ? "success" : "neutral"}>{item.inStock ? "In Stock" : "Out of Stock"}</Badge>
                </button>
                <button
                  onClick={() => handleEdit(item)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-vibe-violet hover:bg-vibe-violet/10"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-vibe-coral hover:bg-vibe-coral/10"
                  title="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {loading && <p className="py-8 text-center text-sm text-ink-faint">Loading menu...</p>}
          {!loading && items.length === 0 && <p className="py-8 text-center text-sm text-ink-faint">No menu items yet.</p>}
        </div>
      </SectionCard>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}

function BrandingUploadBox({
  label,
  hint,
  image,
  uploading,
  inputRef,
  onFile,
}: {
  label: string;
  hint: string;
  image?: string;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (file: File | undefined) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold tracking-wider text-ink-faint uppercase mb-1.5">{label}</label>
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
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="relative flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-surface-border bg-cream-200/50 transition-colors hover:bg-cream-200 disabled:opacity-60"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-1.5 text-ink-faint">
            <ImageIcon size={18} />
            <span className="text-xs font-semibold">Upload {label.toLowerCase()}</span>
          </span>
        )}
        {uploading && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 size={20} className="animate-spin text-white" />
          </span>
        )}
      </button>
      <p className="mt-1.5 text-[11px] text-ink-faint">{hint}</p>
    </div>
  );
}

function Input({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold tracking-wider text-ink-faint uppercase mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm outline-none focus:border-vibe-violet placeholder:text-ink-faint"
      />
    </div>
  );
}
