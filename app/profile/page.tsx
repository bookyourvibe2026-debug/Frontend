"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Camera, Clock, Download, Mail, Phone, Ticket, Trophy, UserRoundCog, X } from "lucide-react";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";
import { getMyBookings } from "@/lib/api/customerBookings";
import { cancelMyCoachSubscription, getMyCoachSubscriptions } from "@/lib/api/coaches";
import { cancelMyRegistration, getMyRegistrations } from "@/lib/api/tournaments";
import { uploadCustomerImage } from "@/lib/api/uploads";
import { ApiError } from "@/lib/api/client";
import type {
  Booking,
  BookingStatus,
  CoachSubscription,
  CoachSubscriptionStatus,
  TournamentRegistration,
  TournamentRegistrationStatus,
} from "@/lib/api/types";
import { downloadBookingTicket } from "@/lib/ticket";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/home/Footer";

const STATUS_STYLES: Record<BookingStatus, string> = {
  Confirmed: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-700",
  Cancelled: "bg-accent-100 text-accent-600",
  Completed: "bg-slate-100 text-slate-600",
};

const COACH_STATUS_STYLES: Record<CoachSubscriptionStatus, string> = {
  Active: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-accent-100 text-accent-600",
  Expired: "bg-slate-100 text-slate-600",
};

const REGISTRATION_STATUS_STYLES: Record<TournamentRegistrationStatus, string> = {
  Registered: "bg-emerald-100 text-emerald-700",
  Cancelled: "bg-accent-100 text-accent-600",
  Withdrawn: "bg-slate-100 text-slate-600",
};

