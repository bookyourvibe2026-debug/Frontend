"use client";

import { useState } from "react";
import { RefreshCw, Save, Smartphone } from "lucide-react";
import { Toast } from "@/components/admin/Toast";
import { getAppVersionConfig, saveAppVersionConfig } from "@/lib/admin-mock-data";
import { AppVersionConfig } from "@/lib/types";

export default function AppVersionPage() {
  const [config, setConfig] = useState(() => getAppVersionConfig());
  const [toast, setToast] = useState<string | null>(null);

  function updatePlatform(platform: "ios" | "android", patch: Partial<AppVersionConfig>) {
    setConfig((c) => ({ ...c, [platform]: { ...c[platform], ...patch } }));
  }

  function handleSave(platform: "ios" | "android") {
    saveAppVersionConfig(config);
    setToast(`${platform === "ios" ? "iOS" : "Android"} version config saved`);
  }

  return (
    <div className="space-y-5">
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl2 p-6 text-white shadow-pop"
        style={{ background: "linear-gradient(120deg, #0c1912 0%, #15101f 60%, #211731 100%)" }}
      >
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wide">
            Release Management
          </span>
          <h1 className="mt-2 flex items-center gap-2 font-display text-xl font-semibold">
            <Smartphone size={18} /> Mobile App Version Control
          </h1>
          <p className="mt-1 max-w-lg text-sm text-white/70">
            Admin panel se iOS aur Android dono app versions, minimum support aur force update rules manage karein.
          </p>
        </div>
        <button
          onClick={() => {
            setConfig(getAppVersionConfig());
            setToast("Config refreshed");
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/20"
        >
          <RefreshCw size={14} /> Refresh Config
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <PlatformCard
          title="iOS Version Control"
          subtitle="App Store listing aur minimum supported iOS build yahan manage karein."
          gradient="from-sky-600 to-cyan-600"
          config={config.ios}
          endpoint="PUT /api/version/admin/ios"
          onChange={(patch) => updatePlatform("ios", patch)}
          onSave={() => handleSave("ios")}
          saveLabel="Save iOS"
        />
        <PlatformCard
          title="Android Version Control"
          subtitle="Play Store release aur forced update threshold yahan update karein."
          gradient="from-emerald-600 to-teal-600"
          config={config.android}
          endpoint="PUT /api/version/admin/android"
          onChange={(patch) => updatePlatform("android", patch)}
          onSave={() => handleSave("android")}
          saveLabel="Save Android"
        />
      </div>

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}

function PlatformCard({
  title,
  subtitle,
  gradient,
  config,
  endpoint,
  onChange,
  onSave,
  saveLabel,
}: {
  title: string;
  subtitle: string;
  gradient: string;
  config: AppVersionConfig;
  endpoint: string;
  onChange: (patch: Partial<AppVersionConfig>) => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-xl2 border border-surface-border bg-white shadow-panel">
      <div className={`bg-gradient-to-r p-5 text-white ${gradient}`}>
        <p className="font-display font-semibold">{title}</p>
        <p className="mt-1 text-xs text-white/80">{subtitle}</p>
      </div>
      <div className="space-y-4 p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Current Version</label>
            <input
              value={config.currentVersion}
              onChange={(e) => onChange({ currentVersion: e.target.value })}
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-vibe-violet"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Min Required Version</label>
            <input
              value={config.minRequiredVersion}
              onChange={(e) => onChange({ minRequiredVersion: e.target.value })}
              className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-vibe-violet"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Download URL</label>
          <input
            value={config.downloadUrl}
            onChange={(e) => onChange({ downloadUrl: e.target.value })}
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-vibe-violet"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Release Notes</label>
          <textarea
            value={config.releaseNotes}
            onChange={(e) => onChange({ releaseNotes: e.target.value })}
            rows={4}
            className="w-full rounded-lg border border-surface-border px-3 py-2 text-sm outline-none focus:border-vibe-violet"
          />
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={config.forceUpdate} onChange={(e) => onChange({ forceUpdate: e.target.checked })} className="mt-1 accent-vibe-violet" />
          <span>
            <span className="font-semibold text-ink">Force Update</span>
            <p className="text-xs text-ink-faint">Enable karne par outdated app versions ko update mandatory dikhaya jayega.</p>
          </span>
        </label>

        <div className="flex items-center justify-between border-t border-surface-border pt-3">
          <p className="text-[11px] text-ink-faint">
            Save karte hi <code className="rounded bg-cream-200 px-1 py-0.5">{endpoint}</code> call trigger hoga.
          </p>
          <button onClick={onSave} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink/85">
            <Save size={14} /> {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
