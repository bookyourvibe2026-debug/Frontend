import { useEffect, useRef, useState } from "react";

export function BoostCountdown({ 
  slotStart, 
  onExpire 
}: { 
  slotStart: string; 
  onExpire?: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState<{ hrs: string; min: string; sec: string }>({ hrs: "00", min: "00", sec: "00" });
  const onExpireRef = useRef(onExpire);

  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    function calculateTime() {
      const now = new Date();
      const [h = 0, m = 0] = (slotStart || "01:00").split(":").map(Number);
      
      const target = new Date();
      target.setHours(h, m, 0, 0);

      // If target time has already passed today, set target to tomorrow
      if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
      }

      const diffMs = target.getTime() - now.getTime();
      const totalSecs = Math.max(0, Math.floor(diffMs / 1000));
      const hrs = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;

      return {
        hrs: String(hrs).padStart(2, "0"),
        min: String(mins).padStart(2, "0"),
        sec: String(secs).padStart(2, "0"),
      };
    }

    setTimeLeft(calculateTime());

    const interval = setInterval(() => {
      setTimeLeft(calculateTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [slotStart]);

  if (!timeLeft) {
    return (
      <div className="flex flex-col items-center rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-lg border border-slate-100 text-center w-[125px] sm:w-[135px] backdrop-blur-sm">
        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Offer ends in</span>
        <div className="mt-1 flex items-center justify-center font-mono text-sm font-black text-slate-800 tracking-tight leading-none">
          <span>00</span>
          <span className="px-0.5 animate-pulse">:</span>
          <span>00</span>
          <span className="px-0.5 animate-pulse">:</span>
          <span>00</span>
        </div>
        <div className="mt-1.5 flex justify-between w-full px-1 text-[7px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">
          <span>Hrs</span>
          <span>Min</span>
          <span>Sec</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center rounded-2xl bg-white/95 px-3.5 py-2.5 shadow-lg border border-slate-100 text-center w-[125px] sm:w-[135px] backdrop-blur-sm">
      <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest leading-none">Offer ends in</span>
      <div className="mt-1 flex items-center justify-center font-mono text-sm font-black text-slate-800 tracking-tight leading-none">
        <span>{timeLeft.hrs}</span>
        <span className="px-0.5 animate-pulse">:</span>
        <span>{timeLeft.min}</span>
        <span className="px-0.5 animate-pulse">:</span>
        <span>{timeLeft.sec}</span>
      </div>
      <div className="mt-1.5 flex justify-between w-full px-1 text-[7px] font-extrabold text-slate-400 uppercase tracking-wider leading-none">
        <span>Hrs</span>
        <span>Min</span>
        <span>Sec</span>
      </div>
    </div>
  );
}
