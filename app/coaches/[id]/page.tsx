"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Award, Clock, UserRoundCog } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { CoachBookingFlow } from "@/components/coach/CoachBookingFlow";
import { getPublicCoachById } from "@/lib/api/coaches";
import { ApiError } from "@/lib/api/client";
import { Coach, CoachSlot } from "@/lib/api/types";

export default function CoachDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<CoachSlot | null>(null);

  useEffect(() => {
    getPublicCoachById(id)
      .catch((err) => {
        if (!(err instanceof ApiError)) throw err;
        return null;
      })
      .then(setCoach)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center text-sm text-slate-400">Loading coach...</div>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="min-h-screen bg-slate-50">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <UserRoundCog className="mx-auto h-16 w-16 text-slate-300" />
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900">Coach not found</h1>
          <p className="mt-2 text-sm text-slate-500">This coach may no longer be listed.</p>
          <Link
            href="/coaches"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" /> Browse all coaches
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href="/coaches"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" /> Back to coaches
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-slate-100">
                  {coach.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coach.photoUrl} alt={coach.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-lg font-bold text-slate-500">
                      {coach.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900">{coach.name}</h1>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-brand-600">
                    {coach.category}
                    {coach.subCategory ? ` · ${coach.subCategory}` : ""}
                  </p>
                  {typeof coach.experienceYears === "number" && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <Award className="h-3.5 w-3.5" /> {coach.experienceYears} years of experience
                    </p>
                  )}
                </div>
              </div>
              {coach.bio && <p className="mt-4 text-sm leading-relaxed text-slate-600">{coach.bio}</p>}
            </section>

            <section className="mt-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                <Clock className="h-5 w-5 text-brand-500" /> Open Slots
              </h2>
              {coach.slots.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No open slots right now — check back soon.</p>
              ) : (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {coach.slots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedSlot(slot)}
                      className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                    >
                      {new Date(slot.date).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" })}
                      <br />
                      <span className="text-xs font-medium text-slate-500">
                        {slot.startTime} – {slot.endTime}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Fee per session</p>
              <p className="mt-1 text-2xl font-black text-slate-900">₹{coach.fees.toLocaleString("en-IN")}</p>
              <p className="mt-3 text-sm text-slate-500">
                Pick an open slot on the left, then confirm your booking here.
              </p>
              <p className="mt-4 text-xs text-slate-400">
                {coach.slots.length} open slot{coach.slots.length === 1 ? "" : "s"} available
              </p>
            </div>
          </div>
        </div>
      </main>

      {selectedSlot && <CoachBookingFlow coach={coach} slot={selectedSlot} onClose={() => setSelectedSlot(null)} />}
    </div>
  );
}
