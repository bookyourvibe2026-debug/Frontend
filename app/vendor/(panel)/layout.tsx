"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/vendor/Sidebar";
import Topbar from "@/components/vendor/Topbar";
import {
  clearVendorSession,
  getVendorSession,
  type VendorSession,
} from "@/lib/vendor-session";

export default function VendorPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<VendorSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const current = getVendorSession();

    if (!current) {
      router.replace(`/vendor/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    setSession(current);
    setReady(true);
  }, [pathname, router]);

  function handleLogout() {
    clearVendorSession();
    router.replace("/vendor/login");
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-cream-200 flex items-center justify-center text-ink-soft">
        Checking vendor access...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-cream-200 text-ink">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          vendorName={session?.businessName ?? session?.vendorName}
        />
        <main className="flex-1 px-4 sm:px-6 py-6 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
