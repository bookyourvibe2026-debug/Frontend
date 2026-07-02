"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";

export default function AdminIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getAdminSession() ? "/admin/dashboard" : "/admin/login");
  }, [router]);

  return null;
}
