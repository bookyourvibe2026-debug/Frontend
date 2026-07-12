"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { toPng } from "html-to-image";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clipboard,
  Download,
  Eye,
  Flame,
  MessageCircle,
  Plus,
  Search,
  Send,
  Share2,
  X,
} from "lucide-react";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";
import { LoginModal } from "@/components/home/modals/LoginModal";
import { SignupModal } from "@/components/home/modals/SignupModal";
import {
  createChallenge,
  listChallengePlayers,
  type Challenge,
  type ChallengeMatchStyle,
  type ChallengePlayer,
  type ChallengePlayersCount,
  type ChallengeSeries,
  type ChallengeStakeType,
} from "@/lib/api/challenges";

type Step = "ground" | "opponent" | "sport" | "details" | "stakes" | "poster" | "share";
type Opponent = ChallengePlayer & { isInvite?: boolean };

const NO_PLAYERS: Opponent[] = [];

const SPORTS = [
  { label: "Cricket", image: "/bat.png" },
  { label: "Badminton", image: "/badminton.png" },
  { label: "Table Tennis", image: "/tabletennis.png" },
  { label: "Pickleball", image: "/pickball.png" },
  { label: "Football", image: "/football.png" },
  { label: "Basketball", emoji: "🏀" },
  { label: "Pool", emoji: "8" },
  { label: "Gaming", emoji: "🎮" },
  { label: "Other Match", emoji: "+" },
] as const;

// Valid player-count options for each sport — only these show up, and the first is the default.
const GAME_PLAYER_COUNT_OPTIONS: Record<string, ChallengePlayersCount[]> = {
  Cricket: ["team"],
  Badminton: ["1v1", "2v2"],
  "Table Tennis": ["1v1", "2v2"],
  Pickleball: ["1v1", "2v2"],
  Football: ["team"],
  Basketball: ["team"],
  Pool: ["1v1"],
  Gaming: ["1v1", "2v2", "team"],
  "Other Match": ["1v1", "2v2", "team"],
};

// Best-of series only makes sense for game-based sports, not single-match team sports.
const GAME_SUPPORTS_SERIES = new Set(["Cricket", "Badminton", "Table Tennis", "Pickleball", "Pool"]);

const STAKES: { type: ChallengeStakeType; label: string; icon: string; copy: string }[] = [
  { type: "Pizza", label: "Pizza", icon: "🍕", copy: "Loser buys pizza" },
  { type: "Coffee", label: "Coffee", icon: "☕", copy: "Loser buys coffee" },
  { type: "Burger", label: "Burger", icon: "🍔", copy: "Loser buys burgers" },
  { type: "Movie", label: "Movie", icon: "🎬", copy: "Loser buys movie tickets" },
  { type: "Cash", label: "Cash", icon: "💰", copy: "Loser pays the pool" },
  { type: "Trophy", label: "Trophy", icon: "🏆", copy: "Winner gets trophy rights" },
  { type: "Insta Story", label: "Insta Story", icon: "📸", copy: "Loser posts winner story" },
  { type: "Apology", label: "Apology", icon: "🎤", copy: "Loser records an apology" },
  { type: "Reel", label: "Reel", icon: "😂", copy: "Loser makes a reel" },
];

const DETAILS = {
  venues: ["One Arena, Shobhagpura", "Urban Turf, Udaipur", "BYV Sports Club", "Lakecity Indoor Court"],
  dates: ["Saturday", "Sunday", "Today", "Tomorrow"],
  times: ["07:00 PM", "08:00 PM", "09:00 PM", "06:00 AM"],
  playerCounts: ["1v1", "2v2", "team"] as ChallengePlayersCount[],
  series: ["BO1", "BO3", "BO5"] as ChallengeSeries[],
  styles: ["friendly", "competitive", "tournament"] as ChallengeMatchStyle[],
  fees: [0, 100, 250, 500],
};

