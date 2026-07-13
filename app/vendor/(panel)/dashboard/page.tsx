"use client";

import {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  LayoutGrid,
  Clock as ClockIcon,
  ChevronLeft,
  ChevronRight,
  X,
  Ban,
  BookOpen,
  Pause,
  Pencil,
  CalendarDays,
  Calendar as CalendarIcon,
  ChevronDown,
  User,
  Phone,
  Check,
  CheckCircle2,
  Wallet,
  Clock3,
} from "lucide-react";
import { PageHero, SectionCard, Badge } from "@/components/vendor/ui";
import {
  getVendorListings,
  getVendorBookings,
  createVendorBooking,
  updateVendorBookingStatus,
  updateVendorListing,
} from "@/lib/api/vendor";
import { apiListingToMock, mockListingToApiInput } from "@/lib/api/listingAdapter";
import { ApiError } from "@/lib/api/client";
import { Listing, Booking } from "@/lib/types";
import { ClockSlotsWidget } from "@/components/vendor/ClockSlotsWidget";
import { BlockReasonModal, ConfirmCountdownModal, ManageBookedSlotModal } from "@/components/vendor/SlotActionModals";

/* ─── helpers ─────────────────────────────────────────────────── */
function to12h(t: string) {
  if (!t) return "";
  const [hStr, mStr] = t.split(":");
  let h = Number(hStr);
  const ap = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${mStr} ${ap}`;
}
function t24m(t: string) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
function durHrs(start: string, end: string) {
  const d = t24m(end) - t24m(start);
  return d > 0 ? +(d / 60).toFixed(1) : 0;
}
function dayPart(t: string) {
  const h = Number(t.split(":")[0]);
  if (h >= 5 && h < 12) return "Morning";
  if (h >= 12 && h < 17) return "Afternoon";
  if (h >= 17 && h < 21) return "Evening";
  if (h >= 21 && h < 24) return "Night";
  return "Mid Night";
}

type SlotStatus = "Available" | "Booked" | "Part Paid" | "Offline Booked" | "Blocked" | "On Hold";

const STAT_TONE = {
  emerald: { idle: "border-emerald-100 bg-emerald-50/50", active: "border-emerald-400 ring-1 ring-emerald-300 bg-emerald-50", label: "text-emerald-600", value: "text-emerald-700", pct: "text-emerald-400" },
  rose: { idle: "border-rose-100 bg-rose-50/50", active: "border-rose-400 ring-1 ring-rose-300 bg-rose-50", label: "text-rose-600", value: "text-rose-700", pct: "text-rose-400" },
  amber: { idle: "border-amber-100 bg-amber-50/50", active: "border-amber-400 ring-1 ring-amber-300 bg-amber-50", label: "text-amber-600", value: "text-amber-700", pct: "text-amber-400" },
  orange: { idle: "border-orange-100 bg-orange-50/50", active: "border-orange-400 ring-1 ring-orange-300 bg-orange-50", label: "text-orange-600", value: "text-orange-700", pct: "text-orange-400" },
  purple: { idle: "border-purple-100 bg-purple-50/50", active: "border-purple-400 ring-1 ring-purple-300 bg-purple-50", label: "text-purple-600", value: "text-purple-700", pct: "text-purple-400" },
  slate: { idle: "border-slate-200 bg-slate-50", active: "border-slate-400 ring-1 ring-slate-300 bg-slate-100", label: "text-slate-600", value: "text-slate-700", pct: "text-slate-400" },
} as const;

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
}

/* ────────────────────────────────────────────────────────────────
   MAIN PAGE
────────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Agenda state
  const todayIso = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [selectedTurfId, setSelectedTurfId] = useState("");
  const [daypart, setDaypart] = useState<"Morning" | "Afternoon" | "Night" | "Mid Night" | null>("Morning");

  // Live clock tick — drives "running now" / "already passed" slot styling
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  const isToday = selectedDate === todayIso;
  const [viewMode, setViewMode] = useState<"grid" | "clock">("grid");
  const [cardSize, setCardSize] = useState<"S" | "M" | "L">("M");

  // Active slot action modal
  const [activeSlot, setActiveSlot] = useState<AgendaSlot | null>(null);
  // Grouped-list filter (for "See Booking" bottom button)
  const [groupedFilter, setGroupedFilter] = useState<SlotStatus | null>(null);

  // Offline booking modal
  const [offlineModal, setOfflineModal] = useState(false);
  const [offlineName, setOfflineName] = useState("");
  const [offlinePhone, setOfflinePhone] = useState("");
  const [offlineSubmitting, setOfflineSubmitting] = useState(false);

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
        setBookings(b.items as unknown as Booking[]);
      })
      .catch((e) => setError(e instanceof ApiError ? e.describe() : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  const selectedTurf = useMemo(
    () => listings.find((l) => l.id === selectedTurfId),
    [listings, selectedTurfId]
  );
  const turfListings = useMemo(() => listings.filter((l) => l.type === "Turf"), [listings]);

  /* ── Scrollable date queue: today onwards, grouped by month ── */
  const agendaDates = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, []);

  const agendaMonthGroups = useMemo(() => {
    const groups: { key: string; label: string; dates: Date[] }[] = [];
    for (const d of agendaDates) {
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const last = groups[groups.length - 1];
      if (last && last.key === key) {
        last.dates.push(d);
      } else {
        groups.push({ key, label: d.toLocaleDateString("en-US", { month: "long", year: "numeric" }), dates: [d] });
      }
    }
    return groups;
  }, [agendaDates]);

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
        return (bk.listing === selectedTurfId || (bk as any).listingId === selectedTurfId)
          && bk.status !== "Cancelled"
          && bkDate === selectedDate
          && bkTime === slot.startTime;
      });

      let status: SlotStatus = "Available";
      let bookingId: string | undefined;
      let customerName: string | undefined;
      let phone: string | undefined;

      if (match) {
        bookingId = match.orderId;
        customerName = (match as any).customerName ?? match.customer;
        phone = (match as any).phone;
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
      };
    });
  }, [selectedTurf, selectedDate, bookings, selectedTurfId]);

  /* ── Stats (in hours) ── */
  const stats = useMemo(() => {
    const hrsFor = (status: SlotStatus) =>
      resolvedSlots.filter(s => s.status === status).reduce((s, sl) => s + durHrs(sl.startTime, sl.endTime), 0);
    const totalHrs = resolvedSlots.reduce((s, sl) => s + durHrs(sl.startTime, sl.endTime), 0);
    return {
      totalHrs,
      bookedHrs: hrsFor("Booked"),
      partPaidHrs: hrsFor("Part Paid"),
      offlineHrs: hrsFor("Offline Booked"),
      blockedHrs: hrsFor("Blocked"),
      onHoldHrs: hrsFor("On Hold"),
      availHrs: hrsFor("Available"),
    };
  }, [resolvedSlots]);

  /* ── Filter by daypart tab ── */
  const visibleSlots = useMemo(
    () => daypart ? resolvedSlots.filter(s => s.label === daypart) : resolvedSlots,
    [resolvedSlots, daypart]
  );

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

  async function startOfflineBooking(slot: AgendaSlot) {
    setActiveSlot(slot);
    setOfflineModal(true);
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
      await createVendorBooking({
        listingId: selectedTurf.id,
        customerName: offlineName,
        phone: offlinePhone,
        dateTime: dt.toISOString(),
        totalAmount: activeSlot.price,
        payment: "Cash (Offline)",
        status: "Confirmed",
      });
      // Refresh bookings
      const fresh = await getVendorBookings({ limit: 500 });
      setBookings(fresh.items as unknown as Booking[]);
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
      setBookings(fresh.items as unknown as Booking[]);
      setActiveSlot(null);
    } catch { alert("Failed to hold slot"); }
  }

  /* ── Actions on an already-booked slot ── */
  async function clearBookedSlot(slot: AgendaSlot) {
    try {
      if (slot.bookingId) {
        await updateVendorBookingStatus(slot.bookingId, "Cancelled");
        const fresh = await getVendorBookings({ limit: 500 });
        setBookings(fresh.items as unknown as Booking[]);
      }
    } catch { alert("Failed to clear slot"); }
    setActiveSlot(null);
  }

  async function markSlotPaidConfirmed(slot: AgendaSlot) {
    try {
      if (slot.bookingId) {
        await updateVendorBookingStatus(slot.bookingId, "Confirmed");
        const fresh = await getVendorBookings({ limit: 500 });
        setBookings(fresh.items as unknown as Booking[]);
      }
    } catch { alert("Failed to update booking"); }
    setActiveSlot(null);
  }

  async function blockSlotForMaintenance(slot: AgendaSlot) {
    try {
      if (slot.bookingId) {
        await updateVendorBookingStatus(slot.bookingId, "Cancelled");
        const fresh = await getVendorBookings({ limit: 500 });
        setBookings(fresh.items as unknown as Booking[]);
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

  /* ── Clock select ── */
  const handleClockHour = async (hour: number) => {
    if (!selectedTurf) return;
    const startStr = `${String(hour).padStart(2, "0")}:00`;
    const slot = resolvedSlots.find(s => s.startTime === startStr);
    if (slot) setActiveSlot(slot);
  };

  const selectedDateObj = new Date(selectedDate + "T00:00:00");
  const todayLabel = selectedDateObj.toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  /* ── Sizes ── */
  const cardH = cardSize === "S" ? "h-24" : cardSize === "M" ? "h-36" : "h-48";
  const cardGrid = cardSize === "S" ? "grid-cols-4 sm:grid-cols-6 lg:grid-cols-8" : cardSize === "M" ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5" : "grid-cols-2 sm:grid-cols-3";

  const isBookedSlot = activeSlot
    ? (["Booked", "Offline Booked", "Part Paid", "On Hold"] as SlotStatus[]).includes(activeSlot.status)
    : false;

  if (error) return <div className="p-10 text-center text-vibe-coral text-sm">{error}</div>;
  if (loading) {
    return <div className="p-10 text-center text-ink-faint text-sm">Loading dashboard…</div>;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">

      {/* ── PAGE HEADER ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[15px] font-extrabold text-slate-900 leading-none">Today&apos;s Agenda</h1>
          <p className="text-[11px] text-slate-400 mt-1">{todayLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Turf selector */}
          {turfListings.length > 1 && (
            <div className="relative">
              <select
                value={selectedTurfId}
                onChange={(e) => setSelectedTurfId(e.target.value)}
                className="text-xs font-bold border border-slate-200 rounded-lg px-3 py-1.5 bg-white outline-none focus:border-vibe-violet appearance-none pr-7"
              >
                {turfListings.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}
          {/* View toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode("grid")} className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold transition ${viewMode === "grid" ? "bg-vibe-navy text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
              <LayoutGrid size={12} /> Grid
            </button>
            <button onClick={() => setViewMode("clock")} className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold transition ${viewMode === "clock" ? "bg-vibe-navy text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>
              <ClockIcon size={12} /> Clock
            </button>
          </div>
          {/* Card size */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            {(["S", "M", "L"] as const).map(s => (
              <button key={s} onClick={() => setCardSize(s)} className={`px-2.5 py-1.5 text-[11px] font-bold transition ${cardSize === s ? "bg-vibe-navy text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 pb-28">

        {/* ── DATE QUEUE (scrollable, grouped by month, today onwards only) ── */}
        <div className="flex items-center justify-between pt-3">
          <p className="text-xs font-extrabold uppercase tracking-wide text-slate-700">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
          {selectedDate !== todayIso && (
            <button onClick={() => setSelectedDate(todayIso)} className="text-[10px] font-bold text-vibe-violet hover:underline">
              Jump to Today
            </button>
          )}
        </div>
        <div className="grid grid-cols-7 gap-2 py-3">
          {agendaDates.map((d) => {
            const iso = d.toISOString().slice(0, 10);
            const isSel = iso === selectedDate;
            const isToday = iso === todayIso;
            const isWeekend = d.getDay() === 0 || d.getDay() === 6;
            return (
              <button
                key={iso}
                onClick={() => setSelectedDate(iso)}
                className={`flex flex-col items-center justify-center py-2.5 rounded-xl border transition ${
                  isSel
                    ? "bg-vibe-navy border-vibe-navy text-white shadow-md"
                    : isToday
                    ? "border-vibe-violet/40 bg-vibe-violet/5 text-vibe-violet hover:bg-vibe-violet/10"
                    : isWeekend
                    ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                <span className="text-[10px] font-bold uppercase">{d.toLocaleDateString("en-US", { weekday: "short" })}</span>
                <span
                  className={`text-xl font-extrabold leading-tight mt-0.5 ${
                    isSel ? "text-white" : isToday ? "text-vibe-violet" : isWeekend ? "text-rose-600" : "text-slate-800"
                  }`}
                >
                  {d.getDate()}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── STATS ROW ── */}
        {selectedTurf && (
          <div className="grid grid-cols-4 gap-3 mb-4">
            <button
              onClick={() => setGroupedFilter(null)}
              className={`rounded-xl border p-3 text-center transition ${
                !groupedFilter ? "border-slate-400 bg-slate-100 ring-1 ring-slate-300" : "border-slate-200 bg-slate-50"
              }`}
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Total Cap.</p>
              <p className="text-lg font-extrabold text-slate-800 mt-1">{stats.totalHrs}<span className="text-[10px] font-semibold text-slate-500 ml-0.5">hrs</span></p>
            </button>
            <button
              onClick={() => setGroupedFilter(groupedFilter === "Booked" ? null : "Booked")}
              className={`rounded-xl border p-3 text-center transition ${
                groupedFilter === "Booked" ? "border-green-400 bg-green-50 ring-1 ring-green-300" : "border-green-100 bg-green-50/50"
              }`}
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-green-600">Booked</p>
              <p className="text-lg font-extrabold text-green-700 mt-1">{stats.bookedHrs + stats.offlineHrs}<span className="text-[10px] font-semibold text-green-500 ml-0.5">hrs</span></p>
            </button>
            <button
              onClick={() => setGroupedFilter(groupedFilter === "Part Paid" ? null : "Part Paid")}
              className={`rounded-xl border p-3 text-center transition ${
                groupedFilter === "Part Paid" ? "border-amber-400 bg-amber-50 ring-1 ring-amber-300" : "border-amber-100 bg-amber-50/50"
              }`}
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-amber-600">Part Paid</p>
              <p className="text-lg font-extrabold text-amber-600 mt-1">{stats.partPaidHrs}<span className="text-[10px] font-semibold text-amber-400 ml-0.5">hrs</span></p>
            </button>
            <button
              onClick={() => setGroupedFilter(groupedFilter === "Available" ? null : "Available")}
              className={`rounded-xl border p-3 text-center transition ${
                groupedFilter === "Available" ? "border-emerald-400 bg-emerald-50 ring-1 ring-emerald-300" : "border-emerald-100 bg-emerald-50/50"
              }`}
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Available</p>
              <p className="text-lg font-extrabold text-emerald-600 mt-1">{stats.availHrs}<span className="text-[10px] font-semibold text-emerald-400 ml-0.5">hrs</span></p>
            </button>
          </div>
        )}

        {/* ── NO TURF ── */}
        {!selectedTurf && (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center bg-white">
            <CalendarDays size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-500">No Turf listings found. Add a Turf listing to use the Agenda.</p>
          </div>
        )}

        {/* ── GROUPED LIST MODE (when stat card clicked) ── */}
        {selectedTurf && groupedFilter && (
          <GroupedSlotsList
            slots={groupedSlots}
            filter={groupedFilter}
            onClose={() => setGroupedFilter(null)}
          />
        )}

        {/* ── AGENDA GRID / CLOCK ── */}
        {selectedTurf && !groupedFilter && (
          <>
            {/* Day-part tabs */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto scrollbar-none">
              {(["Morning", "Afternoon", "Night", "Mid Night"] as const).map(dp => (
                <button
                  key={dp}
                  onClick={() => setDaypart(daypart === dp ? null : dp)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition border ${
                    daypart === dp
                      ? "bg-vibe-navy border-vibe-navy text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {dp}
                </button>
              ))}
            </div>

            {viewMode === "grid" && (
              <AgendaGrid
                slots={visibleSlots}
                cardH={cardH}
                cardGrid={cardGrid}
                daypart={daypart}
                onSlotClick={setActiveSlot}
                now={now}
                isToday={isToday}
              />
            )}
            {viewMode === "clock" && (
              <div className="flex justify-center py-4">
                <ClockSlotsWidget
                  slots={resolvedSlots}
                  onSelectSlot={setActiveSlot}
                  onSelectHour={handleClockHour}
                  renderSeeBooking={() => <SeeBookingButton resolvedSlots={resolvedSlots} onPick={setGroupedFilter} />}
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

      {/* ── OFFLINE BOOKING MODAL ── */}
      {offlineModal && activeSlot && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => { setOfflineModal(false); }}>
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Offline Booking</h3>
                <p className="text-xs text-slate-400">{to12h(activeSlot.startTime)} – {to12h(activeSlot.endTime)} · ₹{activeSlot.price}</p>
              </div>
              <button onClick={() => setOfflineModal(false)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Customer Name</label>
                <div className="relative">
                  <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={offlineName} onChange={e => setOfflineName(e.target.value)} placeholder="e.g. Rahul Sharma"
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-vibe-violet" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-500 block mb-1">Phone Number</label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={offlinePhone} onChange={e => setOfflinePhone(e.target.value)} placeholder="10-digit mobile" type="tel"
                    className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-vibe-violet" />
                </div>
              </div>
              <button onClick={confirmOfflineBooking} disabled={offlineSubmitting}
                className="w-full rounded-xl bg-emerald-600 text-white py-3 text-sm font-bold hover:bg-emerald-700 transition disabled:opacity-60">
                {offlineSubmitting ? "Booking…" : "Confirm Offline Booking"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── AGENDA GRID ─────────────────────────────────────────────── */
function AgendaGrid({ slots, cardH, cardGrid, daypart, onSlotClick, now, isToday }: {
  slots: AgendaSlot[];
  cardH: string;
  cardGrid: string;
  daypart: string | null;
  onSlotClick: (s: AgendaSlot) => void;
  now: Date;
  isToday: boolean;
}) {
  const parts = daypart
    ? [daypart]
    : ["Morning", "Afternoon", "Evening", "Night", "Mid Night"];

  return (
    <div className="space-y-6">
      {parts.map(part => {
        const partSlots = slots.filter(s => s.label === part);
        if (partSlots.length === 0) return null;
        return (
          <div key={part}>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">{part}</p>
            <div className={`grid ${cardGrid} gap-2`}>
              {partSlots.map((s, i) => (
                <SlotCard key={i} slot={s} cardH={cardH} onClick={() => onSlotClick(s)} now={now} isToday={isToday} />
              ))}
            </div>
          </div>
        );
      })}
      {slots.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-400 font-medium">No slots for this day part</p>
        </div>
      )}
    </div>
  );
}

function formatHourRange(start24: string, end24: string) {
  const startHour = parseInt(start24.split(":")[0], 10);
  const endHour = parseInt(end24.split(":")[0], 10);
  return `${startHour}-${endHour}`;
}

/* ─── SLOT CARD ────────────────────────────────────────────────── */
function SlotCard({ slot, cardH, onClick, now, isToday }: {
  slot: AgendaSlot; cardH: string; onClick: () => void; now: Date; isToday: boolean;
}) {
  const cfg: Record<SlotStatus, { bg: string; border: string; icon: typeof Ban }> = {
    Available:        { bg: "", border: "", icon: Check },
    Booked:           { bg: "bg-emerald-600", border: "border-emerald-700", icon: CheckCircle2 },
    "Offline Booked": { bg: "bg-green-600", border: "border-green-700", icon: Wallet },
    "Part Paid":      { bg: "bg-amber-500", border: "border-amber-600", icon: Clock3 },
    Blocked:          { bg: "bg-rose-600", border: "border-rose-700", icon: Ban },
    "On Hold":        { bg: "bg-violet-600", border: "border-violet-700", icon: Pause },
  };
  const c = cfg[slot.status] || cfg["Available"];
  const StatusIcon = c.icon;

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const startMin = t24m(slot.startTime);
  const endMin = t24m(slot.endTime);
  const isRunning = isToday && nowMin >= startMin && nowMin < endMin;
  const isPast = isToday && nowMin >= endMin;

  return (
    <div className="group relative">
      <button
        onClick={onClick}
        className={`flex w-full flex-col items-center justify-center ${cardH} rounded-2xl border-2 ${
          slot.status === "Available"
            ? "border-dashed border-emerald-200 bg-white hover:border-emerald-400"
            : `${c.border} ${c.bg} hover:brightness-110`
        } relative cursor-pointer hover:shadow-md transition-shadow ${
          isRunning ? "ring-2 ring-vibe-navy ring-offset-2" : ""
        }`}
      >
        {isRunning && (
          <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-vibe-navy opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-vibe-navy" />
          </span>
        )}
        <span className={`text-base font-extrabold font-sans ${slot.status === "Available" ? "text-slate-800" : "text-white"}`}>
          {formatHourRange(slot.startTime, slot.endTime)}
        </span>
        {slot.status === "Available" ? (
          <>
            <span className="text-xl font-bold text-emerald-500 mt-1 leading-none">+</span>
            <span className="text-[10px] font-extrabold uppercase text-emerald-600 mt-0.5">FREE</span>
          </>
        ) : (
          <>
            <StatusIcon size={16} className="text-white/90 mt-1.5" strokeWidth={2.25} />
            <span className="mt-1 text-[10px] font-extrabold uppercase text-white/95">
              {slot.status}
            </span>
            {slot.customerName && slot.customerName !== "Hold" && (
              <span className="text-[9px] text-white/80 mt-0.5 truncate max-w-full px-1">{slot.customerName}</span>
            )}
          </>
        )}
      </button>

      {/* Hover tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 hidden -translate-x-1/2 flex-col gap-0.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-lg group-hover:flex whitespace-nowrap">
        <p className="font-bold text-vibe-lime">{to12h(slot.startTime)} - {to12h(slot.endTime)} · {durHrs(slot.startTime, slot.endTime)}h</p>
        <p className="text-[10px] text-slate-300">{slot.label} · {isRunning ? "Live now" : isPast ? "Already passed" : "Upcoming"}</p>
        <p className="text-[11px] text-slate-200 font-bold">₹{slot.price}</p>
        {slot.customerName && <p className="text-[10px] text-slate-300">Customer: {slot.customerName}</p>}
        <span className="self-start rounded bg-white/10 px-1.5 py-0.5 text-[9px] uppercase tracking-wide">{slot.status}</span>
      </div>
    </div>
  );
}

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