export default function ProfilePage() {
  const router = useRouter();
  const { customer, status: authStatus, updateProfile } = useCustomerAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [coachSubs, setCoachSubs] = useState<CoachSubscription[]>([]);
  const [coachSubsLoading, setCoachSubsLoading] = useState(true);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(true);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImgError(false);
  }, [customer?.avatarUrl]);

  const getInitials = () => {
    if (customer?.name) {
      const parts = customer.name.trim().split(/\s+/);
      const firstInitial = parts[0]?.charAt(0) || "";
      const lastInitial = parts.length > 1 ? parts[parts.length - 1]?.charAt(0) : "";
      const initials = (firstInitial + lastInitial).toUpperCase();
      if (initials) return initials;
    }
    if (customer?.email) {
      return customer.email.charAt(0).toUpperCase();
    }
    return "?";
  };

  useEffect(() => {
    if (authStatus === "guest") {
      router.replace("/");
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;
    getMyBookings({ limit: 50 })
      .then((res) => setBookings(res.items))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
    getMyCoachSubscriptions({ limit: 50 })
      .then((res) => setCoachSubs(res.items))
      .catch(() => setCoachSubs([]))
      .finally(() => setCoachSubsLoading(false));
    getMyRegistrations({ limit: 50 })
      .then((res) => setRegistrations(res.items))
      .catch(() => setRegistrations([]))
      .finally(() => setRegistrationsLoading(false));
  }, [authStatus]);

  async function handleCancelCoachSubscription(orderId: string) {
    try {
      const updated = await cancelMyCoachSubscription(orderId);
      setCoachSubs((prev) => prev.map((b) => (b.orderId === orderId ? updated : b)));
    } catch {
      // Surfacing this inline would need its own toast plumbing — the button
      // simply stays actionable so the player can retry.
    }
  }

  async function handleCancelRegistration(orderId: string) {
    try {
      const updated = await cancelMyRegistration(orderId);
      setRegistrations((prev) => prev.map((r) => (r.orderId === orderId ? updated : r)));
    } catch {
      // Same as coach-booking cancel above — button stays actionable to retry.
    }
  }

  async function handleAvatarUpload(file: File | undefined) {
    if (!file) return;
    setAvatarUploading(true);
    setAvatarError(null);
    try {
      const { url } = await uploadCustomerImage(file, "customer-avatars");
      await updateProfile({ avatarUrl: url });
    } catch (err) {
      setAvatarError(err instanceof ApiError ? err.describe() : "Failed to upload photo");
    } finally {
      setAvatarUploading(false);
    }
  }

  if (authStatus !== "authenticated" || !customer) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {/* Profile card */}
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-sm sm:flex-row sm:items-center sm:gap-5 sm:text-left">
          <div className="relative shrink-0">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-2xl font-bold text-brand-700 sm:h-16 sm:w-16">
              {customer.avatarUrl && !imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={customer.avatarUrl}
                  alt={customer.name}
                  className="h-full w-full object-cover"
                  onError={() => setImgError(true)}
                />
              ) : (
                getInitials()
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleAvatarUpload(e.target.files?.[0])}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              aria-label="Upload profile photo"
              title="Upload profile photo"
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-white shadow-md ring-2 ring-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">{customer.name}</h1>
            <div className="mt-1 flex flex-col items-center gap-1 text-sm text-slate-500 sm:items-start sm:gap-1.5">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {customer.email}
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {customer.phone}
              </span>
            </div>
            {avatarUploading && <p className="mt-1.5 text-xs text-slate-400">Uploading photo…</p>}
            {avatarError && <p className="mt-1.5 text-xs text-accent-600">{avatarError}</p>}
          </div>
        </div>

        {/* My Tickets */}
        <section className="mt-8 sm:mt-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <Ticket className="h-5 w-5 text-brand-500" /> My Tickets
          </h2>

          {loading ? (
            <p className="text-sm text-slate-500">Loading your bookings…</p>
          ) : bookings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No bookings yet — once you book a venue, your ticket will show up here.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {bookings.map((b) => {
                const dt = new Date(b.dateTime);
                return (
                  <div
                    key={b._id}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-bold text-slate-900">
                          {b.listingTitle ?? "Venue Booking"}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLES[b.status]}`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span>Order #{b.orderId}</span>
                        <span className="font-semibold text-slate-700">₹{b.totalAmount}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => downloadBookingTicket(b)}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:scale-[1.02] sm:w-auto"
                    >
                      <Download className="h-4 w-4" /> Download Ticket
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* My Coaching Subscriptions */}
        <section className="mt-8 sm:mt-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <UserRoundCog className="h-5 w-5 text-brand-500" /> My Coaching
          </h2>

          {coachSubsLoading ? (
            <p className="text-sm text-slate-500">Loading your enrolments…</p>
          ) : coachSubs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              Not enrolled anywhere yet — join a batch from the Coaches page.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {coachSubs.map((b) => (
                <div
                  key={b._id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-bold text-slate-900">{b.batchName}</p>
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold capitalize text-brand-600">{b.plan}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${COACH_STATUS_STYLES[b.status]}`}>
                        {b.status}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(b.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        {b.endDate ? ` – ${new Date(b.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}` : ""}
                      </span>
                      <span>Order #{b.orderId}</span>
                      <span className="font-semibold text-slate-700">₹{b.amount}</span>
                    </div>
                  </div>

                  {b.status === "Active" && (
                    <button
                      onClick={() => handleCancelCoachSubscription(b.orderId)}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent-300 hover:text-accent-600 sm:w-auto"
                    >
                      <X className="h-4 w-4" /> Cancel
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* My Tournament Registrations */}
        <section className="mt-8 sm:mt-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <Trophy className="h-5 w-5 text-brand-500" /> My Tournament Registrations
          </h2>

          {registrationsLoading ? (
            <p className="text-sm text-slate-500">Loading your registrations…</p>
          ) : registrations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
              No tournament registrations yet — register your team from the Tournaments page.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {registrations.map((r) => (
                <div
                  key={r._id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-bold text-slate-900">{r.teamName}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${REGISTRATION_STATUS_STYLES[r.status]}`}>
                        {r.status}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>{r.players.length} player(s)</span>
                      <span>Order #{r.orderId}</span>
                      <span className="font-semibold text-slate-700">₹{r.amount}</span>
                    </div>
                  </div>

                  {r.status === "Registered" && (
                    <button
                      onClick={() => handleCancelRegistration(r.orderId)}
                      className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-accent-300 hover:text-accent-600 sm:w-auto"
                    >
                      <X className="h-4 w-4" /> Cancel Registration
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
