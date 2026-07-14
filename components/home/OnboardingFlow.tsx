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
  const [step, setStep] = useState<"splash1" | "splash2" | "splash3" | "role" | "player-login" | "player-signup">("splash1");

  // Auto-advance splash screens
  useEffect(() => {
    if (step === "splash1") {
      const timer = setTimeout(() => setStep("splash2"), 2500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  useEffect(() => {
    if (step === "splash2") {
      const timer = setTimeout(() => setStep("splash3"), 2000);
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

        {step === "splash3" && (
          <div className="fixed inset-0 z-0 bg-[#0b1118] flex flex-col md:flex-row items-center justify-center animate-in fade-in duration-500">
             {/* Desktop SEO Content - Hidden on mobile */}
             <div className="hidden md:flex flex-1 flex-col justify-center px-12 lg:px-24">
               <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight">
                 India's Premier <span className="text-emerald-500">Sports & Venue</span> Management Platform
               </h2>
               <p className="mt-6 text-lg text-slate-400 max-w-xl leading-relaxed">
                 Book Your Vibe is the ultimate solution for turf owners, sports arenas, and players. We bridge the gap between sports enthusiasts and premium venues. Discover games, manage seamless bookings, host professional tournaments, and grow your sports community all in one place. Experience the future of sports management today.
               </p>
               <div className="mt-8 flex gap-6">
                 <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-emerald-500" />
                   <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">Automated Bookings</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-emerald-500" />
                   <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">Revenue Analytics</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="h-2 w-2 rounded-full bg-emerald-500" />
                   <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">Player Discovery</span>
                 </div>
               </div>
             </div>

             {/* Mobile / Shared Image Section */}
             <div className="relative flex h-full w-full md:w-[500px] lg:w-[600px] flex-col bg-[#0b1118] md:bg-[#0f1720] md:border-l border-white/5 shadow-2xl">
                
                {/* Image Container */}
                <div className="relative flex-1 w-full px-5 pt-8 pb-36 md:pb-40">
                  <div className="relative h-full w-full overflow-hidden rounded-[1.25rem] bg-[#fdfaf2] shadow-2xl border-2 border-[#111720]">
                    <Image src="/sim.png" alt="Book Your Vibe Complete Solution" fill className="object-contain" unoptimized priority />
                  </div>
                </div>

                {/* Bottom Dock */}
                <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center rounded-t-[2.5rem] bg-[#111720] px-6 py-8 shadow-[0_-15px_40px_rgba(0,0,0,0.4)]">
                  <div className="mb-8 flex gap-2">
                    <span className="h-1.5 w-6 rounded-full bg-emerald-500" />
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                  </div>
                  <button
                    onClick={() => setStep("role")}
                    className="w-full rounded-2xl bg-emerald-500 py-4 text-[15px] font-bold uppercase tracking-wider text-white shadow-[0_8px_30px_rgba(16,185,129,0.35)] transition-transform active:scale-95"
                  >
                    Continue
                  </button>
                </div>
             </div>
          </div>
        )}

        {step === "role" && (
          <div className="fixed inset-0 z-0 flex flex-col items-center justify-center animate-in fade-in duration-500 bg-[#041510]">
             {/* Grid & Football Background */}
             <div className="absolute inset-0 z-0 overflow-hidden">
               <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
               <div className="absolute left-[-20%] top-[40%] h-[80%] w-[120%] opacity-10 blur-sm mix-blend-screen">
                  {/* Faint background elements */}
                  <div className="absolute inset-0 rounded-full border-[1px] border-emerald-500/20" />
                  <div className="absolute inset-10 rounded-full border-[1px] border-emerald-500/20" />
               </div>
             </div>
             
             {/* Main content */}
             <div className="relative z-10 flex w-full flex-col items-center justify-center gap-16 px-6">
               
               {/* Center Glow Circle */}
               <div className="relative flex h-[120px] w-[120px] items-center justify-center rounded-full bg-emerald-500 shadow-[0_0_80px_rgba(16,185,129,0.4)]">
                 <div className="absolute -inset-3 rounded-full border border-emerald-400/20" />
                 <div className="text-center text-xs font-black leading-tight tracking-[0.25em] text-white">
                   BOOK<br />YOUR<br />VIBE
                 </div>
               </div>

               <div className="w-full max-w-sm space-y-4">
                 {/* Player Card */}
                 <button
                   onClick={() => setStep("player-login")}
                   className="flex w-full items-center gap-5 rounded-[1.5rem] border border-white/5 bg-[#172520] p-5 shadow-lg backdrop-blur-md transition-transform active:scale-95"
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
                   className="flex w-full items-center gap-5 rounded-[1.5rem] border border-white/5 bg-[#172520] p-5 shadow-lg backdrop-blur-md transition-transform active:scale-95"
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

               <button onClick={onComplete} className="text-sm font-bold text-slate-400 hover:text-white transition-colors underline decoration-slate-600 underline-offset-4">
                 Skip for now
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}
