"use client";

import {
  useEffect,
  useState,
  useMemo,
  useRef,
} from "react";
import {
  Clock as ClockIcon,
  List as ListIcon,
  SlidersHorizontal,
  X,
  Ban,
  BookOpen,
  Pause,
  CalendarDays,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  getVendorListings,
  getVendorBookings,
  createVendorBooking,
  updateVendorBookingStatus,
  updateVendorListing,
  checkInVendorBooking,
} from "@/lib/api/vendor";
import { apiListingToMock, mockListingToApiInput } from "@/lib/api/listingAdapter";
import { ApiError } from "@/lib/api/client";
import { Listing, Booking, BookingStatus } from "@/lib/types";
import { ClockSlotsWidget } from "@/components/vendor/ClockSlotsWidget";
import { BlockReasonModal, ConfirmCountdownModal, ManageBookedSlotModal } from "@/components/vendor/SlotActionModals";
import { BookingsHeader } from "@/components/vendor/bookings/BookingsHeader";
import { BookingsTimeline, TimelineLegend, type SlotAction } from "@/components/vendor/bookings/BookingsTimeline";
import { AddBookingSheet, type AddBookingValues } from "@/components/vendor/bookings/AddBookingSheet";
import { QrScannerModal } from "@/components/vendor/bookings/QrScannerModal";
import {
  SlotFilterSheet,
  DEFAULT_FILTERS,
  activeFilterCount,
  filterSummary,
  hourMatchesTimeOfDay,
  type SlotFilters,
} from "@/components/vendor/bookings/SlotFilterSheet";