const RECENT_CHALLENGES_KEY = "byv_recent_challenges";

function saveRecentChallenge(challenge: Challenge) {
  if (typeof window === "undefined") return;
  try {
    const existing: Challenge[] = JSON.parse(window.localStorage.getItem(RECENT_CHALLENGES_KEY) ?? "[]");
    const next = [challenge, ...existing.filter((c) => c.code !== challenge.code)].slice(0, 20);
    window.localStorage.setItem(RECENT_CHALLENGES_KEY, JSON.stringify(next));
  } catch {
    // localStorage unavailable — skip persistence silently.
  }
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function localChallenge(input: {
  challengerName: string;
  opponent: Opponent;
  sport: string;
  venueName: string;
  scheduleLabel: string;
  playersCount: ChallengePlayersCount;
  series: ChallengeSeries;
  matchStyle: ChallengeMatchStyle;
  entryFee: number;
  stakeType: ChallengeStakeType;
  stakeText: string;
}): Challenge {
  const code = `CHAL${Math.floor(100 + Math.random() * 900)}`;
  const origin = typeof window !== "undefined" ? window.location.origin : "https://bookyourvibe.com";
  const inviteUrl = `${origin}/challenge/${code}`;
  const shareMessage = [
    "You've been challenged!",
    `${input.challengerName} has challenged ${input.opponent.name} for a ${input.sport}.`,
    `Venue: ${input.venueName}`,
    `Time: ${input.scheduleLabel}`,
    `Bet: Loser buys ${input.stakeText}`,
    inviteUrl,
  ].join("\n");

  return {
    id: code,
    code,
    challenger: { id: "local", name: input.challengerName },
    opponent: { id: input.opponent.isInvite ? undefined : input.opponent.id, name: input.opponent.name, phone: input.opponent.phone },
    sport: input.sport,
    venueName: input.venueName,
    scheduleLabel: input.scheduleLabel,
    playersCount: input.playersCount,
    series: input.series,
    matchStyle: input.matchStyle,
    entryFee: input.entryFee,
    stakeType: input.stakeType,
    stakeText: input.stakeText,
    inviteUrl,
    shareMessage,
    status: "pending",
    createdAt: new Date().toISOString(),
    poster: { challengerInitials: initials(input.challengerName), opponentInitials: initials(input.opponent.name) },
  };
}

export function ChallengeFlow({ onClose }: { onClose: () => void }) {
  const { customer, status } = useCustomerAuth();
  const [authView, setAuthView] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<Step>("sport");
  const [players, setPlayers] = useState<Opponent[]>(NO_PLAYERS);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [search, setSearch] = useState("");
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [sport, setSport] = useState("Other Match");
  const [venueName, setVenueName] = useState(DETAILS.venues[0]);
  const [dateLabel, setDateLabel] = useState(DETAILS.dates[0]);
  const [timeLabel, setTimeLabel] = useState(DETAILS.times[0]);
  const [playersCount, setPlayersCount] = useState<ChallengePlayersCount>("1v1");
  const [series, setSeries] = useState<ChallengeSeries>("BO1");
  const [matchStyle, setMatchStyle] = useState<ChallengeMatchStyle>("competitive");
  const [entryFee, setEntryFee] = useState(100);
  const [stakeType, setStakeType] = useState<ChallengeStakeType>("Custom");
  const [stakeText, setStakeText] = useState("I'll pay for dinner");
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [sharingToIG, setSharingToIG] = useState(false);
  const posterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    listChallengePlayers({ search, limit: 20 })
      .then((items) => {
        if (cancelled) return;
        setPlayers(items);
        setOpponent((current) => current ?? items[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setPlayers(NO_PLAYERS);
      })
      .finally(() => {
        if (!cancelled) setLoadingPlayers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, status]);

  function selectSport(label: string) {
    setSport(label);
    const options = GAME_PLAYER_COUNT_OPTIONS[label];
    if (options?.length) setPlayersCount(options[0]);
    if (!GAME_SUPPORTS_SERIES.has(label)) setSeries("BO1");
  }

  const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : "https://bookyourvibe.com"}/?join=player`;
  const inviteMessage = `Hey! Join me on Book Your Vibe — sign up as a player and let's set up a match: ${inviteUrl}`;

  function shareInviteOnWhatsApp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(inviteMessage)}`, "_blank", "noopener,noreferrer");
  }

  const filteredPlayers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return players;
    return players.filter((player) => `${player.name} ${player.phone ?? ""}`.toLowerCase().includes(needle));
  }, [players, search]);

  if (status === "loading") {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-slate-600">Loading challenge arena...</div>
      </div>
    );
  }

  if (status === "guest") {
    return authView === "login" ? (
      <LoginModal onClose={onClose} onLoggedIn={() => {}} onSwitchToSignup={() => setAuthView("signup")} />
    ) : (
      <SignupModal onClose={onClose} onSignedUp={() => {}} onSwitchToLogin={() => setAuthView("login")} />
    );
  }

  const scheduleLabel = `${dateLabel}, ${timeLabel}`;
  const challengerName = customer?.name ?? "BYV Player";

  async function generatePoster() {
    if (!opponent) return;
    setSubmitting(true);
    setNotice("");
    try {
      const created = await createChallenge({
        opponentId: opponent.isInvite ? undefined : opponent.id,
        opponentName: opponent.name,
        opponentPhone: opponent.phone,
        sport,
        venueName,
        scheduleLabel,
        playersCount,
        series,
        matchStyle,
        entryFee,
        stakeType,
        stakeText,
        inviteBaseUrl: window.location.origin,
      });
      setChallenge(created);
      saveRecentChallenge(created);
    } catch {
      const fallback = localChallenge({
        challengerName,
        opponent,
        sport,
        venueName,
        scheduleLabel,
        playersCount,
        series,
        matchStyle,
        entryFee,
        stakeType,
        stakeText,
      });
      setChallenge(fallback);
      saveRecentChallenge(fallback);
      setNotice("Challenge poster ready in preview mode. Backend save can happen after API deploy.");
    } finally {
      setSubmitting(false);
      setStep("poster");
    }
  }

  function shareOnWhatsApp() {
    if (!challenge) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(challenge.shareMessage)}`, "_blank", "noopener,noreferrer");
  }

  async function copyLink() {
    if (!challenge) return;
    await navigator.clipboard?.writeText(challenge.inviteUrl);
    setNotice("Challenge link copied.");
  }

  async function downloadPoster() {
    if (downloading || !posterRef.current || !challenge) return;
    setDownloading(true);
    setNotice("");
    try {
      const dataUrl = await toPng(posterRef.current, {
        backgroundColor: "#090f19",
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `byv-challenge-${challenge.code}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setNotice("Couldn't generate the poster image. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  async function shareToInstagramStory() {
    if (sharingToIG || !posterRef.current || !challenge) return;
    setSharingToIG(true);
    setNotice("");
    try {
      const dataUrl = await toPng(posterRef.current, {
        backgroundColor: "#090f19",
        pixelRatio: 2,
        cacheBust: true,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `byv-challenge-${challenge.code}.png`, { type: "image/png" });

      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "BYV Vibe Challenge",
          text: "I just threw a Vibe Challenge — check it out!",
        });
        setNotice("Poster shared — pick Instagram in the share sheet and add it to your Story.");
      } else {
        const link = document.createElement("a");
        link.download = file.name;
        link.href = dataUrl;
        link.click();
        setNotice("Poster saved to your device — open Instagram, tap + for a new Story, and pick this image from your gallery.");
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setNotice("Couldn't prepare the poster for Instagram. Please try again.");
      }
    } finally {
      setSharingToIG(false);
    }
  }

  function goBack() {
    const order: Step[] = ["sport", "ground", "opponent", "details", "stakes", "poster", "share"];
    const index = order.indexOf(step);
    if (index <= 0) onClose();
    else setStep(order[index - 1]);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/75 backdrop-blur-sm sm:items-center">
      <div className="relative flex h-full w-full max-w-[440px] flex-col overflow-hidden bg-[#071018] text-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-[2rem]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(249,115,22,0.22),transparent_28%),radial-gradient(circle_at_60%_100%,rgba(16,185,129,0.16),transparent_34%)] pointer-events-none" />
        <div className="relative flex flex-1 flex-col overflow-y-auto px-5 py-6 pb-32">
          <div className="mb-5 flex items-center justify-between">
            <button type="button" onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-slate-300">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-300">
              <Flame className="h-3.5 w-3.5" /> Live Challenge
            </div>
            <button type="button" onClick={onClose} aria-label="Close challenge" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-slate-300">
              <X className="h-4 w-4" />
            </button>
          </div>

          {step === "sport" && (
            <StepShell eyebrow="Step 01 / Match format" title="Choose the battle type" subtitle="Pick the sport or keep it as a custom vibe challenge.">
              <div className="grid grid-cols-2 gap-3">
                {SPORTS.map((item) => (
                  <button key={item.label} type="button" onClick={() => selectSport(item.label)} className={`relative flex aspect-square flex-col items-center justify-center gap-3 rounded-[1.6rem] border text-center transition ${sport === item.label ? "border-orange-500 bg-orange-500/10 text-white" : "border-white/10 bg-white/7 text-slate-300"}`}>
                    {sport === item.label && <Check className="absolute right-4 top-4 h-5 w-5 rounded-full bg-orange-500 p-1 text-slate-950" />}
                    {"image" in item ? (
                      <Image src={item.image} alt={item.label} width={48} height={48} unoptimized className="h-12 w-12 object-contain" />
                    ) : (
                      <span className={`flex h-12 w-12 items-center justify-center text-4xl font-black ${item.emoji === "8" ? "rounded-full bg-slate-200 text-slate-900 text-xl" : ""}`}>{item.emoji}</span>
                    )}
                    <span className="text-xs font-extrabold uppercase tracking-wide">{item.label}</span>
                  </button>
                ))}
              </div>
              <BottomBar label="Selected match" value={sport} onNext={() => setStep("ground")} />
            </StepShell>
          )}

          {step === "ground" && (
            <StepShell eyebrow="Step 02 / Pick your arena" title="Choose the ground" subtitle="Select the venue or turf where the challenge will happen.">
              <SelectBlock label="Select venue / turf" value={venueName} options={DETAILS.venues} onChange={setVenueName} />
              <BottomBar label="Selected ground" value={venueName} onNext={() => setStep("opponent")} />
            </StepShell>
          )}

          {step === "opponent" && (
            <StepShell eyebrow="Step 03 / Select duel partner" title="Who are you challenging?" subtitle="Select an opponent from BYV players or invite them via WhatsApp.">
              <div className="flex items-center gap-2">
                <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/7 px-4 py-3.5">
                  <Search className="h-5 w-5 text-slate-500" />
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search username, name, or phone..." className="w-full bg-transparent text-sm font-semibold text-slate-200 outline-none placeholder:text-slate-500" />
                </div>
                <button
                  type="button"
                  onClick={shareInviteOnWhatsApp}
                  aria-label="Invite friends via WhatsApp"
                  title="Invite friends via WhatsApp"
                  className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 transition active:scale-95"
                >
                  <Share2 className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-7 flex items-center justify-between">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-orange-400">Suggested opponents</p>
                <button type="button" onClick={shareInviteOnWhatsApp} className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase text-emerald-400">
                  <Share2 className="h-3.5 w-3.5" /> Invite on WhatsApp
                </button>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {loadingPlayers ? (
                  <p className="col-span-2 py-6 text-center text-xs font-semibold text-slate-500">Loading BYV players...</p>
                ) : filteredPlayers.length === 0 ? (
                  <div className="col-span-2 rounded-2xl border border-dashed border-white/15 bg-white/5 p-5 text-center">
                    <p className="text-xs font-semibold text-slate-400">No players found{search ? ` for "${search}"` : " yet"}.</p>
                    <button type="button" onClick={shareInviteOnWhatsApp} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-[11px] font-extrabold uppercase text-white">
                      <Share2 className="h-3.5 w-3.5" /> Invite a friend on WhatsApp
                    </button>
                  </div>
                ) : (
                  filteredPlayers.map((player) => (
                    <PlayerCard key={player.id} player={player} selected={opponent?.id === player.id} onSelect={() => setOpponent(player)} />
                  ))
                )}
              </div>
              <BottomBar label="Selected opponent" value={opponent?.name ?? "None selected"} onNext={() => setStep("details")} disabled={!opponent} />
            </StepShell>
          )}

          {step === "details" && (
            <StepShell eyebrow="Step 04 / Match metrics" title="Set challenge details" subtitle="Lock down the time and rules for the match.">
              <div className="grid grid-cols-2 gap-4">
                <SelectBlock label="Date" value={dateLabel} options={DETAILS.dates} onChange={setDateLabel} />
                <SelectBlock label="Start time" value={timeLabel} options={DETAILS.times} onChange={setTimeLabel} />
              </div>
              <Segmented
                label={`Players count (for ${sport})`}
                value={playersCount}
                options={GAME_PLAYER_COUNT_OPTIONS[sport] ?? DETAILS.playerCounts}
                onChange={setPlayersCount}
              />
              {GAME_SUPPORTS_SERIES.has(sport) && (
                <Segmented label="Best of series" value={series} options={DETAILS.series} onChange={setSeries} />
              )}
              <Segmented label="Match styling" value={matchStyle} options={DETAILS.styles} onChange={setMatchStyle} wide />
              <Segmented label="Optional entry fee / co-pay" value={entryFee} options={DETAILS.fees} onChange={setEntryFee} formatter={(value) => (value === 0 ? "Free" : `₹${value}`)} wide />
              <BottomBar label="Schedule" value={scheduleLabel} onNext={() => setStep("stakes")} />
            </StepShell>
          )}

          {step === "stakes" && (
            <StepShell eyebrow="Step 05 / Stakes & bet" title="What happens if you lose?" subtitle="Lock down the food treat or punishment for bragging rights.">
              <div className="grid grid-cols-3 gap-3">
                {STAKES.map((item) => (
                  <button key={item.type} type="button" onClick={() => { setStakeType(item.type); setStakeText(item.copy); }} className={`rounded-[1.4rem] border p-4 text-center transition ${stakeType === item.type ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/7"}`}>
                    <span className="text-3xl">{item.icon}</span>
                    <span className="mt-2 block text-[11px] font-extrabold uppercase tracking-wide text-slate-200">{item.label}</span>
                  </button>
                ))}
              </div>
              <label className="mt-7 block text-[11px] font-extrabold uppercase tracking-[0.18em] text-orange-400">Custom stake / punishment</label>
              <input value={stakeText} onChange={(event) => { setStakeText(event.target.value); setStakeType("Custom"); }} className="mt-3 w-full rounded-2xl border border-white/10 bg-white/7 px-4 py-4 text-sm font-bold text-white outline-none focus:border-orange-500" />
              <div className="mt-4 flex flex-wrap gap-2">
                {["I'll wear opponent jersey", "I'll pay for dinner", "I'll buy protein shake", "Loser buys sports grip"].map((copy) => (
                  <button key={copy} type="button" onClick={() => { setStakeText(copy); setStakeType("Custom"); }} className="rounded-full bg-white/8 px-3 py-2 text-[11px] font-semibold text-slate-300">
                    + {copy}
                  </button>
                ))}
              </div>
              <BottomBar label="The stakes" value={stakeText} actionLabel={submitting ? "Generating..." : "Generate poster"} onNext={generatePoster} disabled={submitting || stakeText.trim().length < 2} />
            </StepShell>
          )}

          {(step === "poster" || step === "share") && challenge && (
            <StepShell eyebrow={step === "poster" ? "Final review" : "Deep link ready"} title={step === "poster" ? "Your cinematic poster" : "The gauntlet is thrown!"} subtitle={step === "poster" ? "Review your generated duel flyer." : `Share the challenge with ${opponent?.name ?? "your opponent"} on WhatsApp.`}>
              <div ref={posterRef} className={step === "poster" ? "" : "pointer-events-none fixed left-[-9999px] top-0"}>
                <Poster challenge={challenge} />
              </div>
              {step === "poster" && (
                <button
                  type="button"
                  onClick={downloadPoster}
                  disabled={downloading}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/7 py-3.5 text-xs font-black uppercase tracking-wide text-slate-200 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" /> {downloading ? "Saving..." : "Download poster"}
                </button>
              )}
              {step === "share" && (
                <SharePanel
                  challenge={challenge}
                  onWhatsApp={shareOnWhatsApp}
                  onCopy={copyLink}
                  onDownload={downloadPoster}
                  downloading={downloading}
                  onShareInstagram={shareToInstagramStory}
                  sharingToIG={sharingToIG}
                />
              )}
              {notice && <p className="mt-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-xs font-semibold text-emerald-300">{notice}</p>}
              {step === "poster" ? (
                <BottomBar label="Invite link" value={challenge.code} actionLabel="Issue challenge" onNext={() => setStep("share")} />
              ) : (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setStep("poster")} className="rounded-2xl border border-white/10 bg-white/7 py-3 text-xs font-extrabold uppercase tracking-wide text-slate-300">
                    View poster
                  </button>
                  <button type="button" onClick={onClose} className="rounded-2xl bg-orange-500 py-3 text-xs font-extrabold uppercase tracking-wide text-white">
                    Done
                  </button>
                </div>
              )}
            </StepShell>
          )}
        </div>
      </div>
    </div>
  );
}

