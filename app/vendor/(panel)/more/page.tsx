"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useVendorAuth } from "@/components/providers/VendorAuthProvider";
import { isVendorOwner } from "@/lib/api/auth";
import { NAV_ITEMS_BY_VERTICAL, SHARED_NAV_ITEMS, MOBILE_NAV_ORDER } from "@/components/vendor/Sidebar";
import type { VendorVertical } from "@/lib/api/types";
import { 
  Zap, 
  ChevronRight, 
  LogOut, 
  Twitter, 
  Instagram, 
  Linkedin,
  Megaphone,
  ShieldCheck,
  ClipboardList,
  PhoneCall,
  Sparkles,
  MessageCircle,
  LayoutGrid,
  GraduationCap,
  UtensilsCrossed,
  Trophy,
  ArrowRightLeft
} from "lucide-react";

const MAX_PRIMARY_ITEMS = 4;
/** Support line vendors can WhatsApp directly. */
const SUPPORT_WHATSAPP_URL = "https://wa.me/916350651667?text=Hi%20BYV%20team%2C%20I%20need%20help%20with%20my%20venue.";

/** Display copy for each panel a vendor can switch between. */
const VERTICAL_META: Record<VendorVertical, { label: string; blurb: string; icon: typeof Zap }> = {
  turf: { label: "Turf Panel", blurb: "Bookings, slots & pricing", icon: LayoutGrid },
  coaches: { label: "Coach Panel", blurb: "Sessions & coach bookings", icon: GraduationCap },
  food: { label: "Food Panel", blurb: "Menu & counter orders", icon: UtensilsCrossed },
  events: { label: "Events Panel", blurb: "Tournaments & events", icon: Trophy },
};

