import { Boxes, CalendarDays, Clock3, IndianRupee, Pencil } from "lucide-react";
import StatCard from "@/components/vendor/StatCard";
import { PageHero, SectionCard, Badge } from "@/components/vendor/ui";
import { vendorProfile, listings, bookings } from "@/lib/mock-data";

export default function DashboardPage() {
  const activeListings = listings.filter((l) => l.status === "Active").length;
  const totalBookings = bookings.length;
  const awaiting = bookings.filter((b) => b.status === "Pending").length;
  const revenue = bookings.reduce((sum, b) => sum + b.yourEarning, 0);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Vendor Portal"
        title={vendorProfile.vendorName}
        description="Manage your turfs, games & events, track bookings, monitor revenue, and keep your business moving smoothly."
        right={
          <>
            <div className="rounded-xl bg-white/10 px-4 py-2.5 min-w-[140px]">
              <p className="text-[10px] uppercase tracking-wide text-white/70">Status</p>
              <p className="text-sm font-semibold mt-0.5">Active Vendor</p>
            </div>
            <div className="rounded-xl bg-white/10 px-4 py-2.5 min-w-[140px]">
              <p className="text-[10px] uppercase tracking-wide text-white/70">Verified</p>
              <p className="text-sm font-semibold mt-0.5">Confirmed</p>
            </div>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Active Listings"
          value={String(activeListings)}
          hint="Currently live turfs, games & events"
          icon={Boxes}
          accent="violet"
        />
        <StatCard
          label="Total Bookings"
          value={String(totalBookings)}
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
          value={`₹${revenue.toLocaleString("en-IN")}`}
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
            <Field label="Vendor Name" value={vendorProfile.vendorName} />
            <Field label="Business Name" value={vendorProfile.businessName} />
            <Field label="Contact Number" value={vendorProfile.phone} />
            <Field label="Email Address" value={vendorProfile.email} />
            <Field label="Business Category" value={vendorProfile.businessCategory} />
            <Field label="Location" value={`${vendorProfile.city}, ${vendorProfile.state}`} />
          </div>
        </SectionCard>

        <SectionCard title="Account Health">
          <div className="space-y-4">
            <HealthRow label="Onboarding" tone="success" text="Approved" />
            <HealthRow label="Account Status" tone="success" text="Active" />
            <HealthRow label="Verification" tone="success" text="Confirmed" />
            <div className="pt-2 border-t border-surface-border">
              <Field label="Member Since" value={vendorProfile.memberSince} />
            </div>
            <Field label="Approved On" value={vendorProfile.approvedOn} />
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
