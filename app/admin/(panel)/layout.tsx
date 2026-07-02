"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/Sidebar";
import AdminTopbar from "@/components/admin/Topbar";
import { clearAdminSession, getAdminSession, type AdminSession } from "@/lib/admin-session";

const LABELS: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/listings": "Listings",
  "/admin/user-queries": "User Queries",
  "/admin/categories": "Categories",
  "/admin/blog": "Vibe Blog",
  "/admin/users": "Users",
  "/admin/vendor-management": "Vendor Management",
  "/admin/sub-admins": "Manage Sub Admins",
  "/admin/bookings": "Bookings Management",
  "/admin/shared-package-report": "Shared Package Report",
  "/admin/marketing": "Marketing Campaigns",
  "/admin/vendor-payouts": "Vendor Payouts",
  "/admin/refund-payouts": "Refund Payouts",
  "/admin/app-version": "App Version",
  "/admin/system-health": "System Health",
};

function currentLabel(pathname: string) {
  const match = Object.keys(LABELS).find((href) => pathname.startsWith(href));
  return match ? LABELS[match] : "Admin";
}

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = getAdminSession();

    if (!current) {
      router.replace(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    setSession(current);
    setReady(true);
  }, [pathname, router]);

  function handleLogout() {
    clearAdminSession();
    router.replace("/admin/login");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream-200 text-ink-soft">
        Checking admin access...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-cream-200 text-ink">
      <AdminSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
        currentLabel={currentLabel(pathname ?? "")}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar onMenuClick={() => setSidebarOpen(true)} adminName={session?.adminName} />
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
