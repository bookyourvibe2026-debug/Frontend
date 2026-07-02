"use client";

import { Menu } from "lucide-react";

export default function Topbar({
  onMenuClick,
  vendorName = "Book Your Vibes",
}: {
  onMenuClick: () => void;
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
      <p className="text-sm text-ink-soft">
        Welcome, <span className="font-semibold text-ink">{vendorName}</span>
      </p>
    </header>
  );
}
