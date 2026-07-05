"use client";

import Image from "next/image";
import Link from "next/link";

type BrandLogoProps = {
  className?: string;
  boxClassName?: string;
  imageClassName?: string;
  logoBoxClassName?: string;
  textClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  showText?: boolean;
  showTagline?: boolean;
  priority?: boolean;
  href?: string;
};

export function BrandLogo({
  className = "",
  boxClassName = "border-slate-200 bg-white shadow-sm",
  imageClassName = "p-1",
  logoBoxClassName = "h-10 w-10 rounded-xl",
  textClassName = "",
  titleClassName = "text-slate-900",
  subtitleClassName = "text-slate-400",
  showText = true,
  showTagline = true,
  priority = false,
  href = "/",
}: BrandLogoProps) {
  return (
    <Link href={href} className={`flex min-w-0 items-center gap-3 ${className}`.trim()}>
      <div className={`relative shrink-0 overflow-hidden border bg-white shadow-sm ${boxClassName} ${logoBoxClassName}`.trim()}>
        <Image
          src="/logo.jpg"
          alt="Book Your Vibe logo"
          fill
          sizes="120px"
          className={`object-contain ${imageClassName}`.trim()}
          priority={priority}
        />
      </div>

      {showText && (
        <div className={`min-w-0 leading-tight ${textClassName}`.trim()}>
          <p className={`text-sm font-extrabold tracking-tight ${titleClassName}`.trim()}>
            BOOK <span className="text-brand-600">YOUR VIBE</span>
          </p>
          {showTagline && (
            <p className={`text-[10px] font-semibold uppercase tracking-widest ${subtitleClassName}`.trim()}>
              Book · Play · Eat · Repeat
            </p>
          )}
        </div>
      )}
    </Link>
  );
}