export default function MorePage() {
  const { vendor, logout } = useVendorAuth();
  const vendorName = isVendorOwner(vendor) ? vendor.businessName : vendor.holderName;
  const initialLetter = vendorName ? vendorName.charAt(0).toUpperCase() : "V";

  interface MoreLink {
    href: string;
    label: string;
    icon: typeof ChevronRight;
    /** Leaves the app (e.g. WhatsApp) — rendered as a plain anchor. */
    external?: boolean;
  }

  const [overflowItems, setOverflowItems] = useState<MoreLink[]>([]);
  const [activeVertical, setActiveVertical] = useState<VendorVertical | null>(null);

  useEffect(() => {
    if (!vendor) return;

    const stored = localStorage.getItem("byv_vendor_active_vertical") as VendorVertical | null;
    const activeVertical = (stored && vendor.verticals.includes(stored)) ? stored : (vendor.verticals[0] ?? "turf");
    setActiveVertical(activeVertical);

    const allItems = NAV_ITEMS_BY_VERTICAL[activeVertical] ?? [];
    const customOrder = MOBILE_NAV_ORDER[activeVertical];
    const primaryItems = customOrder
      ? (customOrder.map((href) => allItems.find((item) => item.href === href)).filter(Boolean) as typeof allItems)
      : allItems.slice(0, MAX_PRIMARY_ITEMS);
    const primaryHrefs = new Set(primaryItems.map((item) => item.href));
    
    // Filter out primary items and don't double include "Marketing" if it's already shown as a big card
    const list = [
      ...allItems.filter((item) => !primaryHrefs.has(item.href) && item.href !== "/vendor/marketing"),
      ...SHARED_NAV_ITEMS.filter((item) => item.href !== "/vendor/marketing"),
      { href: "/vendor/listings", label: "My Listings", icon: ClipboardList },
      { href: "/vendor/insights", label: "BYV Insights", icon: Sparkles },
      { href: "/vendor/privacy-security", label: "Privacy & Security", icon: ShieldCheck },
      { href: SUPPORT_WHATSAPP_URL, label: "Chat with Us", icon: MessageCircle, external: true },
    ];
    setOverflowItems(list);
  }, [vendor]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div className="max-w-md mx-auto w-full bg-white rounded-3xl border border-surface-border/80 p-5 md:p-6 shadow-panel my-2 md:my-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-5 mb-5 border-b border-surface-border">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
            Book Your Vibe Partner
          </p>
          <h1 className="text-2xl font-bold font-display text-ink mt-0.5 leading-tight">
            {vendorName}
          </h1>
        </div>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-vibe-limeDark text-white font-bold text-lg shadow-sm">
          {initialLetter}
        </div>
      </div>

      {/* Setup Progress */}
      <div className="mb-5 rounded-2xl bg-vibe-navy text-white p-5 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-28 h-28 bg-vibe-violet/10 rounded-full blur-xl" />
        <span className="inline-block text-[10px] font-bold tracking-wider text-vibe-lime bg-vibe-lime/10 border border-vibe-lime/20 px-2.5 py-0.5 rounded uppercase">
          Setup Progress
        </span>
        <h3 className="text-base font-semibold mt-2.5 mb-1">You&apos;re almost ready...</h3>
        <p className="text-[11px] text-slate-300">Complete your profile to start accepting bookings.</p>
        
        {/* Progress Bar */}
        <div className="mt-4 bg-white/10 h-1.5 rounded-full overflow-hidden">
          <div className="bg-vibe-lime h-full rounded-full" style={{ width: "70%" }} />
        </div>
      </div>

      {/* Panel switcher — only the verticals this vendor actually runs. */}
      {vendor && activeVertical && vendor.verticals.filter((v) => v !== activeVertical).length > 0 && (
        <div className="mb-5 rounded-2xl border-2 border-vibe-violet/30 bg-vibe-violet/5 p-4">
          <div className="mb-3 flex items-center gap-2">
            <ArrowRightLeft size={14} className="text-vibe-violet" />
            <p className="text-[11px] font-black uppercase tracking-wide text-vibe-violet">Switch Panel</p>
            <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[9px] font-bold text-ink-soft">
              Now: {VERTICAL_META[activeVertical].label}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {vendor.verticals
              .filter((v) => v !== activeVertical)
              .map((v) => {
                const meta = VERTICAL_META[v];
                const target = NAV_ITEMS_BY_VERTICAL[v]?.[0]?.href ?? "/vendor/dashboard";
                return (
                  <button
                    key={v}
                    onClick={() => {
                      localStorage.setItem("byv_vendor_active_vertical", v);
                      // Full navigation so the sidebar/bottom-nav re-read the new vertical.
                      window.location.href = target;
                    }}
                    className="flex items-center gap-3 rounded-xl border border-vibe-violet/20 bg-white p-3 text-left shadow-sm transition hover:border-vibe-violet/50 active:scale-[0.98]"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-vibe-violet/10 text-vibe-violet">
                      <meta.icon size={18} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-ink">Switch to {meta.label}</span>
                      <span className="block text-[11px] text-ink-faint">{meta.blurb}</span>
                    </span>
                    <ChevronRight size={16} className="shrink-0 text-vibe-violet" />
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Marketing Center Card */}
      <Link
        href="/vendor/marketing"
        className="flex items-center justify-between p-4 mb-5 bg-white border border-surface-border rounded-2xl shadow-sm hover:bg-cream-200/40 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-vibe-amber/10 border border-vibe-amber/20 text-vibe-amber">
            <Megaphone size={20} strokeWidth={2} />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-ink">Marketing Center</h4>
            <p className="text-[11px] text-ink-faint mt-0.5 leading-none">Coupons, promos, push notes</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-ink-faint" />
      </Link>

      {/* Links List */}
      <div className="bg-white border border-surface-border rounded-2xl divide-y divide-surface-border overflow-hidden mb-5 shadow-sm">
        {overflowItems.map(({ href, label, icon: Icon, external }) => {
          const body = (
            <>
              <div className="flex items-center gap-3">
                <Icon size={18} strokeWidth={2} className="text-ink-faint" />
                <span>{label}</span>
              </div>
              <ChevronRight size={16} className="text-ink-faint/60" />
            </>
          );
          const cls =
            "flex items-center justify-between px-4 py-3.5 hover:bg-cream-200/40 transition-colors text-sm font-medium text-ink-soft";
          // WhatsApp support leaves the app, so it needs a plain anchor.
          return external ? (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer" className={cls}>
              {body}
            </a>
          ) : (
            <Link key={href} href={href} className={cls}>
              {body}
            </Link>
          );
        })}
      </div>

      {/* Actions */}
      <div className="space-y-3 mb-6">
        <Link
          href="/vendor/marketing#boost"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#dc2626] py-3 text-sm font-semibold text-white shadow-md hover:bg-red-700 transition-colors"
        >
          <Zap size={16} className="fill-white" />
          Last Min Boost
        </Link>

        <a
          href="mailto:support@bookyourvibes.com?subject=Vendor Support Request"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-border bg-white py-3 text-sm font-semibold text-ink shadow-sm hover:bg-cream-200/40 transition-colors"
        >
          <PhoneCall size={16} className="text-ink-soft" />
          Contact Platform Owner
        </a>

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3 text-sm font-semibold text-[#dc2626] shadow-sm hover:bg-red-50 transition-colors"
        >
          <LogOut size={16} />
          Log Out
        </button>
      </div>

      {/* Social Links */}
      <div className="flex flex-col items-center justify-center pt-5 border-t border-surface-border/60">
        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-faint mb-3">
          Connect with us
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-surface-border text-ink-faint hover:text-ink hover:bg-cream-200/40 transition-colors"
            aria-label="Twitter"
          >
            <Twitter size={16} />
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-surface-border text-ink-faint hover:text-ink hover:bg-cream-200/40 transition-colors"
            aria-label="Instagram"
          >
            <Instagram size={16} />
          </a>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-surface-border text-ink-faint hover:text-ink hover:bg-cream-200/40 transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