function StepShell({ eyebrow, title, subtitle, children }: { eyebrow: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-orange-400">{eyebrow}</p>
      <h2 className="mt-2 text-3xl font-black uppercase leading-tight tracking-normal text-white">{title}</h2>
      <p className="mt-3 text-sm font-medium leading-relaxed text-slate-400">{subtitle}</p>
      <div className="mt-7 flex-1">{children}</div>
    </div>
  );
}

function PlayerCard({ player, selected, onSelect }: { player: Opponent; selected: boolean; onSelect: () => void }) {
  const isActive = !player.isInvite;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex w-full flex-col items-center gap-2.5 rounded-2xl border p-4 text-center transition ${
        selected ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/[0.07]"
      }`}
    >
      {selected && <Check className="absolute right-3 top-3 h-4 w-4 rounded-full bg-orange-500 p-0.5 text-slate-950" />}
      <span className="relative">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/60 to-slate-700 text-lg font-black text-white">
          {player.initials}
        </span>
        {isActive && (
          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[7px] font-black text-white ring-2 ring-[#071018]">BYV</span>
        )}
      </span>
      <span className="w-full min-w-0">
        <span className="block truncate text-sm font-extrabold text-white">{player.name}</span>
        <span className={`block truncate text-xs font-semibold ${isActive ? "text-slate-400" : "text-slate-500"}`}>{player.relation}</span>
      </span>
      {player.isInvite ? (
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-[10px] font-extrabold uppercase text-white">
          <Share2 className="h-3 w-3" /> Invite
        </span>
      ) : (
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-extrabold uppercase text-orange-400">
          {selected ? "Selected" : "Select"}
        </span>
      )}
    </button>
  );
}

function SelectBlock({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="mb-5 block">
      <span className="mb-2 block text-[11px] font-extrabold uppercase tracking-[0.18em] text-orange-400">{label}</span>
      <span className="flex items-center rounded-2xl border border-white/10 bg-white/7 px-4 py-4">
        <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full appearance-none bg-transparent text-sm font-extrabold text-white outline-none">
          {options.map((option) => (
            <option key={option} className="bg-slate-950 text-white">
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="h-5 w-5 text-slate-400" />
      </span>
    </label>
  );
}

function Segmented<T extends string | number>({ label, value, options, onChange, formatter, wide }: { label: string; value: T; options: readonly T[]; onChange: (value: T) => void; formatter?: (value: T) => string; wide?: boolean }) {
  const cols = wide ? 3 : Math.min(Math.max(options.length, 1), 3);
  const gridColsClass = cols === 1 ? "grid-cols-1" : cols === 2 ? "grid-cols-2" : "grid-cols-3";
  return (
    <div className="mb-5">
      <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.18em] text-orange-400">{label}</p>
      <div className={`grid gap-2 ${gridColsClass}`}>
        {options.map((option) => (
          <button key={String(option)} type="button" onClick={() => onChange(option)} className={`rounded-xl px-3 py-3 text-xs font-extrabold uppercase transition ${value === option ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20" : "bg-white/7 text-slate-400"}`}>
            {formatter ? formatter(option) : String(option)}
          </button>
        ))}
      </div>
    </div>
  );
}

