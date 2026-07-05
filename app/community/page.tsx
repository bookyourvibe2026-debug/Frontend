import Link from "next/link";
import { SiteHeader } from "../../components/site-header";
import { MobileCard, MobileTopBar } from "@/components/mobile/ui";

export const metadata = {
  title: "Community | Book Your Vibe",
  description: "Find players, matches, and community moments.",
};

const MATCHES = [
  { title: "Friday night badminton run", place: "Shobhagpura", time: "8:00 PM", spots: "3 spots left" },
  { title: "Weekend cricket squad", place: "Bhawani Nagar", time: "7:00 AM", spots: "Need 2 players" },
  { title: "Pickleball social mix-in", place: "Hiran Magri", time: "6:30 PM", spots: "Open to all" },
];

const TESTIMONIALS = [
  {
    quote: "I found a team in minutes, not days. The page makes it easy to see what is actually open.",
    name: "Aman Sharma",
  },
  {
    quote: "The flow feels calm and direct. I knew where to go next on the first try.",
    name: "Riya Verma",
  },
  {
    quote: "Great for getting people from chat into an actual booking without friction.",
    name: "CA Yashank R.",
  },
];

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef2ff,_#f8fafc_45%,_#ffffff_80%)]">
      <div className="hidden sm:block">
        <SiteHeader />
      </div>

      <div className="sm:hidden">
        <div className="px-4 pt-4">
          <MobileTopBar />
        </div>
        <main className="flex flex-col gap-5 px-4 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-sky-600">Community</p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
              Find players, matches, and momentum.
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Active matches, trusted feedback, and a fast path back into booking.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {MATCHES.map((match) => (
              <MobileCard key={match.title} className="flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">
                  Open match
                </p>
                <h2 className="text-base font-extrabold text-slate-950">{match.title}</h2>
                <p className="text-xs text-slate-500">{match.place}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-bold text-sky-700">
                    {match.time}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
                    {match.spots}
                  </span>
                </div>
              </MobileCard>
            ))}
          </div>

          <div>
            <h2 className="mb-3 text-base font-extrabold text-slate-900">What players say</h2>
            <div className="flex flex-col gap-3">
              {TESTIMONIALS.map((item) => (
                <MobileCard key={item.name}>
                  <p className="text-sm leading-6 text-slate-700">&ldquo;{item.quote}&rdquo;</p>
                  <p className="mt-3 text-sm font-bold text-slate-950">{item.name}</p>
                </MobileCard>
              ))}
            </div>
          </div>

          <Link
            href="/venues"
            className="rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-3 text-center text-sm font-semibold text-white shadow-md shadow-brand-500/30"
          >
            Browse venues
          </Link>
        </main>
      </div>

      <main className="mx-auto hidden max-w-7xl px-4 py-10 sm:block sm:px-6 sm:py-14">
        <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,0.26)] sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-300">Community</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            A friendlier way to find players, matches, and momentum.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            This page groups the social side of the app into one clean place: active matches,
            trusted player feedback, and a fast path back into booking.
          </p>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-3">
          {MATCHES.map((match) => (
            <article
              key={match.title}
              className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">
                Open match
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">{match.title}</h2>
              <p className="mt-3 text-sm text-slate-500">{match.place}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                  {match.time}
                </span>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  {match.spots}
                </span>
              </div>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {TESTIMONIALS.map((item) => (
            <article
              key={item.name}
              className="rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm"
            >
              <p className="text-lg leading-8 text-slate-700">“{item.quote}”</p>
              <p className="mt-4 font-bold text-slate-950">{item.name}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 rounded-[2rem] bg-gradient-to-r from-brand-500 to-accent-500 p-6 text-white sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/80">
                Next step
              </p>
              <h2 className="mt-2 text-2xl font-black">Ready to book something now?</h2>
            </div>
            <Link
              href="/venues"
              className="inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
            >
              Browse venues
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
