"use client";

import { Activity, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/vendor/ui";
import { systemHealthSnapshot } from "@/lib/admin-mock-data";

export default function SystemHealthPage() {
  const s = systemHealthSnapshot;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
          <Activity size={20} className="text-vibe-violet" /> System Health
        </h1>
        <p className="mt-0.5 text-xs text-ink-faint">Monitor API and service endpoints status.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-surface-border bg-white p-5 shadow-panel">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-100 text-vibe-limeDark">
            <CheckCircle2 size={18} />
          </span>
          <div>
            <p className="font-semibold text-ink">{s.serviceName}</p>
            <p className="text-xs text-ink-faint">Main Service</p>
          </div>
        </div>
        <Badge tone="success">{s.status}</Badge>
        <div className="text-xs text-ink-faint">
          <p className="uppercase tracking-wide">Timestamp</p>
          <p className="font-semibold text-ink">{s.timestamp}</p>
        </div>
        <div className="text-xs text-ink-faint">
          <p className="uppercase tracking-wide">Base URL</p>
          <p className="font-semibold text-ink">{s.baseUrl}</p>
        </div>
      </div>

      <div>
        <p className="mb-3 font-display font-semibold text-ink">Performance Management</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatTile label="Avg Response Time" value={`${s.avgResponseTime}ms`} hint="All endpoints" />
          <StatTile label="Fastest Endpoint" value={`${s.fastestEndpoint.ms}ms`} hint={s.fastestEndpoint.name} tone="green" />
          <StatTile label="Slowest Endpoint" value={`${s.slowestEndpoint.ms}ms`} hint={s.slowestEndpoint.name} tone="amber" />
          <StatTile label="Slow APIs" value={String(s.slowApisOver1000ms)} hint="Over 1000ms" />
        </div>
      </div>

      <div>
        <p className="mb-3 font-display font-semibold text-ink">Endpoint Status</p>
        <div className="space-y-4">
          {s.endpoints.map((e) => (
            <div key={e.name} className="rounded-xl2 border border-surface-border bg-white p-5 shadow-panel">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-vibe-limeDark" />
                  <div>
                    <p className="font-semibold text-ink">{e.name}</p>
                    <p className="text-xs text-ink-faint">{e.url}</p>
                  </div>
                </div>
                <Badge tone="success">{e.statusCode}</Badge>
              </div>
              <p className="mt-2 text-xs text-ink-faint">⏱ {e.ms}ms</p>
              <p className="mb-1 mt-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Response</p>
              <pre className="overflow-x-auto rounded-lg bg-cream-200/60 p-3 text-xs text-ink-soft">
                {JSON.stringify(e.response, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, hint, tone = "default" }: { label: string; value: string; hint: string; tone?: string }) {
  return (
    <div className="rounded-xl2 border border-surface-border bg-white p-4 shadow-panel">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold ${tone === "green" ? "text-vibe-limeDark" : tone === "amber" ? "text-vibe-amber" : "text-ink"}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-ink-faint">{hint}</p>
    </div>
  );
}
