"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { NAV_ITEMS_BY_VERTICAL, SHARED_NAV_ITEMS, MOBILE_NAV_ORDER } from "./Sidebar";
import type { VendorVertical } from "@/lib/api/types";

const MAX_PRIMARY_ITEMS = 4;

const SHORT_LABELS: Record<string, string> = {
  "Bookings Management": "Bookings",
  "Payment Settled": "Payments",
  "Manage Tournaments": "Tournaments",
  "Manage Coaches": "Coaches",
  "Menu Management": "Menu",
};

export default function BottomNav({
  verticals,
  onLogout,
}: {
  verticals: VendorVertical[];
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const activeVertical =
    verticals.find((v) => NAV_ITEMS_BY_VERTICAL[v].some((item) => pathname?.startsWith(item.href))) ??
    verticals[0] ??
    "turf";

  const allItems = NAV_ITEMS_BY_VERTICAL[activeVertical];
  const customOrder = MOBILE_NAV_ORDER[activeVertical];
  const primaryItems = customOrder
    ? (customOrder.map((href) => allItems.find((item) => item.href === href)).filter(Boolean) as typeof allItems)
    : allItems.slice(0, MAX_PRIMARY_ITEMS);
  const primaryHrefs = new Set(primaryItems.map((item) => item.href));
  const overflowItems = [...allItems.filter((item) => !primaryHrefs.has(item.href)), ...SHARED_NAV_ITEMS];

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-surface-border bg-white lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {primaryItems.map(({ href, label, icon: Icon }) => {
          const active = pathname?.startsWith(href);
          const isDashboard = href.endsWith("/dashboard");

          if (isDashboard) {
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-1 flex-col items-center justify-end gap-1 pb-1.5 text-[11px] font-medium text-ink-faint"
              >
                <span
                  className={`-mt-5 flex h-12 w-12 items-center justify-center rounded-full shadow-lg ring-4 ring-white transition-colors ${
                    active ? "bg-vibe-violet" : "bg-vibe-navy"
                  }`}
                >
                  <Icon size={22} strokeWidth={2} className="text-white" />
                </span>
                <span className={active ? "text-vibe-violet" : "text-ink-faint"}>{label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                active ? "text-vibe-violet" : "text-ink-faint"
              }`}
            >
              <Icon size={20} strokeWidth={2} />
              {SHORT_LABELS[label] ?? label}
            </Link>
          );
        })}
        <button
          onClick={() => setMoreOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-ink-faint"
        >
          <Menu size={20} strokeWidth={2} />
          More
        </button>
      </nav>

      {moreOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm" />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white shadow-2xl px-3 pt-3"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-surface-border" />
            <div className="flex items-center justify-between px-2 pb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">More</p>
              <button onClick={() => setMoreOpen(false)} className="p-1 text-ink-faint hover:text-ink" aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-1 pb-1">
              {overflowItems.map(({ href, label, icon: Icon }) => {
                const active = pathname?.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMoreOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                      active ? "bg-vibe-violet/10 text-vibe-violet" : "text-ink-soft hover:bg-cream-300"
                    }`}
                  >
                    <Icon size={18} strokeWidth={2} />
                    {label}
                  </Link>
                );
              })}
              <button
                onClick={() => {
                  setMoreOpen(false);
                  onLogout();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-vibe-coral hover:bg-vibe-coral/10 transition-colors"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
