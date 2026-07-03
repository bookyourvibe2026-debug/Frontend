import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, MessageSquareMore, Percent, Store, Trophy } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { buildWhatsAppLink, WHATSAPP_DISPLAY } from "@/lib/contact";
import { FOOTER_COLUMNS } from "./data";
import type { FooterLink } from "./types";

const FOOTER_WHATSAPP_MESSAGE =
  "Hello Book Your Vibe team, I'd like to know more about booking a venue.";

const FOOTER_QUICK_LINKS: FooterLink[] = [
  { label: "Community", href: "/community", icon: <MessageSquareMore className="h-4 w-4" /> },
  { label: "Offers", href: "/offers", icon: <Percent className="h-4 w-4" /> },
  { label: "Tournaments", href: "/tournaments", icon: <Trophy className="h-4 w-4" /> },
  { label: "Vendor", href: "/vendor", icon: <Store className="h-4 w-4" /> },
];

function FooterLinkItem({ link }: { link: FooterLink }) {
  const className =
    "group inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white";
  const icon = link.icon ?? <ArrowUpRight className="h-3.5 w-3.5 text-orange-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />;

  if (link.href.startsWith("http") || link.href.startsWith("mailto:") || link.href.startsWith("tel:")) {
    return (
      <a href={link.href} className={className}>
        <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
        <span>{link.label}</span>
      </a>
    );
  }

  return (
    <Link href={link.href} className={className}>
      <span className="flex h-4 w-4 items-center justify-center">{icon}</span>
      <span>{link.label}</span>
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="relative mt-20 overflow-hidden border-t border-white/10 bg-[#060a15] text-slate-300">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-0 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="absolute right-0 top-24 h-72 w-72 translate-x-1/3 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      {/* Mobile footer — compact app-shell variant */}
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:hidden">
        <div className="flex flex-col items-center gap-3 text-center">
          <BrandLogo
            className="inline-flex"
            boxClassName="border-white/10 bg-white/5 shadow-none"
            logoBoxClassName="h-14 w-14 rounded-2xl"
            imageClassName="p-1.5"
            showText={false}
          />
          <p className="max-w-xs text-sm leading-6 text-slate-400">
            Discover curated venues, book real slots, and keep your game moving across the city.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2.5 text-sm text-slate-400">
          <a href="mailto:info@bookyourvibe.in" className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-orange-300">
              <Mail className="h-4 w-4" />
            </span>
            <span className="truncate">info@bookyourvibe.in</span>
          </a>
          <a href={buildWhatsAppLink(FOOTER_WHATSAPP_MESSAGE)} target="_blank" rel="noreferrer" className="flex items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-emerald-400">
              <WhatsAppIcon className="h-4 w-4" />
            </span>
            <span className="truncate">{WHATSAPP_DISPLAY} (WhatsApp)</span>
          </a>
          <a
            href="https://www.google.com/maps/search/Udaipur,+Rajasthan,+India"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-orange-300">
              <MapPin className="h-4 w-4" />
            </span>
            <span className="truncate">Udaipur, Rajasthan, India</span>
          </a>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-6 border-t border-white/10 pt-6">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="space-y-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white">{col.title}</p>
              <ul className="space-y-2">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-xs text-slate-400">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-7 flex flex-col items-center gap-4 border-t border-white/10 pt-6">
          <div className="flex items-center gap-3">
            {FOOTER_QUICK_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                aria-label={link.label}
                title={link.label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300"
              >
                {link.icon}
              </Link>
            ))}
          </div>
          <p className="text-[11px] tracking-[0.12em] text-slate-500">
            © 2025 Book Your Vibe. All rights reserved.
          </p>
        </div>
      </div>

      {/* Desktop / tablet footer */}
      <div className="relative mx-auto hidden max-w-7xl px-4 py-10 sm:block sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <BrandLogo
              className="inline-flex"
              boxClassName="border-white/10 bg-white/5 shadow-none"
              logoBoxClassName="h-20 w-20 rounded-2xl sm:h-24 sm:w-24"
              imageClassName="p-2"
              showText={false}
            />

            <p className="max-w-md text-sm leading-6 text-slate-400 sm:text-base">
              Discover curated venues, book real slots, and keep your game moving across the city.
            </p>

            <div className="space-y-2.5 text-sm text-slate-400">
              <a href="mailto:info@bookyourvibe.in" className="flex items-center gap-3 transition hover:text-white">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-orange-300">
                  <Mail className="h-4 w-4" />
                </span>
                <span>info@bookyourvibe.in</span>
              </a>
              <a
                href={buildWhatsAppLink(FOOTER_WHATSAPP_MESSAGE)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 transition hover:text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-emerald-400">
                  <WhatsAppIcon className="h-4 w-4" />
                </span>
                <span>{WHATSAPP_DISPLAY} (WhatsApp)</span>
              </a>
              <a
                href="https://www.google.com/maps/search/Udaipur,+Rajasthan,+India"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 transition hover:text-white"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-orange-300">
                  <MapPin className="h-4 w-4" />
                </span>
                <span>Udaipur, Rajasthan, India</span>
              </a>
            </div>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title} className="space-y-4">
              <p className="text-sm font-bold uppercase tracking-[0.26em] text-white">{col.title}</p>
              <ul className="space-y-2.5">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <FooterLinkItem link={item} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-5 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs tracking-[0.16em] text-slate-500">
            © 2025 Book Your Vibe. All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            {FOOTER_QUICK_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                aria-label={link.label}
                title={link.label}
                className="group flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:-translate-y-0.5 hover:border-orange-400/30 hover:bg-orange-500/10 hover:text-white"
              >
                {link.icon}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
