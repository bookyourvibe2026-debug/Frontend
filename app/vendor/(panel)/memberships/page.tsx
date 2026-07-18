"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Plus, Trash2, UserPlus, X } from "lucide-react";
import { PageHero, SectionCard, Badge } from "@/components/vendor/ui";
import { Toast } from "@/components/admin/Toast";
import {
  createMembership,
  createSubscription,
  deleteMembership,
  getVendorListings,
  listMemberships,
  listSubscriptions,
  updateSubscriptionStatus,
  CreateMembershipInput,
} from "@/lib/api/vendor";
import { apiListingToMock } from "@/lib/api/listingAdapter";
import { ApiError } from "@/lib/api/client";
import { Membership, MembershipPlanType, Subscription, SubscriptionStatus } from "@/lib/api/types";
import type { Listing } from "@/lib/types";

const emptyDraft: CreateMembershipInput = {
  listingId: undefined,
  name: "",
  description: "",
  planType: "duration",
  price: 0,
  durationDays: 30,
  sessionsIncluded: undefined,
};

const SUB_TONE: Record<SubscriptionStatus, "success" | "neutral" | "danger"> = {
  active: "success",
  expired: "neutral",
  cancelled: "danger",
};

export default function MembershipsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [turfs, setTurfs] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<CreateMembershipInput>(emptyDraft);
  const [saving, setSaving] = useState(false);
  /** Enroll sheet open state; `plan` preselects one, null lets the vendor pick. */
  const [enroll, setEnroll] = useState<{ plan: Membership | null } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const refresh = useCallback(() => {
    Promise.all([listMemberships(), listSubscriptions()])
      .then(([m, s]) => {
        setMemberships(m);
        setSubscriptions(s);
      })
      .catch((err) => setToast(err instanceof ApiError ? err.describe() : "Failed to load memberships"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    getVendorListings()
      .then((l) => setTurfs(l.map(apiListingToMock).filter((x) => x.type === "Turf")))
      .catch(() => {});
  }, [refresh]);

  const turfName = (listingId?: string) => turfs.find((t) => t.id === listingId)?.title;

  async function handleCreate() {
    if (!draft.name.trim() || draft.price < 0) {
      setToast("Enter a plan name and a valid price.");
      return;
    }
    setSaving(true);
    try {
      await createMembership(draft);
      setToast(`Plan "${draft.name}" created`);
      setDraft(emptyDraft);
      refresh();
    } catch (err) {
      setToast(err instanceof ApiError ? err.describe() : "Failed to create plan");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(m: Membership) {
    if (!window.confirm(`Delete plan "${m.name}"?`)) return;
    try {
      await deleteMembership(m._id);
      setToast(`Deleted "${m.name}"`);
      refresh();
    } catch (err) {
      setToast(err instanceof ApiError ? err.describe() : "Failed to delete plan");
    }
  }

  async function handleSubStatus(sub: Subscription, status: SubscriptionStatus) {
    try {
      await updateSubscriptionStatus(sub._id, status);
      refresh();
    } catch (err) {
      setToast(err instanceof ApiError ? err.describe() : "Failed to update subscription");
    }
  }

  const activeCount = subscriptions.filter((s) => s.status === "active").length;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Commerce"
        title="Membership Management"
        description="Create membership plans, sell packages, and track active and expired members."
        right={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold">
              <CreditCard size={16} /> {activeCount} Active Member(s)
            </span>
            <button
              onClick={() => setEnroll({ plan: null })}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-vibe-violet shadow-md transition hover:bg-violet-50"
            >
              <UserPlus size={16} /> Add Member
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SectionCard title="Create Plan" description="Duration-based or session-count plans." className="lg:col-span-1">
          <div className="space-y-3">
            {turfs.length > 0 && (
              <div>
                <label className="block text-[11px] font-semibold tracking-wider text-ink-faint uppercase mb-1.5">Turf</label>
                <select
                  value={draft.listingId ?? ""}
                  onChange={(e) => setDraft({ ...draft, listingId: e.target.value || undefined })}
                  className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm outline-none focus:border-vibe-violet"
                >
                  <option value="">All turfs</option>
                  {turfs.map((t) => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>
            )}
            <Input label="Plan Name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} placeholder="Monthly Unlimited" />
            <div>
              <label className="block text-[11px] font-semibold tracking-wider text-ink-faint uppercase mb-1.5">Plan Type</label>
              <select
                value={draft.planType}
                onChange={(e) => setDraft({ ...draft, planType: e.target.value as MembershipPlanType })}
                className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm outline-none focus:border-vibe-violet"
              >
                <option value="duration">Duration (e.g. 30 days)</option>
                <option value="sessions">Sessions (e.g. 10 visits)</option>
              </select>
            </div>
            {draft.planType === "duration" ? (
              <Input
                label="Duration (days)"
                value={String(draft.durationDays ?? "")}
                onChange={(v) => setDraft({ ...draft, durationDays: Number(v.replace(/\D/g, "")) || undefined })}
                placeholder="30"
              />
            ) : (
              <Input
                label="Sessions Included"
                value={String(draft.sessionsIncluded ?? "")}
                onChange={(v) => setDraft({ ...draft, sessionsIncluded: Number(v.replace(/\D/g, "")) || undefined })}
                placeholder="10"
              />
            )}
            <Input
              label="Price (₹)"
              value={String(draft.price || "")}
              onChange={(v) => setDraft({ ...draft, price: Number(v.replace(/\D/g, "")) || 0 })}
              placeholder="2500"
            />
            <Input
              label="Description"
              value={draft.description ?? ""}
              onChange={(v) => setDraft({ ...draft, description: v })}
              placeholder="Optional"
            />
            <button
              onClick={handleCreate}
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-vibe-violet px-4 py-2.5 text-sm font-semibold text-white hover:bg-vibe-violetSoft disabled:opacity-60"
            >
              <Plus size={15} /> {saving ? "Creating..." : "Create Plan"}
            </button>
          </div>
        </SectionCard>

        <SectionCard title="Your Plans" className="lg:col-span-2">
          <div className="grid sm:grid-cols-2 gap-4">
            {memberships.map((m) => (
              <div key={m._id} className="rounded-xl border border-surface-border p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-ink text-sm">{m.name}</p>
                    <p className="text-xs text-ink-faint mt-0.5">
                      {m.planType === "duration" ? `${m.durationDays} days` : `${m.sessionsIncluded} sessions`}
                      {turfName(m.listingId) ? ` · ${turfName(m.listingId)}` : ""}
                    </p>
                  </div>
                  <Badge tone={m.status === "Active" ? "success" : "neutral"}>{m.status}</Badge>
                </div>
                {m.turfDimensions && <p className="text-xs text-ink-faint mt-1">Turf size: {m.turfDimensions}</p>}
                {m.description && <p className="text-xs text-ink-soft mt-2">{m.description}</p>}
                <p className="mt-2 font-display text-lg font-bold text-ink">₹{m.price.toLocaleString("en-IN")}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={() => setEnroll({ plan: m })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-cream-300"
                  >
                    <UserPlus size={13} /> Enroll Member
                  </button>
                  <button
                    onClick={() => handleDelete(m)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-vibe-coral hover:bg-vibe-coral/10"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {loading && <p className="col-span-full text-sm text-ink-faint">Loading plans...</p>}
            {!loading && memberships.length === 0 && <p className="col-span-full text-sm text-ink-faint">No plans yet — create one on the left.</p>}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Members"
        description="Everyone subscribed to one of your plans."
        action={
          <button
            onClick={() => setEnroll({ plan: null })}
            className="inline-flex items-center gap-1.5 rounded-lg bg-vibe-violet px-3 py-2 text-xs font-semibold text-white hover:bg-vibe-violetSoft"
          >
            <UserPlus size={13} /> Add Member
          </button>
        }
      >
        <div className="divide-y divide-surface-border">
          {subscriptions.map((s) => (
            <div key={s._id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p className="font-medium text-ink text-sm">{s.customerName}</p>
                <p className="text-xs text-ink-faint">
                  {typeof s.membershipId === "string" ? "Plan" : s.membershipId.name} · {s.phone} · ₹{s.amountPaid.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={SUB_TONE[s.status]}>{s.status}</Badge>
                {s.status === "active" && (
                  <button
                    onClick={() => handleSubStatus(s, "cancelled")}
                    className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-cream-300"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
          {!loading && subscriptions.length === 0 && <p className="py-8 text-center text-sm text-ink-faint">No members yet.</p>}
        </div>
      </SectionCard>

      {enroll && (
        <EnrollModal
          memberships={memberships.filter((m) => m.status === "Active")}
          initial={enroll.plan}
          turfName={turfName}
          onClose={() => setEnroll(null)}
          onEnrolled={() => {
            setEnroll(null);
            refresh();
          }}
        />
      )}

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}

function EnrollModal({
  memberships,
  initial,
  turfName,
  onClose,
  onEnrolled,
}: {
  memberships: Membership[];
  /** Plan to preselect; null lets the vendor pick one in the modal. */
  initial: Membership | null;
  turfName: (listingId?: string) => string | undefined;
  onClose: () => void;
  onEnrolled: () => void;
}) {
  const [planId, setPlanId] = useState(initial?._id ?? memberships[0]?._id ?? "");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const plan = memberships.find((m) => m._id === planId) ?? null;
  const [amountPaid, setAmountPaid] = useState(String(initial?.price ?? memberships[0]?.price ?? ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function selectPlan(id: string) {
    setPlanId(id);
    const next = memberships.find((m) => m._id === id);
    if (next) setAmountPaid(String(next.price));
  }

  async function handleSubmit() {
    if (!plan) {
      setError("Pick a membership plan first.");
      return;
    }
    if (!customerName.trim() || !/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter the member's full name and a valid 10-digit phone number.");
      return;
    }
    setSaving(true);
    try {
      await createSubscription({ membershipId: plan._id, customerName: customerName.trim(), phone, amountPaid: Number(amountPaid) || 0 });
      onEnrolled();
    } catch (err) {
      setError(err instanceof ApiError ? err.describe() : "Failed to enroll member");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display font-semibold text-ink">Add Member</p>
          <button onClick={onClose} className="text-ink-faint hover:text-ink">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3">
          {error && <p className="text-xs text-vibe-coral">{error}</p>}
          {memberships.length === 0 ? (
            <p className="text-sm text-ink-faint">Create a membership plan first, then add members to it.</p>
          ) : (
            <div>
              <label className="block text-[11px] font-semibold tracking-wider text-ink-faint uppercase mb-1.5">Membership Plan</label>
              <select
                value={planId}
                onChange={(e) => selectPlan(e.target.value)}
                className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm outline-none focus:border-vibe-violet"
              >
                {memberships.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.name} — ₹{m.price.toLocaleString("en-IN")}
                    {turfName(m.listingId) ? ` (${turfName(m.listingId)})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Input label="Full Name" value={customerName} onChange={setCustomerName} placeholder="Aarav Mehta" />
          <Input label="Phone Number" value={phone} onChange={(v) => setPhone(v.replace(/\D/g, "").slice(0, 10))} placeholder="9812345670" />
          <Input label="Amount Paid (₹)" value={amountPaid} onChange={(v) => setAmountPaid(v.replace(/\D/g, ""))} placeholder={plan ? String(plan.price) : "0"} />
        </div>
        <button
          onClick={handleSubmit}
          disabled={saving || memberships.length === 0}
          className="mt-5 w-full rounded-lg bg-vibe-violet py-2.5 text-sm font-semibold text-white hover:bg-vibe-violetSoft disabled:opacity-60"
        >
          {saving ? "Adding member..." : "Add Member"}
        </button>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
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
