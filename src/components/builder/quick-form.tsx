"use client";

import { ArrowRight, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CHIP_SUGGESTIONS } from "@/lib/prompt/defaults";
import type { VocalType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/store/builder-store";
import { useSettingsStore } from "@/store/settings-store";
import { Field, SectionCard } from "./form-primitives";
import { GlossaryHint } from "./glossary-hint";
import { LyricWorkshop } from "./lyric-workshop";
import { TagInput } from "./tag-input";

const VOCALS: Array<{ value: VocalType; label: string }> = [
  { value: "female", label: "Perempuan" },
  { value: "male", label: "Laki-laki" },
  { value: "duet", label: "Duet" },
  { value: "instrumental", label: "Instrumental" },
];

/**
 * Three decisions that matter most, nothing else. Everything typed here is the same state as the
 * full form, so "Perdalam" never loses work — it just reveals the remaining controls.
 */
export function QuickForm() {
  const input = useBuilderStore((s) => s.input);
  const setField = useBuilderStore((s) => s.setField);
  const setVocal = useBuilderStore((s) => s.setVocal);
  const setMode = useSettingsStore((s) => s.setMode);
  const instrumental = input.vocal.type === "instrumental";

  return (
    <div className="space-y-4">
      <SectionCard index={1} title="Genre" description="Satu genre, sespesifik mungkin.">
        <Input
          id="genre"
          value={input.genre}
          onChange={(e) => setField("genre", e.target.value)}
          placeholder="mis. indie folk, keroncong, boom bap"
          list="quick-genres"
          aria-label="Genre utama"
          className="font-mono text-xs"
        />
        <datalist id="quick-genres">
          {CHIP_SUGGESTIONS.genres.map((g) => (
            <option key={g} value={g} />
          ))}
        </datalist>
        <GlossaryHint value={input.genre} onApply={(v) => setField("genre", v)} />
      </SectionCard>

      <SectionCard index={2} title="Perasaan & Mood" description="Boleh bahasa Indonesia — “galau”, “sendu”, “rindu” otomatis diterjemahkan.">
        <TagInput
          id="moods"
          value={input.moods}
          onChange={(v) => setField("moods", v)}
          placeholder="ketik lalu Enter"
          suggestions={CHIP_SUGGESTIONS.moods.slice(0, 5)}
          translate
          max={3}
        />
      </SectionCard>

      <SectionCard index={3} title="Cerita & Karakter Vokal">
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Jenis vokal">
          {VOCALS.map((v) => (
            <button
              key={v.value}
              type="button"
              role="radio"
              aria-checked={input.vocal.type === v.value}
              onClick={() => setVocal({ type: v.value })}
              className={cn(
                "rounded-xs border px-2.5 py-1 font-mono text-[11px] font-medium transition-all active:translate-y-px",
                input.vocal.type === v.value
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "border-border/80 bg-card text-foreground hover:bg-muted/80",
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
        <Field label="Tentang apa lagunya?" htmlFor="theme">
          <Input
            id="theme"
            value={input.theme}
            onChange={(e) => setField("theme", e.target.value)}
            placeholder="mis. surat yang tak pernah dikirim untuk nenek"
            className="text-xs"
          />
        </Field>
        {!instrumental && (
          <Field label="Lirik (sangat disarankan)" htmlFor="lyrics" hint="Pisahkan bait dengan baris kosong.">
            <Textarea
              id="lyrics"
              value={input.lyrics}
              onChange={(e) => setField("lyrics", e.target.value)}
              rows={8}
              className="font-mono text-xs leading-relaxed"
              placeholder={"Bait pertama…\n\nChorus…"}
            />
          </Field>
        )}
        {!instrumental && <LyricWorkshop />}
      </SectionCard>

      {/* Deep Dive Callout */}
      <div className="rounded-sm border border-border/80 bg-secondary/30 p-4 text-center space-y-2">
        <div className="flex items-center justify-center gap-1.5 font-mono text-xs font-semibold text-accent-strong uppercase">
          <Sliders className="h-3.5 w-3.5" />
          <span>Ingin Kontrol Akustik Lebih Lanjut?</span>
        </div>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Tempo BPM, instrumen organik, gaya mixing analog, dan negative exclusion prompt adalah tuas terkuat berikutnya untuk mematikan slop AI.
        </p>
        <Button type="button" variant="outline" className="font-mono text-xs" onClick={() => setMode("full")}>
          Perdalam ke mode lengkap <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