function BottomBar({ label, value, actionLabel = "Next step", onNext, disabled }: { label: string; value: string; actionLabel?: string; onNext: () => void; disabled?: boolean }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] px-4 pb-5 pt-3 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent">
      <div className="mx-auto max-w-[440px]">
        <div className="flex items-center gap-3 rounded-2xl border border-orange-500/35 bg-[#0c1a26]/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-md">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-sm font-black text-white">{value.slice(0, 2).toUpperCase()}</span>
          <span className="min-w-0 flex-1 overflow-hidden">
            <span className="block text-[10px] font-extrabold uppercase tracking-wide text-orange-400">{label}</span>
            <span className="block truncate text-sm font-extrabold text-white">{value}</span>
          </span>
          <button
            type="button"
            disabled={disabled}
            onClick={onNext}
            className="shrink-0 whitespace-nowrap rounded-2xl bg-orange-500 px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-white shadow-lg shadow-orange-500/25 disabled:opacity-50 active:scale-95 transition-transform"
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Poster({ challenge }: { challenge: Challenge }) {
  return (
    <div className="rounded-[1.8rem] border border-orange-500/50 bg-[#090f19] p-7 shadow-[0_0_40px_rgba(249,115,22,0.16)]">
      <div className="text-center">
        <span className="rounded-full bg-orange-500 px-5 py-2 text-[11px] font-extrabold uppercase tracking-[0.28em] text-white">Vibe Challenge</span>
        <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.24em] text-orange-400">Official athletic matchup</p>
      </div>
      <div className="mt-8 flex items-center justify-between">
        <PlayerBadge initials={challenge.poster.challengerInitials} name={challenge.challenger?.name ?? "Challenger"} label="Challenger" tone="orange" />
        <span className="rounded-full bg-gradient-to-br from-orange-500 to-red-700 px-3 py-3 text-sm font-black italic">VS</span>
        <PlayerBadge initials={challenge.poster.opponentInitials} name={challenge.opponent?.name ?? "Opponent"} label="Opponent" tone="emerald" />
      </div>
      <div className="mt-8 rounded-2xl border border-white/10 bg-white/7 p-5">
        <div className="flex items-center gap-3">
          <Plus className="h-8 w-8 text-slate-400" />
          <p className="text-lg font-black uppercase tracking-wide">{challenge.sport}</p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-4 text-xs font-bold">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-orange-400">Venue</p>
            <p className="mt-1 text-white">{challenge.venueName}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-orange-400">Schedule</p>
            <p className="mt-1 text-white">{challenge.scheduleLabel}</p>
          </div>
        </div>
      </div>
      <div className="mt-8 text-center">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-orange-400">The stakes</p>
        <div className="mx-auto mt-4 inline-flex max-w-full items-center gap-3 rounded-2xl border border-orange-500/35 bg-orange-500/10 px-5 py-4">
          <Flame className="h-6 w-6 shrink-0 text-orange-400" />
          <div className="min-w-0 text-left">
            <p className="truncate text-sm font-black uppercase text-white">{challenge.stakeType} stakes</p>
            <p className="truncate text-xs font-semibold text-slate-300">{challenge.stakeText}</p>
          </div>
        </div>
      </div>
      <div className="mt-8 border-t border-white/10 pt-5 text-center text-[10px] font-extrabold uppercase tracking-[0.24em] text-slate-500">
        Powered by Book Your Vibe
      </div>
    </div>
  );
}

