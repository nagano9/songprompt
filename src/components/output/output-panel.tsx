"use client";

import * as React from "react";
import { BookmarkPlus, Check, ShieldAlert, ShieldCheck, Scissors, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PLATFORM_LABELS, profileAgeDays, profilesFor, STALE_AFTER_DAYS, VARIANTS, type PlatformProfile } from "@/lib/prompt/platforms";
import { smartTrim } from "@/lib/prompt/generator";
import type { GeneratedPrompt, Platform, PromptField, Variant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/store/builder-store";
import { useSettingsStore } from "@/store/settings-store";
import { CopyButton } from "./copy-button";
import { ExportSuite } from "./export-suite";

function FieldPreview({ field, onCopied }: { field: PromptField; onCopied: () => void }) {
  const len = field.content.length;
  const limit = field.limit ?? 1000;
  const over = field.limit !== undefined && len > field.limit;
  const near = field.limit !== undefined && !over && len > field.limit * 0.85;
  const empty = !field.content.trim();
  const percentage = Math.min(100, Math.round((len / limit) * 100));

  const [trimmedPreview, setTrimmedPreview] = React.useState<string | null>(null);

  const displayContent = trimmedPreview ?? field.content;
  const displayLen = displayContent.length;
  const isDisplayOver = field.limit !== undefined && displayLen > field.limit;

  const handleQuickTrim = () => {
    if (field.limit) {
      const trimmed = smartTrim(field.content, field.limit);
      setTrimmedPreview(trimmed);
    }
  };

  return (
    <div className="overflow-hidden rounded-sm border border-border/90 bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-secondary/40 px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-mono text-[11px] font-bold uppercase tracking-wider text-foreground">
            {field.label}
          </span>

          {/* Progress / Character Count */}
          <div className="flex items-center gap-1.5">
            <span
              className={cn(
                "font-mono text-[10px] tabular-nums",
                isDisplayOver
                  ? "font-bold text-destructive"
                  : near
                    ? "font-medium text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground",
              )}
            >
              {displayLen}
              {field.limit ? `/${field.limit}` : "/1000"} kar
            </span>

            {/* Visual Budget Bar */}
            <div className="hidden sm:block h-1.5 w-16 overflow-hidden rounded-full bg-secondary/80">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  isDisplayOver
                    ? "bg-destructive"
                    : near
                      ? "bg-amber-500"
                      : "bg-emerald-500",
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {over && !trimmedPreview && field.key !== "lyrics" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleQuickTrim}
              className="h-6 px-1.5 font-mono text-[10px] text-amber-600 dark:text-amber-400 border-amber-500/40 hover:bg-amber-500/10"
              title={`Pangkas teks secara otomatis agar pas ≤ ${limit} karakter`}
            >
              <Scissors className="mr-1 h-2.5 w-2.5" />
              Pangkas ke {limit}
            </Button>
          )}

          {trimmedPreview && (
            <span className="inline-flex items-center gap-0.5 rounded-xs bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[9.5px] font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-2.5 w-2.5" /> Dipangkas
            </span>
          )}

          <CopyButton
            text={displayContent}
            label=""
            variant="ghost"
            size="icon-sm"
            onCopied={onCopied}
            aria-label={`Copy ${field.label}`}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          />
        </div>
      </div>

      <pre
        className={cn(
          "max-h-72 overflow-auto whitespace-pre-wrap break-words px-3 py-2 font-mono text-[12px] leading-relaxed selection:bg-accent/25",
          empty && "italic text-muted-foreground/60",
        )}
      >
        {empty ? "— kosong —" : displayContent}
      </pre>

      {field.hint && (
        <p className="border-t border-border/40 bg-secondary/15 px-3 py-1 text-[10.5px] leading-snug text-muted-foreground">
          {field.hint}
        </p>
      )}
    </div>
  );
}

function ProfilePicker({ platform, profile }: { platform: Platform; profile: PlatformProfile }) {
  const setProfile = useSettingsStore((s) => s.setProfile);
  const options = profilesFor(platform);
  const age = profileAgeDays(profile);
  const stale = age === null || age > STALE_AFTER_DAYS;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {options.length > 1 ? (
        <select
          value={profile.id}
          onChange={(e) => setProfile(platform, e.target.value)}
          className="h-7 rounded-sm border border-border bg-card px-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label="Versi model"
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <span className="font-mono font-medium text-foreground">{profile.label}</span>
      )}
      <span
        className={cn(
          "inline-flex items-center gap-1 font-mono text-[11px]",
          stale ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
        )}
        title={profile.source}
      >
        {stale ? <ShieldAlert className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
        {age === null ? "standar aman 1000 kar" : `diverifikasi ${profile.verifiedAt}${stale ? " — mungkin usang" : ""}`}
      </span>
    </div>
  );
}

