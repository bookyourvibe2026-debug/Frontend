"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  clearVendorSession,
  DEMO_VENDOR_CREDENTIALS,
  DEMO_VENDOR_SESSION,
  getVendorSession,
  setVendorSession,
} from "@/lib/vendor-session";

type LoginTab = "email" | "phone" | "staff" | "subadmin";

const TABS: { id: LoginTab; label: string }[] = [
  { id: "email", label: "Email" },
  { id: "phone", label: "Phone" },
  { id: "staff", label: "Staff" },
  { id: "subadmin", label: "Subadmin" },
];

const HIGHLIGHTS = [
  { icon: "📅", label: "Slot-Based Booking" },
  { icon: "🏆", label: "Tournament Hosting" },
  { icon: "🎫", label: "Walk-in Ticketing" },
  { icon: "📷", label: "QR Check-In" },
  { icon: "💳", label: "Instant Payouts" },
  { icon: "📈", label: "Revenue Insights" },
  { icon: "📣", label: "Growth Marketing Tools" },
  { icon: "👥", label: "Customer Management" },
];

function VendorLoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/vendor/dashboard";

  const [tab, setTab] = useState<LoginTab>("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [redirecting, setRedirecting] = useState(false);

  const identifierLabel =
    tab === "email" ? "Email" : tab === "phone" ? "Phone Number" : tab === "staff" ? "Staff ID" : "Subadmin ID";
  const identifierPlaceholder =
    tab === "email" ? "vendor@bookyourvibes.com" : tab === "phone" ? "98765 43210" : tab === "staff" ? "STAFF-0001" : "SUB-0001";

  useEffect(() => {
    const current = getVendorSession();

    if (current) {
      setRedirecting(true);
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  function useDemoCredential() {
    clearVendorSession();
    setTab("email");
    setIdentifier(DEMO_VENDOR_CREDENTIALS.email);
    setPassword(DEMO_VENDOR_CREDENTIALS.password);
    setOtp("");
    setOtpSent(false);
    setShowPassword(true);
    setError("");
  }

  async function handleLogin() {
    setError("");
    if (!identifier.trim()) {
      setError(`Enter your ${identifierLabel.toLowerCase()}.`);
      return;
    }
    if (tab === "phone" && !otpSent) {
      setOtpSent(true);
      return;
    }
    if (tab === "phone" && !otp.trim()) {
      setError("Enter the OTP sent to your phone.");
      return;
    }
    if (tab !== "phone" && !password.trim()) {
      setError("Enter your password.");
      return;
    }

    setLoading(true);
    try {
      const normalizedIdentifier = identifier.replace(/\s+/g, "");
      const isEmailLogin =
        tab === "email" &&
        normalizedIdentifier.toLowerCase() === DEMO_VENDOR_CREDENTIALS.email &&
        password === DEMO_VENDOR_CREDENTIALS.password;
      const isPhoneLogin =
        tab === "phone" &&
        normalizedIdentifier === DEMO_VENDOR_CREDENTIALS.phone &&
        otp === DEMO_VENDOR_CREDENTIALS.otp;
      const isStaffLogin =
        tab === "staff" &&
        normalizedIdentifier.toUpperCase() === DEMO_VENDOR_CREDENTIALS.staffId &&
        password === DEMO_VENDOR_CREDENTIALS.password;
      const isSubadminLogin =
        tab === "subadmin" &&
        normalizedIdentifier.toUpperCase() === DEMO_VENDOR_CREDENTIALS.subadminId &&
        password === DEMO_VENDOR_CREDENTIALS.password;

      if (!isEmailLogin && !isPhoneLogin && !isStaffLogin && !isSubadminLogin) {
        setError("Demo credential mismatch. Use the credential card below.");
        return;
      }

      setVendorSession({
        ...DEMO_VENDOR_SESSION,
        role: tab === "staff" ? "staff" : tab === "subadmin" ? "subadmin" : "vendor",
        loggedInAt: new Date().toISOString(),
      });

      router.replace(redirectTo);
    } finally {
      setLoading(false);
    }
  }

  if (redirecting) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0c1912] px-6 text-center text-[#f6f3ea]">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#a6ff3c]">
            Vendor Access
          </p>
          <h1 className="mt-3 text-2xl font-semibold">Redirecting to your panel...</h1>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0c1912]">
      <Image
        src="/vendorbg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
        style={{ transform: "scale(1.3) translateX(-21%)", transformOrigin: "center" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#0c1912] via-[#0c1912]/92 to-[#0c1912]/55 lg:via-[#0c1912]/85 lg:to-[#0c1912]/35" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0c1912]/70 via-transparent to-[#0c1912]/40" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(166,255,60,0.16),transparent_45%),radial-gradient(circle_at_80%_70%,rgba(255,176,32,0.14),transparent_45%)]" />

      <div className="relative mx-auto flex min-h-screen max-w-[1440px] flex-col items-center justify-center gap-12 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        <div className="flex max-w-md flex-col justify-center text-[#f6f3ea]">
          <div className="flex items-center gap-2 font-[600] text-2xl" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#a6ff3c] text-[#0c1912]">BYV</span>
            Book Your Vibes
          </div>
          <h1 className="mt-6 text-3xl font-[600] leading-tight" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
            Vendor <span className="text-[#a6ff3c]">Partner</span> Login
          </h1>
          <p className="mt-3 text-sm text-[#c9d6cd]">
            Manage your turf, court, or arena bookings, slots, and payouts from your professional dashboard.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#a6ff3c]">
              Demo access
            </p>
            <div className="mt-3 grid gap-2 text-sm text-[#e6ede8] sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-[#c9d6cd]">Email</p>
                <p className="font-semibold">{DEMO_VENDOR_CREDENTIALS.email}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#c9d6cd]">Password</p>
                <p className="font-semibold">{DEMO_VENDOR_CREDENTIALS.password}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-[#c9d6cd]">Phone OTP</p>
                <p className="font-semibold">
                  {DEMO_VENDOR_CREDENTIALS.phone} / {DEMO_VENDOR_CREDENTIALS.otp}
                </p>
              </div>
              <div className="sm:text-right">
                <button
                  type="button"
                  onClick={useDemoCredential}
                  className="rounded-full border border-white/15 px-4 py-2 text-xs font-bold uppercase tracking-wide text-[#f6f3ea] transition hover:bg-white/10"
                >
                  Use demo login
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {HIGHLIGHTS.map((h) => (
              <div key={h.label} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-3 text-xs font-semibold text-[#e6ede8]">
                <span>{h.icon}</span>
                {h.label}
              </div>
            ))}
          </div>

          <div className="mt-10 flex gap-8 text-sm">
            <Stat value="500+" label="Partners" />
            <Stat value="50+" label="Cities" />
            <Stat value="4.9" label="Rating" />
          </div>
        </div>

        <div className="w-full max-w-md rounded-3xl bg-[#f6f3ea] p-8 shadow-2xl">
          <h2 className="text-2xl font-[600] text-[#10241a]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
            Partner Login
          </h2>
          <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#3f5449]">Access your professional dashboard.</p>

          <div className="mt-6 grid grid-cols-4 gap-1 rounded-xl bg-[#eef2e4] p-1 text-xs font-bold uppercase">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id);
                  setError("");
                  setOtpSent(false);
                }}
                className={`rounded-lg py-2 transition ${
                  tab === t.id ? "bg-white text-[#10241a] shadow" : "text-[#3f5449]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wide text-[#3f5449]">{identifierLabel}</label>
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={identifierPlaceholder}
                className="mt-2 w-full rounded-xl border border-[#e4ded0] bg-white px-4 py-3 text-sm text-[#10241a] outline-none focus:border-[#a6ff3c]"
              />
            </div>

            {tab === "phone" && otpSent ? (
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wide text-[#3f5449]">OTP</label>
                  <button onClick={() => setOtpSent(false)} className="text-xs font-bold text-[#3f7d3f]">
                    Change number
                  </button>
                </div>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="••••••"
                  className="mt-2 w-full rounded-xl border border-[#e4ded0] bg-white px-4 py-3 font-mono text-sm text-[#10241a] outline-none focus:border-[#a6ff3c]"
                />
              </div>
            ) : tab !== "phone" ? (
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wide text-[#3f5449]">Password</label>
                  <Link href="/vendor/forgot-password" className="text-xs font-bold text-[#3f7d3f]">
                    Forgot?
                  </Link>
                </div>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#e4ded0] bg-white px-4 py-1">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-transparent py-2 text-sm text-[#10241a] outline-none"
                  />
                  <button onClick={() => setShowPassword((s) => !s)} className="text-xs font-bold text-[#3f5449]">
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            ) : null}

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0c1912] py-3 text-sm font-bold text-[#a6ff3c] transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Logging in…" : tab === "phone" && !otpSent ? "Send OTP" : "Login"} {!loading && "›"}
            </button>
          </div>

          <p className="mt-6 text-center text-xs text-[#3f5449]">
            Not a partner yet?{" "}
            <Link href="/vendor/register" className="font-bold text-[#3f7d3f] underline">
              Apply here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function VendorLoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-950" />}>
      <VendorLoginInner />
    </Suspense>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-mono text-lg font-bold text-[#ffb020]">{value}</p>
      <p className="text-xs uppercase tracking-wide text-[#c9d6cd]">{label}</p>
    </div>
  );
}
