"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { PageHero, SectionCard, Badge } from "@/components/vendor/ui";
import { Toast } from "@/components/admin/Toast";
import {
  createVendorMenuItem,
  deleteVendorMenuItem,
  listVendorMenu,
  updateVendorMenuItem,
  type MenuItemInput,
} from "@/lib/api/vendor";
import { uploadVendorImage } from "@/lib/api/uploads";
import { ApiError } from "@/lib/api/client";
import { MenuItem } from "@/lib/api/types";

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
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    listVendorMenu()
      .then(setItems)
      .catch((err) => setToast(err instanceof ApiError ? err.describe() : "Failed to load menu"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

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

  async function handleCreate() {
    if (!draft.name.trim() || draft.price < 0) {
      setToast("Enter an item name and a valid price.");
      return;
    }
    setSaving(true);
    try {
      await createVendorMenuItem(draft);
      setToast(`"${draft.name}" added to your menu`);
      setDraft(emptyDraft);
      if (fileInputRef.current) fileInputRef.current.value = "";
      refresh();
    } catch (err) {
      setToast(err instanceof ApiError ? err.describe() : "Failed to add menu item");
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

      <SectionCard title="Add Menu Item" description="Fill item details and upload a photo (optional).">
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
        <button
          onClick={handleCreate}
          disabled={saving || uploading}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-vibe-violet px-5 py-2.5 text-sm font-semibold text-white hover:bg-vibe-violetSoft disabled:opacity-60"
        >
          <Plus size={16} /> {saving ? "Adding..." : "Add Item"}
        </button>
      </SectionCard>

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