export function OutputPanel({
  output,
  onSave,
  profile,
}: {
  output: GeneratedPrompt;
  onSave: () => unknown;
  profile: PlatformProfile;
}) {
  const platform = useBuilderStore((s) => s.platform);
  const variant = useBuilderStore((s) => s.variant);
  const setPlatform = useBuilderStore((s) => s.setPlatform);
  const setVariant = useBuilderStore((s) => s.setVariant);

  const maxPromptLength = useSettingsStore((s) => s.maxPromptLength);
  const autoTrimPrompt = useSettingsStore((s) => s.autoTrimPrompt);
  const setAutoTrimPrompt = useSettingsStore((s) => s.setAutoTrimPrompt);

  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => setSaved(false), [output.combined]);

  const save = () => {
    onSave();
    setSaved(true);
  };

  return (
    <div className="space-y-3">
      {/* Platform Switcher */}
      <Tabs value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
        <TabsList className="grid w-full grid-cols-3 h-8 bg-secondary/80 p-0.5 rounded-sm">
          {(Object.keys(PLATFORM_LABELS) as Platform[]).map((id) => (
            <TabsTrigger key={id} value={id} className="font-mono text-xs rounded-xs">
              {PLATFORM_LABELS[id].label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <p className="text-[11.5px] text-muted-foreground">{PLATFORM_LABELS[platform].description}</p>
      
      <div className="flex items-center justify-between gap-2">
        <ProfilePicker platform={platform} profile={profile} />
        
        {/* Output Settings Indicator */}
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <span className="rounded-xs border border-border/80 bg-secondary/40 px-2 py-0.5 text-foreground font-semibold">
            Maks {maxPromptLength || 1000} Karakter
          </span>
          <button
            type="button"
            onClick={() => setAutoTrimPrompt(!autoTrimPrompt)}
            title="Klik untuk mengubah status Auto-Trim otomatis"
            className={cn(
              "rounded-xs border px-1.5 py-0.5 font-mono text-[10px] transition-colors cursor-pointer",
              autoTrimPrompt
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium"
                : "border-border text-muted-foreground hover:bg-secondary",
            )}
          >
            Auto-Trim: {autoTrimPrompt ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Prompt Variant Selector */}
      <div className="flex rounded-sm border border-border/80 bg-secondary/50 p-0.5" role="radiogroup" aria-label="Variasi prompt">
        {(Object.keys(VARIANTS) as Variant[]).map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={variant === v}
            title={VARIANTS[v].description}
            onClick={() => setVariant(v)}
            className={cn(
              "flex-1 rounded-xs px-2 py-1 font-mono text-[11px] font-medium transition-colors",
              variant === v ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {VARIANTS[v].label}
          </button>
        ))}
      </div>

      {/* Output Stems */}
      <div className="space-y-2">
        {output.fields.map((f) => (
          <FieldPreview key={f.key} field={f} onCopied={save} />
        ))}
      </div>

      {/* Master Action Trigger */}
      <div className="flex gap-2 pt-1">
        <CopyButton
          text={output.combined}
          label="Copy Prompt"
          copiedLabel="Tersalin & disimpan"
          variant="accent"
          className="flex-1 h-9 font-mono text-xs uppercase tracking-wider font-semibold shadow-xs"
          onCopied={save}
        />
        <Button
          type="button"
          variant="outline"
          className="h-9 font-mono text-xs"
          onClick={save}
          disabled={saved}
          aria-label="Simpan ke riwayat"
        >
          {saved ? <Check className="text-emerald-500" /> : <BookmarkPlus />}
          <span className="hidden sm:inline">{saved ? "Tersimpan" : "Simpan"}</span>
        </Button>
      </div>

      <div className="flex items-center justify-between text-[10.5px] font-mono text-muted-foreground/80 border-t border-border/40 pt-2 mb-3">
        <span>Tips Suno: Salin per kolom di atas untuk Custom Mode di suno.com.</span>
        <span className="text-primary font-medium">Batas: ≤ {maxPromptLength || 1000} karakter</span>
      </div>

      <ExportSuite input={useBuilderStore.getState().input} />
    </div>
  );
}
