"use client";

import { useCallback, useState } from "react";
import { PrimaryButton } from "../ui";
import { FieldLabel, inputClass, ModalShell } from "./ModalShell";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.91l-3.88-3c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.11A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28V6.61H1.26A12 12 0 0 0 0 12c0 1.94.46 3.77 1.26 5.39l4.01-3.11Z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.26 6.61l4.01 3.11C6.22 6.86 8.87 4.75 12 4.75Z" />
    </svg>
  );
}

export function LoginModal({
  onClose,
  onLoginSuccess,
  onSwitchToSignup,
}: {
  onClose: () => void;
  onLoginSuccess: (name: string) => void;
  onSwitchToSignup: () => void;
}) {
  const [method, setMethod] = useState<"mobile" | "email">("mobile");
  const [mobile, setMobile] = useState("");
  const [emailVal, setEmailVal] = useState("");
  const [password, setPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const sendOtp = useCallback(() => {
    if (mobile.replace(/\D/g, "").length !== 10) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    setOtpSent(true);
    // TODO: call /api/auth/send-otp
  }, [mobile]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (method === "mobile") {
        if (!otpSent) {
          sendOtp();
          return;
        }
        if (otp.length !== 6) {
          setError("Enter the 6-digit OTP sent to your mobile.");
          return;
        }
      } else {
        if (!emailVal || !password) {
          setError("Enter both email and password.");
          return;
        }
      }
      setError("");
      // TODO: call /api/auth/login
      onLoginSuccess(method === "mobile" ? `User${mobile.slice(-4)}` : emailVal.split("@")[0]);
    },
    [method, otpSent, otp, emailVal, password, mobile, onLoginSuccess, sendOtp]
  );

  return (
    <ModalShell onClose={onClose} title="Welcome back" subtitle="Login to continue your vibe.">
      <div className="mb-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
        {(["mobile", "email"] as const).map((m) => (
          <button
            key={m}
            onClick={() => {
              setMethod(m);
              setError("");
            }}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              method === m ? "bg-white text-orange-600 shadow" : "text-slate-500"
            }`}
          >
            {m === "mobile" ? "Mobile OTP" : "Email & Password"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {method === "mobile" ? (
          <>
            <div>
              <FieldLabel>Mobile Number</FieldLabel>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  maxLength={10}
                  placeholder="98765 43210"
                  className={inputClass}
                  disabled={otpSent}
                />
                {!otpSent && (
                  <button
                    type="button"
                    onClick={sendOtp}
                    className="whitespace-nowrap rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white"
                  >
                    Send OTP
                  </button>
                )}
              </div>
            </div>
            {otpSent && (
              <div>
                <FieldLabel>Enter OTP</FieldLabel>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  placeholder="6-digit OTP"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-slate-400">
                  Sent to +91 {mobile}.{" "}
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="font-semibold text-orange-600"
                  >
                    Change number
                  </button>
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <div>
              <FieldLabel>Email</FieldLabel>
              <input
                value={emailVal}
                onChange={(e) => setEmailVal(e.target.value)}
                type="email"
                placeholder="you@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel>Password</FieldLabel>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                className={inputClass}
              />
              <p className="mt-1 text-right text-xs font-semibold text-orange-600">
                Forgot password?
              </p>
            </div>
          </>
        )}

        {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

        <PrimaryButton type="submit" className="w-full">
          {method === "mobile" && !otpSent ? "Continue" : "Login"}
        </PrimaryButton>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> or continue with{" "}
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:border-orange-300"
        >
          <GoogleIcon className="h-4 w-4" /> Continue with Google
        </button>

        <p className="text-center text-sm text-slate-500">
          New to Book Your Vibe?{" "}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-semibold text-orange-600"
          >
            Create an account
          </button>
        </p>
      </form>
    </ModalShell>
  );
}