function PlayerBadge({ initials, name, label, tone }: { initials: string; name: string; label: string; tone: "orange" | "emerald" }) {
  const colors = tone === "orange" ? "border-orange-500 bg-orange-500/20 shadow-orange-500/25" : "border-emerald-400 bg-emerald-400/20 shadow-emerald-400/25";
  return (
    <div className="min-w-0 text-center">
      <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-xl font-black text-white shadow-lg ${colors}`}>{initials || "P"}</div>
      <p className="mt-3 max-w-[110px] truncate text-xs font-black uppercase">{name}</p>
      <p className={`mt-1 text-[9px] font-extrabold uppercase tracking-wide ${tone === "orange" ? "text-orange-400" : "text-emerald-300"}`}>{label}</p>
    </div>
  );
}

function SharePanel({
  challenge,
  onWhatsApp,
  onCopy,
  onDownload,
  downloading,
  onShareInstagram,
  sharingToIG,
}: {
  challenge: Challenge;
  onWhatsApp: () => void;
  onCopy: () => void;
  onDownload: () => void;
  downloading: boolean;
  onShareInstagram: () => void;
  sharingToIG: boolean;
}) {
  return (
    <div>
      <div className="rounded-2xl border border-white/10 bg-white/7 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-orange-400">Preview share message</p>
          <span className="text-[11px] font-bold text-emerald-300">Deep Link Ready</span>
        </div>
        <pre className="whitespace-pre-wrap rounded-2xl bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-300">{challenge.shareMessage}</pre>
      </div>
      <button type="button" onClick={onWhatsApp} className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 py-4 text-sm font-black uppercase tracking-wide text-white">
        <MessageCircle className="h-5 w-5" /> Share on WhatsApp
      </button>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={onCopy} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/7 py-4 text-xs font-black uppercase tracking-wide text-slate-200">
          <Clipboard className="h-4 w-4" /> Copy link
        </button>
        <button
          type="button"
          onClick={onDownload}
          disabled={downloading}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/7 py-4 text-xs font-black uppercase tracking-wide text-slate-200 disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> {downloading ? "Saving..." : "Download"}
        </button>
        <button
          type="button"
          onClick={onShareInstagram}
          disabled={sharingToIG}
          className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/7 py-4 text-xs font-black uppercase tracking-wide text-slate-200 disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> {sharingToIG ? "Preparing..." : "IG Story"}
        </button>
        <a href={challenge.inviteUrl} className="flex items-center justify-center gap-2 rounded-2xl border border-orange-500/35 bg-orange-500/10 py-4 text-xs font-black uppercase tracking-wide text-orange-400">
          <Eye className="h-4 w-4" /> View Landing
        </a>
      </div>
    </div>
  );
}
