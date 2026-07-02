"use client";

import { useState } from "react";
import { Pencil, Plus, ShieldCheck, Trash2, X } from "lucide-react";
import { Badge } from "@/components/vendor/ui";
import { Toast } from "@/components/admin/Toast";
import { getAdminSubUsers, saveAdminSubUsers, superAdminEmail } from "@/lib/admin-mock-data";
import { AdminSubUser } from "@/lib/types";

const ROLE_OPTIONS = ["SUB_ADMIN", "IT MANAGER", "FINANCE ROLE", "FINANCE", "MARKETING", "SALES"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminSubUser[]>(() => getAdminSubUsers());
  const [adminEmail, setAdminEmail] = useState(superAdminEmail);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState(adminEmail);
  const [modalUser, setModalUser] = useState<AdminSubUser | null | "new">(null);
  const [toast, setToast] = useState<string | null>(null);

  function persist(next: AdminSubUser[]) {
    setUsers(next);
    saveAdminSubUsers(next);
  }

  function handleRemove(id: string) {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    if (!window.confirm(`Remove ${user.name} from admin directory?`)) return;
    persist(users.filter((u) => u.id !== id));
    setToast(`Removed ${user.name}`);
  }

  function handleSaveUser(user: AdminSubUser) {
    if (users.some((u) => u.id === user.id)) {
      persist(users.map((u) => (u.id === user.id ? user : u)));
      setToast(`Updated ${user.name}`);
    } else {
      persist([...users, user]);
      setToast(`Created ${user.name}`);
    }
    setModalUser(null);
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-ink-faint">Admin / Admin Dashboard / Users</p>
        <div className="mt-1 flex items-center gap-2">
          <h1 className="font-display text-xl font-semibold text-ink">Users</h1>
          <Badge tone="info">Logged in as: Super Admin</Badge>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded-xl2 border border-surface-border bg-white p-5 shadow-panel sm:flex-row sm:items-end sm:justify-between">
        <div className="flex-1">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Admin Email</p>
          {editingEmail ? (
            <div className="flex gap-2">
              <input
                value={emailDraft}
                onChange={(e) => setEmailDraft(e.target.value)}
                className="w-full max-w-sm rounded-lg border border-surface-border bg-cream-200/40 px-3 py-2 text-sm outline-none focus:border-vibe-violet"
              />
              <button
                onClick={() => {
                  setAdminEmail(emailDraft);
                  setEditingEmail(false);
                  setToast("Admin email updated");
                }}
                className="rounded-lg bg-vibe-violet px-3.5 py-2 text-xs font-semibold text-white"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEmailDraft(adminEmail);
                  setEditingEmail(false);
                }}
                className="rounded-lg border border-surface-border px-3.5 py-2 text-xs font-semibold text-ink-soft"
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <input
                readOnly
                value={adminEmail}
                className="w-full max-w-sm rounded-lg border border-surface-border bg-cream-200/40 px-3 py-2 text-sm text-ink-soft"
              />
              <button
                onClick={() => setEditingEmail(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3.5 py-2 text-xs font-semibold text-white"
              >
                <Pencil size={13} /> Edit
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => setModalUser("new")}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          <Plus size={15} /> Create
        </button>
      </div>

      <div className="rounded-xl2 border border-surface-border bg-white shadow-panel">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <p className="font-display font-semibold text-ink">Admin Directory</p>
            <p className="text-xs text-ink-faint">Manage sub-admin records, roles, and access.</p>
          </div>
          <Badge tone="neutral">{users.length} records</Badge>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-ink text-xs font-semibold uppercase tracking-wider text-white">
                <th className="px-5 py-3">#</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Edit</th>
                <th className="px-5 py-3">Remove</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className="border-b border-surface-border last:border-0">
                  <td className="px-5 py-3 text-ink-faint">{i + 1}</td>
                  <td className="px-5 py-3 font-semibold text-ink">{u.name}</td>
                  <td className="px-5 py-3 text-ink-soft">{u.email}</td>
                  <td className="px-5 py-3">
                    <Badge tone="info">{u.role}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => setModalUser(u)} className="font-semibold text-vibe-violet hover:underline">
                      Edit
                    </button>
                  </td>
                  <td className="px-5 py-3 pb-5">
                    <button
                      onClick={() => handleRemove(u.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-vibe-coral/10 px-2.5 py-1.5 text-xs font-semibold text-vibe-coral hover:bg-vibe-coral/20"
                    >
                      <Trash2 size={12} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalUser && (
        <SubUserModal
          user={modalUser === "new" ? null : modalUser}
          onClose={() => setModalUser(null)}
          onSave={handleSaveUser}
        />
      )}

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}

function SubUserModal({
  user,
  onClose,
  onSave,
}: {
  user: AdminSubUser | null;
  onClose: () => void;
  onSave: (user: AdminSubUser) => void;
}) {
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState(user?.role ?? ROLE_OPTIONS[0]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="flex items-center gap-1.5 font-display font-semibold text-ink">
            <ShieldCheck size={16} className="text-vibe-violet" /> {user ? "Edit Sub-Admin" : "Create Sub-Admin"}
          </p>
          <button onClick={onClose} className="text-ink-faint hover:text-ink">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-vibe-violet" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-vibe-violet" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-vibe-violet">
              {ROLE_OPTIONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={() => {
            if (!name.trim() || !email.trim()) return;
            onSave({
              id: user?.id ?? `au-${Date.now()}`,
              name: name.trim(),
              email: email.trim(),
              role,
              status: "Active",
            });
          }}
          className="mt-5 w-full rounded-lg bg-vibe-violet py-2.5 text-sm font-semibold text-white hover:bg-vibe-violetSoft"
        >
          {user ? "Save Changes" : "Create Sub-Admin"}
        </button>
      </div>
    </div>
  );
}
