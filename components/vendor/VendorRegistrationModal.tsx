"use client";

import { useMemo, useState } from "react";
import { RegistrationFormData, VenueType, emptyFormData, PHASES } from "./types";

const VENUE_TYPES: VenueType[] = [
  "Turf / Sports Ground",
  "Box Cricket Arena",
  "Futsal Court",
  "Badminton / Pickleball Court",
  "Gaming Zone / PS5 Lounge",
  "Bowling Alley",
  "Skating Rink",
  "Escape Room",
  "Individual",
  "Company",
];

const INDIAN_STATES = [
  "Rajasthan",
  "Delhi",
  "Maharashtra",
  "Karnataka",
  "Gujarat",
  "Uttar Pradesh",
  "Telangana",
  "Tamil Nadu",
  "West Bengal",
  "Punjab",
];

const CHECKLISTS: Record<number, string[]> = {
  1: ["Business Name", "Your Full Name", "Business Email", "Venue Type (Company, Individual, etc)", "Contact Phone Number (Verified via OTP)"],
  2: ["Strong Password (min 8 characters)", "Confirm Password", "Passwords must match"],
  3: ["Bank Account Number", "IFSC Code", "Account Holder Name"],
  4: ["State", "City", "Postal Code (Pincode)"],
  5: ["Verify all details", "Solve security puzzle", "Accept terms & conditions"],
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: RegistrationFormData) => Promise<void> | void;
}