/* ─── helpers ─────────────────────────────────────────────────── */
function to12h(t: string) {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  let h = Number(hStr) % 24; // "24:00" (midnight close) → 12:00 AM
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${mStr} ${ap}`;
}
function t24m(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
/** Local-date ISO (yyyy-mm-dd). toISOString() would shift the day for IST users. */
function toIsoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function durHrs(start: string, end: string) {
  const d = t24m(end) - t24m(start);
  return d > 0 ? +(d / 60).toFixed(1) : 0;
}
/** Day-part label for a newly-added slot, from its start hour. */
function slotLabel(start: string) {
  const h = Number(start.split(":")[0]);
  if (h >= 5 && h < 12) return "Morning";
  if (h >= 12 && h < 17) return "Afternoon";
  if (h >= 17 && h < 21) return "Evening";
  return "Night";
}
type SlotStatus = "Available" | "Booked" | "Part Paid" | "Offline Booked" | "Blocked" | "On Hold";

/**
 * The vendor bookings API returns more than the shared mock `Booking` type models
 * (it carries listingId/customerName/phone/checkedIn). Naming that here keeps the
 * slot resolver free of `as any` casts.
 */
type ApiBooking = Booking & {
  listingId?: string;
  customerName?: string;
  phone?: string;
  checkedIn?: boolean;
};

interface AgendaSlot {
  startTime: string;
  endTime: string;
  label: string;
  price: number;
  status: SlotStatus;
  bookingId?: string;
  customerName?: string;
  phone?: string;
  blockedReason?: string;
  /** True once the player's ticket QR has been scanned in. */
  arrived?: boolean;
  sport?: string;
  numberOfPlayers?: number;
}

/* ────────────────────────────────────────────────────────────────
   MAIN PAGE
────────────────────────────────────────────────────────────────── */
export default function BookingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Agenda state
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [selectedTurfId, setSelectedTurfId] = useState("");
  // "All Slots" filter — status / time of day / source / quick filters.
  const [filters, setFilters] = useState<SlotFilters>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  // Add Booking sheet (name, number, court, price, timing, sport)
  const [addBookingOpen, setAddBookingOpen] = useState(false);
  const [addBookingInitial, setAddBookingInitial] = useState<Partial<AddBookingValues>>({});
  const [addBookingSaving, setAddBookingSaving] = useState(false);
  /** Start of the visible 7-day strip in the header. */
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  // Live clock tick — drives "running now" / "already passed" slot styling
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const isToday = selectedDate === todayIso;
  const [viewMode, setViewMode] = useState<"timeline" | "clock">("timeline");
  // Active slot action modal
  const [activeSlot, setActiveSlot] = useState<AgendaSlot | null>(null);
  // Grouped-list filter (for "See Booking" bottom button)
  const [groupedFilter, setGroupedFilter] = useState<SlotStatus | null>(null);

  // Offline booking modal
  const [offlineModal, setOfflineModal] = useState(false);
  const [offlineName, setOfflineName] = useState("");
  const [offlinePhone, setOfflinePhone] = useState("");
  const [offlineSport, setOfflineSport] = useState("");
  const [offlineAmount, setOfflineAmount] = useState("");
  const [offlineSubmitting, setOfflineSubmitting] = useState(false);
  const [setupSportsOpen, setSetupSportsOpen] = useState(false);
  const [setupSportsSelected, setSetupSportsSelected] = useState<string[]>([]);
  const [setupSportsSaving, setSetupSportsSaving] = useState(false);

  const ALL_SPORTS = ["Football", "Cricket", "Tennis", "Badminton", "Basketball", "Volleyball", "Hockey", "Rugby", "Kabaddi", "Handball", "Futsal", "Box Cricket", "Pickleball", "Squash", "Padel"];

  // "Add a time slot" modal (e.g. an extra late-night slot for this date)
  const [addSlotOpen, setAddSlotOpen] = useState(false);

  // Block-reason picker (available slot → "Block Slot")
  const [blockReasonOpen, setBlockReasonOpen] = useState(false);
  // Generic "are you sure, finalizing in Ns" step before any action actually runs
  const [pendingConfirm, setPendingConfirm] = useState<{ title: string; seconds: number; run: () => void | Promise<void> } | null>(null);

  // Load
  useEffect(() => {
    Promise.all([getVendorListings(), getVendorBookings({ limit: 500 })])
      .then(([l, b]) => {
        const mapped = l.map(apiListingToMock);
        setListings(mapped);
        const turfs = mapped.filter((x) => x.type === "Turf");
        // Prefer a turf that actually has slots configured, so the agenda isn't empty by default.
        const withSlots = turfs.find((t) => (t.slotsList?.length ?? 0) > 0);
        if (withSlots) setSelectedTurfId(withSlots.id);
        else if (turfs.length > 0) setSelectedTurfId(turfs[0].id);
        setBookings(b.items as unknown as ApiBooking[]);
      })
      .catch((e) => setError(e instanceof ApiError ? e.describe() : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const selectedTurf = useMemo(
    () => listings.find((l) => l.id === selectedTurfId),
    [listings, selectedTurfId]
  );
  const turfListings = useMemo(() => listings.filter((l) => l.type === "Turf"), [listings]);

  /* ── Deep link from Price Setting: ?date&start&end&price opens Add Booking prefilled ── */
  const bookingLinkHandled = useRef(false);
  useEffect(() => {
    if (bookingLinkHandled.current || turfListings.length === 0) return;
    bookingLinkHandled.current = true;
    const sp = new URLSearchParams(window.location.search);
    const date = sp.get("date");
    const start = sp.get("start");
    if (!date || !start) return;
    jumpToDate(date);
    setAddBookingInitial({ startTime: start, endTime: sp.get("end") ?? "", price: sp.get("price") ?? "" });
    setAddBookingOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turfListings]);

  /* ── Resolve slots for selected date ── */
  const resolvedSlots = useMemo<AgendaSlot[]>(() => {
    if (!selectedTurf) return [];
    const override = selectedTurf.dateOverrides?.find((o) => o.date === selectedDate);
    const base = override
      ? override.isHoliday ? [] : (override.slots || [])
      : (selectedTurf.slotsList || []);

    return base.map((slot) => {
      if (slot.blocked) {
        return {
          startTime: slot.startTime,
          endTime: slot.endTime,
          label: slot.label,
          price: slot.price,
          status: "Blocked" as SlotStatus,
          blockedReason: slot.blockedReason,
        };
      }

      // Find bookings on this date + turf that match the start time
      const match = bookings.find((bk) => {
        const bkDate = new Date(bk.dateTime).toISOString().slice(0, 10);
        const bkTime = new Date(bk.dateTime).toLocaleTimeString("en-US", {
          hour12: false, hour: "2-digit", minute: "2-digit",
        });
        return (bk.listing === selectedTurfId || bk.listingId === selectedTurfId)
          && bk.status !== "Cancelled"
          && bkDate === selectedDate
          && bkTime === slot.startTime;
      });

      let status: SlotStatus = "Available";
      let bookingId: string | undefined;
      let customerName: string | undefined;
      let phone: string | undefined;
      let arrived = false;

      if (match) {
        bookingId = match.orderId;
        customerName = match.customerName ?? match.customer;
        phone = match.phone;
        arrived = Boolean(match.checkedIn);
        const isOffline = match.payment === "Cash (Offline)";
        const isHold = customerName === "Hold";
        if (isHold && match.status === "Pending") status = "On Hold";
        else if (match.status === "Pending") status = "Part Paid";
        else if (match.status === "Confirmed" && isOffline) status = "Offline Booked";
        else status = "Booked";
      }

      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        label: slot.label,
        price: slot.price,
        status,
        bookingId,
        customerName,
        phone,
        arrived,
        sport: match?.sport,
        numberOfPlayers: match?.numberOfPlayers,
      };
    });
  }, [selectedTurf, selectedDate, bookings, selectedTurfId]);

  /* ── "All Slots" filter: status + time of day + source + quick ── */
  const visibleSlots = useMemo(() => {
    // "Next Booking" = the single next upcoming booked slot (today only).
    let nextBookedStart: string | null = null;
    if (filters.quick === "Next Booking") {
      const nowMins = now.getHours() * 60 + now.getMinutes();
      const upcoming = resolvedSlots
        .filter((s) => s.status !== "Available" && s.status !== "Blocked")
        .filter((s) => !isToday || t24m(s.startTime) >= nowMins)
        .sort((a, b) => t24m(a.startTime) - t24m(b.startTime));
      nextBookedStart = upcoming[0]?.startTime ?? null;
    }

    return resolvedSlots.filter((s) => {
      const hour = Number(s.startTime.split(":")[0]);
      if (!hourMatchesTimeOfDay(hour, filters.timeOfDay)) return false;

      if (filters.status === "Available" && s.status !== "Available") return false;
      if (filters.status === "Confirmed" && !(s.status === "Booked" || s.status === "Offline Booked")) return false;
      if (filters.status === "Pending" && !(s.status === "Part Paid" || s.status === "On Hold")) return false;
      if (filters.status === "Blocked" && s.status !== "Blocked") return false;

      if (filters.source === "Walk-in" && s.status !== "Offline Booked") return false;
      if (filters.source === "Online" && s.status !== "Booked") return false;

      if (filters.quick === "Empty Slots" && s.status !== "Available") return false;
      if (filters.quick === "Next Booking" && s.startTime !== nextBookedStart) return false;

      return true;
    });
  }, [resolvedSlots, filters, now, isToday]);

  /* ── Header-derived data ── */
  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return d;
    }),
    [weekStart]
  );

  /** Slots taken by any kind of booking — drives the "x/y Slots Booked" ring. */
  const bookedSlotCount = useMemo(
    () => resolvedSlots.filter((s) => ["Booked", "Offline Booked", "Part Paid", "On Hold"].includes(s.status)).length,
    [resolvedSlots]
  );

  /** Next upcoming booking on the selected day (from now, when the day is today). */
  const nextBooking = useMemo(() => {
    const nowMins = now.getHours() * 60 + now.getMinutes();
    return resolvedSlots
      .filter((s) => s.status !== "Available" && s.status !== "Blocked")
      .filter((s) => !isToday || t24m(s.startTime) >= nowMins)
      .sort((a, b) => t24m(a.startTime) - t24m(b.startTime))[0];
  }, [resolvedSlots, now, isToday]);

  /**
   * How far off the next booking is, measured from the current clock —
   * e.g. "in 45 min", "in 2 hr 10 min", or "now" while it's running.
   */
  const nextBookingIn = useMemo(() => {
    if (!nextBooking) return undefined;
    if (!isToday) return undefined;
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const diff = t24m(nextBooking.startTime) - nowMins;
    if (diff <= 0) return t24m(nextBooking.endTime) > nowMins ? "now" : undefined;
    if (diff < 60) return `in ${diff} min`;
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    return m === 0 ? `in ${h} hr` : `in ${h} hr ${m} min`;
  }, [nextBooking, now, isToday]);

  /** Open when the current time falls inside the day's configured slot window. */
  const isOpenNow = useMemo(() => {
    if (!isToday || resolvedSlots.length === 0) return false;
    const nowMins = now.getHours() * 60 + now.getMinutes();
    const open = Math.min(...resolvedSlots.map((s) => t24m(s.startTime)));
    const close = Math.max(...resolvedSlots.map((s) => t24m(s.endTime)));
    return nowMins >= open && nowMins < close;
  }, [resolvedSlots, now, isToday]);

  /** Keep the visible week strip in sync when the date jumps (e.g. quick filters). */
  function jumpToDate(iso: string) {
    setSelectedDate(iso);
    const d = new Date(iso + "T00:00:00");
    const inStrip = weekDates.some((w) => toIsoDate(w) === iso);
    if (!inStrip) setWeekStart(d);
  }

  /* ── Grouped list (for "See Booking" panel) ── */
  const groupedSlots = useMemo(() => {
    if (!groupedFilter) return [];
    if (groupedFilter === "Booked") {
      return resolvedSlots.filter(s => s.status === "Booked" || s.status === "Offline Booked");
    }
    return resolvedSlots.filter(s => s.status === groupedFilter);
  }, [resolvedSlots, groupedFilter]);

  /* ── Actions on available slot ── */
  async function setSlotBlocked(slot: AgendaSlot, blocked: boolean, reason?: string) {
    if (!selectedTurf) return;
    try {
      const overrides = [...(selectedTurf.dateOverrides || [])];
      const idx = overrides.findIndex(o => o.date === selectedDate);
      const currentSlots = idx > -1
        ? [...(overrides[idx].slots || [])]
        : [...(selectedTurf.slotsList || [])];
      const next = currentSlots.map(s => s.startTime === slot.startTime
        ? { ...s, blocked, blockedReason: blocked ? reason : undefined }
        : s);
      const newOverride = { date: selectedDate, isHoliday: false, holidayName: "", slots: next };
      if (idx > -1) overrides[idx] = newOverride; else overrides.push(newOverride);
      const updated = { ...selectedTurf, dateOverrides: overrides };
      const saved = await updateVendorListing(selectedTurf.id, mockListingToApiInput(updated));
      setListings(l => l.map(x => x.id === selectedTurf.id ? apiListingToMock(saved) : x));
      setActiveSlot(null);
    } catch { alert(`Failed to ${blocked ? "block" : "unblock"} slot`); }
  }

  /** Append a custom slot (e.g. late-night 1–2 AM) to the selected date's slot list. */
  async function addCustomSlot(start: string, end: string, price: number) {
    if (!selectedTurf) return;
    try {
      const overrides = [...(selectedTurf.dateOverrides || [])];
      const idx = overrides.findIndex((o) => o.date === selectedDate);
      const currentSlots = idx > -1 ? [...(overrides[idx].slots || [])] : [...(selectedTurf.slotsList || [])];
      if (currentSlots.some((s) => s.startTime === start)) {
        alert("A slot already starts at that time.");
        return;
      }
      const next = [...currentSlots, { startTime: start, endTime: end, label: slotLabel(start), price }].sort((a, b) =>
        a.startTime.localeCompare(b.startTime)
      );
      const newOverride = { date: selectedDate, isHoliday: false, holidayName: "", slots: next };
      if (idx > -1) overrides[idx] = newOverride;
      else overrides.push(newOverride);
      const updated = { ...selectedTurf, dateOverrides: overrides };
      const saved = await updateVendorListing(selectedTurf.id, mockListingToApiInput(updated));
      setListings((l) => l.map((x) => (x.id === selectedTurf.id ? apiListingToMock(saved) : x)));
      setAddSlotOpen(false);
    } catch {
      alert("Failed to add the slot");
    }
  }

  async function startOfflineBooking(slot: AgendaSlot) {
    if (!selectedTurf) return;
    if (!selectedTurf.categories || selectedTurf.categories.length === 0) {
      setSetupSportsSelected([]);
      setSetupSportsOpen(true);
      return;
    }
    setOfflineSport(selectedTurf.categories[0] || "");
    setOfflineAmount("");
    setActiveSlot(slot);
    setOfflineModal(true);
  }

  async function saveSetupSports() {
    if (!selectedTurf || setupSportsSelected.length === 0) return;
    setSetupSportsSaving(true);
    try {
      const updated = { ...selectedTurf, categories: setupSportsSelected };
      const saved = await updateVendorListing(selectedTurf.id, mockListingToApiInput(updated));
      setListings(l => l.map(x => x.id === selectedTurf.id ? apiListingToMock(saved) : x));
      setSetupSportsOpen(false);
      // Wait for React to apply state if we wanted to auto-open offline modal, 
      // but easier to just let user click again or open it directly:
      alert("Sports saved! You can now create the offline booking.");
    } catch {
      alert("Failed to save sports");
    } finally {
      setSetupSportsSaving(false);
    }
  }

  /** Validates the offline-booking form, then hands off to the confirm-with-undo step. */
  function confirmOfflineBooking() {
    if (!offlineName || !offlinePhone) { alert("Please fill name and phone"); return; }
    setOfflineModal(false);
    setPendingConfirm({ title: "Mark as Booked", seconds: 6, run: submitOfflineBooking });
  }

  async function submitOfflineBooking() {
    if (!activeSlot || !selectedTurf) return;
    setOfflineSubmitting(true);
    try {
      const dt = new Date(`${selectedDate}T${activeSlot.startTime}:00`);
      const parsedAmount = offlineAmount ? Number(offlineAmount) : activeSlot.price;
      const statusText = parsedAmount > 0 && parsedAmount < activeSlot.price ? "Part Paid" : "Confirmed";

      await createVendorBooking({
        listingId: selectedTurf.id,
        customerName: offlineName,
        phone: offlinePhone,
        dateTime: dt.toISOString(),
        totalAmount: activeSlot.price, // API requirement
        payment: "Cash (Offline)",
        status: statusText as BookingStatus,
      });
      // Refresh bookings
      const fresh = await getVendorBookings({ limit: 500 });
      setBookings(fresh.items as unknown as ApiBooking[]);
      setActiveSlot(null);
      setOfflineName("");
      setOfflinePhone("");
    } catch { alert("Failed to create offline booking"); }
    setOfflineSubmitting(false);
  }

  async function holdSlot(slot: AgendaSlot) {
    if (!selectedTurf) return;
    try {
      // Create a pending booking (no customer info yet — vendor can fill later)
      const dt = new Date(`${selectedDate}T${slot.startTime}:00`);
      await createVendorBooking({
        listingId: selectedTurf.id,
        customerName: "Hold",
        phone: "9000000000", // placeholder — must match backend's Indian mobile format (^[6-9]\d{9}$)
        dateTime: dt.toISOString(),
        totalAmount: slot.price,
        payment: "Cash (Offline)",
        status: "Pending",
      });
      const fresh = await getVendorBookings({ limit: 500 });
      setBookings(fresh.items as unknown as ApiBooking[]);
      setActiveSlot(null);
    } catch { alert("Failed to hold slot"); }
  }

  /* ── Actions on an already-booked slot ── */
  async function clearBookedSlot(slot: AgendaSlot) {
    try {
      if (slot.bookingId) {
        await updateVendorBookingStatus(slot.bookingId, "Cancelled");
        const fresh = await getVendorBookings({ limit: 500 });
        setBookings(fresh.items as unknown as ApiBooking[]);
      }
    } catch { alert("Failed to clear slot"); }
    setActiveSlot(null);
  }

  async function markSlotPaidConfirmed(slot: AgendaSlot) {
    try {
      if (slot.bookingId) {
        await updateVendorBookingStatus(slot.bookingId, "Confirmed");
        const fresh = await getVendorBookings({ limit: 500 });
        setBookings(fresh.items as unknown as ApiBooking[]);
      }
    } catch { alert("Failed to update booking"); }
    setActiveSlot(null);
  }

  async function blockSlotForMaintenance(slot: AgendaSlot) {
    try {
      if (slot.bookingId) {
        await updateVendorBookingStatus(slot.bookingId, "Cancelled");
        const fresh = await getVendorBookings({ limit: 500 });
        setBookings(fresh.items as unknown as ApiBooking[]);
      }
    } catch { alert("Failed to clear existing booking"); return; }
    await setSlotBlocked(slot, true, "Maintenance");
  }

  function handleConfirmPending() {
    if (!pendingConfirm) return;
    const { run } = pendingConfirm;
    setPendingConfirm(null);
    void run();
  }

  function handleUndoPending() {
    setPendingConfirm(null);
  }

  /* ── Add Booking ── */
  function openAddBooking(slot?: AgendaSlot) {
    setAddBookingInitial({
      courtId: selectedTurfId,
      price: slot ? String(slot.price) : "",
      startTime: slot?.startTime ?? "",
      endTime: slot?.endTime ?? "",
      sport: selectedTurf?.categories?.[0] ?? "",
    });
    setAddBookingOpen(true);
  }

  async function submitAddBooking(v: AddBookingValues) {
    setAddBookingSaving(true);
    try {
      const dt = new Date(`${selectedDate}T${v.startTime}:00`);
      await createVendorBooking({
        listingId: v.courtId,
        customerName: v.customerName.trim(),
        phone: v.phone,
        sport: v.sport || undefined,
        numberOfPlayers: v.numberOfPlayers ? Number(v.numberOfPlayers) : undefined,
        foodIncluded: v.foodIncluded,
        dateTime: dt.toISOString(),
        endTime: v.endTime || undefined,
        totalAmount: Number(v.price) || 0,
        payment: v.payment,
        status: "Confirmed",
      });
      const fresh = await getVendorBookings({ limit: 500 });
      setBookings(fresh.items as unknown as ApiBooking[]);
      setAddBookingOpen(false);
      setActiveSlot(null);
    } catch (e) {
      alert(e instanceof ApiError ? e.describe() : "Failed to create booking");
    }
    setAddBookingSaving(false);
  }

  /* ── QR check-in: scan ticket → mark the booking arrived ── */
  async function handleQrCheckIn(orderId: string): Promise<string> {
    const booking = await checkInVendorBooking(orderId).catch((e) => {
      throw new Error(e instanceof ApiError ? e.describe() : "Check-in failed. Please try again.");
    });
    // Refresh so the slot immediately shows the "Arrived" badge.
    const fresh = await getVendorBookings({ limit: 500 });
    setBookings(fresh.items as unknown as ApiBooking[]);
    const name = (booking as unknown as { customerName?: string })?.customerName;
    return name ? `${name} · ${orderId}` : orderId;
  }

  /* ── Timeline row ⋮ menu ── */
  function handleSlotAction(slot: AgendaSlot, action: SlotAction) {
    switch (action) {
      case "create-booking":
        openAddBooking(slot);
        return;
      case "block-slot":
        setActiveSlot(slot);
        setBlockReasonOpen(true);
        return;
      case "make-available":
        setPendingConfirm({
          title: "Make slot available",
          seconds: 6,
          run: () => (slot.status === "Blocked" ? setSlotBlocked(slot, false) : clearBookedSlot(slot)),
        });
        return;
      case "cancel-booking":
        setPendingConfirm({
          title: "Cancel this booking",
          seconds: 6,
          run: () => clearBookedSlot(slot),
        });
        return;
      case "mark-pending":
        setPendingConfirm({
          title: "Mark as pending",
          seconds: 6,
          run: () => setBookingStatus(slot, "Pending"),
        });
        return;
      case "mark-paid":
        setPendingConfirm({
          title: "Mark as paid & confirmed",
          seconds: 6,
          run: () => markSlotPaidConfirmed(slot),
        });
        return;
    }
  }

  /** Move a booking between Confirmed / Pending from the timeline. */
  async function setBookingStatus(slot: AgendaSlot, status: BookingStatus) {
    try {
      if (!slot.bookingId) return;
      await updateVendorBookingStatus(slot.bookingId, status);
      const fresh = await getVendorBookings({ limit: 500 });
      setBookings(fresh.items as unknown as ApiBooking[]);
    } catch (e) {
      alert(e instanceof ApiError ? e.describe() : "Failed to update booking");
    }
    setActiveSlot(null);
  }

  /* ── Clock select ── */
  const handleClockHour = async (hour: number) => {
    if (!selectedTurf) return;
    const startStr = `${String(hour).padStart(2, "0")}:00`;
    const slot = resolvedSlots.find(s => s.startTime === startStr);
    if (slot) setActiveSlot(slot);
  };

  const selectedDateObj = new Date(selectedDate + "T00:00:00");
  /** e.g. "Fri, 17 July" — the label beside "TODAY" in the header. */
  const headerDateLabel = selectedDateObj.toLocaleDateString("en-IN", {
    weekday: "short", day: "numeric", month: "long",
  });

  const isBookedSlot = activeSlot
    ? (["Booked", "Offline Booked", "Part Paid", "On Hold"] as SlotStatus[]).includes(activeSlot.status)
    : false;

  if (error) return <div className="p-10 text-center text-vibe-coral text-sm">{error}</div>;
  if (loading) {
    return <div className="p-10 text-center text-ink-faint text-sm">Loading dashboard…</div>;
  }

  return (
    <div className="flex flex-col bg-[#f5f5f5] -mx-4 -mt-6 -mb-24 sm:-mx-6 lg:-mb-6 h-[calc(100dvh-64px)] overflow-hidden relative">
      {/* ── HEADER: venue, today card, date strip ── */}
      <div className="shrink-0 z-20 bg-[#f5f7fa] px-4 pt-3 pb-2 md:px-6">
        <BookingsHeader
          turfs={turfListings.map((t) => ({ id: t.id, title: t.title }))}
          selectedTurfId={selectedTurfId}
          onSelectTurf={setSelectedTurfId}
          city={selectedTurf?.city}
          dateLabel={headerDateLabel}
          isOpenNow={isOpenNow}
          bookedSlots={bookedSlotCount}
          totalSlots={resolvedSlots.length}
          nextBookingTime={nextBooking ? to12h(nextBooking.startTime) : undefined}
          nextBookingIn={nextBookingIn}
          nextBookingName={nextBooking?.customerName}
          onOpenQrScanner={() => setQrScannerOpen(true)}
          onAddBooking={() => openAddBooking()}
          dates={weekDates}
          selectedDate={selectedDate}
          todayIso={todayIso}
          onSelectDate={setSelectedDate}
          onPrevWeek={() => setWeekStart((d) => { const n = new Date(d); n.setDate(d.getDate() - 7); return n; })}
          onNextWeek={() => setWeekStart((d) => { const n = new Date(d); n.setDate(d.getDate() + 7); return n; })}
        />

        {/* View toggle + "All Slots" filter */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex items-center overflow-hidden rounded-xl border border-slate-200 bg-white">
            <button
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold transition ${viewMode === "timeline" ? "bg-vibe-navy text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <ListIcon size={12} /> Timeline
            </button>
            <button
              onClick={() => setViewMode("clock")}
              className={`flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold transition ${viewMode === "clock" ? "bg-vibe-navy text-white" : "text-slate-500 hover:bg-slate-50"}`}
            >
              <ClockIcon size={12} /> Clock
            </button>
          </div>

          <button
            onClick={() => setFilterOpen(true)}
            className="ml-auto flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50"
          >
            <SlidersHorizontal size={12} /> {filterSummary(filters)}
            {activeFilterCount(filters) > 0 && (
              <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-vibe-violet px-1 text-[8px] font-black text-white">
                {activeFilterCount(filters)}
              </span>
            )}
            <ChevronDown size={11} className="text-slate-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6 pt-4 pb-28">
        {!selectedTurf && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center bg-white">
            <CalendarDays size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-500">No Turf listings found. Add a Turf listing to use the Agenda.</p>
          </div>
        )}

        {selectedTurf && groupedFilter && (
          <GroupedSlotsList
            slots={groupedSlots}
            filter={groupedFilter}
            onClose={() => setGroupedFilter(null)}
          />
        )}

        {selectedTurf && !groupedFilter && (
          <>
            {viewMode === "timeline" && (
              <>
                <BookingsTimeline
                  slots={visibleSlots}
                  onSlotClick={setActiveSlot}
                  onAction={handleSlotAction}
                  scrollToNow={isToday}
                />
                <button
                  onClick={() => setAddSlotOpen(true)}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-vibe-navy/30 bg-white py-3 text-[11px] font-black text-vibe-navy transition hover:bg-slate-50 active:scale-[0.99]"
                >
                  <CalendarDays size={13} /> Add a time slot (e.g. late night 1–2 AM)
                </button>
                <TimelineLegend />
              </>
            )}
            {viewMode === "clock" && (
              <div className="flex justify-center py-4">
                <ClockSlotsWidget
                  slots={visibleSlots}
                  onSelectSlot={setActiveSlot}
                  onSelectHour={handleClockHour}
                  renderSeeBooking={(closeFullscreen) => (
                    <SeeBookingButton
                      resolvedSlots={resolvedSlots}
                      onPick={(f) => {
                        // The grouped list renders in the page body, so leave fullscreen first.
                        closeFullscreen();
                        setGroupedFilter(f);
                      }}
                    />
                  )}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── BOTTOM "SEE BOOKING" BUTTON (grid mode only — clock mode has its own inline button) ── */}
      {selectedTurf && !groupedFilter && viewMode !== "clock" && (
        <div className="fixed bottom-16 left-0 right-0 flex justify-center z-20 pointer-events-none">
          <div className="pointer-events-auto">
            <SeeBookingButton resolvedSlots={resolvedSlots} onPick={setGroupedFilter} />
          </div>
        </div>
      )}

      {/* ── "ALL SLOTS" FILTER SHEET ── */}
      {filterOpen && (
      <SlotFilterSheet
        initial={filters}
        onClose={() => setFilterOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setFilterOpen(false);
          // Date-scoped quick filters move the agenda instead of filtering rows.
          if (next.quick === "Today") jumpToDate(todayIso);
          if (next.quick === "Tomorrow") {
            const d = new Date();
            d.setDate(d.getDate() + 1);
            jumpToDate(toIsoDate(d));
          }
          if (next.quick === "Weekend") {
            const d = new Date();
            d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7));
            jumpToDate(toIsoDate(d));
          }
        }}
      />
      )}

      {/* ── ADD BOOKING ── */}
      {addBookingOpen && (
        <AddBookingSheet
          courts={turfListings.map((t) => ({ id: t.id, title: t.title }))}
          sports={selectedTurf?.categories ?? []}
          initial={addBookingInitial}
          submitting={addBookingSaving}
          onClose={() => setAddBookingOpen(false)}
          onSubmit={submitAddBooking}
        />
      )}

      {/* ── QR SCANNER — scans the ticket QR and checks the player in ── */}
      {qrScannerOpen && (
        <QrScannerModal onClose={() => setQrScannerOpen(false)} onCheckIn={handleQrCheckIn} />
      )}

      {/* ── ADD A TIME SLOT ── */}
      {addSlotOpen && (
        <AddSlotModal
          dateLabel={headerDateLabel}
          defaultPrice={resolvedSlots[0]?.price ?? 0}
          onClose={() => setAddSlotOpen(false)}
          onAdd={addCustomSlot}
        />
      )}

      {/* ── SLOT ACTION MODAL (available / blocked) ── */}
      {activeSlot && !offlineModal && !blockReasonOpen && !pendingConfirm && !isBookedSlot && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setActiveSlot(null)}>
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {activeSlot.status === "Available" ? "Available Segment" : activeSlot.status}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <ClockIcon size={13} className="text-slate-400" />
                  <span className="text-sm text-slate-500 font-semibold">{to12h(activeSlot.startTime)} · {to12h(activeSlot.endTime)}</span>
                </div>
              </div>
              <button onClick={() => setActiveSlot(null)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400">
                <X size={18} />
              </button>
            </div>

            {activeSlot.status === "Available" ? (
              <div className="space-y-2">
                <ActionRow icon={<Ban size={18} className="text-rose-500" />} color="rose" title="Block Slot" sub="Mark as blocked for maintenance or other reasons" onClick={() => setBlockReasonOpen(true)} />
                <ActionRow icon={<BookOpen size={18} className="text-emerald-600" />} color="emerald" title="Offline Booking" sub="Book manually for a walk-in or phone customer" onClick={() => startOfflineBooking(activeSlot)} />
                <ActionRow icon={<Pause size={18} className="text-amber-500" />} color="amber" title="Keep on Hold" sub="Temporarily reserve this slot without full payment" onClick={() => setPendingConfirm({ title: "Keep on Hold", seconds: 8, run: () => holdSlot(activeSlot) })} />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-2">
                  <div className="flex justify-between"><span className="text-slate-500">Status</span><SlotBadge status={activeSlot.status} /></div>
                  {activeSlot.blockedReason && <div className="flex justify-between"><span className="text-slate-500">Reason</span><span className="font-bold">{activeSlot.blockedReason}</span></div>}
                  <div className="flex justify-between"><span className="text-slate-500">Price</span><span className="font-bold">₹{activeSlot.price}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Duration</span><span className="font-bold">{durHrs(activeSlot.startTime, activeSlot.endTime)} hrs</span></div>
                </div>
                {activeSlot.status === "Blocked" && (
                  <ActionRow icon={<Check size={18} className="text-emerald-600" />} color="emerald" title="Unblock Slot" sub="Make this slot available again" onClick={() => setSlotBlocked(activeSlot, false)} />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MANAGE BOOKED SLOT MODAL ── */}
      {activeSlot && isBookedSlot && !pendingConfirm && (
        <ManageBookedSlotModal
          customerName={activeSlot.customerName}
          phone={activeSlot.phone}
          timeLabel={`${to12h(activeSlot.startTime)} – ${to12h(activeSlot.endTime)}`}
          onClose={() => setActiveSlot(null)}
          onClear={() => setPendingConfirm({ title: "Clear this slot", seconds: 6, run: () => clearBookedSlot(activeSlot) })}
          onMarkPaid={() => setPendingConfirm({ title: "Mark as Paid & Confirmed", seconds: 6, run: () => markSlotPaidConfirmed(activeSlot) })}
          onBlockMaintenance={() => setPendingConfirm({ title: "Block for Maintenance", seconds: 6, run: () => blockSlotForMaintenance(activeSlot) })}
        />
      )}

      {/* ── BLOCK REASON PICKER ── */}
      {blockReasonOpen && activeSlot && (
        <BlockReasonModal
          onPick={(reason) => {
            setBlockReasonOpen(false);
            setPendingConfirm({ title: "Block this slot", seconds: 6, run: () => setSlotBlocked(activeSlot, true, reason) });
          }}
          onClose={() => setBlockReasonOpen(false)}
        />
      )}

      {/* ── CONFIRM WITH UNDO COUNTDOWN ── */}
      {pendingConfirm && (
        <ConfirmCountdownModal
          title={pendingConfirm.title}
          seconds={pendingConfirm.seconds}
          onConfirm={handleConfirmPending}
          onUndo={handleUndoPending}
        />
      )}

      {/* ── SETUP SPORTS MODAL ── */}
      {setupSportsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setSetupSportsOpen(false)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Setup Sports</h3>
                <p className="text-xs text-slate-500">Select the sports you provide at this turf</p>
              </div>
              <button onClick={() => setSetupSportsOpen(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"><X size={18} /></button>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6 max-h-60 overflow-y-auto pr-2">
              {ALL_SPORTS.map(sport => {
                const isSelected = setupSportsSelected.includes(sport);
                return (
                  <button 
                    key={sport}
                    onClick={() => setSetupSportsSelected(prev => 
                      isSelected ? prev.filter(s => s !== sport) : [...prev, sport]
                    )}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                      isSelected ? "bg-vibe-violet text-white border-vibe-violet" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {sport}
                  </button>
                );
              })}
            </div>
            
            <button 
              onClick={saveSetupSports} 
              disabled={setupSportsSelected.length === 0 || setupSportsSaving}
              className="w-full rounded-xl bg-vibe-violet text-white py-3 text-sm font-bold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {setupSportsSaving ? "Saving..." : "Save Sports"}
            </button>
          </div>
        </div>
      )}

      {/* ── OFFLINE BOOKING MODAL ── */}
      {offlineModal && activeSlot && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => { setOfflineModal(false); }}>
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-4xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Offline Booking</h3>
                <p className="text-xs text-slate-400">{to12h(activeSlot.startTime)} – {to12h(activeSlot.endTime)} · Total: ₹{activeSlot.price}</p>
              </div>
              <button onClick={() => setOfflineModal(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"><X size={18} /></button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Customer Name</label>
                <input value={offlineName} onChange={e => setOfflineName(e.target.value)} placeholder="e.g. Rahul"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-vibe-violet" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Phone Number</label>
                <input value={offlinePhone} onChange={e => setOfflinePhone(e.target.value)} placeholder="10-digit mobile" type="tel"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-vibe-violet" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Sport / Court</label>
                <select value={offlineSport} onChange={e => setOfflineSport(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-vibe-violet bg-white">
                  {selectedTurf?.categories?.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Amount Paid</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input value={offlineAmount} onChange={e => setOfflineAmount(e.target.value)} placeholder={activeSlot.price.toString()} type="number"
                    className="w-full rounded-xl border border-slate-200 pl-7 pr-3 py-2.5 text-sm outline-none focus:border-vibe-violet" />
                </div>
              </div>
              <button onClick={confirmOfflineBooking} disabled={offlineSubmitting}
                className="w-full rounded-xl bg-emerald-600 text-white py-2.5 text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-60 h-[42px]">
                {offlineSubmitting ? "Booking…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── AGENDA GRID ─────────────────────────────────────────────── */
/* ─── SEE BOOKING BUTTON + DROPDOWN ────────────────────────────── */
function SeeBookingButton({ resolvedSlots, onPick }: { resolvedSlots: AgendaSlot[]; onPick: (f: SlotStatus) => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent | TouchEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onOutside);
    return () => document.removeEventListener("pointerdown", onOutside);
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-vibe-navy text-white text-sm font-bold px-6 py-3 rounded-full shadow-xl hover:bg-vibe-navyDark transition"
      >
        SEE BOOKING <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-slate-100 min-w-[220px] overflow-hidden">
          {(["Booked", "Part Paid", "Offline Booked", "Blocked", "Available"] as SlotStatus[]).map(f => (
            <button key={f} onClick={() => { onPick(f); setOpen(false); }}
              className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 border-b border-slate-100 last:border-0">
              {f} ({resolvedSlots.filter(s => s.status === f).length})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── GROUPED LIST ─────────────────────────────────────────────── */
function GroupedSlotsList({ slots, filter, onClose }: { slots: AgendaSlot[]; filter: SlotStatus; onClose: () => void }) {
  const colorMap: Record<SlotStatus, { border: string; label: string; dot: string }> = {
    Available:        { border: "border-emerald-200", label: "text-emerald-700", dot: "bg-emerald-500" },
    Booked:           { border: "border-emerald-300", label: "text-emerald-700", dot: "bg-emerald-600" },
    "Part Paid":      { border: "border-amber-200", label: "text-amber-700", dot: "bg-amber-500" },
    "Offline Booked": { border: "border-green-200", label: "text-green-700", dot: "bg-green-600" },
    Blocked:          { border: "border-rose-200", label: "text-rose-700", dot: "bg-rose-600" },
    "On Hold":        { border: "border-violet-200", label: "text-violet-700", dot: "bg-violet-500" },
  };
  const c = colorMap[filter] || colorMap.Available;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-4 overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-800">Grouped {filter} Slots</h4>
        <span className="ml-auto text-xs font-bold text-slate-400">{slots.length} slot{slots.length !== 1 ? "s" : ""}</span>
        <button onClick={onClose} className="ml-2 p-1 rounded-full hover:bg-slate-100 text-slate-400"><X size={14} /></button>
      </div>
      {slots.length === 0 ? (
        <p className="px-5 py-8 text-sm text-center text-slate-400">No {filter.toLowerCase()} slots for this date</p>
      ) : (
        <div className="divide-y divide-slate-100">
          {slots.map((s, i) => {
            const sc = colorMap[s.status] || c;
            return (
              <div key={i} className={`flex items-center justify-between px-5 py-4 border-l-2 ${sc.border}`}>
                <div>
                  <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider mb-0.5">{s.label}</p>
                  <p className="text-[17px] font-extrabold text-slate-900 leading-none">{to12h(s.startTime)} – <span className={sc.label}>{to12h(s.endTime)}</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">{s.status}</p>
                  <p className="text-sm font-extrabold text-slate-700">{durHrs(s.startTime, s.endTime)} hrs</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── ACTION ROW ───────────────────────────────────────────────── */
function ActionRow({ icon, title, sub, onClick, color }: {
  icon: React.ReactNode; title: string; sub: string; onClick: () => void; color: string;
}) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-4 rounded-xl border border-slate-100 p-4 hover:bg-slate-50 text-left transition">
      <div className={`shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-${color}-50`}>{icon}</div>
      <div>
        <p className="text-sm font-bold text-slate-900">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </div>
    </button>
  );
}

/* ─── ADD A TIME SLOT MODAL ────────────────────────────────────── */
function AddSlotModal({
  dateLabel,
  defaultPrice,
  onClose,
  onAdd,
}: {
  dateLabel: string;
  defaultPrice: number;
  onClose: () => void;
  onAdd: (start: string, end: string, price: number) => void;
}) {
  const [start, setStart] = useState("01:00");
  const [end, setEnd] = useState("02:00");
  const [price, setPrice] = useState(defaultPrice ? String(defaultPrice) : "");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    if (!start || !end) return setError("Set the start and end time.");
    if (t24m(end) <= t24m(start)) return setError("End time must be after the start time.");
    if (price === "" || Number(price) < 0) return setError("Enter a valid price.");
    onAdd(start, end, Number(price));
  }

  const field = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-vibe-violet";

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-[15px] font-black text-slate-900">Add a time slot</h3>
            <p className="mt-0.5 text-[10px] font-medium text-slate-400">{dateLabel} — for late-night or extra hours.</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500"><X size={15} /></button>
        </div>

        {error && <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2.5 text-[11px] font-bold text-rose-600">{error}</p>}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">From</label>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className={field} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">To</label>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className={field} />
          </div>
        </div>
        <div className="mt-3">
          <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-slate-500">Price ₹</label>
          <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} placeholder="0" className={field} />
        </div>

        <button
          onClick={submit}
          className="mt-5 w-full rounded-2xl bg-vibe-navy py-3.5 text-[12px] font-black uppercase tracking-wide text-white transition active:scale-[0.98]"
        >
          Add Slot
        </button>
      </div>
    </div>
  );
}

/* ─── SLOT BADGE ───────────────────────────────────────────────── */
function SlotBadge({ status }: { status: SlotStatus }) {
  const cfg: Record<SlotStatus, string> = {
    Available: "bg-emerald-100 text-emerald-700",
    Booked: "bg-emerald-100 text-emerald-700",
    "Part Paid": "bg-amber-100 text-amber-700",
    "Offline Booked": "bg-green-100 text-green-700",
    Blocked: "bg-rose-100 text-rose-700",
    "On Hold": "bg-violet-100 text-violet-700",
  };
  return <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${cfg[status] || ""}`}>{status}</span>;
}
