"use client";

import * as React from "react";
import { BookmarkPlus, Check, ShieldAlert, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PLATFORM_LABELS, profileAgeDays, profilesFor, STALE_AFTER_DAYS, VARIANTS, type PlatformProfile } from "@/lib/prompt/platforms";
import type { GeneratedPrompt, Platform, PromptField, Variant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/store/builder-store";
import { useSettingsStore } from "@/store/settings-store";
import { CopyButton } from "./copy-button";

function FieldPreview({ field, onCopied }: { field: PromptField; onCopied: () => void }) {
  const len = field.content.length;
  const over = field.limit !== undefined && len > field.limit;
  const empty = !field.content.trim();

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/50 px-3 py-1.5">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="truncate text-xs font-semibold uppercase tracking-wide">{field.label}</span>
          <span className={cn("font-mono text-[11px] tabular-nums", over ? "font-semibold text-destructive" : "text-muted-foreground")}>
            {len}
            {field.limit ? `/${field.limit}` : ""}
          </span>
        </div>
        <CopyButton text={field.content} label="" variant="ghost" size="icon-sm" onCopied={onCopied} aria-label={`Copy ${field.label}`} />
      </div>
      <pre
        className={cn(
          "max-h-72 overflow-auto whitespace-pre-wrap break-words px-3 py-2.5 font-mono text-[12.5px] leading-relaxed",
          empty && "italic text-muted-foreground",
        )}
      >
        {empty ? "— kosong —" : field.content}
      </pre>
      {field.hint && <p className="border-t px-3 py-1.5 text-[11px] leading-snug text-muted-foreground">{field.hint}</p>}
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
          className="h-7 rounded-md border border-input bg-card px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Versi model"
        >
          {options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <span className="font-medium">{profile.label}</span>
      )}
      <span
        className={cn("inline-flex items-center gap-1", stale ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground")}
        title={profile.source}
      >
        {stale ? <ShieldAlert className="h-3.5 w-3.5" /> : <ShieldCheck className="h-3.5 w-3.5" />}
        {age === null ? "batas belum diverifikasi" : `diverifikasi ${profile.verifiedAt}${stale ? " — mungkin usang" : ""}`}
      </span>
    </div>
  );
}

export function OutputPanel({ output, onSave, profile }: { output: GeneratedPrompt; onSave: () => unknown; profile: PlatformProfile }) {
  const platform = useBuilderStore((s) => s.platform);
  const variant = useBuilderStore((s) => s.variant);
  const setPlatform = useBuilderStore((s) => s.setPlatform);
  const setVariant = useBuilderStore((s) => s.setVariant);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => setSaved(false), [output.combined]);

  const save = () => {
    onSave();
    setSaved(true);
  };

  return (
    <div className="space-y-3">
      <Tabs value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
        <TabsList className="grid w-full grid-cols-3">
          {(Object.keys(PLATFORM_LABELS) as Platform[]).map((id) => (
            <TabsTrigger key={id} value={id}>
              {PLATFORM_LABELS[id].label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <p className="text-xs text-muted-foreground">{PLATFORM_LABELS[platform].description}</p>
      <ProfilePicker platform={platform} profile={profile} />

      <div className="flex rounded-lg border p-0.5" role="radiogroup" aria-label="Variasi prompt">
        {(Object.keys(VARIANTS) as Variant[]).map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={variant === v}
            title={VARIANTS[v].description}
            onClick={() => setVariant(v)}
            className={cn(
              "flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
              variant === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {VARIANTS[v].label}
          </button>
        ))}
      </div>

      <div className="space-y-2.5">
        {output.fields.map((f) => (
          <FieldPreview key={f.key} field={f} onCopied={save} />
        ))}
      </div>

      <div className="flex gap-2">
        <CopyButton text={output.combined} label="Copy Prompt" copiedLabel="Tersalin & disimpan" variant="accent" className="flex-1" onCopied={save} />
        <Button type="button" variant="outline" onClick={save} disabled={saved} aria-label="Simpan ke riwayat">
          {saved ? <Check /> : <BookmarkPlus />}
          <span className="hidden sm:inline">{saved ? "Tersimpan" : "Simpan"}</span>
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Tips Suno: copy per kolom (ikon di kanan atas tiap kotak) lalu tempel ke kolom yang sesuai di Custom Mode.
      </p>
    </div>
  );
}
