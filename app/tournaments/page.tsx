import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { MobileCard, MobileTopBar } from "@/components/mobile/ui";

export const metadata = {
  title: "Tournaments | Book Your Vibe",
  description: "Browse upcoming tournaments and competitive events.",
};

const TOURNAMENTS = [
  { name: "Weekend Cricket Cup", sport: "Cricket", date: "Sat, 12 Jul", prize: "₹25,000", status: "Registration Open" },
  { name: "City Badminton Ladder", sport: "Badminton", date: "Sun, 13 Jul", prize: "₹10,000", status: "Filling Fast" },
  { name: "Pickleball Sprint Series", sport: "Pickleball", date: "Fri, 18 Jul", prize: "₹7,500", status: "New" },
  { name: "Football Turf League", sport: "Football", date: "Sun, 20 Jul", prize: "₹30,000", status: "Registration Open" },
];

export default function TournamentsPage() {
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
            {TOURNAMENTS.map((event) => (
              <MobileCard key={event.name} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">
                      {event.sport}
                    </p>
                    <h2 className="mt-1 text-base font-extrabold text-slate-950">{event.name}</h2>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                    {event.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-brand-50 px-3 py-1.5 font-semibold text-brand-700">
                    {event.date}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">
                    Prize {event.prize}
                  </span>
                </div>
                <Link
                  href="/community"
                  className="rounded-full bg-slate-950 px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Register interest
                </Link>
              </MobileCard>
            ))}
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
          {TOURNAMENTS.map((event) => (
            <article
              key={event.name}
              className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">
                    {event.sport}
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">{event.name}</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                  {event.status}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <span className="rounded-full bg-brand-50 px-4 py-2 font-semibold text-brand-700">
                  {event.date}
                </span>
                <span className="rounded-full bg-emerald-50 px-4 py-2 font-semibold text-emerald-700">
                  Prize {event.prize}
                </span>
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">Best suited for competitive players and squads.</p>
                <Link
                  href="/community"
                  className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-500"
                >
                  Register interest
                </Link>
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
