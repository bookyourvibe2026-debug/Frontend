"use client";

import { useState } from "react";
import Link from "next/link";
import VendorRegistrationModal from "@/components/vendor/VendorRegistrationModal";
import type { RegistrationFormData } from "@/components/vendor/types";

const FEATURES = [
  { icon: "📅", title: "Slot-Based Booking", desc: "Let players book hourly slots on your turf, court, or arena in real time." },
  { icon: "🏆", title: "Tournament Hosting", desc: "Publish and manage tournaments, leagues, and private matches." },
  { icon: "🎫", title: "Walk-in Ticketing", desc: "Sell counter bookings alongside your online slots, in sync." },
  { icon: "📷", title: "QR Check-In", desc: "Scan players in at the gate with instant QR verification." },
  { icon: "💳", title: "Instant Payouts", desc: "Fast, secure settlements straight to your bank account." },
  { icon: "📈", title: "Revenue Insights", desc: "Track peak hours, occupancy, and earnings from one dashboard." },
];

const CATEGORIES = [
  { icon: "⚽", title: "Turf & Sports Grounds", desc: "Football, cricket, and multi-sport turfs across India." },
  { icon: "🏏", title: "Box Cricket Arenas", desc: "Indoor and outdoor box cricket venues." },
  { icon: "🎮", title: "Gaming Zones", desc: "PS5 lounges, VR arenas, and eSports cafes." },
  { icon: "🎳", title: "Bowling & Skating", desc: "Bowling alleys and skating rinks for all ages." },
  { icon: "🏸", title: "Court Sports", desc: "Badminton, pickleball, and table tennis courts." },
  { icon: "🔑", title: "Escape Rooms", desc: "Themed escape rooms and puzzle experiences." },
];

const WHO_CAN_REGISTER = [
  "Turf & football ground owners",
  "Box cricket arena operators",
  "Badminton / pickleball court owners",
  "Gaming zone & PS5 lounge owners",
  "Bowling alley operators",
  "Skating rink owners",
  "Escape room hosts",
  "Tournament & league organizers",
];

const STEPS = [
  { n: 1, title: "Register Your Venue", desc: "Create your vendor account and complete your venue profile." },
  { n: 2, title: "Add Your Slots", desc: "List your turf, court, or arena with pricing and availability." },
  { n: 3, title: "Receive Bookings", desc: "Players discover and book your venue directly on the platform." },
  { n: 4, title: "Earn & Grow", desc: "Host great sessions, get rated, and grow your bookings." },
];

const FAQS = [
  { q: "Is vendor registration free on Book Your Vibes?", a: "Yes, venue owners across India can register and list their venues at no upfront cost." },
  { q: "What kinds of venues are supported?", a: "Turfs, box cricket arenas, gaming zones, bowling alleys, skating rinks, court sports, and more." },
  { q: "How are payouts handled?", a: "All payments are processed securely through Book Your Vibes and settled directly to your bank account." },
  { q: "Can I list multiple venues or slots?", a: "Yes, you get full control to list multiple venues, courts, and custom time slots." },
];

