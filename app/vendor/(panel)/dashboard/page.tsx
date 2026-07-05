"use client";

import { useEffect, useState } from "react";
import { Boxes, CalendarDays, Clock3, IndianRupee, Pencil } from "lucide-react";
import StatCard from "@/components/vendor/StatCard";
import { PageHero, SectionCard, Badge } from "@/components/vendor/ui";
import { getVendorDashboard, getVendorProfile } from "@/lib/api/vendor";
import { ApiError } from "@/lib/api/client";
import { Vendor, VendorDashboard } from "@/lib/api/types";

export default function DashboardPage() {
  const [profile, setProfile] = useState<Vendor | null>(null);
  const [dashboard, setDashboard] = useState<VendorDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getVendorProfile(), getVendorDashboard()])
      .then(([p, d]) => {
        setProfile(p);
        setDashboard(d);
      })
      .catch((err) => setError(err instanceof ApiError ? err.describe() : "Failed to load dashboard"));
  }, []);

  if (error) {
    return <div className="rounded-xl2 border border-surface-border bg-white p-10 text-center text-sm text-vibe-coral">{error}</div>;
  }

  if (!profile || !dashboard) {
    return <div className="rounded-xl2 border border-surface-border bg-white p-10 text-center text-sm text-ink-faint">Loading dashboard...</div>;
  }

  const awaiting = dashboard.bookingsByStatus.Pending ?? 0;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Vendor Portal"
        title={profile.businessName}
        description="Manage your turfs, games & events, track bookings, monitor revenue, and keep your business moving smoothly."
        right={
          <>
            <div className="rounded-xl bg-white/10 px-4 py-2.5 min-w-[140px]">
              <p className="text-[10px] uppercase tracking-wide text-white/70">Status</p>
              <p className="text-sm font-semibold mt-0.5 capitalize">{profile.status}</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-2.5 min-w-[140px]">
              <p className="text-[10px] uppercase tracking-wide text-white/70">Verified</p>
              <p className="text-sm font-semibold mt-0.5">{profile.status === "approved" ? "Confirmed" : "Pending"}</p>
            </div>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Active Listings"
          value={String(dashboard.activeListingsCount)}
          hint="Currently live turfs, games & events"
          icon={Boxes}
          accent="violet"
        />
        <StatCard
          label="Total Bookings"
          value={String(Object.values(dashboard.bookingsByStatus).reduce((sum, n) => sum + (n ?? 0), 0))}
          hint="All customer reservations"
          icon={CalendarDays}
          accent="lime"
        />
        <StatCard
          label="Awaiting Confirmation"
          value={String(awaiting)}
          hint="Need your response soon"
          icon={Clock3}
          accent="amber"
        />
        <StatCard
          label="Revenue Earned"
          value={`₹${dashboard.totalEarnings.toLocaleString("en-IN")}`}
          hint="Net earnings till today"
          icon={IndianRupee}
          accent="coral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard
          title="Business Details"
          className="lg:col-span-2"
          action={
            <button className="h-9 w-9 rounded-full border border-surface-border flex items-center justify-center text-ink-faint hover:text-vibe-violet hover:border-vibe-violet transition-colors">
              <Pencil size={15} />
            </button>
          }
        >
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
            <Field label="Owner Name" value={profile.ownerName} />
            <Field label="Business Name" value={profile.businessName} />
            <Field label="Contact Number" value={profile.phone} />
            <Field label="Email Address" value={profile.email} />
            <Field label="Location" value={`${profile.city ?? "—"}, ${profile.state}`} />
          </div>
        </SectionCard>

        <SectionCard title="Account Health">
          <div className="space-y-4">
            <HealthRow label="Onboarding" tone={profile.status === "approved" ? "success" : "pending"} text={profile.status === "approved" ? "Approved" : "Pending"} />
            <HealthRow label="Account Status" tone={profile.status === "suspended" ? "danger" : "success"} text={profile.status === "suspended" ? "Suspended" : "Active"} />
            <HealthRow label="Verification" tone={profile.status === "approved" ? "success" : "pending"} text={profile.status === "approved" ? "Confirmed" : "Awaiting"} />
            <div className="pt-2 border-t border-surface-border">
              <Field label="Member Since" value={new Date(profile.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })} />
            </div>
            <Field
              label="Approved On"
              value={profile.approvedOn ? new Date(profile.approvedOn).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
            />
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

function HealthRow({
  label,
  text,
  tone,
}: {
  label: string;
  text: string;
  tone: "success" | "pending" | "danger";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink-soft">{label}</span>
      <Badge tone={tone}>{text}</Badge>
    </div>
  );
}
