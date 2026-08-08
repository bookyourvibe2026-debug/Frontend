import type { Listing } from "./api/types";

/**
 * Checks if an Event listing's scheduled date and time have already passed.
 * Compares the event's scheduled date and end time with the current time.
 * Returns true if the event has ended/passed, false if it is upcoming or active.
 */
export function isEventExpired(event: Partial<Listing>, now: Date = new Date()): boolean {
  if (event.type !== "Event") return false;

  const validOverrides = (event.dateOverrides ?? []).filter(
    (o) => !o.isHoliday && (o.slots ?? []).length > 0
  );

  let latestEndTime: Date | null = null;

  if (validOverrides.length > 0) {
    for (const override of validOverrides) {
      if (!override.date) continue;
      const dateOnly = override.date.slice(0, 10);

      for (const slot of override.slots ?? []) {
        const slotEnd = slot.endTime || slot.startTime || "23:59";
        const [hStr, mStr] = slotEnd.split(":");
        const hours = parseInt(hStr || "23", 10);
        const mins = parseInt(mStr || "59", 10);

        const slotEndDate = new Date(`${dateOnly}T00:00:00`);
        if (isNaN(slotEndDate.getTime())) continue;

        slotEndDate.setHours(hours, mins, 0, 0);

        // Handle overnight slots crossing midnight (e.g. 22:00 -> 02:00)
        const [startHStr] = (slot.startTime || "00:00").split(":");
        const startHours = parseInt(startHStr || "0", 10);
        if (hours < startHours) {
          slotEndDate.setDate(slotEndDate.getDate() + 1);
        }

        if (!latestEndTime || slotEndDate.getTime() > latestEndTime.getTime()) {
          latestEndTime = slotEndDate;
        }
      }
    }
  }

  // Fallback 1: availableTill
  if (!latestEndTime && event.availableTill) {
    const tillDate = new Date(event.availableTill);
    if (!isNaN(tillDate.getTime())) {
      if (event.reportingEndTime) {
        const [hStr, mStr] = event.reportingEndTime.split(":");
        tillDate.setHours(parseInt(hStr || "23", 10), parseInt(mStr || "59", 10), 59, 999);
      } else {
        tillDate.setHours(23, 59, 59, 999);
      }
      latestEndTime = tillDate;
    }
  }

  // Fallback 2: availableFrom
  if (!latestEndTime && event.availableFrom) {
    const fromDate = new Date(event.availableFrom);
    if (!isNaN(fromDate.getTime())) {
      fromDate.setHours(23, 59, 59, 999);
      latestEndTime = fromDate;
    }
  }

  if (!latestEndTime) return false;

  return latestEndTime.getTime() < now.getTime();
}
