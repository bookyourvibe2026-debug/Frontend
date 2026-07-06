"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  CalendarCheck2,
  Wallet,
  CreditCard,
  ShieldCheck,
  Settings2,
  BarChart3,
  Megaphone,
  LogOut,
  UtensilsCrossed,
  ClipboardList,
  X,
} from "lucide-react";
import type { VendorVertical } from "@/lib/api/types";

const TURF_NAV_ITEMS = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/listings", label: "My Listings", icon: Briefcase },
  { href: "/vendor/bookings", label: "Bookings Management", icon: CalendarCheck2 },
  { href: "/vendor/payments", label: "Payment Settled", icon: Wallet },
  { href: "/vendor/memberships", label: "Memberships", icon: CreditCard },
  { href: "/vendor/statistics", label: "Statistics", icon: BarChart3 },
] as const;

const FOOD_NAV_ITEMS = [
  { href: "/vendor/food/dashboard", label: "Food Dashboard", icon: LayoutDashboard },
  { href: "/vendor/food/menu", label: "Menu Management", icon: UtensilsCrossed },
  { href: "/vendor/food/orders", label: "Food Orders", icon: ClipboardList },
] as const;

const SHARED_NAV_ITEMS = [
  { href: "/vendor/role-access", label: "Role Access", icon: ShieldCheck },
  { href: "/vendor/profile", label: "Profile", icon: Settings2 },
  { href: "/vendor/marketing", label: "Marketing", icon: Megaphone },
] as const;

export default function Sidebar({
  open,
  onClose,
  onLogout,
  vertical,
}: {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  vertical: VendorVertical;
}) {
  const pathname = usePathname();
  const [appMode, setAppMode] = useState<"turf" | "food">("turf");

  const activeMode = vertical === "both" ? appMode : vertical === "food" ? "food" : "turf";
  const navItems = [...(activeMode === "food" ? FOOD_NAV_ITEMS : TURF_NAV_ITEMS), ...SHARED_NAV_ITEMS];

  return (
    <>
      {/* mobile backdrop */}
      {open && (
        <button
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed z-40 inset-y-0 left-0 w-64 shrink-0 border-r border-surface-border bg-white transform transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-vibe-violet to-vibe-limeDark flex items-center justify-center text-white font-display font-semibold">
              BV
            </div>
            <div>
              <p className="font-display font-semibold text-ink text-sm leading-none">
                Book Your Vibes
              </p>
              <p className="text-[11px] text-ink-faint mt-1">Vendor Workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-ink-faint hover:text-ink"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {vertical === "both" && (
          <div className="p-3 border-b border-surface-border">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-cream-200 p-1 text-xs font-semibold">
              <button
                onClick={() => setAppMode("turf")}
                className={`rounded-lg py-2 transition ${
                  appMode === "turf" ? "bg-white text-vibe-violet shadow" : "text-ink-faint"
                }`}
              >
                Owner App
              </button>
              <button
                onClick={() => setAppMode("food")}
                className={`rounded-lg py-2 transition ${
                  appMode === "food" ? "bg-white text-vibe-violet shadow" : "text-ink-faint"
                }`}
              >
                Food App
              </button>
            </div>
          </div>
        )}

        <nav className="px-3 py-5 space-y-1">
          <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
            Navigation
          </p>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-vibe-violet/10 text-vibe-violet"
                    : "text-ink-soft hover:bg-cream-300"
                }`}
              >
                <Icon size={18} strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 inset-x-0 p-3 border-t border-surface-border">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-vibe-coral hover:bg-vibe-coral/10 w-full transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
