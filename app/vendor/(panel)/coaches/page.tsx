"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarPlus, Pencil, Plus, Trash2, UserRoundCog, X } from "lucide-react";
import { PageHero, SectionCard, Badge } from "@/components/vendor/ui";
import { Toast } from "@/components/admin/Toast";
import {
  addCoachSlot,
  createCoach,
  deleteCoach,
  listVendorCoaches,
  removeCoachSlot,
  updateCoach,
  type CreateCoachInput,
} from "@/lib/api/vendor";
import { ApiError } from "@/lib/api/client";
import { Coach } from "@/lib/api/types";

const emptyDraft: CreateCoachInput = {
  name: "",
  category: "",
  subCategory: "",
  experienceYears: undefined,
  fees: 0,
  bio: "",
  photoUrl: "",
};

function emptySlotDraft() {
  return { date: "", startTime: "", endTime: "" };
}

export default function VendorCoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<CreateCoachInput>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [slotDraft, setSlotDraft] = useState(emptySlotDraft());
  const [addingSlot, setAddingSlot] = useState(false);

  const refresh = useCallback(() => {
    listVendorCoaches()
      .then((result) => setCoaches(result.items))
      .catch((err) => setToast(err instanceof ApiError ? err.describe() : "Failed to load coaches"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function handleEdit(coach: Coach) {
    setEditingId(coach._id);
    setDraft({
      name: coach.name,
      category: coach.category,
      subCategory: coach.subCategory ?? "",
      experienceYears: coach.experienceYears,
      fees: coach.fees,
      bio: coach.bio ?? "",
      photoUrl: coach.photoUrl ?? "",
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setDraft(emptyDraft);
  }

  async function handleSubmit() {
    if (!draft.name.trim() || !draft.category.trim() || draft.fees < 0) {
      setToast("Enter a name, sport/category, and a valid fee.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateCoach(editingId, draft);
        setToast(`"${draft.name}" updated`);
      } else {
        await createCoach(draft);
        setToast(`"${draft.name}" added`);
      }
      setEditingId(null);
      setDraft(emptyDraft);
      refresh();
    } catch (err) {
      setToast(err instanceof ApiError ? err.describe() : "Failed to save coach");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleStatus(coach: Coach) {
    try {
      await updateCoach(coach._id, { status: coach.status === "Active" ? "Inactive" : "Active" });
      refresh();
    } catch (err) {
      setToast(err instanceof ApiError ? err.describe() : "Failed to update coach");
    }
  }

  async function handleDelete(coach: Coach) {
    if (!window.confirm(`Remove ${coach.name} from your coaches?`)) return;
    try {
      await deleteCoach(coach._id);
      setToast(`Removed ${coach.name}`);
      refresh();
    } catch (err) {
      setToast(err instanceof ApiError ? err.describe() : "Failed to remove coach");
    }
  }

  function toggleExpanded(coach: Coach) {
    setExpandedId((id) => (id === coach._id ? null : coach._id));
    setSlotDraft(emptySlotDraft());
  }

  async function handleAddSlot(coachId: string) {
    if (!slotDraft.date || !slotDraft.startTime || !slotDraft.endTime) {
      setToast("Pick a date and start/end time for the slot.");
      return;
    }
    setAddingSlot(true);
    try {
      await addCoachSlot(coachId, slotDraft);
      setSlotDraft(emptySlotDraft());
      refresh();
    } catch (err) {
      setToast(err instanceof ApiError ? err.describe() : "Failed to add slot");
    } finally {
      setAddingSlot(false);
    }
  }

  async function handleRemoveSlot(coachId: string, slotId: string) {
    try {
      await removeCoachSlot(coachId, slotId);
      refresh();
    } catch (err) {
      setToast(err instanceof ApiError ? err.describe() : "Failed to remove slot");
    }
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Coach Marketplace"
        title="Coaches"
        description="Add coaches, set their fees and coaching slots — players book them live from the Sports tab."
        right={
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold">
            <UserRoundCog size={16} /> {coaches.length} Coach(es)
          </span>
        }
      />

      <SectionCard
        title={editingId ? "Edit Coach" : "Add Coach"}
        description={editingId ? "Update details, then save." : "Fill in the coach's profile."}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Name" placeholder="Rohan Sharma" value={draft.name} onChange={(v) => setDraft((d) => ({ ...d, name: v }))} />
          <Input label="Sport / Category" placeholder="Badminton" value={draft.category} onChange={(v) => setDraft((d) => ({ ...d, category: v }))} />
          <Input
            label="Specialisation (optional)"
            placeholder="Doubles coaching"
            value={draft.subCategory ?? ""}
            onChange={(v) => setDraft((d) => ({ ...d, subCategory: v }))}
          />
          <Input
            label="Experience (years)"
            placeholder="5"
            value={draft.experienceYears ? String(draft.experienceYears) : ""}
            onChange={(v) => setDraft((d) => ({ ...d, experienceYears: v ? Number(v.replace(/\D/g, "")) : undefined }))}
          />
          <Input
            label="Fee per session (₹)"
            placeholder="800"
            value={String(draft.fees || "")}
            onChange={(v) => setDraft((d) => ({ ...d, fees: Number(v.replace(/\D/g, "")) || 0 }))}
          />
          <Input label="Photo URL (optional)" placeholder="https://..." value={draft.photoUrl ?? ""} onChange={(v) => setDraft((d) => ({ ...d, photoUrl: v }))} />
          <div className="sm:col-span-2">
            <Input label="Bio (optional)" placeholder="Short intro players will see" value={draft.bio ?? ""} onChange={(v) => setDraft((d) => ({ ...d, bio: v }))} />
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-vibe-violet px-5 py-2.5 text-sm font-semibold text-white hover:bg-vibe-violetSoft disabled:opacity-60"
          >
            <Plus size={16} /> {saving ? "Saving..." : editingId ? "Save Changes" : "Add Coach"}
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

      <SectionCard title="Your Coaches" description="Tap a coach to manage their coaching slots.">
        <div className="divide-y divide-surface-border">
          {coaches.map((coach) => (
            <div key={coach._id} className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {coach.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coach.photoUrl} alt={coach.name} className="h-12 w-12 shrink-0 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-vibe-violet/10 text-vibe-violet">
                      <UserRoundCog size={18} />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-ink text-sm truncate">{coach.name}</p>
                    <p className="text-xs text-ink-faint">
                      {coach.category}
                      {coach.subCategory ? ` · ${coach.subCategory}` : ""} · ₹{coach.fees}/session
                      {coach.experienceYears ? ` · ${coach.experienceYears} yrs exp` : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleToggleStatus(coach)}>
                    <Badge tone={coach.status === "Active" ? "success" : "neutral"}>{coach.status}</Badge>
                  </button>
                  <button
                    onClick={() => toggleExpanded(coach)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-vibe-violet hover:bg-vibe-violet/10"
                    title="Manage slots"
                  >
                    <CalendarPlus size={14} />
                  </button>
                  <button
                    onClick={() => handleEdit(coach)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-vibe-violet hover:bg-vibe-violet/10"
                    title="Edit"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(coach)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-vibe-coral hover:bg-vibe-coral/10"
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {expandedId === coach._id && (
                <div className="mt-4 rounded-lg bg-cream-200/50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-faint mb-2">Coaching Slots</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {coach.slots.length === 0 && <p className="text-xs text-ink-faint">No slots yet.</p>}
                    {coach.slots.map((slot) => (
                      <span
                        key={slot.id}
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                          slot.isBooked ? "bg-cream-300 text-ink-faint" : "bg-vibe-lime/20 text-vibe-limeDark"
                        }`}
                      >
                        {new Date(slot.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} ·{" "}
                        {slot.startTime}–{slot.endTime}
                        {slot.isBooked ? " (booked)" : ""}
                        {!slot.isBooked && (
                          <button onClick={() => handleRemoveSlot(coach._id, slot.id)} aria-label="Remove slot">
                            <X size={12} />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-end gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-faint mb-1">Date</label>
                      <input
                        type="date"
                        value={slotDraft.date}
                        onChange={(e) => setSlotDraft((s) => ({ ...s, date: e.target.value }))}
                        className="rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-vibe-violet"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-faint mb-1">Start</label>
                      <input
                        type="time"
                        value={slotDraft.startTime}
                        onChange={(e) => setSlotDraft((s) => ({ ...s, startTime: e.target.value }))}
                        className="rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-vibe-violet"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-ink-faint mb-1">End</label>
                      <input
                        type="time"
                        value={slotDraft.endTime}
                        onChange={(e) => setSlotDraft((s) => ({ ...s, endTime: e.target.value }))}
                        className="rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-vibe-violet"
                      />
                    </div>
                    <button
                      onClick={() => handleAddSlot(coach._id)}
                      disabled={addingSlot}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-vibe-violet px-3.5 py-2 text-xs font-semibold text-white hover:bg-vibe-violetSoft disabled:opacity-60"
                    >
                      <Plus size={14} /> Add Slot
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {loading && <p className="py-8 text-center text-sm text-ink-faint">Loading coaches...</p>}
          {!loading && coaches.length === 0 && <p className="py-8 text-center text-sm text-ink-faint">No coaches added yet.</p>}
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
