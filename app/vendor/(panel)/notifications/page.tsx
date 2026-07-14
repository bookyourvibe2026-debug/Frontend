"use client";

import { useEffect, useMemo, useState } from "react";
import { getVendorBookings, updateVendorBookingStatus } from "@/lib/api/vendor";
import { Booking } from "@/lib/types";
import { Bell, ChevronDown, ChevronUp, Phone, MessageSquare, MoreHorizontal, Clock, CheckCircle2 } from "lucide-react";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_DOT: Record<Booking["status"], string> = {
  Confirmed: "bg-emerald-500",
  Pending: "bg-amber-500",
  Cancelled: "bg-rose-500",
  Completed: "bg-slate-400",
};

export default function NotificationsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Time state to force re-render for countdown updates
  const [time, setTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setTime(Date.now()), 10000); // update every 10s
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    getVendorBookings({ limit: 50 })
      .then((res) => {
        setBookings(res.items as unknown as Booking[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleAcknowledge = async (orderId: string) => {
    try {
      await updateVendorBookingStatus(orderId, "Confirmed");
      setBookings(prev => prev.map(b => b.orderId === orderId ? { ...b, status: "Confirmed" } : b));
    } catch (err) {
      console.error(err);
      alert("Failed to acknowledge booking");
    }
  };

  const getBookingDuration = (dateTimeStr: string) => {
    // Assuming standard 1 hour duration for turf booking if not specified, 
    // or calculate based on slots list if available
    return "1 hours";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12 font-sans text-slate-800">
      {/* ── TOP BANNER (PULLED UP TO TOUCH EDGES) ── */}
      <div className="bg-[#0f172a] text-white p-5 rounded-b-2xl shadow-lg flex items-center gap-4 mb-5 mt-[-24px] mx-[-16px] sm:mx-[-24px]">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Bell size={20} />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight">Notifications</h1>
          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mt-0.5">Confirmed Upcoming Bookings</p>
        </div>
      </div>

      <div className="px-1 max-w-md mx-auto space-y-2.5">
        {loading ? (
          <div className="bg-white rounded-2xl p-10 text-center text-slate-400 font-bold border border-slate-100 shadow-sm">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-slate-400 font-bold border border-slate-100 shadow-sm">
            No upcoming bookings found.
          </div>
        ) : (
          bookings.map((booking, index) => {
            const isExpanded = expandedOrderId === booking.orderId;
            
            // Calculate dynamic countdown/badge values
            const diffMs = new Date(booking.dateTime).getTime() - time;
            const diffMins = Math.floor(diffMs / 60_000);
            
            let badgeText = "UPCOMING";
            let timeText = "";
            let badgeColor = "bg-indigo-50 text-indigo-600";
            let timerColor = "";

            if (diffMs < 0) {
              badgeText = `NO. ${index + 1}`;
              timeText = "Booking passed";
              badgeColor = "bg-slate-100 text-slate-600";
            } else if (diffMins < 30) {
              badgeText = "UPCOMING";
              const m = diffMins;
              const s = Math.floor((diffMs % 60_000) / 1000);
              timeText = `Customer arriving in ${m}:${String(s).padStart(2, '0')} mins`;
              badgeColor = "bg-indigo-50 text-indigo-600";
              timerColor = "bg-rose-50 text-rose-600 border border-rose-100";
            } else if (diffMins < 120) {
              badgeText = "NEXT";
              const h = Math.floor(diffMins / 60);
              const m = diffMins % 60;
              timeText = `Starts in ${h} hr ${m} mins`;
              badgeColor = "bg-emerald-50 text-emerald-600";
              timerColor = "bg-emerald-50 text-emerald-600 border border-emerald-100";
            } else {
              badgeText = `NO. ${index + 1}`;
              const h = Math.ceil(diffMins / 60);
              timeText = `Starts in ${h} hrs`;
              badgeColor = "bg-slate-100 text-slate-600";
              timerColor = "bg-slate-50 text-slate-500 border border-slate-100";
            }

            const formattedTime = new Date(booking.dateTime).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true
            });
            // Assume 1 hour default end time
            const endTimeDate = new Date(booking.dateTime);
            endTimeDate.setHours(endTimeDate.getHours() + 1);
            const formattedEndTime = endTimeDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true
            });

            return (
              <div 
                key={booking.orderId} 
                className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 ${
                  isExpanded 
                    ? "border-amber-400 ring-4 ring-amber-400/10 scale-[1.01]" 
                    : "border-slate-100 hover:border-slate-200"
                }`}
              >
                {/* CARD HEADER */}
                <div 
                  onClick={() => setExpandedOrderId(isExpanded ? null : booking.orderId)}
                  className="p-4 flex flex-col gap-3.5 cursor-pointer select-none"
                >
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black tracking-wider uppercase ${badgeColor}`}>
                      {badgeText}
                    </span>
                    {timeText && (
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5 ${timerColor || "bg-slate-50 text-slate-500 border border-slate-100"}`}>
                        <Clock size={11} />
                        {timeText}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <div className="flex items-center">
                          <h3 className="font-black text-slate-800 text-sm">{booking.customer}</h3>
                          <span className="font-extrabold text-[#00a86b] text-xs ml-2">
                            {formattedTime} - {formattedEndTime}
                          </span>
                        </div>
                        <p className="text-[11px] font-extrabold text-slate-400 mt-0.5 tracking-wide">
                          {booking.status === "Pending" ? "Booking request" : booking.orderId}
                        </p>
                      </div>
                    </div>
                    <button className="text-slate-400 hover:text-slate-600 transition shrink-0 bg-slate-50 hover:bg-slate-100 p-1.5 rounded-full">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* EXPANDED DETAILS */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-50 space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="flex items-center justify-between gap-3 mt-1">
                      <a 
                        href={`tel:${booking.phone}`}
                        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-extrabold px-3 py-2.5 rounded-xl flex items-center gap-2 transition active:scale-95"
                      >
                        <Phone size={12} className="text-slate-500" />
                        {booking.phone}
                      </a>
                      <span className="text-[11px] font-black text-slate-400 tracking-wider">
                        ID: {booking.orderId}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">Duration</span>
                        <span className="text-xs font-black text-slate-700 mt-0.5 block">{getBookingDuration(booking.dateTime)}</span>
                      </div>
                      <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">Payment Mode</span>
                        <span className="text-xs font-black text-slate-700 mt-0.5 block">{booking.payment}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider block">Total Price</span>
                        <span className="text-base font-black text-slate-900 mt-0.5">₹{booking.totalAmount}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black tracking-wider uppercase ${
                        booking.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                      }`}>
                        {booking.paymentStatus === 'paid' ? 'Paid' : 'Partially Paid'}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      {booking.status === "Pending" ? (
                        <button 
                          onClick={() => handleAcknowledge(booking.orderId)}
                          className="flex-1 bg-[#00a86b] hover:bg-[#00965f] text-white py-3.5 rounded-xl text-xs font-black shadow-sm transition active:scale-[0.97]"
                        >
                          Acknowledge
                        </button>
                      ) : (
                        <button 
                          disabled
                          className="flex-1 bg-emerald-50 text-emerald-600 border border-emerald-100 py-3.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 size={14} /> Confirmed
                        </button>
                      )}
                      
                      <button className="flex-1 bg-[#0f172a] hover:bg-slate-800 text-white py-3.5 rounded-xl text-xs font-black shadow-sm transition active:scale-[0.97] flex items-center justify-center gap-1.5">
                        <MessageSquare size={13} />
                        Message
                      </button>

                      <button className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-xl p-3 flex items-center justify-center transition active:scale-[0.97]">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
