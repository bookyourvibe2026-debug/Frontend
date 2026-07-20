"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
    <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900 text-white">
      {/* Background for splash 1 & 2 */}
      {(step === "splash1" || step === "splash2") && (
        <div className="absolute inset-0 z-0 bg-[#071310]">
          <Image src="/splash.jpeg" alt="Splash Background" fill className="object-cover opacity-60" priority unoptimized />
          <div className="absolute inset-0 bg-black/40" />
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
            <p className="mt-4 text-sm font-extrabold uppercase tracking-[0.2em] text-[#001711] opacity-70">
              Your Venue. Your Game.
            </p>
          </div>
        )}

        {step === "role" && (
          <div className="fixed inset-0 z-0 flex flex-col items-center justify-center animate-in fade-in duration-500 bg-[#041510]">
             {/* Grid, orbiting rings & floating sport icons */}
             <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
               <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
               <div className="absolute left-[-20%] top-[40%] h-[80%] w-[120%] opacity-10 blur-sm mix-blend-screen">
                  {/* Faint background rings — slow counter-rotating orbit for depth */}
                  <div className="absolute inset-0 rounded-full border-[1px] border-emerald-500/20 [animation:spin_28s_linear_infinite]" />
                  <div className="absolute inset-10 rounded-full border-[1px] border-emerald-500/20 [animation:spin_20s_linear_infinite_reverse]" />
               </div>
               {/* Drifting sport emoji — subtle, low-opacity, staggered timing so they never sync */}
               <span className="absolute left-[12%] top-[20%] text-3xl opacity-[0.08] [animation:float-y_7s_ease-in-out_infinite]">⚽</span>
               <span className="absolute right-[14%] top-[28%] text-3xl opacity-[0.08] [animation:float-y_8s_ease-in-out_infinite_1.2s]">🏸</span>
               <span className="absolute left-[18%] bottom-[24%] text-3xl opacity-[0.08] [animation:float-y_6.5s_ease-in-out_infinite_0.6s]">🎾</span>
               <span className="absolute right-[10%] bottom-[18%] text-3xl opacity-[0.08] [animation:float-y_7.5s_ease-in-out_infinite_2s]">🏓</span>
             </div>

             {/* Main content */}
             <div className="relative z-10 flex w-full flex-col items-center justify-center gap-16 px-6">

               {/* Center Glow Circle — breathing glow with an orbiting dashed ring.
                   The one-time mount animation and the perpetual pulse live on separate
                   elements so their `animation` properties don't fight each other. */}
               <div className="animate-in zoom-in duration-700">
                 <div className="relative flex h-[120px] w-[120px] items-center justify-center rounded-full bg-emerald-500 [animation:pulse-glow_3s_ease-in-out_infinite]">
                   <div className="absolute -inset-3 rounded-full border border-emerald-400/20" />
                   <div className="absolute -inset-6 rounded-full border border-dashed border-emerald-400/30 [animation:spin_14s_linear_infinite]" />
                   <div className="text-center text-xs font-black leading-tight tracking-[0.25em] text-white">
                     BOOK<br />YOUR<br />VIBE
                   </div>
                 </div>
               </div>

               <div className="w-full max-w-sm space-y-4">
                 {/* Player Card */}
                 <button
                   onClick={() => setStep("player-login")}
                   className="flex w-full items-center gap-5 rounded-[1.5rem] border border-white/5 bg-[#172520] p-5 shadow-lg backdrop-blur-md transition-transform animate-in slide-in-from-bottom-4 fade-in duration-500 fill-mode-both active:scale-95"
                 >
                   <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#273832] text-xl shadow-inner">🏏</span>
                   <div className="text-left">
                     <p className="text-[17px] font-bold text-white">I am a Player</p>
                     <p className="mt-1 text-xs font-medium text-slate-400">Book venues, find games & playpals.</p>
                   </div>
                 </button>

                 {/* Vendor Card */}
                 <button
                   onClick={() => router.push("/vendor/login")}
                   className="flex w-full items-center gap-5 rounded-[1.5rem] border border-white/5 bg-[#172520] p-5 shadow-lg backdrop-blur-md transition-transform animate-in slide-in-from-bottom-4 fade-in duration-500 delay-150 fill-mode-both active:scale-95"
                 >
                   <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#273832] text-emerald-400 shadow-inner">
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.04-4.04M22 7l-4.04-4.04M2 7l2.1 10.45c.14.72.8 1.25 1.54 1.25h12.72c.74 0 1.4-.53 1.54-1.25L22 7M2 7h20"/><path d="M10 22v-3a2 2 0 0 1 2-2v0a2 2 0 0 1 2 2v3"/></svg>
                   </span>
                   <div className="text-left">
                     <p className="text-[17px] font-bold text-white">I am a Venue Owner</p>
                     <p className="mt-1 text-xs font-medium text-slate-400">Manage bookings & pricing.</p>
                   </div>
                 </button>
               </div>

               <button onClick={onComplete} className="text-sm font-bold text-slate-400 hover:text-white transition-colors underline decoration-slate-600 underline-offset-4 animate-in fade-in duration-700 delay-300 fill-mode-both">
                 Skip for now
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
