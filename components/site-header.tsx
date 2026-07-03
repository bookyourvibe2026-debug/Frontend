"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bell, ChevronDown, Menu, MapPin, Search, X } from "lucide-react";
import { BrandLogo } from "./brand-logo";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Find Your Games", href: "/games" },
  { label: "Venues", href: "/venues" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "Offers", href: "/offers" },
  { label: "Community", href: "/community" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-6">
        <BrandLogo
          className="shrink-0"
          logoBoxClassName="h-11 w-11 rounded-xl sm:h-12 sm:w-12"
          imageClassName="p-1.5"
          showText={false}
          priority
        />

        <button className="hidden items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:border-orange-300 hover:text-orange-600 md:flex">
          <MapPin className="h-3.5 w-3.5" aria-hidden /> Udaipur
          <ChevronDown className="h-3.5 w-3.5" aria-hidden />
        </button>

        <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-semibold transition ${
                isActive(link.href) ? "text-orange-600" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            aria-label="Search"
            className="hidden h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600 sm:flex"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            aria-label="Notifications"
            className="relative hidden h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600 sm:flex"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          <Link
            href="/"
            className="hidden rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-500/30 transition hover:scale-[1.03] sm:inline-flex"
          >
            Login / Sign Up
          </Link>

          <button
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 shadow-lg lg:hidden">
          <nav className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`text-sm font-semibold ${
                  isActive(link.href) ? "text-orange-600" : "text-slate-700"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Link
                href="/vendor/register"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-700"
              >
                List Games
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md"
              >
                Login / Sign Up
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
