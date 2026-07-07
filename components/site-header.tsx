"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, ShieldCheck, X } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { useCustomerAuth } from "./providers/CustomerAuthProvider";
import { LoginModal } from "./home/modals/LoginModal";
import { SignupModal } from "./home/modals/SignupModal";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Find Your Games", href: "/games" },
  { label: "Venues", href: "/venues" },
  { label: "Events", href: "/events" },
  { label: "Coaches", href: "/coaches" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "Blog", href: "/blogs" },
  { label: "Community", href: "/community" },
];

/** The one header every page renders — same links, same auth state, same look everywhere. */
export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [authView, setAuthView] = useState<"login" | "signup" | null>(null);
  const pathname = usePathname();
  const { customer, status, logout } = useCustomerAuth();
  const isLoggedIn = status === "authenticated";
  const userName = customer?.name?.split(" ")[0] ?? "";

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

        <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-semibold transition ${
                isActive(link.href) ? "text-brand-600" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/vendor/register"
            className="hidden rounded-full border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-100 lg:inline-flex"
          >
            List Your Games
          </Link>
          <Link
            href="/admin/login"
            aria-label="Admin Panel"
            title="Admin Panel"
            className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-brand-300 hover:text-brand-600 lg:flex"
          >
            <ShieldCheck size={18} />
          </Link>

          {isLoggedIn ? (
            <Link
              href="/profile"
              aria-label="My Profile"
              title="My Profile"
              className="hidden h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-brand-100 text-sm font-bold text-brand-700 transition hover:bg-brand-200 sm:flex"
            >
              {customer?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={customer.avatarUrl} alt={userName} className="h-full w-full object-cover" />
              ) : (
                userName.charAt(0).toUpperCase()
              )}
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setAuthView("login")}
              className="hidden rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-500/30 transition hover:scale-[1.03] sm:inline-flex"
            >
              Login / Sign Up
            </button>
          )}

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
                  isActive(link.href) ? "text-brand-600" : "text-slate-700"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {isLoggedIn ? (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
                >
                  My Profile
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Link
                  href="/vendor/register"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center rounded-full border border-brand-200 bg-brand-50 px-4 py-2.5 text-sm font-semibold text-brand-700"
                >
                  List Games
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    setAuthView("login");
                  }}
                  className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-brand-500 to-accent-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md"
                >
                  Login / Sign Up
                </button>
              </div>
            )}

            <Link
              href="/admin/login"
              onClick={() => setMobileOpen(false)}
              className="mt-1 inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 px-4 py-2.5 text-center text-xs font-semibold text-slate-600"
            >
              <ShieldCheck size={14} /> Admin Panel
            </Link>
          </nav>
        </div>
      )}

      {authView === "login" && (
        <LoginModal
          onClose={() => setAuthView(null)}
          onLoggedIn={() => setAuthView(null)}
          onSwitchToSignup={() => setAuthView("signup")}
        />
      )}
      {authView === "signup" && (
        <SignupModal
          onClose={() => setAuthView(null)}
          onSignedUp={() => setAuthView(null)}
          onSwitchToLogin={() => setAuthView("login")}
        />
      )}
    </header>
  );
}
