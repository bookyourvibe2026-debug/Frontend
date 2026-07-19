"use client";

import { useState, useEffect } from "react";
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
  UserRoundCog,
  Trophy,
  Tag,
  Ticket,
  ScanLine,
  X,
  Bell,
} from "lucide-react";
import type { VendorVertical } from "@/lib/api/types";

export const NAV_ITEMS_BY_VERTICAL: Record<VendorVertical, { href: string; label: string; icon: typeof LayoutDashboard }[]> = {
  turf: [
    { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/vendor/notifications", label: "Notifications", icon: Bell },
    { href: "/vendor/bookings", label: "Bookings Management", icon: CalendarCheck2 },
    { href: "/vendor/pricing", label: "Price Setting", icon: Tag },
    { href: "/vendor/payments", label: "Payment Settled", icon: Wallet },
    { href: "/vendor/memberships", label: "Memberships", icon: CreditCard },
    { href: "/vendor/statistics", label: "Statistics", icon: BarChart3 },
  ],
  events: [
    { href: "/vendor/events/dashboard", label: "Events Dashboard", icon: LayoutDashboard },
    { href: "/vendor/events/listings", label: "Event Listings", icon: Ticket },
    { href: "/vendor/events/scanner", label: "Ticket Scanner", icon: ScanLine },
    { href: "/vendor/profile", label: "Profile", icon: Settings2 },
  ],
  food: [
    { href: "/vendor/food/dashboard", label: "Food Dashboard", icon: LayoutDashboard },
    { href: "/vendor/food/profile", label: "Restaurants", icon: Briefcase },
    { href: "/vendor/food/menu", label: "Menu Management", icon: UtensilsCrossed },
    { href: "/vendor/food/orders", label: "Food Orders", icon: ClipboardList },
  ],
  coaches: [
    { href: "/vendor/coaches/dashboard", label: "Coaches Dashboard", icon: LayoutDashboard },
    { href: "/vendor/coaches", label: "Manage Coaches", icon: UserRoundCog },
    { href: "/vendor/coaches/schedule", label: "Schedule Manager", icon: CalendarCheck2 },
    { href: "/vendor/coaches/notifications", label: "Notifications", icon: Bell },
  ],
};

/** Mobile bottom-nav order, when it should differ from the desktop sidebar's reading order. */
export const MOBILE_NAV_ORDER: Partial<Record<VendorVertical, string[]>> = {
  turf: ["/vendor/bookings", "/vendor/notifications", "/vendor/dashboard", "/vendor/pricing"],
  events: ["/vendor/events/listings", "/vendor/events/scanner", "/vendor/events/dashboard", "/vendor/profile"],
  // Dashboard sits 3rd so the bottom-nav floats it to the centre.
  coaches: ["/vendor/coaches", "/vendor/coaches/schedule", "/vendor/coaches/dashboard", "/vendor/coaches/notifications"],
  food: ["/vendor/food/menu", "/vendor/food/orders", "/vendor/food/dashboard", "/vendor/food/profile"],
};

const VERTICAL_TAB_LABELS: Record<VendorVertical, string> = {
  turf: "Turf",
  events: "Events",
  food: "Food",
  coaches: "Coaches",
};

export const SHARED_NAV_ITEMS = [
  { href: "/vendor/role-access", label: "Role Access", icon: ShieldCheck },
  { href: "/vendor/profile", label: "Profile", icon: Settings2 },
  { href: "/vendor/marketing", label: "Marketing", icon: Megaphone },
] as const;

export default function Sidebar({
  open,
  onClose,
  onLogout,
  verticals,
}: {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
  verticals: VendorVertical[];
}) {
  const pathname = usePathname();
  const [appMode, setAppMode] = useState<VendorVertical>(verticals[0] ?? "turf");

  useEffect(() => {
    const matched = verticals.find((v) =>
      NAV_ITEMS_BY_VERTICAL[v].some((item) => pathname?.startsWith(item.href))
    );
    if (matched) {
      setAppMode(matched);
    }
  }, [pathname, verticals]);

  const activeMode = verticals.includes(appMode) ? appMode : verticals[0] ?? "turf";
  // Events organizers don't use Role Access, and Profile is already in their main nav
  // (so it also shows in the mobile bottom nav) — drop both from the shared list here.
  const sharedItems = activeMode === "events"
    ? SHARED_NAV_ITEMS.filter((item) => item.href !== "/vendor/role-access" && item.href !== "/vendor/profile")
    : SHARED_NAV_ITEMS;
  const navItems = [...NAV_ITEMS_BY_VERTICAL[activeMode], ...sharedItems];

  // Longest-prefix match so /vendor/coaches doesn't stay active on its sub-routes.
  const bestHref = navItems
    .map((i) => i.href)
    .filter((h) => pathname === h || pathname?.startsWith(h + "/"))
    .sort((a, b) => b.length - a.length)[0];

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

        {verticals.length > 1 && (
          <div className="p-3 border-b border-surface-border">
            <div
              className="grid gap-1 rounded-xl bg-cream-200 p-1 text-xs font-semibold"
              style={{ gridTemplateColumns: `repeat(${verticals.length}, minmax(0, 1fr))` }}
            >
              {verticals.map((v) => (
                <button
                  key={v}
                  onClick={() => setAppMode(v)}
                  className={`rounded-lg py-2 transition ${
                    activeMode === v ? "bg-white text-vibe-violet shadow" : "text-ink-faint"
                  }`}
                >
                  {VERTICAL_TAB_LABELS[v]}
                </button>
              ))}
            </div>
          </div>
        )}

        <nav className="px-3 py-5 space-y-1">
          <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
            Navigation
          </p>
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = href === bestHref;
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
