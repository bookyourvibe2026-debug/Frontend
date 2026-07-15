"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "@/components/vendor/Sidebar";
import BottomNav from "@/components/vendor/BottomNav";

import { isVendorOwner, restoreVendorSession, vendorLogout, type VendorProfile } from "@/lib/api/auth";
import { VendorAuthProvider } from "@/components/providers/VendorAuthProvider";

export default function VendorPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<VendorProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    restoreVendorSession().then((vendor) => {
      if (cancelled) return;
      if (!vendor) {
        router.replace(`/vendor/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      setSession(vendor);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  async function handleLogout() {
    await vendorLogout();
    router.replace("/vendor/login");
  }

  if (!ready || !session) {
    return (
      <div className="min-h-screen bg-cream-200 flex items-center justify-center text-ink-soft">
        Checking vendor access...
      </div>
    );
  }

  return (
    <VendorAuthProvider vendor={session} onLoggedOut={() => router.replace("/vendor/login")}>
      <div className="min-h-screen flex bg-cream-200 text-ink">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onLogout={() => void handleLogout()}
          verticals={session.verticals}
        />
        <div className="flex-1 min-w-0 flex flex-col">
          <main className="flex-1 px-4 sm:px-6 py-6 pb-24 lg:pb-6 max-w-[1400px] w-full mx-auto">
            {children}
          </main>
        </div>
        <BottomNav verticals={session.verticals} onLogout={() => void handleLogout()} />
      </div>
    </VendorAuthProvider>
  );
}
