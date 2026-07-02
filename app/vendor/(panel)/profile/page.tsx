"use client";

import { useState } from "react";
import { Save, Upload } from "lucide-react";
import { SectionCard } from "@/components/vendor/ui";
import { vendorProfile } from "@/lib/mock-data";

const CATEGORIES = [
  "Turf Owners",
  "Indoor Gaming Zones",
  "Event Organizers",
  "DJ & Sound Partners",
  "Local & Independent Experts",
  "Hospitality & Stay Partners",
];

export default function ProfilePage() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "Turf Owners",
    "Event Organizers",
  ]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat)
        ? prev.filter((c) => c !== cat)
        : prev.length < 5
        ? [...prev, cat]
        : prev
    );
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl2 border border-surface-border bg-white shadow-panel p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 rounded-full border-4 border-vibe-lime flex items-center justify-center text-sm font-display font-semibold text-vibe-violet">
            81%
          </div>
          <div>
            <h1 className="font-display font-semibold text-lg text-ink">User Profile</h1>
            <p className="text-xs text-ink-faint">Complete your profile to get the Verified Badge</p>
            <p className="text-xs font-semibold text-vibe-limeDark mt-0.5">
              ● Verification In Progress
            </p>
          </div>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-vibe-violet px-5 py-2.5 text-sm font-semibold text-white hover:bg-vibe-violetSoft">
          <Save size={16} /> Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SectionCard title="Basic Identity">
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold tracking-wider text-ink-faint uppercase mb-1.5">
                Business Logo
              </label>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-xl bg-cream-300 flex items-center justify-center text-ink-faint">
                  <Upload size={18} />
                </div>
                <div>
                  <button className="rounded-lg border border-surface-border px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-cream-300">
                    Choose file
                  </button>
                  <p className="text-[11px] text-ink-faint mt-1">
                    Recommended: Square PNG/JPG, max 5MB
                  </p>
                </div>
              </div>
            </div>
            <Input label="Vendor Name" defaultValue={vendorProfile.vendorName} />
            <Input label="Business Name" defaultValue={vendorProfile.businessName} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Phone" defaultValue={vendorProfile.phone} />
              <Input label="Email" defaultValue={vendorProfile.email} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold tracking-wider text-ink-faint uppercase mb-1.5">
                  Business Type
                </label>
                <select className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm outline-none focus:border-vibe-violet">
                  <option>Company</option>
                  <option>Individual / Proprietor</option>
                  <option>Partnership</option>
                </select>
              </div>
              <Input label="GST Number" placeholder="Optional" />
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Business Address">
          <div className="space-y-4">
            <Input label="Registered Street Address" defaultValue="MI Road" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="City" defaultValue={vendorProfile.city} />
              <Input label="State / Province" defaultValue={vendorProfile.state} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="PIN / Zip Code" defaultValue="302001" />
              <Input label="Country" defaultValue="India" />
            </div>
          </div>

          <h4 className="font-display font-semibold text-ink text-sm mt-6 mb-3">
            Payout Settings
          </h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Account Number" placeholder="******1234" />
              <Input label="IFSC Code" placeholder="e.g. SBIN0001234" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Bank Name" placeholder="e.g. SBI" />
              <div>
                <label className="block text-[11px] font-semibold tracking-wider text-ink-faint uppercase mb-1.5">
                  Account Type
                </label>
                <select className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm outline-none focus:border-vibe-violet">
                  <option>Select Type</option>
                  <option>Savings</option>
                  <option>Current</option>
                </select>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Master Categories"
        description="Select exactly what your business offers (Max 5)"
        action={
          <span className="text-xs font-semibold rounded-full bg-vibe-violet/10 text-vibe-violet px-3 py-1">
            {selectedCategories.length}/5 Selected
          </span>
        }
      >
        <div className="grid sm:grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => {
            const active = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                  active
                    ? "border-vibe-violet bg-vibe-violet/5 text-vibe-violet font-semibold"
                    : "border-surface-border text-ink-soft hover:bg-cream-300"
                }`}
              >
                {cat}
                <span
                  className={`h-4 w-4 rounded-full border-2 ${
                    active ? "bg-vibe-violet border-vibe-violet" : "border-surface-border"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

function Input({
  label,
  defaultValue,
  placeholder,
}: {
  label: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold tracking-wider text-ink-faint uppercase mb-1.5">
        {label}
      </label>
      <input
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm outline-none focus:border-vibe-violet placeholder:text-ink-faint"
      />
    </div>
  );
}
