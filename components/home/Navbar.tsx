"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShieldCheck, X } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { NAV_LINKS } from "./data";
import { GhostButton, PrimaryButton } from "./ui";

export function Navbar({
  onOpenLogin,
  onOpenSignup,
  isLoggedIn,
  userName,
  avatarUrl,
  onLogout,
}: {
  onOpenLogin: () => void;
  onOpenSignup: () => void;
  isLoggedIn: boolean;
  userName: string;
  avatarUrl?: string;
  onLogout: () => void;
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
        </div>

        {/* Nav links */}
        <nav className="hidden min-w-0 items-center justify-center gap-8 whitespace-nowrap xl:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 text-sm font-semibold transition ${
                isActive(link.href)
                  ? "text-brand-600"
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
            className="hidden rounded-full border border-brand-200 bg-brand-50 px-5 py-2.5 text-sm font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-100 lg:inline-flex"
          >
            List Your Games
          </Link>
          <Link
            href="/admin/login"
            aria-label="Admin Panel"
            title="Admin Panel"
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-brand-300 hover:text-brand-600 sm:flex"
          >
            <ShieldCheck size={18} />
          </Link>
          {isLoggedIn ? (
            <div className="hidden items-center gap-3 lg:flex">
              <Link
                href="/profile"
                aria-label="My Profile"
                title="My Profile"
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-sm font-bold text-brand-700 transition hover:bg-brand-200"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt={userName} className="h-full w-full object-cover" />
                ) : (
                  userName.charAt(0).toUpperCase()
                )}
              </Link>
              <button
                onClick={onLogout}
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-accent-300 hover:text-accent-600"
              >
                Logout
              </button>
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
                  isActive(link.href) ? "text-brand-600" : "text-slate-700"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              {isLoggedIn ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-center text-sm font-semibold text-slate-700 transition hover:border-brand-300 hover:text-brand-600"
                  >
                    My Profile
                  </Link>
                  <GhostButton onClick={onLogout} className="flex-1">
                    Logout
                  </GhostButton>
                </>
              ) : (
                <>
                  <Link
                    href="/vendor/register"
                    onClick={() => {
                      setMobileOpen(false);
                    }}
                    className="flex-1 rounded-full border border-brand-200 bg-brand-50 px-4 py-2.5 text-center text-sm font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-100"
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
