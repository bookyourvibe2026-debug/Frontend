"use client";

import { usePathname, useRouter } from "next/navigation";
import { GraduationCap, LayoutGrid, Trophy, UtensilsCrossed } from "lucide-react";
import { NAV_ITEMS_BY_VERTICAL } from "./Sidebar";
import type { VendorVertical } from "@/lib/api/types";

const META: Record<VendorVertical, { label: string; icon: typeof LayoutGrid }> = {
  turf: { label: "Turf", icon: LayoutGrid },
  events: { label: "Events", icon: Trophy },
  food: { label: "Food", icon: UtensilsCrossed },
  coaches: { label: "Coaches", icon: GraduationCap },
};

/**
 * Mobile-only panel switcher shown at the top of every vendor page — a workspace-
 * style pill row so a multi-vertical vendor always sees which panel they're in and
 * can jump between them in one tap. Renders nothing for single-vertical vendors, so
 * they're unaffected. Desktop uses the sidebar's "Switch panel" control instead.
 */
export function VendorPanelSwitcher({ verticals }: { verticals: VendorVertical[] }) {
  const pathname = usePathname();
  const router = useRouter();

  if (verticals.length < 2) return null;

  const active =
    verticals.find((v) => NAV_ITEMS_BY_VERTICAL[v].some((i) => pathname?.startsWith(i.href))) ?? verticals[0];

  function go(v: VendorVertical) {
    if (v === active) return;
    localStorage.setItem("byv_vendor_active_vertical", v);
    router.push(NAV_ITEMS_BY_VERTICAL[v][0]?.href ?? "/vendor/dashboard");
  }

  return (
    <div className="lg:hidden sticky top-0 z-30 border-b border-surface-border bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] items-center gap-2 overflow-x-auto px-4 py-2 sm:px-6 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="shrink-0 text-[10px] font-black uppercase tracking-wider text-ink-faint">Panel</span>
        {verticals.map((v) => {
          const on = v === active;
          const Icon = META[v].icon;
          return (
            <button
              key={v}
              onClick={() => go(v)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition active:scale-[0.97] ${
                on ? "bg-vibe-violet text-white shadow-sm" : "border border-surface-border bg-white text-ink-soft"
              }`}
            >
              <Icon size={13} /> {META[v].label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
