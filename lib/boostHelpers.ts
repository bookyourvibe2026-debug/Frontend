import type { Listing } from "./api/types";
import { activeBoostPct, nowMinutes, todayIso, toMinutes } from "./lastMinBoost";

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
    if (!listing.lastMinBoost?.enabled) continue;

    // Get slots for today
    const override = listing.dateOverrides?.find((o) => o.date === today);
    const slots = override ? (override.isHoliday ? [] : override.slots ?? []) : listing.slotsList ?? [];
    const activeSlots = slots.filter((s) => !s.blocked);

    for (const slot of activeSlots) {
      const pct = activeBoostPct(listing.lastMinBoost, slot.startTime, minutesNow, listing.lastMinBoost.game);
      if (pct > 0) {
        activeBoosts.push({
          discountPct: pct,
          slotStart: slot.startTime,
          triggerMins: listing.lastMinBoost.triggerMins,
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
