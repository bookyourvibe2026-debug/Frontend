import Link from "next/link";

export default function VendorForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-[#f6f3ea] px-6 py-12 text-[#10241a] sm:px-12">
      <div className="mx-auto max-w-xl rounded-3xl border border-[#e4ded0] bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#3f7d3f]">Vendor Access</p>
        <h1 className="mt-3 text-3xl font-bold" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
          Reset your partner password
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#3f5449]">
          This placeholder page is here so the login screen does not lead to a dead end. Wire your password reset flow here when you are ready.
        </p>

        <div className="mt-8 rounded-2xl bg-[#eef2e4] p-5 text-sm text-[#3f5449]">
          <p className="font-semibold text-[#10241a]">Next step</p>
          <p className="mt-1">Hook this page to your OTP or email reset endpoint and redirect users back to /vendor/login.</p>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <Link href="/vendor/login" className="rounded-full bg-[#0c1912] px-5 py-3 text-sm font-bold text-[#a6ff3c]">
            Back to login
          </Link>
          <Link href="/vendor/register" className="rounded-full border border-[#0c1912] px-5 py-3 text-sm font-bold text-[#0c1912]">
            Register instead
          </Link>
        </div>
      </div>
    </main>
  );
}
