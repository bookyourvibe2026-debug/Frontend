"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  CalendarCheck2,
  Wallet,
  CreditCard,
  ShieldCheck,
  Settings2,
  BarChart3,
  Megaphone,
  LogOut,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/vendor/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vendor/listings", label: "My Listings", icon: Briefcase },
  { href: "/vendor/bookings", label: "Bookings Management", icon: CalendarCheck2 },
  { href: "/vendor/payments", label: "Payment Settled", icon: Wallet },
  { href: "/vendor/memberships", label: "Memberships", icon: CreditCard },
  { href: "/vendor/role-access", label: "Role Access", icon: ShieldCheck },
  { href: "/vendor/profile", label: "Profile", icon: Settings2 },
  { href: "/vendor/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/vendor/marketing", label: "Marketing", icon: Megaphone },
] as const;

export default function Sidebar({
  open,
  onClose,
  onLogout,
}: {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* mobile backdrop */}
      {open && (
        <button
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-ink/30 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed z-40 inset-y-0 left-0 w-64 shrink-0 border-r border-surface-border bg-white transform transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-vibe-violet to-vibe-limeDark flex items-center justify-center text-white font-display font-semibold">
              BV
            </div>
            <div>
              <p className="font-display font-semibold text-ink text-sm leading-none">
                Book Your Vibes
              </p>
              <p className="text-[11px] text-ink-faint mt-1">Vendor Workspace</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-ink-faint hover:text-ink"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="px-3 py-5 space-y-1">
          <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-ink-faint uppercase">
            Navigation
          </p>
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname?.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-vibe-violet/10 text-vibe-violet"
                    : "text-ink-soft hover:bg-cream-300"
                }`}
              >
                <Icon size={18} strokeWidth={2} />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 inset-x-0 p-3 border-t border-surface-border">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-vibe-coral hover:bg-vibe-coral/10 w-full transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
