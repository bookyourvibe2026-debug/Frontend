"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Menu,
  ShieldCheck,
  Store,
  X,
  type LucideIcon,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

const MOBILE_NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Find Your Games", href: "/games" },
  { label: "Venues", href: "/venues" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "Blog", href: "/blogs" },
  { label: "Community", href: "/community" },
];

export function MobileTopBar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between">
        <BrandLogo
          showText={false}
          logoBoxClassName="h-12 w-12 rounded-2xl"
          imageClassName="p-1.5"
          priority
        />
        <div className="flex items-center gap-2">
          <button
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
              3
            </span>
          </button>
          <button
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-600"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-900/40"
            onClick={() => setMenuOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-x-0 top-0 z-50 max-h-[85vh] overflow-y-auto rounded-b-3xl bg-white p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <BrandLogo showText={false} logoBoxClassName="h-11 w-11 rounded-xl" imageClassName="p-1.5" />
              <button
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="mt-4 flex flex-col gap-1">
              {MOBILE_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
              <Link
                href="/vendor/login"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700"
              >
                <Store className="h-4 w-4 text-brand-500" /> Vendor Panel
              </Link>
              <Link
                href="/admin/login"
                onClick={() => setMenuOpen(false)}
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

export function MobileCard({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-3xl border border-slate-100 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function MobileSectionRow({
  title,
  actionLabel,
  onAction,
  emoji,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  emoji?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-extrabold text-slate-900">
        {title} {emoji}
      </h2>
      {actionLabel && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600"
        >
          {actionLabel} <ArrowRight className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function MobileChip({
  label,
  selected,
  onClick,
  icon: Icon,
  image,
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  icon?: LucideIcon;
  image?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-4 py-3 transition ${
        selected
          ? "border-brand-300 bg-brand-50 text-brand-600"
          : "border-slate-100 bg-white text-slate-600"
      }`}
    >
      <span className="flex h-8 w-8 items-center justify-center">
        {image ?? (Icon && <Icon className="h-6 w-6" />)}
      </span>
      <span className="text-[11px] font-semibold whitespace-nowrap">{label}</span>
    </button>
  );
}
