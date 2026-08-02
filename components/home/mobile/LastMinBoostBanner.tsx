import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { BoostCountdown } from "./BoostCountdown";
import { type ActiveBoostInfo } from "@/lib/boostHelpers";

export function LastMinBoostBanner({ 
  boost, 
  onExpire 
}: { 
  boost: ActiveBoostInfo; 
  onExpire?: () => void;
}) {
  const hours = Math.round(boost.triggerMins / 60);
  const durationText = hours >= 1 
    ? `Next ${hours} Hour${hours > 1 ? "s" : ""}` 
    : `Next ${boost.triggerMins} Mins`;

  return (
    <Link
      href={boost.linkUrl}
      className="relative flex w-full overflow-hidden rounded-[2rem] bg-gradient-to-r from-[#ea580c] via-[#f97316] to-[#fed7aa] p-5 text-white shadow-lg transition duration-300 hover:shadow-xl hover:shadow-orange-500/10 active:scale-[0.99] min-h-[165px]"
    >
      {/* Decorative light reflection overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_50%)] pointer-events-none" />

      {/* Cricketer Action Image - absolutely positioned on the right half with a gradient mask for seamless blending */}
      <div 
        className="absolute right-0 bottom-0 top-0 h-full w-[60%] sm:w-[48%] md:w-[42%] lg:w-[36%] opacity-95 select-none pointer-events-none"
        style={{
          maskImage: "linear-gradient(to right, transparent 0%, black 50%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 50%)",
        }}
      >
        <Image
          src="/last_minute_boost_cricket.png"
          alt="Play Today"
          fill
          priority
          sizes="(max-width: 640px) 50vw, 36vw"
          className="object-cover object-right"
          draggable={false}
        />
      </div>

      {/* Left Content Side */}
      <div className="relative z-10 flex flex-col justify-between flex-1 max-w-[55%]">
        <div className="flex flex-col gap-1 sm:gap-1.5">
          {/* Flame badge */}
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white">
            ⚡ Play Today
          </span>
          <div className="mt-1">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-none">
              Flat {boost.discountPct}% OFF
            </h2>
            <p className="mt-1.5 text-[11px] font-semibold text-orange-100/90 leading-none">
              For {durationText}
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="mt-4">
          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-orange-600 to-orange-700 px-4 py-2 text-[10px] font-black uppercase text-white shadow-md transition hover:scale-105 active:scale-95">
            View All
            <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* Countdown timer card overlaying cricketer image */}
      <div className="absolute right-3.5 bottom-3.5 z-20 select-none pointer-events-auto">
        <BoostCountdown slotStart={boost.slotStart} onExpire={onExpire} />
      </div>
    </Link>
  );
}
