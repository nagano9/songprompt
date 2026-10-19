"use client";

import * as React from "react";
import { Settings, Sliders, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MODEL_OPTIONS } from "@/lib/llm/anthropic";
import { PLATFORM_PROFILES, resolveProfile, type LimitKey } from "@/lib/prompt/platforms";
import { useSettingsStore } from "@/store/settings-store";

const LIMIT_LABEL: Record<LimitKey, string> = {
  style: "Style (Prompt)",
  exclude: "Exclude Styles",
  prompt: "Prompt",
  brief: "Music Brief",
  lyrics: "Lirik",
};

const LIMIT_KEYS_BY_PLATFORM = {
  suno: ["style", "exclude", "lyrics"],
  udio: ["prompt", "lyrics"],
  generic: ["brief", "lyrics"],
} as const;

function OutputLimitSettings() {
  const maxPromptLength = useSettingsStore((s) => s.maxPromptLength);
  const autoTrimPrompt = useSettingsStore((s) => s.autoTrimPrompt);
  const setMaxPromptLength = useSettingsStore((s) => s.setMaxPromptLength);
  const setAutoTrimPrompt = useSettingsStore((s) => s.setAutoTrimPrompt);
  const setAllProfilesTo1000 = useSettingsStore((s) => s.setAllProfilesTo1000);
  const [copiedSuccess, setCopiedSuccess] = React.useState(false);

  const presets = [
    { label: "1000 Karakter (Standar)", value: 1000 },
    { label: "500 Karakter (Ringkas)", value: 500 },
    { label: "1500 Karakter (Ekstra)", value: 1500 },
    { label: "2000 Karakter (Maksimum)", value: 2000 },
  ];

  const handleResetTo1000 = () => {
    setAllProfilesTo1000();
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  return (
    <div className="space-y-3 rounded-sm border border-accent/40 bg-accent/10 p-3.5">
      <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase text-foreground">
              Batas Maksimal Output Prompt
            </span>
            <span className="rounded-xs bg-primary/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
              Maks {maxPromptLength} Karakter
            </span>
          </div>
          <p className="text-[11.5px] text-muted-foreground">
            Batas karakter target untuk prompt utama (Style Suno, Prompt Udio, atau Brief).
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 shrink-0 font-mono text-[11px]"
          onClick={handleResetTo1000}
        >
          {copiedSuccess ? (
            <>
              <Check className="mr-1 h-3 w-3 text-emerald-500" />
              Sudah 1000
            </>
          ) : (
            <>
              <RefreshCw className="mr-1 h-3 w-3" />
              Set Semua ke 1000
            </>
          )}
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {presets.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setMaxPromptLength(p.value)}
              className={`rounded-xs px-2.5 py-1 font-mono text-[11px] font-medium transition-colors ${
                maxPromptLength === p.value
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "bg-secondary/70 text-secondary-foreground hover:bg-secondary"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Label htmlFor="custom-max-chars" className="text-xs font-mono text-muted-foreground shrink-0">
            Kustom (angka):
          </Label>
          <Input
            id="custom-max-chars"
            type="number"
            min={50}
            max={5000}
            step={50}
            value={maxPromptLength || ""}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (Number.isFinite(val) && val > 0) setMaxPromptLength(val);
            }}
            className="h-7 w-28 font-mono text-xs"
          />
          <span className="font-mono text-[11px] text-muted-foreground">karakter</span>
        </div>
      </div>

      <div className="flex items-start gap-3 border-t border-border/50 pt-2.5">
        <Switch
          id="auto-trim"
          checked={autoTrimPrompt}
          onCheckedChange={(checked) => setAutoTrimPrompt(checked)}
          className="mt-0.5"
        />
        <div className="space-y-0.5">
          <Label htmlFor="auto-trim" className="text-xs font-semibold cursor-pointer">
            Auto-Trim Cerdas (Pangkas Otomatis agar Tidak Melebihi {maxPromptLength} Karakter)
          </Label>
          <p className="text-[11px] leading-snug text-muted-foreground">
            Bila aktif, sistem akan otomatis memangkas tag berlebih pada batas koma/frasa tanpa memotong kata, memastikan output aman dan tidak ditolak oleh generator AI.
          </p>
        </div>
      </div>
    </div>
  );
}

function ProfileEditor() {
  const overrides = useSettingsStore((s) => s.profileOverrides);
  const setOverride = useSettingsStore((s) => s.setOverride);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-2.5">
      {PLATFORM_PROFILES.map((base) => {
        const p = resolveProfile(base.platform, base.id, overrides);
        const overridden = !!overrides[base.id];
        const keys = (LIMIT_KEYS_BY_PLATFORM[base.platform] ?? ["style", "lyrics"]) as readonly LimitKey[];
        return (
          <div key={base.id} className="space-y-2 rounded-sm border border-border/80 bg-secondary/20 p-3">
            <div className="flex items-baseline justify-between gap-2 border-b border-border/40 pb-1.5">
              <span className="font-mono text-xs font-bold text-foreground uppercase">{base.label}</span>
              <span className="font-mono text-[10.5px] text-muted-foreground">
                {p.verifiedAt ? `diverifikasi ${p.verifiedAt}` : "standar aman 1000 kar"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {keys.map((k) => (
                <label key={k} className="space-y-1">
                  <span className="font-mono text-[10.5px] text-muted-foreground uppercase">{LIMIT_LABEL[k]}</span>
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="h-7 font-mono text-xs"
                    value={p.limits[k] ?? ""}
                    placeholder="1000"
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      setOverride(base.id, { limits: { [k]: Number.isFinite(n) && n > 0 ? n : 0 } });
                    }}
                  />
                </label>
              ))}
            </div>
            <p className="font-mono text-[10.5px] leading-snug text-muted-foreground">{base.source}</p>
            <div className="flex gap-1.5 pt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-6 font-mono text-[11px]"
                onClick={() => setOverride(base.id, { limits: { style: 1000, prompt: 1000, exclude: 1000, brief: 1000, lyrics: 5000 }, verifiedAt: today })}
              >
                Setel ke 1000 Karakter
              </Button>
              {overridden && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-6 font-mono text-[11px] text-muted-foreground"
                  onClick={() => setOverride(base.id, null)}
                >
                  Kembalikan default
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LlmSettings() {
  const { llmEnabled, llmModel, apiKey, rememberKey, setLlm } = useSettingsStore();
  const known = MODEL_OPTIONS.some((m) => m.id === llmModel);

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <Switch id="llm-on" checked={llmEnabled} onCheckedChange={(v) => setLlm({ llmEnabled: v })} className="mt-0.5" />
        <div className="space-y-0.5">
          <Label htmlFor="llm-on" className="text-xs font-semibold">Aktifkan asisten lirik (Claude)</Label>
          <p className="text-[11.5px] text-muted-foreground">
            Menambah tombol “Kritik lirikku” dan “Tulis ulang baris klise” di Lirik workshop. Nonaktif secara default — aplikasi tetap
            berjalan penuh tanpa API apa pun.
          </p>
        </div>
      </div>

      {llmEnabled && (
        <div className="space-y-2.5 rounded-sm border border-border/80 bg-secondary/30 p-3">
          <label className="block space-y-1">
            <span className="font-mono text-xs font-medium uppercase">Model Engine</span>
            <select
              value={known ? llmModel : "__custom"}
              onChange={(e) => setLlm({ llmModel: e.target.value === "__custom" ? "" : e.target.value })}
              className="h-8 w-full rounded-xs border border-input bg-card px-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
              <option value="__custom">ID model lain…</option>
            </select>
            {!known && (
              <Input value={llmModel} onChange={(e) => setLlm({ llmModel: e.target.value.trim() })} placeholder="mis. claude-sonnet-5-5" className="h-7 font-mono text-xs" />
            )}
          </label>

          <label className="block space-y-1">
            <span className="font-mono text-xs font-medium uppercase">API key Anthropic</span>
            <Input
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setLlm({ apiKey: e.target.value })}
              placeholder="sk-ant-…"
              className="font-mono text-xs h-8"
            />
            <span className="block font-mono text-[10.5px] text-muted-foreground">
              Buat di console.anthropic.com. Biaya pemakaian ditagihkan ke akunmu sendiri.
            </span>
          </label>

          <div className="flex items-start gap-2.5 pt-1">
            <Checkbox id="remember" checked={rememberKey} onCheckedChange={(v) => setLlm({ rememberKey: v === true })} className="mt-0.5" />
            <div className="space-y-0.5">
              <Label htmlFor="remember" className="text-xs font-medium">Ingat key di browser ini</Label>
              <p className="text-[10.5px] leading-snug text-muted-foreground">
                Mati: key hanya di memori dan hilang saat tab ditutup (lebih aman). Hidup: disimpan di localStorage — jangan aktifkan di
                komputer bersama.
              </p>
            </div>
          </div>

          <p className="rounded-xs border border-border/60 bg-muted/50 px-2.5 py-1.5 font-mono text-[10.5px] leading-snug text-muted-foreground">
            Lirikmu dikirim langsung dari browser ke API Anthropic — aplikasi ini tidak punya server perantara.
          </p>
        </div>
      )}
    </div>
  );
}

export function SettingsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-7 w-7" aria-label="Pengaturan" title="Pengaturan">
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-sm border-border">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-accent-strong" />
            <DialogTitle className="font-mono text-sm uppercase tracking-wider">Konfigurasi Studio & Batas Output</DialogTitle>
          </div>
          <DialogDescription className="text-xs">Pengaturan tersimpan lokal di browser.</DialogDescription>
        </DialogHeader>

        {/* Output Limit Setting Section */}
        <section className="space-y-2">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Pengaturan Batas Karakter Output
          </h3>
          <OutputLimitSettings />
        </section>

        {/* Platform Profiles Section */}
        <section className="space-y-2 border-t border-border/60 pt-4">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Detail Headroom Profil Platform (Suno, Udio, Generic)
          </h3>
          <p className="text-xs text-muted-foreground">
            Konfigurasi batas karakter per platform. Semua model utama diatur ke standar optimal 1000 karakter untuk Style dan Prompt.
          </p>
          <ProfileEditor />
        </section>

        {/* AI Lyric Assistant Section */}
        <section className="space-y-2 border-t border-border/60 pt-4">
          <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Asisten AI Lirik (Opsional)
          </h3>
          <LlmSettings />
        </section>
      </DialogContent>
    </Dialog>
  );
}
