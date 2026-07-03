"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, ShieldCheck } from "lucide-react";
import {
  DEMO_ADMIN_CREDENTIALS,
  DEMO_ADMIN_SESSION,
  getAdminSession,
  setAdminSession,
} from "@/lib/admin-session";

function AdminLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (getAdminSession()) {
      setRedirecting(true);
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  function useDemoCredential() {
    setEmail(DEMO_ADMIN_CREDENTIALS.email);
    setPassword(DEMO_ADMIN_CREDENTIALS.password);
    setShowPassword(true);
    setError("");
  }

  async function handleLogin() {
    setError("");
    if (!email.trim()) {
      setError("Enter your email address.");
      return;
    }
    if (!password.trim()) {
      setError("Enter your password.");
      return;
    }

    setLoading(true);
    try {
      const matches =
        email.trim().toLowerCase() === DEMO_ADMIN_CREDENTIALS.email && password === DEMO_ADMIN_CREDENTIALS.password;

      if (!matches) {
        setError("Invalid credentials. Use the demo credentials below.");
        return;
      }

      setAdminSession({ ...DEMO_ADMIN_SESSION, loggedInAt: new Date().toISOString() });
      router.replace(redirectTo);
    } finally {
      setLoading(false);
    }
  }

  if (redirecting) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-center text-white">
        <p>Redirecting to admin panel...</p>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Go back"
        className="fixed left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 lg:hidden"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>

      <div className="flex w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        {/* Left panel — form, with our logo */}
        <div className="w-full p-8 sm:p-12 lg:w-1/2">
          <div className="mb-6 flex items-center gap-2.5">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <Image src="/logo.jpg" alt="Book Your Vibe" fill sizes="40px" className="object-contain p-1" />
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-tight text-slate-900">
                BOOK <span className="text-orange-600">YOUR VIBE</span>
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Admin Studio</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome!</p>
          <p className="text-sm text-slate-500">Please enter log in details below</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email Address</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <div className="flex items-center rounded-lg border border-blue-400 bg-white px-3">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password..."
                  className="w-full bg-transparent py-2.5 text-sm outline-none"
                />
                <button onClick={() => setShowPassword((s) => !s)} className="text-slate-400 hover:text-slate-600" aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-xs font-medium text-red-600">{error}</p>}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Admin Login"}
            </button>
          </div>

          <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
              <ShieldCheck size={13} /> Demo credentials
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase text-slate-400">Email</p>
                <p className="font-semibold text-slate-800">{DEMO_ADMIN_CREDENTIALS.email}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-slate-400">Password</p>
                <p className="font-semibold text-slate-800">{DEMO_ADMIN_CREDENTIALS.password}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={useDemoCredential}
              className="mt-3 rounded-full border border-slate-300 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-white"
            >
              Use demo login
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">© 2026. All Rights Reserved.</p>
        </div>

        {/* Right panel — brand graphic */}
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-[#15101f] via-[#211731] to-[#3a2a1a] lg:flex lg:w-1/2 lg:flex-col lg:items-center lg:justify-center">
          <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-orange-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -right-10 h-64 w-64 rounded-full bg-fuchsia-500/15 blur-3xl" />
          <div className="relative flex flex-col items-center gap-3 px-8 text-center">
            <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/15 bg-white/5">
              <Image src="/logo.jpg" alt="Book Your Vibe" fill sizes="64px" className="object-contain p-2" />
            </div>
            <h2 className="text-3xl font-extrabold leading-tight text-white">
              BOOK YOUR{" "}
              <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-rose-400 bg-clip-text text-transparent">
                VIBE
              </span>
            </h2>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-200">
              Play · Book · Manage
            </p>
            <p className="mt-4 max-w-xs text-sm text-slate-300">
              One control center for every listing, vendor, booking and payout across the platform.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-100" />}>
      <AdminLoginInner />
    </Suspense>
  );
}
