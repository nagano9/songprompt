"use client";

import * as React from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MODEL_OPTIONS } from "@/lib/llm/anthropic";
import { PLATFORM_PROFILES, resolveProfile, type LimitKey } from "@/lib/prompt/platforms";
import { useSettingsStore } from "@/store/settings-store";

const LIMIT_LABEL: Record<LimitKey, string> = { style: "Style", exclude: "Exclude", prompt: "Prompt", lyrics: "Lirik" };
const LIMIT_KEYS_BY_PLATFORM = { suno: ["style", "exclude", "lyrics"], udio: ["prompt", "lyrics"], generic: [] } as const;

function ProfileEditor() {
  const overrides = useSettingsStore((s) => s.profileOverrides);
  const setOverride = useSettingsStore((s) => s.setOverride);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-3">
      {PLATFORM_PROFILES.filter((p) => p.platform !== "generic").map((base) => {
        const p = resolveProfile(base.platform, base.id, overrides);
        const overridden = !!overrides[base.id];
        const keys = LIMIT_KEYS_BY_PLATFORM[base.platform] as readonly LimitKey[];
        return (
          <div key={base.id} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">{base.label}</span>
              <span className="text-[11px] text-muted-foreground">{p.verifiedAt ? `diverifikasi ${p.verifiedAt}` : "belum diverifikasi"}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {keys.map((k) => (
                <label key={k} className="space-y-1">
                  <span className="text-[11px] text-muted-foreground">{LIMIT_LABEL[k]}</span>
                  <Input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    className="h-8 text-xs"
                    value={p.limits[k] ?? ""}
                    placeholder="—"
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      setOverride(base.id, { limits: { [k]: Number.isFinite(n) && n > 0 ? n : 0 } });
                    }}
                  />
                </label>
              ))}
            </div>
            <p className="text-[11px] leading-snug text-muted-foreground">{base.source}</p>
            <div className="flex gap-1.5">
              <Button type="button" size="sm" variant="outline" onClick={() => setOverride(base.id, { verifiedAt: today })}>
                Saya sudah cek hari ini
              </Button>
              {overridden && (
                <Button type="button" size="sm" variant="ghost" onClick={() => setOverride(base.id, null)}>
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
          <Label htmlFor="llm-on">Aktifkan asisten lirik (Claude)</Label>
          <p className="text-xs text-muted-foreground">
            Menambah tombol “Kritik lirikku” dan “Tulis ulang baris klise” di Lirik workshop. Nonaktif secara default — aplikasi tetap
            berjalan penuh tanpa API apa pun.
          </p>
        </div>
      </div>

      {llmEnabled && (
        <div className="space-y-3 rounded-lg border p-3">
          <label className="block space-y-1">
            <span className="text-xs font-medium">Model</span>
            <select
              value={known ? llmModel : "__custom"}
              onChange={(e) => setLlm({ llmModel: e.target.value === "__custom" ? "" : e.target.value })}
              className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {MODEL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
              <option value="__custom">ID model lain…</option>
            </select>
            {!known && (
              <Input value={llmModel} onChange={(e) => setLlm({ llmModel: e.target.value.trim() })} placeholder="mis. claude-sonnet-5-5" className="h-8 text-xs" />
            )}
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-medium">API key Anthropic</span>
            <Input
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setLlm({ apiKey: e.target.value })}
              placeholder="sk-ant-…"
              className="font-mono text-xs"
            />
            <span className="block text-[11px] text-muted-foreground">
              Buat di console.anthropic.com. Biaya pemakaian ditagihkan ke akunmu sendiri.
            </span>
          </label>

          <div className="flex items-start gap-2.5">
            <Checkbox id="remember" checked={rememberKey} onCheckedChange={(v) => setLlm({ rememberKey: v === true })} className="mt-0.5" />
            <div className="space-y-0.5">
              <Label htmlFor="remember">Ingat key di browser ini</Label>
              <p className="text-[11px] leading-snug text-muted-foreground">
                Mati: key hanya di memori dan hilang saat tab ditutup (lebih aman). Hidup: disimpan di localStorage — jangan aktifkan di
                komputer bersama.
              </p>
            </div>
          </div>

          <p className="rounded-md bg-muted px-2.5 py-2 text-[11px] leading-snug text-muted-foreground">
            Lirikmu dikirim langsung dari browser ke API Anthropic — aplikasi ini tidak punya server, jadi tidak ada pihak ketiga di
            tengah.
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
        <Button variant="outline" size="icon" aria-label="Pengaturan" title="Pengaturan">
          <Settings />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Pengaturan</DialogTitle>
          <DialogDescription>Semua tersimpan hanya di browser ini.</DialogDescription>
        </DialogHeader>
        <section className="space-y-2">
          <h3 className="text-sm font-semibold">Profil platform</h3>
          <p className="text-xs text-muted-foreground">
            Suno dan Udio tidak mempublikasikan batas karakternya. Jika versi baru mengubah batas, perbarui di sini — tidak perlu menunggu
            update aplikasi. Batas hanya memicu peringatan, tidak pernah memotong teks.
          </p>
          <ProfileEditor />
        </section>
        <section className="space-y-2 border-t pt-4">
          <h3 className="text-sm font-semibold">Asisten AI (opsional)</h3>
          <LlmSettings />
        </section>
      </DialogContent>
    </Dialog>
  );
}
