"use client";

import { useState } from "react";
import { PageHero, SectionCard, Badge } from "@/components/vendor/ui";
import { moduleMeta, vendorRoles } from "@/lib/mock-data";
import { ModulePermissionKey } from "@/lib/types";
import { ShieldCheck, ShieldPlus, UserRoundPlus } from "lucide-react";

type PermState = Record<ModulePermissionKey, { view: boolean; create: boolean; edit: boolean; delete: boolean }>;

const emptyPermissions: PermState = {
  dashboard: { view: false, create: false, edit: false, delete: false },
  bookings: { view: false, create: false, edit: false, delete: false },
  listings: { view: false, create: false, edit: false, delete: false },
  earnings: { view: false, create: false, edit: false, delete: false },
  verification: { view: false, create: false, edit: false, delete: false },
  settings: { view: false, create: false, edit: false, delete: false },
};

export default function RoleAccessPage() {
  const [permissions, setPermissions] = useState<PermState>(emptyPermissions);

  const toggle = (moduleKey: ModulePermissionKey, action: keyof PermState[ModulePermissionKey]) => {
    setPermissions((prev) => ({
      ...prev,
      [moduleKey]: { ...prev[moduleKey], [action]: !prev[moduleKey][action] },
    }));
  };

  const selectedCount = Object.values(permissions).reduce(
    (sum, mod) => sum + Object.values(mod).filter(Boolean).length,
    0
  );
  const totalPossible = moduleMeta.reduce((sum, m) => sum + m.toggles.length, 0);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Team Access"
        title="Role access management"
        description="Apni vendor team ke liye multiple roles banao, module-wise permissions do, aur access control maintain karo."
        right={
          <span className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold">
            <ShieldCheck size={16} /> {vendorRoles.length} Active Role(s)
          </span>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SectionCard
          title="Create New Role"
          description="Role holder details bharo aur module-wise View, Create, Edit, Delete permissions do."
          className="lg:col-span-2"
        >
          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <Input label="Role Name" placeholder="Booking Manager" />
            <Input label="Role Holder Name" placeholder="Rahul Verma" />
            <Input label="Role Holder Email" placeholder="roleholder@gmail.com" />
            <Input label="Role Holder Phone" placeholder="9876543210" />
          </div>

          <div className="rounded-xl border border-surface-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-cream-200/60 text-left text-[11px] uppercase tracking-wide text-ink-faint">
                  <th className="px-4 py-3 font-semibold">Module</th>
                  <th className="px-4 py-3 font-semibold text-center">View</th>
                  <th className="px-4 py-3 font-semibold text-center">Create</th>
                  <th className="px-4 py-3 font-semibold text-center">Edit</th>
                  <th className="px-4 py-3 font-semibold text-center">Delete</th>
                </tr>
              </thead>
              <tbody>
                {moduleMeta.map((mod) => (
                  <tr key={mod.key} className="border-t border-surface-border">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{mod.label}</p>
                      <p className="text-[11px] text-ink-faint">{mod.description}</p>
                    </td>
                    {(["view", "create", "edit", "delete"] as const).map((action) => (
                      <td key={action} className="px-4 py-3 text-center">
                        {mod.toggles.includes(action) ? (
                          <input
                            type="checkbox"
                            checked={permissions[mod.key][action]}
                            onChange={() => toggle(mod.key, action)}
                            className="h-4 w-4 accent-vibe-violet cursor-pointer"
                          />
                        ) : (
                          <span className="text-ink-faint">–</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-5">
            <button
              onClick={() => setPermissions(emptyPermissions)}
              className="rounded-lg border border-surface-border px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-cream-300"
            >
              Reset
            </button>
            <div className="flex items-center gap-4">
              <p className="text-xs text-ink-faint">
                Selected Permissions: {selectedCount} / {totalPossible}
              </p>
              <button className="inline-flex items-center gap-2 rounded-lg bg-vibe-violet px-5 py-2.5 text-sm font-semibold text-white hover:bg-vibe-violetSoft">
                <UserRoundPlus size={16} /> Create Role
              </button>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Role Guidelines" description="Ready-to-use rules to keep your team access secure.">
          <div className="space-y-3">
            <GuidelineCard
              tone="info"
              title="Least Privilege"
              text="Har role holder ko sirf required modules ka access do."
            />
            <GuidelineCard
              tone="success"
              title="Role Segregation"
              text="Bookings, listings aur earnings roles alag rakhne se misuse risk kam hota hai."
            />
            <GuidelineCard
              tone="pending"
              title="Periodic Review"
              text="Monthly basis par inactive ya ex-team member roles revoke karo."
            />
          </div>

          <div className="mt-5 rounded-xl border border-surface-border p-4">
            <p className="text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
              Current Role Count
            </p>
            <p className="mt-1 font-display text-3xl font-semibold text-ink">
              {vendorRoles.length}
            </p>
            <p className="text-xs text-ink-faint mt-1">
              Active: {vendorRoles.filter((r) => r.status === "Active").length} | Inactive:{" "}
              {vendorRoles.filter((r) => r.status === "Inactive").length}
            </p>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Role Holders" description="Team members with access to this vendor account.">
        <div className="divide-y divide-surface-border">
          {vendorRoles.map((role) => (
            <div key={role.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="flex items-center gap-3">
                <span className="h-10 w-10 rounded-full bg-vibe-violet/10 text-vibe-violet flex items-center justify-center">
                  <ShieldPlus size={16} />
                </span>
                <div>
                  <p className="font-medium text-ink text-sm">{role.holderName}</p>
                  <p className="text-xs text-ink-faint">
                    {role.roleName} · {role.holderEmail}
                  </p>
                </div>
              </div>
              <Badge tone={role.status === "Active" ? "success" : "neutral"}>{role.status}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

function Input({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold tracking-wider text-ink-faint uppercase mb-1.5">
        {label}
      </label>
      <input
        placeholder={placeholder}
        className="w-full rounded-lg border border-surface-border px-3 py-2.5 text-sm outline-none focus:border-vibe-violet placeholder:text-ink-faint"
      />
    </div>
  );
}

function GuidelineCard({
  tone,
  title,
  text,
}: {
  tone: "info" | "success" | "pending";
  title: string;
  text: string;
}) {
  const toneMap = {
    info: "bg-vibe-violet/5 border-vibe-violet/20",
    success: "bg-lime-50 border-lime-200",
    pending: "bg-amber-50 border-amber-200",
  } as const;
  return (
    <div className={`rounded-xl border p-4 ${toneMap[tone]}`}>
      <p className="text-sm font-semibold text-ink">{title}</p>
      <p className="text-xs text-ink-soft mt-1">{text}</p>
    </div>
  );
}