export default function VendorRegisterPage() {
  const [modalOpen, setModalOpen] = useState(false);

  async function handleSubmit(data: RegistrationFormData) {
    // TODO: replace with your real API call, e.g.
    // await fetch("/api/vendor/register", { method: "POST", body: JSON.stringify(data) });
    console.log("Vendor registration submitted:", data);
    setModalOpen(false);
  }

  return (
    <main className="min-h-screen bg-[#f6f3ea] text-[#10241a]">
      <header className="flex items-center justify-between px-6 py-4 sm:px-12">
        <div className="flex items-center gap-2 font-[600] text-lg" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0c1912] text-[#a6ff3c]">BYV</span>
          Book Your Vibes
        </div>
        <nav className="hidden items-center gap-8 text-sm font-semibold sm:flex">
          <a href="#categories">Venues</a>
          <a href="#how-it-works">How it Works</a>
          <a href="#faq">FAQ</a>
        </nav>
        <Link
          href="/vendor/login"
          className="rounded-full border border-[#0c1912] px-5 py-2 text-sm font-bold hover:bg-[#0c1912] hover:text-[#a6ff3c]"
        >
          Login Account
        </Link>
      </header>

      <section className="mx-6 overflow-hidden rounded-3xl bg-[#0c1912] px-6 py-16 text-center text-[#f6f3ea] sm:mx-12 sm:px-12">
        <span className="inline-block rounded-full bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-[#a6ff3c]">
          Trusted by venue owners across India
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-[600] leading-tight sm:text-5xl" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
          Become a Game-Day Partner with <span className="text-[#a6ff3c]">Book Your Vibes</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-[#c9d6cd]">
          List your turf, court, or arena and reach players looking for their next game across India.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/vendor/login"
            className="rounded-full border border-white/30 px-6 py-3 text-sm font-bold text-[#f6f3ea]"
          >
            Login Account
          </Link>
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-full bg-[#a6ff3c] px-6 py-3 text-sm font-bold text-[#0c1912] hover:opacity-90"
          >
            Register as Partner
          </button>
        </div>

        <p className="mt-4 text-xs text-[#c9d6cd]">
          Already have demo access? Use{" "}
          <Link href="/vendor/login" className="font-bold text-[#a6ff3c] underline">
            vendor login
          </Link>{" "}
          with <span className="font-mono">vendor@bookyourvibes.com</span> /{" "}
          <span className="font-mono">ByvDemo@123</span>.
        </p>

        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4">
          {["⚽ Turfs", "🎮 Gaming Zones", "🏏 Box Cricket", "🏸 Court Sports"].map((t) => (
            <div key={t} className="rounded-xl bg-white/5 py-4 text-sm font-semibold">
              {t}
            </div>
          ))}
        </div>
      </section>

      <section id="categories" className="px-6 py-20 sm:px-12">
        <h2 className="text-center text-3xl font-[600]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
          India&apos;s Trusted <span className="text-[#3f7d3f]">Game & Sports</span> Marketplace
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-center text-[#3f5449]">
          Join hundreds of venue owners who trust Book Your Vibes to reach thousands of players every week.
        </p>
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          {CATEGORIES.map((c) => (
            <div key={c.title} className="rounded-2xl border border-[#e4ded0] bg-white p-6">
              <span className="text-2xl">{c.icon}</span>
              <h3 className="mt-3 font-bold">{c.title}</h3>
              <p className="mt-1 text-sm text-[#3f5449]">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#eef2e4] px-6 py-20 sm:px-12">
        <h2 className="text-center text-3xl font-[600]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
          Why Partner With <span className="text-[#3f7d3f]">BYV</span>?
        </h2>
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl bg-white p-6">
              <span className="text-2xl">{f.icon}</span>
              <h3 className="mt-3 font-bold">{f.title}</h3>
              <p className="mt-1 text-sm text-[#3f5449]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20 sm:px-12">
        <h2 className="text-center text-3xl font-[600]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
          Who Can Register?
        </h2>
        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
          {WHO_CAN_REGISTER.map((w) => (
            <div key={w} className="flex items-center gap-2 rounded-xl border border-[#e4ded0] bg-white px-4 py-3 text-sm font-semibold">
              <span className="text-[#3f7d3f]">✓</span> {w}
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-[#eef2e4] px-6 py-20 sm:px-12">
        <h2 className="text-center text-3xl font-[600]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
          How Book Your Vibes Works
        </h2>
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#0c1912] font-mono font-bold text-[#a6ff3c]">
                {s.n}
              </div>
              <h3 className="mt-3 font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-[#3f5449]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="px-6 py-20 sm:px-12">
        <h2 className="text-center text-3xl font-[600]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
          Common Inquiries
        </h2>
        <div className="mx-auto mt-10 max-w-2xl space-y-4">
          {FAQS.map((f) => (
            <details key={f.q} className="rounded-xl border border-[#e4ded0] bg-white p-5">
              <summary className="cursor-pointer font-bold">{f.q}</summary>
              <p className="mt-2 text-sm text-[#3f5449]">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-6 mb-12 rounded-3xl bg-[#0c1912] px-6 py-16 text-center text-[#f6f3ea] sm:mx-12 sm:px-12">
        <h2 className="text-3xl font-[600]" style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}>
          Scale Your Venue <span className="text-[#a6ff3c]">Nationwide</span>
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-[#c9d6cd]">
          Register today and start receiving high-quality bookings within 48 hours.
        </p>
        <button
          onClick={() => setModalOpen(true)}
          className="mt-8 rounded-full bg-[#a6ff3c] px-8 py-3 text-sm font-bold text-[#0c1912] hover:opacity-90"
        >
          Complete the Form Above to Start
        </button>
      </section>

      <VendorRegistrationModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} />
    </main>
  );
}
