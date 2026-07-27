/**
 * Last Min Boost — client mirror of the backend rule.
 *
 * The vendor's rule lives on the listing; the discount is never baked into slot prices.
 * It's derived here on every render so the trigger window actually holds: a 6:00 PM slot
 * with a 30-minute trigger shows full price at 5:29 PM and the deal at 5:30 PM.
 *
 * Must stay in step with backend/src/services/lastMinBoost.service.ts — the backend
 * re-checks all of this at booking time, so drift shows up as a price mismatch.
 */

export interface LastMinBoost {
  enabled: boolean;
  /** Sport label the boost applies to. */
  game: string;
  /** Slot start times in "HH:mm" the vendor opted into. */
  slotStarts: string[];
  discountPct: number;
  triggerMins: number;
}

export const BOOST_MIN_PCT = 10;
export const BOOST_MAX_PCT = 30;

/** Preset choices shown in the vendor wizard; a custom value is also allowed inside the band. */
export const BOOST_DISCOUNT_PRESETS = [10, 15, 20, 25, 30];
export const BOOST_TRIGGER_OPTIONS = [10, 15, 20, 30, 45, 60];

function toMinutes(time: string): number {
  const [h = 0, m = 0] = time.split(":").map(Number);
  return h * 60 + m;
}

export function clampBoostPct(pct: number): number {
  return Math.min(BOOST_MAX_PCT, Math.max(BOOST_MIN_PCT, Math.round(pct)));
}

/** Price after the boost, never below ₹1. */
export function boostedPrice(basePrice: number, discountPct: number): number {
  return Math.max(1, Math.round((basePrice * (100 - clampBoostPct(discountPct))) / 100));
}

/**
 * Whether `now` is inside the deal window [start - triggerMins, start). Computed on a
 * 24-hour circle so a 00:30 slot with a 60-minute trigger opens at 23:30 the night before.
 */
export function isWindowOpen(slotStart: string, triggerMins: number, nowMinutes: number): boolean {
  const start = toMinutes(slotStart);
  const opensAt = start - triggerMins;
  if (opensAt < 0) return nowMinutes >= opensAt + 1440 || nowMinutes < start;
  return nowMinutes >= opensAt && nowMinutes < start;
}

/** Enabled, slot opted in, and sport matching. No sport named = treat as a match. */
export function boostCoversSlot(
  boost: LastMinBoost | undefined | null,
  slotStart: string,
  sport?: string
): boolean {
  if (!boost?.enabled) return false;
  if (!boost.slotStarts?.includes(slotStart)) return false;
  if (boost.game && sport && boost.game !== sport) return false;
  return true;
}

/** Live discount for a slot, or 0 when no deal is running. Callers must check the slot is unbooked. */
export function activeBoostPct(
  boost: LastMinBoost | undefined | null,
  slotStart: string,
  nowMinutes: number,
  sport?: string
): number {
  if (!boostCoversSlot(boost, slotStart, sport)) return 0;
  if (!isWindowOpen(slotStart, boost!.triggerMins, nowMinutes)) return 0;
  return clampBoostPct(boost!.discountPct);
}

/** Minutes since midnight for a Date, in the viewer's local clock (venues are sold in IST). */
export function nowMinutes(d: Date = new Date()): number {
  return d.getHours() * 60 + d.getMinutes();
}
