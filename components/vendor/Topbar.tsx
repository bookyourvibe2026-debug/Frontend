"use client";

import { LogOut, Menu } from "lucide-react";
import { NotificationBell } from "./NotificationBell";

export default function Topbar({
  onMenuClick,
  onLogout,
  vendorName = "Book Your Vibes",
}: {
  onMenuClick: () => void;
  onLogout?: () => void;
  vendorName?: string;
}) {
  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-surface-border bg-cream-200/80 backdrop-blur sticky top-0 z-20">
      <button
        onClick={onMenuClick}
        className="text-ink-soft hover:text-ink lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>
      <span className="hidden lg:block" />
      <div className="flex items-center gap-1 sm:gap-3">
        <p className="text-sm text-ink-soft hidden sm:block">
          Welcome, <span className="font-semibold text-ink">{vendorName}</span>
        </p>
        <NotificationBell />
        {onLogout && (
          <button
            onClick={onLogout}
            aria-label="Logout"
            title="Logout"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-vibe-coral/10 hover:text-vibe-coral transition"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </header>
  );
}
