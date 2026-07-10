"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  CalendarClock,
  Gamepad2,
  Home,
  Menu,
  ShieldCheck,
  Store,
  Trophy,
  Users,
  UserRoundCog,
  X,
} from "lucide-react";
import { useCustomerAuth } from "@/components/providers/CustomerAuthProvider";

const PRIMARY_TABS = [
  { label: "Home", href: "/", icon: Home },
  { label: "Games", href: "/games", icon: Gamepad2 },
  { label: "Venues", href: "/venues", icon: CalendarClock },
  { label: "Community", href: "/community", icon: Users },
];

const MORE_LINKS = [
  { label: "Events", href: "/events" },
  { label: "Coaches", href: "/coaches" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "Blog", href: "/blogs" },
];

/** Fixed mobile app-shell bottom tab bar — replaces the desktop footer's nav role on small screens. */
export function BottomNav() {
  const pathname = usePathname();
  const { customer, status } = useCustomerAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const isLoggedIn = status === "authenticated";

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/vendor")) {
    return null;
  }

  return (
    <>
      <div className="h-16 sm:hidden" aria-hidden />
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-100 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(15,23,42,0.06)] backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-1">
          {PRIMARY_TABS.map((tab) => {
            const active = isActive(tab.href);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5"
              >
                <Icon className={`h-5 w-5 ${active ? "text-brand-600" : "text-slate-400"}`} strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[10px] font-semibold ${active ? "text-brand-600" : "text-slate-400"}`}>
                  {tab.label}
                </span>
              </Link>
            );
          })}
          <Link
            href="/profile"
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5"
          >
            {isLoggedIn ? (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-[9px] font-bold text-brand-700">
                {customer?.name?.charAt(0).toUpperCase() ?? "P"}
              </span>
            ) : (
              <UserRoundCog className={`h-5 w-5 ${isActive("/profile") ? "text-brand-600" : "text-slate-400"}`} />
            )}
            <span className={`text-[10px] font-semibold ${isActive("/profile") ? "text-brand-600" : "text-slate-400"}`}>
              {isLoggedIn ? "Profile" : "Login"}
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5"
          >
            <Menu className="h-5 w-5 text-slate-400" />
            <span className="text-[10px] font-semibold text-slate-400">More</span>
          </button>
        </div>
      </nav>

      {moreOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/40 sm:hidden"
            onClick={() => setMoreOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-x-0 bottom-0 z-50 max-h-[75vh] overflow-y-auto rounded-t-3xl bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] shadow-2xl sm:hidden">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-extrabold uppercase tracking-wide text-slate-900">More</p>
              <button
                aria-label="Close menu"
                onClick={() => setMoreOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="grid grid-cols-2 gap-2">
              {MORE_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700"
                >
                  <Trophy className="h-4 w-4 text-brand-500" /> {link.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
              <Link
                href="/vendor/login"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700"
              >
                <Store className="h-4 w-4 text-brand-500" /> Vendor Panel
              </Link>
              <Link
                href="/admin/login"
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700"
              >
                <ShieldCheck className="h-4 w-4 text-brand-500" /> Admin Panel
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
