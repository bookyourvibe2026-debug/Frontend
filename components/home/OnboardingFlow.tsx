"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronRight, CalendarCheck2, ShieldCheck, Users, Zap } from "lucide-react";
import { LoginModal } from "./modals/LoginModal";
import { SignupModal } from "./modals/SignupModal";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";

export function OnboardingFlow({ onComplete }: { onComplete: () => void }) {
  const router = useRouter();
  const { status } = useCustomerAuth();
  const [step, setStep] = useState<"splash1" | "splash2" | "role" | "player-login" | "player-signup">("splash1");

  // Auto-advance splash screens
  useEffect(() => {
    if (step === "splash1") {
      const timer = setTimeout(() => setStep("splash2"), 2500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  useEffect(() => {
    if (step === "splash2") {
      const timer = setTimeout(() => setStep("role"), 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Handle Player Login / Signup rendering
  if (step === "player-login") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm">
         <LoginModal onClose={() => setStep("role")} onLoggedIn={onComplete} onSwitchToSignup={() => setStep("player-signup")} />
         <button onClick={onComplete} className="absolute bottom-10 z-[110] text-sm font-bold text-slate-400 hover:text-white transition-colors underline decoration-slate-600 underline-offset-4">
            Skip for now
         </button>
      </div>
    );
  }

  if (step === "player-signup") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm">
         <SignupModal onClose={() => setStep("role")} onSignedUp={onComplete} onSwitchToLogin={() => setStep("player-login")} />
         <button onClick={onComplete} className="absolute bottom-10 z-[110] text-sm font-bold text-slate-400 hover:text-white transition-colors underline decoration-slate-600 underline-offset-4">
            Skip for now
         </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-neutral-950 text-white">
      {/* Background for splash 1 & 2 — neutral so it works under any brand colour the site owner picks. */}
      {(step === "splash1" || step === "splash2") && (
        <div className="absolute inset-0 z-0 bg-neutral-950">
          <Image src="/splash.jpeg" alt="Splash Background" fill className="object-cover opacity-40" priority unoptimized />
          <div className="absolute inset-0 bg-black/50" />
        </div>
      )}

      {/* Foreground content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-6">
        {step === "splash1" && (
          <div className="relative flex h-64 w-full items-center justify-center">
            <style>{`
              @keyframes throwBall {
                0% { transform: translate(-150px, 100px) scale(0.5); opacity: 0; }
                20% { opacity: 1; }
                45% { transform: translate(-10px, 10px) scale(1); }
                55% { transform: translate(20px, -20px) scale(1.2); }
                100% { transform: translate(250px, -150px) scale(0.5); opacity: 0; }
              }
              @keyframes swingBat {
                0% { transform: rotate(45deg); }
                40% { transform: rotate(45deg); }
                50% { transform: rotate(-50deg); }
                100% { transform: rotate(-50deg); }
              }
              .ball-anim { animation: throwBall 2.5s ease-in-out forwards; }
              .bat-anim { animation: swingBat 2.5s ease-in-out forwards; transform-origin: bottom center; }
            `}</style>
            <div className="ball-anim absolute z-20 text-4xl text-red-500 drop-shadow-xl">🔴</div>
            <div className="bat-anim absolute z-10 text-7xl drop-shadow-2xl">🏏</div>
          </div>
        )}

        {step === "splash2" && (
          <div className="animate-in fade-in zoom-in duration-700 text-center">
            <h1 className="text-5xl font-bold tracking-tight text-white drop-shadow-md">
              Book<br />Your Vibe
            </h1>
            <p className="mt-4 text-sm font-extrabold uppercase tracking-[0.2em] text-white/50">
              Your Venue. Your Game.
            </p>
          </div>
        )}

        {step === "role" && (
          <div className="fixed inset-0 z-0 overflow-y-auto bg-neutral-950">
             {/* Background artwork — supplied as-is, scoped to this screen only. */}
             <Image src="/bg.png" alt="" fill priority className="pointer-events-none z-0 object-cover" />

             {/* Main content */}
             <div className="relative z-10 flex min-h-full w-full flex-col items-center px-6 py-12">

               {/* Wordmark — real BYV logo with a breathing brand-colour glow behind it */}
               <div className="flex flex-col items-center animate-in fade-in slide-in-from-top-3 duration-700 fill-mode-both">
                 <div className="relative mb-6 flex h-24 w-24 items-center justify-center">
                   <div
                     className="absolute inset-[-55%] rounded-full blur-2xl [animation:glow-breathe_4s_ease-in-out_infinite]"
                     style={{ background: "radial-gradient(circle, var(--brand-500) 0%, transparent 70%)" }}
                   />
                   <div className="absolute inset-[-14%] rounded-[28px] border border-brand-500/20" />
                   <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[26px] bg-white p-2.5 shadow-xl shadow-brand-900/40">
                     <Image src="/logo.jpg" alt="Book Your Vibe" width={80} height={80} className="h-full w-full object-contain" priority />
                   </div>
                 </div>
                 <h1 className="text-4xl font-extrabold tracking-tight">
                   <span className="text-white">Book </span>
                   <span className="bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">Your</span>
                   <span className="text-white"> Vibe</span>
                 </h1>
                 <p className="mt-2.5 text-[11px] font-bold uppercase tracking-[0.3em] text-white/40">Your Venue. Your Game.</p>
                 <span className="mt-4 h-px w-16 bg-gradient-to-r from-transparent via-brand-500 to-transparent" />
               </div>

               <div className="mt-9 w-full max-w-sm space-y-3.5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
                 {/* Player Card — brand/orange accent */}
                 <button
                   onClick={() => setStep("player-login")}
                   className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-brand-500/30 bg-gradient-to-r from-brand-500/10 via-white/[0.03] to-white/[0.03] p-4 text-left shadow-lg shadow-brand-950/30 backdrop-blur-xl transition-all hover:border-brand-500/50 hover:from-brand-500/15 active:scale-[0.98]"
                 >
                   <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/25 to-brand-600/15 text-xl shadow-inner">🏏</span>
                   <div className="min-w-0 flex-1">
                     <p className="text-[15px] font-bold text-white">I am a Player</p>
                     <p className="mt-0.5 text-xs text-white/45">Book venues, find games & playpals.</p>
                   </div>
                   <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-brand-500/40 text-brand-400 transition-transform group-hover:translate-x-0.5">
                     <ChevronRight className="h-4 w-4" />
                   </span>
                 </button>

                 {/* Vendor Card — violet accent, matching the vendor panel's own colour language */}
                 <button
                   onClick={() => router.push("/vendor/login")}
                   className="group relative flex w-full items-center gap-4 overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-500/10 via-white/[0.03] to-white/[0.03] p-4 text-left shadow-lg shadow-violet-950/30 backdrop-blur-xl transition-all hover:border-violet-500/50 hover:from-violet-500/15 active:scale-[0.98]"
                 >
                   <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/25 to-violet-600/15 text-violet-300 shadow-inner">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.04-4.04M22 7l-4.04-4.04M2 7l2.1 10.45c.14.72.8 1.25 1.54 1.25h12.72c.74 0 1.4-.53 1.54-1.25L22 7M2 7h20"/><path d="M10 22v-3a2 2 0 0 1 2-2v0a2 2 0 0 1 2 2v3"/></svg>
                   </span>
                   <div className="min-w-0 flex-1">
                     <p className="text-[15px] font-bold text-white">I am a Venue Owner</p>
                     <p className="mt-0.5 text-xs text-white/45">Manage bookings & pricing.</p>
                   </div>
                   <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-violet-500/40 text-violet-300 transition-transform group-hover:translate-x-0.5">
                     <ChevronRight className="h-4 w-4" />
                   </span>
                 </button>
               </div>

               {/* or divider */}
               <div className="mt-6 flex w-full max-w-[220px] items-center gap-3 animate-in fade-in duration-700 delay-200 fill-mode-both">
                 <span className="h-px flex-1 bg-white/10" />
                 <span className="text-[11px] font-semibold text-white/30">or</span>
                 <span className="h-px flex-1 bg-white/10" />
               </div>

               <button
                 onClick={onComplete}
                 className="mt-5 rounded-full border border-white/15 px-6 py-2.5 text-xs font-bold text-white/70 transition-colors hover:border-white/30 hover:text-white animate-in fade-in duration-700 delay-300 fill-mode-both"
               >
                 Skip for now
               </button>

               {/* Feature highlights */}
               <div className="mt-14 grid w-full max-w-lg grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 animate-in fade-in duration-700 delay-500 fill-mode-both">
                 {[
                   { icon: CalendarCheck2, label: "Easy Booking", sub: "Book in just a few taps", accent: "brand" as const },
                   { icon: ShieldCheck, label: "Trusted Venues", sub: "Verified & reliable", accent: "violet" as const },
                   { icon: Users, label: "Play Together", sub: "Connect. Play. Repeat.", accent: "brand" as const },
                   { icon: Zap, label: "Fast & Secure", sub: "Seamless experience", accent: "violet" as const },
                 ].map((f) => (
                   <div key={f.label} className="flex flex-col items-center text-center">
                     <span
                       className={`flex h-10 w-10 items-center justify-center rounded-full ${
                         f.accent === "brand" ? "bg-brand-500/15 text-brand-400" : "bg-violet-500/15 text-violet-300"
                       }`}
                     >
                       <f.icon size={17} />
                     </span>
                     <p className="mt-2 text-xs font-bold text-white">{f.label}</p>
                     <p className="mt-0.5 text-[10px] text-white/40">{f.sub}</p>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
