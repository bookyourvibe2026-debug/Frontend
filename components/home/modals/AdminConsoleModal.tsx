"use client";

import { useState } from "react";
import { FolderOpen, Image as ImageIcon, ScrollText, User, X } from "lucide-react";
import type { Role } from "../types";
import { PrimaryButton } from "../ui";
import { inputClass } from "./ModalShell";

type Banner = { id: string; title: string; placement: string; active: boolean };
type AdminUser = { id: string; name: string; role: Role; status: "Active" | "Frozen" };

const INITIAL_BANNERS: Banner[] = [
  { id: "b1", title: "Flat 20% Off - Festival Sale", placement: "Player Home", active: true },
  { id: "b2", title: "Pickleball Launch Week", placement: "Offers Tab", active: true },
  { id: "b3", title: "Refer & Earn ₹100", placement: "Player Home", active: false },
];

const INITIAL_USERS: AdminUser[] = [
  { id: "u1", name: "Yashank Rajawat", role: "owner", status: "Active" },
  { id: "u2", name: "Lakshya Raj Audichya", role: "food", status: "Active" },
  { id: "u3", name: "Aman Sharma", role: "player", status: "Active" },
  { id: "u4", name: "Riya Verma", role: "player", status: "Frozen" },
];

export function AdminConsoleModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"banners" | "users" | "master" | "audit">("banners");
  const [banners, setBanners] = useState<Banner[]>(INITIAL_BANNERS);
  const [users, setUsers] = useState<AdminUser[]>(INITIAL_USERS);
  const [newBannerTitle, setNewBannerTitle] = useState("");
  const [newBannerPlacement, setNewBannerPlacement] = useState("Player Home");
  const [sports, setSports] = useState<string[]>([
    "Cricket",
    "Badminton",
    "Pickleball",
    "Tennis",
    "Swimming",
  ]);
  const [newSport, setNewSport] = useState("");
  const [auditLog, setAuditLog] = useState<string[]>([
    "Admin created banner 'Flat 20% Off'",
    "Admin froze user Riya Verma",
  ]);

  const logAction = (msg: string) => setAuditLog((prev) => [msg, ...prev]);

  const addBanner = () => {
    if (!newBannerTitle) return;
    const banner: Banner = {
      id: `b${Date.now()}`,
      title: newBannerTitle,
      placement: newBannerPlacement,
      active: true,
    };
    setBanners((prev) => [banner, ...prev]);
    logAction(`Admin created banner '${newBannerTitle}' on ${newBannerPlacement}`);
    setNewBannerTitle("");
    // TODO: POST /api/admin/banners
  };

  const toggleBanner = (id: string) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, active: !b.active } : b))
    );
    const b = banners.find((x) => x.id === id);
    if (b) logAction(`Admin ${b.active ? "disabled" : "enabled"} banner '${b.title}'`);
  };

  const removeBanner = (id: string) => {
    const b = banners.find((x) => x.id === id);
    setBanners((prev) => prev.filter((x) => x.id !== id));
    if (b) logAction(`Admin removed banner '${b.title}'`);
  };

  const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === "Active" ? "Frozen" : "Active" } : u
      )
    );
    const u = users.find((x) => x.id === id);
    if (u) logAction(`Admin ${u.status === "Active" ? "froze" : "unfroze"} user '${u.name}'`);
    // TODO: PATCH /api/admin/users/:id
  };

  const addSport = () => {
    if (!newSport) return;
    setSports((prev) => [...prev, newSport]);
    logAction(`Admin added sport category '${newSport}'`);
    setNewSport("");
  };

  const removeSport = (s: string) => {
    setSports((prev) => prev.filter((x) => x !== s));
    logAction(`Admin removed sport category '${s}'`);
  };

  const roleBadge = (role: Role) => {
    const map: Record<Role, string> = {
      player: "bg-blue-100 text-blue-700",
      owner: "bg-emerald-100 text-emerald-700",
      food: "bg-amber-100 text-amber-700",
    };
    const label: Record<Role, string> = {
      player: "Player",
      owner: "Venue Owner",
      food: "Food Owner",
    };
    return (
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${map[role]}`}>
        {label[role]}
      </span>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-[100dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:h-[90vh] sm:rounded-3xl"
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-orange-500">
              Internal · Ops Only
            </p>
            <h2 className="text-xl font-extrabold text-slate-900">Master Admin Console</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
          {/* sidebar tabs */}
          <div className="hidden w-48 flex-col gap-1 border-r border-slate-100 p-4 sm:flex">
            {[
              { id: "banners", label: "Banner CMS", icon: ImageIcon },
              { id: "users", label: "User Editor", icon: User },
              { id: "master", label: "Master Data", icon: FolderOpen },
              { id: "audit", label: "Audit Log", icon: ScrollText },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                  tab === t.id
                    ? "bg-orange-50 text-orange-600"
                    : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </div>

          {/* mobile tab bar */}
          <div className="flex w-full gap-1 overflow-x-auto border-b border-slate-100 p-2 sm:hidden">
            {[
              { id: "banners", label: "Banners" },
              { id: "users", label: "Users" },
              { id: "master", label: "Master Data" },
              { id: "audit", label: "Audit" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                  tab === t.id ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-500"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {tab === "banners" && (
              <div className="flex flex-col gap-5">
                <div className="rounded-2xl border border-dashed border-orange-300 bg-orange-50 p-4">
                  <p className="mb-3 text-sm font-bold text-slate-800">
                    Add new banner (drag-and-drop image upload simulated)
                  </p>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      value={newBannerTitle}
                      onChange={(e) => setNewBannerTitle(e.target.value)}
                      placeholder="Banner title"
                      className={`${inputClass} sm:flex-1`}
                    />
                    <select
                      value={newBannerPlacement}
                      onChange={(e) => setNewBannerPlacement(e.target.value)}
                      className={`${inputClass} sm:w-48`}
                    >
                      <option>Player Home</option>
                      <option>Offers Tab</option>
                      <option>Events Tab</option>
                    </select>
                    <PrimaryButton onClick={addBanner}>Add Banner</PrimaryButton>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  {banners.map((b) => (
                    <div
                      key={b.id}
                      className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-14 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-rose-400 text-white">
                          <ImageIcon className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{b.title}</p>
                          <p className="text-xs text-slate-500">Placement: {b.placement}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          onClick={() => toggleBanner(b.id)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            b.active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {b.active ? "Active" : "Disabled"}
                        </button>
                        <button
                          onClick={() => removeBanner(b.id)}
                          className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "users" && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-500">
                  Edit any field, freeze/unfreeze accounts, or change role assignment.
                </p>
                {users.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-col gap-3 rounded-xl border border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-600">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{u.name}</p>
                        <div className="mt-1">{roleBadge(u.role)}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleUserStatus(u.id)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        u.status === "Active"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-600"
                      }`}
                    >
                      {u.status}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {tab === "master" && (
              <div className="flex flex-col gap-5">
                <p className="text-sm text-slate-500">
                  Manage sport categories shown across the Player, Owner and Food apps.
                </p>
                <div className="flex gap-2">
                  <input
                    value={newSport}
                    onChange={(e) => setNewSport(e.target.value)}
                    placeholder="New sport / category name"
                    className={`${inputClass} flex-1`}
                  />
                  <PrimaryButton onClick={addSport}>Add</PrimaryButton>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sports.map((s) => (
                    <span
                      key={s}
                      className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700"
                    >
                      {s}
                      <button
                        onClick={() => removeSport(s)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {tab === "audit" && (
              <div className="flex flex-col gap-2">
                <p className="mb-2 text-sm text-slate-500">
                  Read-only trail of every admin action, for compliance & traceability.
                </p>
                {auditLog.map((entry, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-sm text-slate-700"
                  >
                    <span className="h-2 w-2 rounded-full bg-orange-500" />
                    {entry}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
