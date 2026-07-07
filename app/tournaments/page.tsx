"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { MobileCard, MobileTopBar } from "@/components/mobile/ui";
import { browsePublicTournaments } from "@/lib/api/tournaments";
import { Tournament } from "@/lib/api/types";

function statusLabel(t: Tournament) {
  if (t.status === "Completed") return "Completed";
  if (t.status === "Ongoing") return "Ongoing";
  if (t.maxTeams && t.spotsLeft === 0) return "Full";
  if (t.maxTeams && t.spotsLeft !== undefined && t.spotsLeft <= 2) return "Filling Fast";
  return "Registration Open";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    browsePublicTournaments({ limit: 24 })
      .then((result) => setTournaments(result.items))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed,_#f8fafc_42%,_#ffffff_78%)]">
      <div className="hidden sm:block">
        <SiteHeader />
      </div>

      <div className="sm:hidden">
        <div className="px-4 pt-4">
          <MobileTopBar />
        </div>
        <main className="flex flex-col gap-5 px-4 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Tournaments</p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
              Competitive events without the clutter.
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Clear dates, prize money, and status — decide in seconds.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {tournaments.map((t) => (
              <MobileCard key={t._id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">
                      {t.category}
                    </p>
                    <h2 className="mt-1 text-base font-extrabold text-slate-950">{t.title}</h2>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                    {statusLabel(t)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-brand-50 px-3 py-1.5 font-semibold text-brand-700">
                    {formatDate(t.startDate)}
                  </span>
                  {!!t.prizeMoney && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">
                      Prize ₹{t.prizeMoney.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
                <Link
                  href={`/tournaments/${t._id}`}
                  className="rounded-full bg-slate-950 px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  View & Register
                </Link>
              </MobileCard>
            ))}
            {!loading && tournaments.length === 0 && (
              <p className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">
                No tournaments live right now. Check back soon.
              </p>
            )}
          </div>
        </main>
      </div>

      <main className="mx-auto hidden max-w-7xl px-4 py-10 sm:block sm:px-6 sm:py-14">
        <section className="rounded-[2rem] bg-gradient-to-br from-brand-500 via-accent-500 to-fuchsia-600 p-6 text-white shadow-[0_30px_90px_rgba(249,115,22,0.22)] sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/75">
            Tournaments
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Competitive events without the clutter.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/85 sm:text-base">
            Discover tournaments that feel organized from the first look. Clear dates, prize
            money, and the exact status you need to decide quickly.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              Multi-sport calendar
            </span>
            <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              Easy registration
            </span>
            <span className="rounded-full bg-white/15 px-4 py-2 text-sm font-semibold backdrop-blur">
              Prize pool highlights
            </span>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          {tournaments.map((t) => (
            <article
              key={t._id}
              className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">
                    {t.category}
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">{t.title}</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {statusLabel(t)}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="rounded-full bg-brand-50 px-4 py-2 font-semibold text-brand-700">
                  {formatDate(t.startDate)}
                </span>
                {!!t.prizeMoney && (
                  <span className="rounded-full bg-emerald-50 px-4 py-2 font-semibold text-emerald-700">
                    Prize ₹{t.prizeMoney.toLocaleString("en-IN")}
                  </span>
                )}
                <span className="rounded-full bg-slate-100 px-4 py-2 font-semibold text-slate-700">
                  {t.city}
                </span>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                  {t.maxTeams ? `${t.registeredTeamsCount}/${t.maxTeams} teams registered` : "Best suited for competitive squads."}
                </p>
                <Link
                  href={`/tournaments/${t._id}`}
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500"
                >
                  View & Register
                </Link>
              </div>
            </article>
          ))}
          {!loading && tournaments.length === 0 && (
            <p className="col-span-full rounded-[1.75rem] border border-slate-100 bg-white p-10 text-center text-sm text-slate-500">
              No tournaments live right now. Check back soon.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
