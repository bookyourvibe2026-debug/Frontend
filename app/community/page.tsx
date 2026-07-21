"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users, Calendar, MapPin, Check, X, MessageSquare, Shield } from "lucide-react";
import { SiteHeader } from "../../components/site-header";
import { MobileCard, MobileTopBar } from "@/components/mobile/ui";
import { Toast } from "@/components/admin/Toast";

interface Match {
  id: string;
  title: string;
  place: string;
  time: string;
  spotsLeft: number;
  sport: string;
}

interface Club {
  id: string;
  name: string;
  members: number;
  sport: string;
  place: string;
}

const INITIAL_MATCHES: Match[] = [
  { id: "m-1", title: "Friday night badminton run", place: "Shobhagpura Arena", time: "8:00 PM", spotsLeft: 3, sport: "Badminton" },
  { id: "m-2", title: "Weekend cricket squad", place: "Bhawani Nagar Turf", time: "7:00 AM", spotsLeft: 2, sport: "Cricket" },
  { id: "m-3", title: "Pickleball social mix-in", place: "Hiran Magri Court", time: "6:30 PM", spotsLeft: 8, sport: "Pickleball" },
];

const INITIAL_CLUBS: Club[] = [
  { id: "c-1", name: "Udaipur Smashers Badminton Club", members: 142, sport: "Badminton", place: "Shobhagpura" },
  { id: "c-2", name: "Mewar Turf Cricket Association", members: 89, sport: "Cricket", place: "Bhawani Nagar" },
  { id: "c-3", name: "Hiran Magri TT Spinners", members: 54, sport: "Table Tennis", place: "Hiran Magri" },
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
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [clubs, setClubs] = useState<Club[]>(INITIAL_CLUBS);
  const [joinedMatches, setJoinedMatches] = useState<string[]>([]);
  const [joinedClubs, setJoinedClubs] = useState<string[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  // Modals state
  const [lobbyModalOpen, setLobbyModalOpen] = useState(false);
  const [clubModalOpen, setClubModalOpen] = useState(false);

  // Form states
  const [lobbyTitle, setLobbyTitle] = useState("");
  const [lobbyPlace, setLobbyPlace] = useState("");
  const [lobbyTime, setLobbyTime] = useState("");
  const [lobbySport, setLobbySport] = useState("Badminton");
  const [lobbySpots, setLobbySpots] = useState(4);

  const [clubName, setClubName] = useState("");
  const [clubSport, setClubSport] = useState("Badminton");
  const [clubPlace, setClubPlace] = useState("");

  const handleJoinMatch = (id: string, title: string) => {
    if (joinedMatches.includes(id)) {
      setJoinedMatches((prev) => prev.filter((mid) => mid !== id));
      setMatches((prev) =>
        prev.map((m) => (m.id === id ? { ...m, spotsLeft: m.spotsLeft + 1 } : m))
      );
      setToast(`Left the match lobby: ${title}`);
    } else {
      setJoinedMatches((prev) => [...prev, id]);
      setMatches((prev) =>
        prev.map((m) => (m.id === id ? { ...m, spotsLeft: Math.max(0, m.spotsLeft - 1) } : m))
      );
      setToast(`Joined match lobby! A WhatsApp invite link has been copied to clipboard.`);
    }
  };

  const handleJoinClub = (id: string, name: string) => {
    if (joinedClubs.includes(id)) {
      setJoinedClubs((prev) => prev.filter((cid) => cid !== id));
      setClubs((prev) =>
        prev.map((c) => (c.id === id ? { ...c, members: c.members - 1 } : c))
      );
      setToast(`Left club: ${name}`);
    } else {
      setJoinedClubs((prev) => [...prev, id]);
      setClubs((prev) =>
        prev.map((c) => (c.id === id ? { ...c, members: c.members + 1 } : c))
      );
      setToast(`Joined ${name}! Welcome to the community.`);
    }
  };

  const handleCreateLobbySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lobbyTitle || !lobbyPlace || !lobbyTime) {
      setToast("Please fill in all match lobby details.");
      return;
    }
    const newLobby: Match = {
      id: `m-${Date.now()}`,
      title: lobbyTitle,
      place: lobbyPlace,
      time: lobbyTime,
      spotsLeft: Number(lobbySpots),
      sport: lobbySport,
    };
    setMatches((prev) => [newLobby, ...prev]);
    setLobbyTitle("");
    setLobbyPlace("");
    setLobbyTime("");
    setLobbyModalOpen(false);
    setToast("New Match Lobby created successfully!");
  };

  const handleCreateClubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clubName || !clubPlace) {
      setToast("Please fill in all club details.");
      return;
    }
    const newClub: Club = {
      id: `c-${Date.now()}`,
      name: clubName,
      members: 1, // Creator is first member
      sport: clubSport,
      place: clubPlace,
    };
    setClubs((prev) => [newClub, ...prev]);
    setJoinedClubs((prev) => [...prev, newClub.id]);
    setClubName("");
    setClubPlace("");
    setClubModalOpen(false);
    setToast(`Created and joined your new club: ${clubName}!`);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#eef2ff,_#f8fafc_45%,_#ffffff_80%)] pb-16">
      <div className="hidden sm:block">
        <SiteHeader />
      </div>

      <div className="sm:hidden">
        <div className="px-4 pt-4">
          <MobileTopBar />
        </div>
        <main className="flex flex-col gap-5 px-4 py-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-600">Community</p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-900">
              Find players, matches, and clubs.
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Active matches, trusted feedback, and direct community creation tools.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => setLobbyModalOpen(true)}
              className="flex items-center justify-center gap-1.5 rounded-2xl bg-brand-600 py-3 text-xs font-bold text-white shadow-md shadow-brand-500/20"
            >
              <Plus className="h-4 w-4" /> Host Match
            </button>
            <button
              onClick={() => setClubModalOpen(true)}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-3 text-xs font-bold text-slate-700 shadow-sm"
            >
              <Users className="h-4 w-4 text-brand-500" /> Start Club
            </button>
          </div>

          <div>
            <h2 className="mb-3 text-base font-extrabold text-slate-900">Open Match Lobbies</h2>
            <div className="flex flex-col gap-3">
              {matches.map((match) => {
                const isJoined = joinedMatches.includes(match.id);
                return (
                  <MobileCard key={match.id} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">
                        {match.sport} Match
                      </p>
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-bold text-sky-700">
                        {match.time}
                      </span>
                    </div>
                    <h2 className="text-base font-extrabold text-slate-950">{match.title}</h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {match.place}
                    </p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-slate-500">
                        {match.spotsLeft > 0 ? `${match.spotsLeft} spots left` : "Lobby Full"}
                      </span>
                      <button
                        onClick={() => handleJoinMatch(match.id, match.title)}
                        className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                          isJoined
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-950 text-white"
                        }`}
                      >
                        {isJoined ? "Joined ✓" : "Join Match"}
                      </button>
                    </div>
                  </MobileCard>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-base font-extrabold text-slate-900">Sports Clubs & Groups</h2>
            <div className="flex flex-col gap-3">
              {clubs.map((club) => {
                const isJoined = joinedClubs.includes(club.id);
                return (
                  <MobileCard key={club.id} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">
                        {club.sport} Club
                      </p>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                        <Users className="h-3 w-3" /> {club.members}
                      </span>
                    </div>
                    <h2 className="text-base font-extrabold text-slate-950">{club.name}</h2>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {club.place}
                    </p>
                    <button
                      onClick={() => handleJoinClub(club.id, club.name)}
                      className={`mt-2 w-full rounded-xl py-2 text-xs font-bold transition ${
                        isJoined
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {isJoined ? "Member ✓" : "Join Club"}
                    </button>
                  </MobileCard>
                );
              })}
            </div>
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
        </main>
      </div>

      <main className="mx-auto hidden max-w-7xl px-4 py-10 sm:block sm:px-6 sm:py-14">
        <section className="rounded-[2rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-[0_30px_90px_rgba(15,23,42,0.26)] sm:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-sky-300">Community</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                Find players, matches, and sports groups.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Discover active match lobbies, join player-managed clubs near you, or host your own community games.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setLobbyModalOpen(true)}
                className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 transition hover:scale-[1.02]"
              >
                <Plus className="h-4 w-4" /> Host Match Lobby
              </button>
              <button
                onClick={() => setClubModalOpen(true)}
                className="flex items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-6 py-3.5 text-sm font-bold text-slate-200 transition hover:bg-slate-900"
              >
                <Users className="h-4 w-4 text-brand-400" /> Create Sports Club
              </button>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900">Active Match Lobbies</h2>
            <p className="text-sm text-slate-500">Jump into open spots or team up for upcoming matches</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {matches.map((match) => {
              const isJoined = joinedMatches.includes(match.id);
              return (
                <article
                  key={match.id}
                  className="flex flex-col justify-between rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                        {match.sport}
                      </span>
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> {match.time}
                      </span>
                    </div>
                    <h3 className="mt-4 text-xl font-extrabold text-slate-950">{match.title}</h3>
                    <p className="mt-2 text-sm text-slate-500 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-slate-400" /> {match.place}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
                    <span className="text-xs font-bold text-slate-500">
                      {match.spotsLeft > 0 ? `${match.spotsLeft} spots remaining` : "Lobby full"}
                    </span>
                    <button
                      onClick={() => handleJoinMatch(match.id, match.title)}
                      className={`flex items-center gap-1 rounded-full px-5 py-2 text-xs font-bold transition ${
                        isJoined
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-950 text-white hover:bg-brand-500"
                      }`}
                    >
                      {isJoined ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Joined
                        </>
                      ) : (
                        "Join Match"
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-slate-900">Featured Sports Clubs</h2>
            <p className="text-sm text-slate-500">Join dedicated local sports clubs to network with players</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {clubs.map((club) => {
              const isJoined = joinedClubs.includes(club.id);
              return (
                <article
                  key={club.id}
                  className="flex flex-col justify-between rounded-[1.75rem] border border-slate-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-bold text-sky-700">
                        {club.sport}
                      </span>
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> {club.members} Members
                      </span>
                    </div>
                    <h3 className="mt-4 text-xl font-extrabold text-slate-950">{club.name}</h3>
                    <p className="mt-2 text-sm text-slate-500 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-slate-400" /> Udaipur, {club.place}
                    </p>
                  </div>
                  <div className="mt-6 border-t border-slate-50 pt-4">
                    <button
                      onClick={() => handleJoinClub(club.id, club.name)}
                      className={`w-full flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-bold transition ${
                        isJoined
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {isJoined ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Club Member
                        </>
                      ) : (
                        "Join Club"
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-12 grid gap-4 md:grid-cols-3">
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
      </main>

      {/* LOBBY MODAL */}
      {lobbyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">Host a Match Lobby</h3>
              <button
                onClick={() => setLobbyModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateLobbySubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Sport</label>
                <select
                  value={lobbySport}
                  onChange={(e) => setLobbySport(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-brand-500"
                >
                  <option value="Badminton">Badminton</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Football">Football</option>
                  <option value="Pickleball">Pickleball</option>
                  <option value="Table Tennis">Table Tennis</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Lobby Title</label>
                <input
                  type="text"
                  placeholder="e.g. Friendly Doubles Match"
                  value={lobbyTitle}
                  onChange={(e) => setLobbyTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-brand-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Time</label>
                  <input
                    type="text"
                    placeholder="e.g. 7:30 PM"
                    value={lobbyTime}
                    onChange={(e) => setLobbyTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-brand-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Max Open Spots</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={lobbySpots}
                    onChange={(e) => setLobbySpots(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-brand-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Venue Location</label>
                <input
                  type="text"
                  placeholder="e.g. Shobhagpura Arena"
                  value={lobbyPlace}
                  onChange={(e) => setLobbyPlace(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-brand-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-slate-950 py-3 text-sm font-bold text-white hover:bg-brand-600 shadow-md transition"
              >
                Create Lobby
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CLUB MODAL */}
      {clubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900">Launch a Sports Club</h3>
              <button
                onClick={() => setClubModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleCreateClubSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Sport Category</label>
                <select
                  value={clubSport}
                  onChange={(e) => setClubSport(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-brand-500"
                >
                  <option value="Badminton">Badminton</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Football">Football</option>
                  <option value="Pickleball">Pickleball</option>
                  <option value="Table Tennis">Table Tennis</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Club Name</label>
                <input
                  type="text"
                  placeholder="e.g. Udaipur Badminton Masters"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Local Area/Locality</label>
                <input
                  type="text"
                  placeholder="e.g. Shobhagpura"
                  value={clubPlace}
                  onChange={(e) => setClubPlace(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-800 focus:outline-brand-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-slate-950 py-3 text-sm font-bold text-white hover:bg-brand-600 shadow-md transition"
              >
                Create Sports Club
              </button>
            </form>
          </div>
        </div>
      )}

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
