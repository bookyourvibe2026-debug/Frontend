"use client";

import { useEffect, useState } from "react";
import { Ticket } from "lucide-react";
import { SectionHeading } from "./ui";
import { getActiveBanners } from "@/lib/api/banners";
import type { AdBanner as AdBannerData } from "@/lib/api/types";

export function AdBanner({
  className = "mx-auto mt-8 max-w-7xl px-4 sm:px-6",
  compact = false,
}: {
  className?: string;
  /** Slim mode for tight spaces (e.g. vendor dashboard): no heading, shorter strip. */
  compact?: boolean;
}) {
  const [banners, setBanners] = useState<AdBannerData[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    getActiveBanners()
      .then(setBanners)
      .catch(() => setBanners([]));
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % banners.length);
    }, 4500);
    return () => clearInterval(id);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <section className={className}>
      {!compact && (
        <SectionHeading eyebrow="Exclusive" title="Hot Offers & Events" subtitle="Limited-time deals, tournaments, and offers — handpicked for you." icon={Ticket} />
      )}

      <div className="relative overflow-hidden rounded-2xl">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {banners.map((banner) => {
            const content = (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={banner.imageUrl} alt={banner.title ?? "Promotional banner"} className="h-full w-full object-cover" />
                {banner.title && (
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <p className="text-sm font-bold text-white sm:text-base">{banner.title}</p>
                  </div>
                )}
              </>
            );
            const cardClass = compact
              ? "group relative block aspect-[21/6] w-full shrink-0 overflow-hidden"
              : "group relative block aspect-[16/7] w-full shrink-0 overflow-hidden sm:aspect-[21/6]";
            return banner.linkUrl ? (
              <a key={banner._id} href={banner.linkUrl} className={cardClass}>
                {content}
              </a>
            ) : (
              <div key={banner._id} className={cardClass}>
                {content}
              </div>
            );
          })}
        </div>

        {banners.length > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            {banners.map((banner, i) => (
              <button
                key={banner._id}
                type="button"
                aria-label={`Show banner ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === index ? "w-7 bg-brand-500" : "w-1.5 bg-slate-200 hover:bg-slate-300"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