export default function VendorRegistrationModal({ open, onClose, onSubmit }: Props) {
  const [phase, setPhase] = useState(1);
  const [data, setData] = useState<RegistrationFormData>(emptyFormData);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const [captcha, setCaptcha] = useState(() => makeCaptcha());
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaSolved, setCaptchaSolved] = useState(false);

  function makeCaptcha() {
    const a = Math.floor(Math.random() * 20) + 5;
    const b = Math.floor(Math.random() * 20) + 5;
    return { a, b, result: a + b };
  }

  function update<K extends keyof RegistrationFormData>(key: K, value: RegistrationFormData[K]) {
    setData((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  }

  function validatePhase(p: number): boolean {
    const e: Record<string, string> = {};
    if (p === 1) {
      if (!/^[6-9]\d{9}$/.test(data.phone)) e.phone = "Enter a valid 10-digit phone number.";
      if (!data.otpVerified) e.otp = "Please verify your phone number with OTP.";
      if (!data.businessName.trim()) e.businessName = "Venue / business name is required.";
      if (!data.ownerName.trim()) e.ownerName = "Owner name is required.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) e.email = "Enter a valid email address.";
    }
    if (p === 2) {
      if (data.password.length < 8) e.password = "Password must be at least 8 characters.";
      if (data.password !== data.confirmPassword) e.confirmPassword = "Passwords do not match.";
    }
    if (p === 3) {
      if (!/^\d{9,18}$/.test(data.accountNumber)) e.accountNumber = "Enter a valid account number.";
      if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(data.ifscCode.toUpperCase())) e.ifscCode = "Enter a valid IFSC code.";
      if (!data.accountHolderName.trim()) e.accountHolderName = "Account holder name is required.";
    }
    if (p === 4) {
      if (!data.state) e.state = "Select a state.";
      if (!data.city.trim()) e.city = "City is required.";
      if (!/^\d{6}$/.test(data.pincode)) e.pincode = "Enter a valid 6-digit pincode.";
    }
    if (p === 5) {
      if (!captchaSolved) e.captcha = "Please solve the security puzzle.";
      if (!data.acceptedTerms) e.acceptedTerms = "You must accept the Vendor Terms & Conditions.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function next() {
    if (!validatePhase(phase)) return;
    if (phase < 5) setPhase(phase + 1);
  }
  function back() {
    if (phase > 1) setPhase(phase - 1);
  }

  function sendOtp() {
    if (!/^[6-9]\d{9}$/.test(data.phone)) {
      setErrors((e) => ({ ...e, phone: "Enter a valid 10-digit phone number first." }));
      return;
    }
    setSendingOtp(true);
    // TODO: wire to your real OTP provider (MSG91 / Firebase / Twilio Verify etc.)
    setTimeout(() => setSendingOtp(false), 900);
  }

  function verifyOtp() {
    // TODO: replace with real OTP verification call
    if (data.otp.trim().length === 4 || data.otp.trim().length === 6) {
      update("otpVerified", true);
    } else {
      setErrors((e) => ({ ...e, otp: "Enter the OTP sent to your phone." }));
    }
  }

  function checkCaptcha(value: string) {
    setCaptchaAnswer(value);
    setCaptchaSolved(Number(value) === captcha.result);
    setErrors((e) => ({ ...e, captcha: "" }));
  }

  function refreshCaptcha() {
    setCaptcha(makeCaptcha());
    setCaptchaAnswer("");
    setCaptchaSolved(false);
  }

  async function finishSetup() {
    if (!validatePhase(5)) return;
    setSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setSubmitting(false);
    }
  }

  const progress = useMemo(() => phase * 20, [phase]);
  const current = PHASES[phase - 1];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c1912]/70 backdrop-blur-sm p-4">
      <div className="relative flex w-full max-w-3xl overflow-hidden rounded-2xl bg-[#f6f3ea] shadow-2xl">
        <button
          onClick={onClose}
          aria-label="Close registration"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-[#10241a] hover:bg-white"
        >
          ✕
        </button>

        <aside className="hidden w-72 shrink-0 flex-col justify-between bg-[#0c1912] p-8 text-[#f6f3ea] sm:flex">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#a6ff3c] px-3 py-1 font-mono text-xs font-bold uppercase tracking-wide text-[#0c1912]">
              Phase {phase}/5
            </span>
            <h2 className="mt-5 font-[600] text-2xl leading-tight" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
              {current.title}
            </h2>
            <p className="mt-2 text-sm text-[#c9d6cd]">{current.desc}</p>

            <p className="mt-8 text-xs font-bold uppercase tracking-widest text-[#a6ff3c]">Checklist</p>
            <ul className="mt-3 space-y-2 text-sm text-[#c9d6cd]">
              {CHECKLISTS[phase].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 text-[#a6ff3c]">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#c9d6cd]">
              Progress <span className="float-right text-[#ffb020]">{progress}%</span>
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#a6ff3c] to-[#ffb020] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </aside>

        <div className="flex max-h-[90vh] w-full flex-col overflow-y-auto p-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#ffb020]">Registration Phase</p>
          <div className="mt-2 h-px w-10 bg-[#ffb020]" />

          <div className="mt-6 flex-1 space-y-4">
            {phase === 1 && (
              <>
                <div className="flex gap-2">
                  <Field
                    icon="📱"
                    placeholder="Phone Number"
                    value={data.phone}
                    onChange={(v) => update("phone", v.replace(/\D/g, "").slice(0, 10))}
                    error={errors.phone}
                  />
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={sendingOtp || data.otpVerified}
                    className="h-[52px] shrink-0 rounded-xl bg-[#0c1912] px-5 text-sm font-bold text-[#a6ff3c] disabled:opacity-50"
                  >
                    {data.otpVerified ? "Sent" : sendingOtp ? "…" : "OTP"}
                  </button>
                </div>

                {!data.otpVerified && (
                  <div className="flex gap-2">
                    <Field
                      icon="🔑"
                      placeholder="Enter OTP"
                      value={data.otp}
                      onChange={(v) => update("otp", v.replace(/\D/g, "").slice(0, 6))}
                      error={errors.otp}
                    />
                    <button
                      type="button"
                      onClick={verifyOtp}
                      className="h-[52px] shrink-0 rounded-xl border border-[#0c1912] px-5 text-sm font-bold text-[#0c1912]"
                    >
                      Verify
                    </button>
                  </div>
                )}
                {data.otpVerified && <p className="text-sm font-semibold text-[#3f7d3f]">✓ Phone number verified</p>}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    icon="🏟️"
                    placeholder="Venue / Business Display Name"
                    value={data.businessName}
                    onChange={(v) => update("businessName", v)}
                    error={errors.businessName}
                  />
                  <Field
                    icon="👤"
                    placeholder="Owner Name"
                    value={data.ownerName}
                    onChange={(v) => update("ownerName", v)}
                    error={errors.ownerName}
                  />
                </div>

                <Field
                  icon="✉️"
                  placeholder="Business / Personal Email"
                  value={data.email}
                  onChange={(v) => update("email", v)}
                  error={errors.email}
                />

                <div>
                  <div className="flex items-center gap-2 rounded-xl border border-[#e4ded0] bg-white px-4 py-3">
                    <span>🏢</span>
                    <select
                      value={data.venueType}
                      onChange={(e) => update("venueType", e.target.value as VenueType)}
                      className="w-full bg-transparent text-sm text-[#10241a] outline-none"
                    >
                      {VENUE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {phase === 2 && (
              <>
                <PasswordField
                  placeholder="Create Strong Password"
                  value={data.password}
                  onChange={(v) => update("password", v)}
                  show={showPassword}
                  toggle={() => setShowPassword((s) => !s)}
                  error={errors.password}
                />
                <PasswordField
                  placeholder="Confirm Password"
                  value={data.confirmPassword}
                  onChange={(v) => update("confirmPassword", v)}
                  show={showConfirm}
                  toggle={() => setShowConfirm((s) => !s)}
                  error={errors.confirmPassword}
                />
                <p className="text-xs text-[#3f5449]">
                  Use at least 8 characters with a mix of letters, numbers, and symbols.
                </p>
              </>
            )}

            {phase === 3 && (
              <>
                <Field
                  icon="🏦"
                  placeholder="Bank Account Number"
                  value={data.accountNumber}
                  onChange={(v) => update("accountNumber", v.replace(/\D/g, "").slice(0, 18))}
                  error={errors.accountNumber}
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    icon="🔤"
                    placeholder="IFSC Code"
                    value={data.ifscCode}
                    onChange={(v) => update("ifscCode", v.toUpperCase().slice(0, 11))}
                    error={errors.ifscCode}
                    mono
                  />
                  <Field
                    icon="👤"
                    placeholder="Account Holder Name"
                    value={data.accountHolderName}
                    onChange={(v) => update("accountHolderName", v)}
                    error={errors.accountHolderName}
                  />
                </div>
              </>
            )}

            {phase === 4 && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <div className="flex items-center gap-2 rounded-xl border border-[#e4ded0] bg-white px-4 py-3">
                      <span>📍</span>
                      <select
                        value={data.state}
                        onChange={(e) => update("state", e.target.value)}
                        className="w-full bg-transparent text-sm text-[#10241a] outline-none"
                      >
                        <option value="">Select State</option>
                        {INDIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.state && <p className="mt-1 text-xs text-red-600">{errors.state}</p>}
                  </div>
                  <Field icon="🏙️" placeholder="City" value={data.city} onChange={(v) => update("city", v)} error={errors.city} />
                </div>
                <Field
                  icon="🔢"
                  placeholder="Pincode"
                  value={data.pincode}
                  onChange={(v) => update("pincode", v.replace(/\D/g, "").slice(0, 6))}
                  error={errors.pincode}
                  mono
                />
              </>
            )}

            {phase === 5 && (
              <>
                <div className="rounded-xl border border-[#e4ded0] bg-white p-5">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <ReviewItem label="Business Name" value={data.businessName} />
                    <ReviewItem label="Owner Name" value={data.ownerName} />
                    <ReviewItem label="Email Address" value={data.email} />
                    <ReviewItem label="Phone Number" value={data.phone} />
                    <ReviewItem label="Venue Type" value={data.venueType} />
                    <ReviewItem label="City / State" value={`${data.city}, ${data.state}`} />
                  </div>
                </div>

                <div className="rounded-xl border border-dashed border-[#e4ded0] p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#3f5449]">Security Challenge</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="rounded-lg bg-[#f1f5e8] px-4 py-2 font-mono text-lg font-bold text-[#0c1912]">
                      {captcha.a} + {captcha.b}
                    </span>
                    <span className="text-lg">=</span>
                    <input
                      value={captchaAnswer}
                      onChange={(e) => checkCaptcha(e.target.value.replace(/\D/g, ""))}
                      className="h-12 w-20 rounded-lg border border-[#e4ded0] text-center font-mono text-lg outline-none focus:border-[#a6ff3c]"
                      placeholder="?"
                    />
                    <button
                      type="button"
                      onClick={refreshCaptcha}
                      className="rounded-lg border border-[#e4ded0] px-3 py-2 text-sm"
                      aria-label="Refresh puzzle"
                    >
                      ↻
                    </button>
                    {captchaSolved && <span className="text-sm font-semibold text-[#3f7d3f]">✓ Verified</span>}
                  </div>
                  {errors.captcha && <p className="mt-2 text-xs text-red-600">{errors.captcha}</p>}
                </div>

                <label className="flex items-start gap-3 rounded-xl border border-[#e4ded0] p-4 text-sm text-[#10241a]">
                  <input
                    type="checkbox"
                    checked={data.acceptedTerms}
                    onChange={(e) => update("acceptedTerms", e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#a6ff3c]"
                  />
                  <span>
                    I accept the{" "}
                    <a className="font-semibold text-[#0c1912] underline" href="/vendor-terms">
                      Vendor Terms &amp; Conditions
                    </a>
                    . I certify all venue data provided is accurate.
                  </span>
                </label>
                {errors.acceptedTerms && <p className="text-xs text-red-600">{errors.acceptedTerms}</p>}
              </>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between border-t border-[#e4ded0] pt-6">
            {phase > 1 ? (
              <button onClick={back} className="text-sm font-bold text-[#10241a]">
                ← Back
              </button>
            ) : (
              <span />
            )}

            {phase < 5 ? (
              <button
                onClick={next}
                className="rounded-full bg-[#0c1912] px-6 py-3 text-sm font-bold text-[#a6ff3c] transition hover:opacity-90"
              >
                Next Phase →
              </button>
            ) : (
              <button
                onClick={finishSetup}
                disabled={submitting}
                className="rounded-full bg-[#a6ff3c] px-6 py-3 text-sm font-bold text-[#0c1912] transition hover:opacity-90 disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "✓ Finish Setup"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  placeholder,
  value,
  onChange,
  error,
  mono,
}: {
  icon: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  mono?: boolean;
}) {
  return (
    <div className="w-full">
      <div
        className={`flex items-center gap-2 rounded-xl border bg-white px-4 py-3 ${
          error ? "border-red-400" : "border-[#e4ded0]"
        }`}
      >
        <span>{icon}</span>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-transparent text-sm text-[#10241a] outline-none placeholder:text-[#9aa79e] ${
            mono ? "font-mono" : ""
          }`}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function PasswordField({
  placeholder,
  value,
  onChange,
  show,
  toggle,
  error,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  toggle: () => void;
  error?: string;
}) {
  return (
    <div className="w-full">
      <div className={`flex items-center gap-2 rounded-xl border bg-white px-4 py-3 ${error ? "border-red-400" : "border-[#e4ded0]"}`}>
        <span>🔒</span>
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-[#10241a] outline-none placeholder:text-[#9aa79e]"
        />
        <button type="button" onClick={toggle} className="text-xs font-bold uppercase text-[#3f5449]">
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-[#9aa79e]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#10241a]">{value || "—"}</p>
    </div>
  );
}
