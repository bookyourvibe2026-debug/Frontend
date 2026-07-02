import { ReactNode } from "react";

export function SectionCard({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl2 border border-surface-border bg-surface-card shadow-panel ${className}`}>
      <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 sm:pt-6 pb-4">
        <div>
          <h3 className="font-display font-semibold text-ink text-base">{title}</h3>
          {description && (
            <p className="text-xs text-ink-faint mt-0.5">{description}</p>
          )}
        </div>
        {action}
      </div>
      <div className="px-5 sm:px-6 pb-6">{children}</div>
    </div>
  );
}

type BadgeTone = "success" | "pending" | "danger" | "neutral" | "info";

const TONE_STYLES: Record<BadgeTone, string> = {
  success: "bg-lime-100 text-vibe-limeDark",
  pending: "bg-amber-100 text-vibe-amber",
  danger: "bg-rose-100 text-vibe-coral",
  neutral: "bg-cream-300 text-ink-soft",
  info: "bg-vibe-violet/10 text-vibe-violet",
};

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${TONE_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}

export function PageHero({
  eyebrow,
  title,
  description,
  right,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  right?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl2 bg-gradient-to-br from-vibe-indigo via-vibe-violet to-vibe-violetSoft px-6 sm:px-8 py-7 sm:py-8 text-white shadow-pop">
      <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-vibe-lime/20 blur-3xl" />
      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold tracking-wide uppercase">
            {eyebrow}
          </span>
          <h1 className="mt-3 font-display text-2xl sm:text-3xl font-semibold">{title}</h1>
          {description && (
            <p className="mt-2 text-sm text-white/80 max-w-xl">{description}</p>
          )}
        </div>
        {right && <div className="flex flex-wrap gap-3">{right}</div>}
      </div>
    </div>
  );
}
