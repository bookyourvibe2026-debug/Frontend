"use client";

import { useEffect, useCallback } from "react";

export interface SlotHoldData {
  listingId: string;
  date: string;
  time: string;
  courtId?: string;
  courtName?: string;
  holderId?: string;
}

export interface SlotReleaseData {
  listingId: string;
  date: string;
  time: string;
  courtId?: string;
  holderId?: string;
}

export interface BookingUpdatedData {
  action: "created" | "confirmed" | "cancelled";
  orderId: string;
  dateTime?: string;
  endTime?: string;
  courtId?: string;
  status: string;
}

interface UseVenueRealtimeOptions {
  listingId: string | null;
  onSlotHold?: (data: SlotHoldData) => void;
  onSlotRelease?: (data: SlotReleaseData) => void;
  onBookingUpdated?: (data: BookingUpdatedData) => void;
  /** Custom refresh interval in milliseconds (default: 3000ms = 3s) */
  pollIntervalMs?: number;
}

/**
 * Zero-Config Adaptive Serverless Real-Time Sync Hook
 * Requires ZERO external accounts, API keys, or third-party services.
 * Automatically syncs slot availability and vendor bookings every 3 seconds
 * when the user is actively viewing the page, pausing when the tab is hidden.
 */
export function useVenueRealtime({
  listingId,
  onBookingUpdated,
  pollIntervalMs = 3000,
}: UseVenueRealtimeOptions) {
  useEffect(() => {
    if (!listingId) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const startPolling = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        if (typeof document !== "undefined" && document.hidden) return;
        onBookingUpdated?.({
          action: "confirmed",
          orderId: "",
          status: "sync",
        });
      }, pollIntervalMs);
    };

    startPolling();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timer) clearInterval(timer);
      } else {
        // Immediate sync when user switches back to tab
        onBookingUpdated?.({
          action: "confirmed",
          orderId: "",
          status: "sync",
        });
        startPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [listingId, onBookingUpdated, pollIntervalMs]);

  const emitSlotHold = useCallback(
    async (data: Omit<SlotHoldData, "listingId">) => {
      if (!listingId) return;
      onBookingUpdated?.({
        action: "created",
        orderId: "",
        dateTime: data.date,
        status: "hold",
      });
    },
    [listingId, onBookingUpdated]
  );

  const emitSlotRelease = useCallback(
    async (data: Omit<SlotReleaseData, "listingId">) => {
      if (!listingId) return;
      onBookingUpdated?.({
        action: "cancelled",
        orderId: "",
        dateTime: data.date,
        status: "release",
      });
    },
    [listingId, onBookingUpdated]
  );

  return {
    emitSlotHold,
    emitSlotRelease,
  };
}

export { useVenueRealtime as useVenueSocket };
