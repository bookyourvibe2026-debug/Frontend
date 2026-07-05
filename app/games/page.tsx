import Image from "next/image";
import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { MobileCard, MobileTopBar } from "@/components/mobile/ui";

export const metadata = {
  title: "Find Your Games | Book Your Vibe",
  description: "Explore sports categories and discover nearby venues.",
};

const SPORTS = [
  { id: "box-cricket", label: "Box Cricket", image: "/bat.png", note: "Fast bookings, turf-friendly" },
  { id: "football", label: "Football", image: "/football.png", note: "Turf matches and friendly kickoffs" },
  { id: "badminton", label: "Badminton", image: "/badminton.png", note: "Indoor courts, live availability" },
  { id: "pickleball", label: "Pickleball", image: "/pickball.png", note: "Trending now with limited slots" },
  { id: "cricket-nets", label: "Cricket Nets", image: "/nets.png", note: "Practice sessions and coaching" },
  { id: "tennis", label: "Tennis", image: "/tennis.png", note: "Singles, doubles, and coaching" },
  { id: "table-tennis", label: "Table Tennis", image: "/tabletennis.png", note: "Quick rallies, fun evenings" },
];

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eff6ff,_#f8fafc_40%,_#ffffff_75%)]">
      <div className="hidden sm:block">
        <SiteHeader />
      </div>

      <div className="sm:hidden">
        <div className="px-4 pt-4">
          <MobileTopBar />
        </div>
        <main className="flex flex-col gap-5 px-4 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">
              Find Your Games
            </p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
              Pick a sport, then jump to the right venue.
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Browse what&rsquo;s popular right now and move into booking fast.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {SPORTS.map((sport) => (
              <Link key={sport.id} href="/venues">
                <MobileCard className="flex items-center gap-4">
                  <div className="relative h-16 w-16 shrink-0 rounded-full bg-gradient-to-b from-slate-50 to-slate-100">
                    <Image src={sport.image} alt={sport.label} fill className="object-contain p-2" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-extrabold text-slate-950">{sport.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{sport.note}</p>
                  </div>
                </MobileCard>
              </Link>
            ))}
          </div>
        </main>
      </div>

      <main className="mx-auto hidden max-w-7xl px-4 py-10 sm:block sm:px-6 sm:py-14">
        <section className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white/80 p-6 shadow-[0_20px_80px_rgba(148,163,184,0.18)] backdrop-blur sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-600">
                Find Your Games
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Pick a sport, then jump straight to the right venue.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                We keep the decision simple. Browse the sport you want, see what is popular right
                now, and move into booking without hunting across the app.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <span className="rounded-full bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
                  7 sports ready
                </span>
                <span className="rounded-full bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700">
                  Live availability
                </span>
                <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                  Fast rebooking
                </span>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/venues"
                  className="rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:scale-[1.02]"
                >
                  Browse venues
                </Link>
                <Link
                  href="/"
                  className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
                >
                  Back home
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] bg-gradient-to-br from-sky-50 via-white to-brand-50 p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-4">
                {SPORTS.slice(0, 4).map((sport) => (
                  <div
                    key={sport.id}
                    className="rounded-3xl border border-white/70 bg-white p-4 shadow-sm"
                  >
                    <div className="relative mx-auto h-28 w-28">
                      <Image src={sport.image} alt={sport.label} fill className="object-contain p-2" />
                    </div>
                    <p className="mt-2 text-center text-sm font-bold text-slate-900">{sport.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">Browse by sport</p>
              <h2 className="mt-1 text-2xl font-extrabold text-slate-900">Tap a sport and start from there</h2>
            </div>
            <p className="hidden text-sm text-slate-500 sm:block">Built for quick discovery on mobile and desktop.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {SPORTS.map((sport, index) => (
              <Link
                key={sport.id}
                href="/venues"
                className={`group overflow-hidden rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                  index === 0 ? "sm:col-span-2 xl:col-span-2" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 shrink-0 rounded-full bg-gradient-to-b from-slate-50 to-slate-100">
                    <Image src={sport.image} alt={sport.label} fill className="object-contain p-2 transition group-hover:scale-105" />
                  </div>
                  <div>
                    <p className="text-xl font-black text-slate-950">{sport.label}</p>
                    <p className="mt-1 text-sm text-slate-500">{sport.note}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
