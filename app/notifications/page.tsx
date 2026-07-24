"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Trophy,
  CheckCircle,
  Calendar,
  AlertCircle,
  X,
  Check,
  Zap,
  Info,
} from "lucide-react";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/home/Footer";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/api/notifications";
import {
  getMyRegistrations,
  updateTournamentReminder,
} from "@/lib/api/tournaments";
import type { CustomerNotification, TournamentRegistration } from "@/lib/api/types";

export default function NotificationsPage() {
  const router = useRouter();
  const { status: authStatus } = useCustomerAuth();

  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(true);
  const [updatingReminderId, setUpdatingReminderId] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);

  // Redirect to home if guest
  useEffect(() => {
    if (authStatus === "guest") {
      router.replace("/");
    }
  }, [authStatus, router]);

  // Load notifications
  const loadNotifications = (pageNum = 1) => {
    if (authStatus !== "authenticated") return;
    setLoading(true);
    getNotifications({ page: pageNum, limit: 10 })
      .then((res) => {
        setNotifications(res.items);
        setPage(res.page);
        setTotalPages(res.pages);
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  };

  // Load registrations
  const loadRegistrations = () => {
    if (authStatus !== "authenticated") return;
    setRegistrationsLoading(true);
    getMyRegistrations({ limit: 50, status: "Registered" })
      .then((res) => {
        setRegistrations(res.items);
      })
      .catch(() => setRegistrations([]))
      .finally(() => setRegistrationsLoading(false));
  };

  useEffect(() => {
    if (authStatus === "authenticated") {
      loadNotifications(1);
      loadRegistrations();
    }
  }, [authStatus]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleMarkRead = async (id: string) => {
    try {
      const updated = await markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => (n._id === id ? updated : n)));
      showToast("Notification marked as read");
    } catch {
      showToast("Failed to update notification");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showToast("All notifications marked as read");
    } catch {
      showToast("Failed to mark all as read");
    }
  };

  const handleToggleReminder = async (reg: TournamentRegistration) => {
    setUpdatingReminderId(reg._id);
    const newPreference = !reg.reminderSet;
    try {
      await updateTournamentReminder(reg.orderId, newPreference);
      setRegistrations((prev) =>
        prev.map((r) => (r._id === reg._id ? { ...r, reminderSet: newPreference } : r))
      );
      showToast(
        newPreference
          ? `Reminders enabled for ${reg.teamName}`
          : `Reminders disabled for ${reg.teamName}`
      );
    } catch {
      showToast("Failed to update reminder settings");
    } finally {
      setUpdatingReminderId(null);
    }
  };

  if (authStatus !== "authenticated") {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col justify-between">
      <div>
        <SiteHeader />

        <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
          {/* Toast Notification */}
          {toast && (
            <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-xs font-bold text-white shadow-xl animate-in slide-in-from-bottom-2">
              <Check className="h-4 w-4 text-emerald-400" />
              <span>{toast}</span>
            </div>
          )}

          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Notifications Hub</h1>
              <p className="text-xs text-slate-500 mt-1">Manage tournament alerts, reminder preferences, and system notifications.</p>
            </div>
            
            {notifications.some((n) => !n.read) && (
              <button
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-200 hover:bg-slate-300 px-4 py-2 text-xs font-bold text-slate-700 transition"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* List of Notifications */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-base font-extrabold text-slate-700 mb-2 flex items-center gap-2">
                <Bell className="h-4 w-4 text-brand-500" /> Inbox
              </h2>

              {loading && page === 1 ? (
                <div className="rounded-2xl border border-slate-100 bg-white p-8 text-center text-sm text-slate-500">
                  Loading your inbox notifications…
                </div>
              ) : notifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                  Your inbox is quiet! You don&apos;t have any notifications at the moment.
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((n) => {
                    const isReminder = n.type === "TournamentReminder";
                    return (
                      <div
                        key={n._id}
                        className={`relative overflow-hidden rounded-2xl border transition p-5 flex items-start gap-4 ${
                          n.read
                            ? "border-slate-100 bg-white opacity-85"
                            : "border-brand-100 bg-brand-50/20 shadow-sm"
                        }`}
                      >
                        {!n.read && (
                          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-brand-500" />
                        )}
                        <div
                          className={`rounded-xl p-2.5 shrink-0 ${
                            isReminder
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {isReminder ? (
                            <Trophy className="h-5 w-5" />
                          ) : (
                            <Info className="h-5 w-5" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-bold text-slate-900 truncate">
                              {n.title}
                            </h3>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(n.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                            {n.message}
                          </p>

                          {!n.read && (
                            <button
                              onClick={() => handleMarkRead(n._id)}
                              className="mt-3 text-[10px] font-extrabold text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button
                        disabled={page === 1}
                        onClick={() => loadNotifications(page - 1)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <span className="text-xs text-slate-500">
                        Page {page} of {totalPages}
                      </span>
                      <button
                        disabled={page === totalPages}
                        onClick={() => loadNotifications(page + 1)}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar Reminder Settings */}
            <div className="space-y-4">
              <h2 className="text-base font-extrabold text-slate-700 mb-2 flex items-center gap-2">
                <Zap className="h-4 w-4 text-brand-500" /> Tournament Reminders
              </h2>

              <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  Turn reminders on to receive emails and push notifications 24 hours before your match starts.
                </p>

                {registrationsLoading ? (
                  <p className="text-xs text-slate-400 text-center py-4">Loading your teams…</p>
                ) : registrations.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    You don&apos;t have any active registrations. Register for a tournament to configure alerts.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {registrations.map((reg) => (
                      <div key={reg._id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {reg.teamName}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                            Order #{reg.orderId}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={updatingReminderId === reg._id}
                          onClick={() => handleToggleReminder(reg)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 ${
                            reg.reminderSet ? "bg-brand-500" : "bg-slate-200"
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              reg.reminderSet ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
