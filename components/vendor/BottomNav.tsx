"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { NAV_ITEMS_BY_VERTICAL, MOBILE_NAV_ORDER } from "./Sidebar";
import type { VendorVertical } from "@/lib/api/types";

const MAX_PRIMARY_ITEMS = 4;

const SHORT_LABELS: Record<string, string> = {
  "Bookings Management": "Bookings",
  "Payment Settled": "Payments",
  "Manage Tournaments": "Tournaments",
  "Event Listings": "Events",
  "Ticket Scanner": "Scanner",
  "Manage Coaches": "Coaches",
  "Menu Management": "Menu",
  "Events Dashboard": "Dashboard",
  "Food Dashboard": "Dashboard",
  "Coaches Dashboard": "Dashboard",
};

export default function BottomNav({
  verticals,
  onLogout,
}: {
  verticals: VendorVertical[];
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const [activeVertical, setActiveVertical] = useState<VendorVertical>(verticals[0] ?? "turf");

  useEffect(() => {
    const matched = verticals.find((v) =>
      NAV_ITEMS_BY_VERTICAL[v].some((item) => pathname?.startsWith(item.href))
    );
    if (matched) {
      localStorage.setItem("byv_vendor_active_vertical", matched);
      setActiveVertical(matched);
    } else {
      const stored = localStorage.getItem("byv_vendor_active_vertical") as VendorVertical | null;
      if (stored && verticals.includes(stored)) {
        setActiveVertical(stored);
      } else {
        setActiveVertical(verticals[0] ?? "turf");
      }
    }
  }, [pathname, verticals]);

  const allItems = NAV_ITEMS_BY_VERTICAL[activeVertical];
  const customOrder = MOBILE_NAV_ORDER[activeVertical];
  const primaryItems = customOrder
    ? (customOrder.map((href) => allItems.find((item) => item.href === href)).filter(Boolean) as typeof allItems)
    : allItems.slice(0, MAX_PRIMARY_ITEMS);

  const isMoreActive = pathname === "/vendor/more";

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-surface-border bg-white lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {primaryItems.map(({ href, label, icon: Icon }) => {
        const active = pathname?.startsWith(href) && !isMoreActive;
        const isDashboard = href.endsWith("/dashboard");

        if (isDashboard) {
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-end text-center gap-1 pb-1.5 text-[11px] font-medium text-ink-faint"
            >
              <span 
                className={`-mt-5 flex h-12 w-12 items-center justify-center rounded-full shadow-lg ring-4 ring-white transition-colors ${
                  active ? "bg-vibe-violet" : "bg-vibe-navy"
                }`}
              >
                <Icon size={22} strokeWidth={2} className="text-white" />
              </span>
              <span className={active ? "text-vibe-violet" : "text-ink-faint"}>{SHORT_LABELS[label] ?? label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center text-center gap-1 py-2.5 text-[11px] font-medium ${
              active ? "text-vibe-violet" : "text-ink-faint"
            }`}
          >
            <Icon size={20} strokeWidth={2} />
            {SHORT_LABELS[label] ?? label}
          </Link>
        );
      })}
      <Link
        href="/vendor/more"
        className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
          isMoreActive ? "text-vibe-violet" : "text-ink-faint"
        }`}
      >
        <Menu size={20} strokeWidth={2} />
        More
      </Link>
    </nav>
  );
}
