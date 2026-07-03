"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Menu, MapPin, Search, ShieldCheck, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { NAV_LINKS } from "./data";
import { GhostButton, PrimaryButton } from "./ui";

export function Navbar({
  onOpenLogin,
  onOpenSignup,
  isLoggedIn,
  userName,
  onOpenAdmin,
}: {
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  isLoggedIn: boolean;
  userName: string;
  onOpenAdmin: () => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto grid max-w-[1600px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-6 px-4 py-3 sm:px-6 lg:gap-10 lg:px-8">
        {/* Left side */}
        <div className="flex items-center gap-5 lg:gap-6">
          <BrandLogo
            className="shrink-0"
            logoBoxClassName="h-11 w-11 rounded-xl sm:h-12 sm:w-12"
            imageClassName="p-1.5"
            showText={false}
            priority
          />

          {/* Location */}
          <button className="hidden items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-orange-300 hover:text-orange-600 xl:flex">
            <MapPin className="h-3.5 w-3.5" aria-hidden /> Udaipur
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>

        {/* Nav links */}
        <nav className="hidden min-w-0 items-center justify-center gap-8 whitespace-nowrap xl:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 text-sm font-semibold transition ${
                isActive(link.href)
                  ? "text-orange-600"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4 lg:gap-5">
          <Link
            href="/vendor/register"
            className="hidden rounded-full border border-orange-200 bg-orange-50 px-5 py-2.5 text-sm font-semibold text-orange-700 transition hover:border-orange-300 hover:bg-orange-100 lg:inline-flex"
          >
            List Your Games
          </Link>
          <Link
            href="/admin/login"
            aria-label="Admin Panel"
            title="Admin Panel"
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-orange-300 hover:text-orange-600 sm:flex"
          >
            <ShieldCheck size={18} />
          </Link>
          <button
            aria-label="Search"
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-orange-300 hover:text-orange-600 sm:flex"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            aria-label="Notifications"
            className="relative hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-orange-300 hover:text-orange-600 sm:flex"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>

          {isLoggedIn ? (
            <div className="hidden items-center gap-3 lg:flex">
              <button
                onClick={onOpenAdmin}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-orange-300 hover:text-orange-600"
              >
                Admin Console
              </button>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-700">
                {userName.charAt(0).toUpperCase()}
              </div>
            </div>
          ) : (
            <PrimaryButton onClick={onOpenLogin} className="hidden lg:inline-flex">
              Login / Sign Up
            </PrimaryButton>
          )}

          {/* Mobile hamburger */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 lg:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => {
                  setMobileOpen(false);
                }}
                className={`text-sm font-semibold ${
                  isActive(link.href) ? "text-orange-600" : "text-slate-700"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              {isLoggedIn ? (
                <GhostButton onClick={onOpenAdmin} className="flex-1">
                  Admin Console
                </GhostButton>
              ) : (
                <>
                  <Link
                    href="/vendor/register"
                    onClick={() => {
                      setMobileOpen(false);
                    }}
                    className="flex-1 rounded-full border border-orange-200 bg-orange-50 px-4 py-2.5 text-center text-sm font-semibold text-orange-700 transition hover:border-orange-300 hover:bg-orange-100"
                  >
                    List Your Games
                  </Link>
                  <GhostButton onClick={onOpenLogin} className="flex-1">
                    Login
                  </GhostButton>
                  <PrimaryButton onClick={onOpenSignup} className="flex-1">
                    Sign Up
                  </PrimaryButton>
                </>
              )}
            </div>
            <Link
              href="/admin/login"
              onClick={() => setMobileOpen(false)}
              className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 px-4 py-2.5 text-center text-xs font-semibold text-slate-600"
            >
              <ShieldCheck size={14} /> Admin Panel
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
