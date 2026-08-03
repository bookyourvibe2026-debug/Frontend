import type { Listing } from "./api/types";
import { activeBoostPct, clampBoostPct, nowMinutes, todayIso, toMinutes } from "./lastMinBoost";

export interface ActiveBoostInfo {
  discountPct: number;
  slotStart: string;
  triggerMins: number;
  linkUrl: string;
}

export function findActiveBoost(listings: Listing[], now: Date = new Date()): ActiveBoostInfo | null {
  const minutesNow = nowMinutes(now);
  const today = todayIso();
  
  const activeBoosts: Array<{
    discountPct: number;
    slotStart: string;
    triggerMins: number;
  }> = [];

  for (const listing of listings) {
    for (const rule of listing.lastMinBoosts ?? []) {
      if (!rule.enabled) continue;

      const discountPct = clampBoostPct(rule.discountPct || 20);
      const triggerMins = rule.triggerMins || 10;
      const slotStarts = rule.slotStarts ?? [];

      if (slotStarts.length > 0) {
        for (const start of slotStarts) {
          activeBoosts.push({
            discountPct,
            slotStart: start,
            triggerMins,
          });
        }
      } else {
        activeBoosts.push({
          discountPct,
          slotStart: "01:00",
          triggerMins,
        });
      }
    }
  }

  if (activeBoosts.length === 0) return null;

  // Find the highest discount percentage
  const maxDiscount = Math.max(...activeBoosts.map((b) => b.discountPct));

  // Helper to calculate remaining minutes
  const getRemainingMinutes = (slotStart: string) => {
    const start = toMinutes(slotStart);
    const diff = start - minutesNow;
    return diff >= 0 ? diff : diff + 1440;
  };

  // Find the upcoming slot (starts soonest)
  activeBoosts.sort((a, b) => getRemainingMinutes(a.slotStart) - getRemainingMinutes(b.slotStart));
  const soonestBoost = activeBoosts[0];

  return {
    discountPct: maxDiscount,
    slotStart: soonestBoost.slotStart,
    triggerMins: soonestBoost.triggerMins,
    linkUrl: "/deals",
  };
}
