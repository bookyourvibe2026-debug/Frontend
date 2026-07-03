"use client";

import { useState } from "react";
import { Building2, Footprints, Sandwich, type LucideIcon } from "lucide-react";
import type { Role } from "../types";
import { GhostButton, PrimaryButton } from "../ui";
import { FieldLabel, inputClass, ModalShell } from "./ModalShell";

const ROLE_OPTIONS: { id: Role; label: string; icon: LucideIcon; desc: string }[] = [
  { id: "player", label: "Player", icon: Footprints, desc: "Book venues, join matches & events" },
  { id: "owner", label: "Venue Owner", icon: Building2, desc: "List your venue, manage bookings" },
  { id: "food", label: "Food Owner", icon: Sandwich, desc: "Manage menu, orders & billing" },
];

export function SignupModal({
  onClose,
  onSignupSuccess,
  onSwitchToLogin,
}: {
  onClose: () => void;
  onSignupSuccess: (name: string, role: Role) => void;
  onSwitchToLogin: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>("player");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [emailVal, setEmailVal] = useState("");
  const [password, setPassword] = useState("");
  // owner / food owner extra fields
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("Udaipur");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");

  const handleNext = () => {
    if (!role) {
      setError("Please choose a role to continue.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || mobile.replace(/\D/g, "").length !== 10 || !emailVal || !password) {
      setError("Please fill all required fields correctly.");
      return;
    }
    if ((role === "owner" || role === "food") && !businessName) {
      setError("Business / venue name is required for owner accounts.");
      return;
    }
    if (!agree) {
      setError("Please accept the Terms & Privacy Policy to continue.");
      return;
    }
    setError("");
    // TODO: call /api/auth/signup with { role, fullName, mobile, emailVal, password, businessName, city }
    onSignupSuccess(fullName.split(" ")[0], role);
  };

  return (
    <ModalShell
      onClose={onClose}
      title={step === 1 ? "Create your account" : "Just a few details"}
      subtitle={
        step === 1
          ? "Choose how you'll use Book Your Vibe."
          : `Signing up as ${ROLE_OPTIONS.find((r) => r.id === role)?.label}.`
      }
    >
      {step === 1 ? (
        <div className="flex flex-col gap-3">
          {ROLE_OPTIONS.map((r) => (
            <button
              key={r.id}
              onClick={() => setRole(r.id)}
              className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${
                role === r.id
                  ? "border-orange-500 bg-orange-50"
                  : "border-slate-100 hover:border-orange-200"
              }`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-orange-500 shadow">
                <r.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900">{r.label}</p>
                <p className="text-xs text-slate-500">{r.desc}</p>
              </div>
              <span
                className={`ml-auto h-5 w-5 rounded-full border-2 ${
                  role === r.id ? "border-orange-500 bg-orange-500" : "border-slate-300"
                }`}
              />
            </button>
          ))}

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

          <PrimaryButton onClick={handleNext} className="mt-2 w-full">
            Continue
          </PrimaryButton>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <button onClick={onSwitchToLogin} className="font-semibold text-orange-600">
              Log in
            </button>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <FieldLabel>Full Name</FieldLabel>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Yashank Rajawat"
              className={inputClass}
            />
          </div>

          {(role === "owner" || role === "food") && (
            <div>
              <FieldLabel>
                {role === "owner" ? "Venue / Business Name" : "Food Outlet Name"}
              </FieldLabel>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={role === "owner" ? "Cricket Arena" : "Vibe Cafe"}
                className={inputClass}
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Mobile Number</FieldLabel>
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                maxLength={10}
                placeholder="98765 43210"
                className={inputClass}
              />
            </div>
            <div>
              <FieldLabel>City</FieldLabel>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={inputClass}
              >
                {["Udaipur", "Jaipur", "Ahmedabad", "Delhi", "Mumbai", "Bangalore"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

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
              placeholder="Create a strong password"
              className={inputClass}
            />
          </div>

          <label className="flex items-start gap-2 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5"
            />
            I agree to the <span className="font-semibold text-orange-600">Terms & Conditions</span>{" "}
            and <span className="font-semibold text-orange-600">Privacy Policy</span>.
          </label>

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

          <div className="flex flex-col gap-3 sm:flex-row">
            <GhostButton onClick={() => setStep(1)} className="flex-1">
              Back
            </GhostButton>
            <PrimaryButton type="submit" className="flex-1">
              Create Account
            </PrimaryButton>
          </div>
        </form>
      )}
    </ModalShell>
  );
}
