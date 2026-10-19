"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CHIP_SUGGESTIONS } from "@/lib/prompt/defaults";
import { planNegatives } from "@/lib/prompt/negatives";
import type { VocalType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/store/builder-store";
import { Field, SectionCard } from "./form-primitives";
import { GlossaryHint } from "./glossary-hint";
import { LyricWorkshop } from "./lyric-workshop";
import { ReferenceTranslator } from "./reference-translator";
import { StructureEditor } from "./structure-editor";
import { TagInput } from "./tag-input";

const VOCAL_TYPES: Array<{ value: VocalType; label: string }> = [
  { value: "unspecified", label: "Bebas" },
  { value: "female", label: "Perempuan" },
  { value: "male", label: "Laki-laki" },
  { value: "duet", label: "Duet" },
  { value: "choir", label: "Paduan suara" },
  { value: "instrumental", label: "Instrumental" },
];

export function PromptForm() {
  const input = useBuilderStore((s) => s.input);
  const setField = useBuilderStore((s) => s.setField);
  const setVocal = useBuilderStore((s) => s.setVocal);
  const setProduction = useBuilderStore((s) => s.setProduction);

  const instrumental = input.vocal.type === "instrumental";
  const negPlan = planNegatives(input);
  const autoSent = negPlan.sent.slice(negPlan.user.length);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-sm border border-border/80 bg-secondary/30 px-3 py-2 text-xs text-muted-foreground">
        <span className="font-mono text-accent-strong font-bold">INFO:</span>
        <p className="leading-relaxed">
          Gunakan deskriptor dalam <strong className="font-medium text-foreground">bahasa Inggris</strong> untuk akurasi generator AI.
          Istilah Indonesia (mis. “suara serak”, “mendayu”) dapat diterjemahkan sekali klik. Lirik bebas dalam bahasa apa pun.
        </p>
      </div>

      {/* 01. Genre */}
      <SectionCard index={1} title="Genre & Subgenre" description="Satu genre utama, maksimal dua subgenre. Fokus mengalahkan ‘genre soup’.">
        <Field label="Genre utama" htmlFor="genre">
          <Input
            id="genre"
            value={input.genre}
            onChange={(e) => setField("genre", e.target.value)}
            placeholder="mis. indie folk"
            list="genre-options"
            className="font-mono text-xs"
          />
          <datalist id="genre-options">
            {CHIP_SUGGESTIONS.genres.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </Field>
        <Field label="Subgenre / pengaruh" htmlFor="subgenres">
          <TagInput
            id="subgenres"
            value={input.subgenres}
            onChange={(v) => setField("subgenres", v)}
            translate
            placeholder="ketik lalu Enter, mis. chamber folk"
          />
        </Field>
      </SectionCard>

      {/* 02. Mood */}
      <SectionCard index={2} title="Mood & Emosi" description="Emosi spesifik → pilihan harmoni dan aransemen yang spesifik.">
        <Field label="Mood" htmlFor="moods">
          <TagInput
            id="moods"
            value={input.moods}
            onChange={(v) => setField("moods", v)}
            translate
            placeholder="mis. bittersweet resignation"
            suggestions={CHIP_SUGGESTIONS.moods.slice(0, 5)}
          />
        </Field>
        <Field label="Alur emosi (arc)" htmlFor="arc" hint="Bagaimana energi berubah dari awal ke akhir lagu.">
          <Input
            id="arc"
            value={input.emotionalArc}
            onChange={(e) => setField("emotionalArc", e.target.value)}
            placeholder="mis. starts hushed, swells in the final chorus, ends near-silent"
            className="text-xs"
          />
          <GlossaryHint value={input.emotionalArc} onApply={(v) => setField("emotionalArc", v)} />
        </Field>
      </SectionCard>

      {/* 03. Tempo */}
      <SectionCard index={3} title="Tempo & Nada">
        <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
          <Field label="BPM" htmlFor="bpm">
            <div className="relative">
              <Input
                id="bpm"
                type="number"
                inputMode="numeric"
                min={40}
                max={220}
                value={input.bpm ?? ""}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  setField("bpm", Number.isFinite(n) ? Math.max(1, Math.min(300, n)) : null);
                }}
                placeholder="76"
                className="font-mono text-xs pr-10"
              />
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted-foreground/60 uppercase">
                BPM
              </span>
            </div>
          </Field>
          <Field label="Rasa tempo" htmlFor="tempo-feel">
            <Input
              id="tempo-feel"
              value={input.tempoFeel}
              onChange={(e) => setField("tempoFeel", e.target.value)}
              placeholder="mis. lazy behind-the-beat swing"
              className="text-xs"
            />
            <GlossaryHint value={input.tempoFeel} onApply={(v) => setField("tempoFeel", v)} />
          </Field>
        </div>
        <Field label="Kunci / mode" htmlFor="key">
          <Input
            id="key"
            value={input.keyMode}
            onChange={(e) => setField("keyMode", e.target.value)}
            placeholder="mis. D major with modal borrowing"
            className="text-xs font-mono"
          />
        </Field>
      </SectionCard>

      {/* 04. Structure */}
      <SectionCard
        index={4}
        title="Struktur Lagu"
        description="Catatan per section menciptakan kontras dinamika — obat utama lagu yang datar."
      >
        <StructureEditor value={input.structure} onChange={(v) => setField("structure", v)} />
      </SectionCard>

      {/* 05. Instruments */}
      <SectionCard index={5} title="Instrumen" description="3–4 instrumen spesifik. ‘Felt piano’ lebih kuat dari ‘piano’.">
        <Field label="Instrumen utama" htmlFor="inst-in">
          <TagInput
            id="inst-in"
            value={input.instrumentsInclude}
            onChange={(v) => setField("instrumentsInclude", v)}
            translate
            placeholder="mis. fingerpicked nylon-string guitar"
            suggestions={CHIP_SUGGESTIONS.instruments.slice(0, 6)}
          />
        </Field>
        <Field label="Instrumen yang dihindari" htmlFor="inst-out" hint="Masuk ke daftar negatif.">
          <TagInput
            id="inst-out"
            tone="negative"
            value={input.instrumentsAvoid}
            onChange={(v) => setField("instrumentsAvoid", v)}
            translate
            placeholder="mis. synth pads, 808"
          />
        </Field>
      </SectionCard>

      {/* 06. Vocals */}
      <SectionCard index={6} title="Vokal">
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Jenis vokal">
          {VOCAL_TYPES.map((v) => {
            const active = input.vocal.type === v.value;
            return (
              <button
                key={v.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setVocal({ type: v.value })}
                className={cn(
                  "rounded-xs border px-2.5 py-1 font-mono text-[11px] font-medium transition-all active:translate-y-px",
                  active
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border/80 bg-card text-foreground hover:bg-muted/80",
                )}
              >
                {v.label}
              </button>
            );
          })}
        </div>
        {!instrumental && (
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <Field label="Timbre" htmlFor="timbre">
              <Input
                id="timbre"
                value={input.vocal.timbre}
                onChange={(e) => setVocal({ timbre: e.target.value })}
                placeholder="mis. breathy alto with a slight rasp"
                className="text-xs"
              />
              <GlossaryHint value={input.vocal.timbre} onApply={(v) => setVocal({ timbre: v })} />
            </Field>
            <Field label="Delivery" htmlFor="delivery">
              <Input
                id="delivery"
                value={input.vocal.delivery}
                onChange={(e) => setVocal({ delivery: e.target.value })}
                placeholder="mis. almost spoken in verses"
                className="text-xs"
              />
              <GlossaryHint value={input.vocal.delivery} onApply={(v) => setVocal({ delivery: v })} />
            </Field>
            <Field label="Aksen" htmlFor="accent">
              <Input
                id="accent"
                value={input.vocal.accent}
                onChange={(e) => setVocal({ accent: e.target.value })}
                placeholder="mis. Javanese"
                className="text-xs"
              />
              <GlossaryHint value={input.vocal.accent} onApply={(v) => setVocal({ accent: v.replace(/ accent$/i, "") })} />
            </Field>
            <Field label="Bahasa" htmlFor="language">
              <Input
                id="language"
                value={input.vocal.language}
                onChange={(e) => setVocal({ language: e.target.value })}
                placeholder="mis. Indonesian"
                className="text-xs"
              />
            </Field>
          </div>
        )}
      </SectionCard>

      {/* 07. Production */}
      <SectionCard index={7} title="Produksi & Mixing" description="Di sinilah ‘glossy AI sound’ paling mudah dilawan.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Era / pendekatan" htmlFor="era">
            <Input
              id="era"
              value={input.production.era}
              onChange={(e) => setProduction({ era: e.target.value })}
              placeholder="mis. late-1970s analog studio"
              className="text-xs"
            />
            <GlossaryHint value={input.production.era} onApply={(v) => setProduction({ era: v })} />
          </Field>
          <Field label="Gaya mix" htmlFor="mix">
            <Input
              id="mix"
              value={input.production.mixStyle}
              onChange={(e) => setProduction({ mixStyle: e.target.value })}
              placeholder="mis. dry, close-miked, minimal compression"
              className="text-xs"
            />
            <GlossaryHint value={input.production.mixStyle} onApply={(v) => setProduction({ mixStyle: v })} />
          </Field>
          <Field label="Tekstur" htmlFor="texture">
            <Input
              id="texture"
              value={input.production.texture}
              onChange={(e) => setProduction({ texture: e.target.value })}
              placeholder="mis. tape hiss, fret squeaks left in"
              className="text-xs"
            />
            <GlossaryHint value={input.production.texture} onApply={(v) => setProduction({ texture: v })} />
          </Field>
          <Field label="Ruang" htmlFor="space">
            <Input
              id="space"
              value={input.production.space}
              onChange={(e) => setProduction({ space: e.target.value })}
              placeholder="mis. small wooden room"
              className="text-xs"
            />
            <GlossaryHint value={input.production.space} onApply={(v) => setProduction({ space: v })} />
          </Field>
        </div>
      </SectionCard>

      {/* 08. Anti-slop + negatives */}
      <SectionCard index={8} title="Anti-Slop & Negative Prompt">
        <div className="space-y-3 rounded-sm border border-border/70 bg-secondary/30 p-3">
          <div className="flex items-start gap-3">
            <Switch
              id="strong"
              checked={input.strongAntiSlop}
              onCheckedChange={(v) => setField("strongAntiSlop", v)}
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <Label htmlFor="strong" className="text-xs font-semibold">Include strong anti-slop instructions</Label>
              <p className="text-[11.5px] text-muted-foreground">
                Menambah arahan positif (human feel, kontras dinamika, aransemen yang disengaja) + exclusion tambahan.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 border-t border-border/40 pt-2.5">
            <Checkbox
              id="defaults"
              checked={input.useDefaultNegatives}
              onCheckedChange={(v) => setField("useDefaultNegatives", v === true)}
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <Label htmlFor="defaults" className="text-xs font-semibold">Pakai negatif bawaan (genre-aware)</Label>
              <p className="text-[11.5px] text-muted-foreground">
                Otomatis menyesuaikan genre dan membuang yang bertentangan dengan pilihanmu.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="neg-budget" className="text-xs font-semibold">Budget negatif</Label>
            <div className="flex items-center gap-2">
              <input
                id="neg-budget"
                type="range"
                min={0}
                max={25}
                value={input.negativeBudget}
                onChange={(e) => setField("negativeBudget", Number(e.target.value))}
                className="w-32 accent-[var(--accent)]"
              />
              <span className="w-16 text-right font-mono text-xs tabular-nums text-foreground">
                {input.negativeBudget === 0 ? "tanpa batas" : `${negPlan.sent.length}/${input.negativeBudget}`}
              </span>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Daftar exclusion yang terlalu panjang melemahkan tiap item. Negatif yang kamu tulis sendiri selalu dikirim; sisa budget diisi negatif
            otomatis berprioritas tertinggi.
          </p>
          {(autoSent.length > 0 || negPlan.dropped.length > 0) && (
            <div className="flex flex-wrap gap-1 pt-1">
              {autoSent.map((n) => (
                <span key={n} className="rounded-xs border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 font-mono text-[10.5px] text-destructive">
                  {n}
                </span>
              ))}
              {negPlan.dropped.map((n) => (
                <span key={n} className="rounded-xs border border-dashed border-border px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground/70 line-through" title="Dipangkas oleh budget">
                  {n}
                </span>
              ))}
            </div>
          )}
        </div>

        <Field label="Negatif tambahan (manual)" htmlFor="neg-manual">
          <TagInput
            id="neg-manual"
            tone="negative"
            value={input.negativesManual}
            onChange={(v) => setField("negativesManual", v)}
            placeholder="mis. key change, children's choir"
          />
        </Field>
      </SectionCard>

      {/* 09. Theme & lyrics */}
      <SectionCard
        index={9}
        title="Tema & Lirik"
        description="Lirik milikmu sendiri adalah pembeda terbesar antara lagu berkualitas dan slop."
      >
        <Field label="Tema / cerita" htmlFor="theme">
          <Input
            id="theme"
            value={input.theme}
            onChange={(e) => setField("theme", e.target.value)}
            placeholder="mis. surat yang tak pernah dikirim untuk nenek"
            className="text-xs"
          />
        </Field>
        {!instrumental && (
          <Field
            label="Lirik"
            htmlFor="lyrics"
            hint="Pisahkan bait dengan baris kosong — akan dipetakan ke struktur. Atau tulis tag sendiri: [Verse 1], [Chorus]."
          >
            <Textarea
              id="lyrics"
              value={input.lyrics}
              onChange={(e) => setField("lyrics", e.target.value)}
              rows={9}
              className="font-mono text-xs leading-relaxed"
              placeholder={"Bait pertama…\n\nChorus…\n\nBait kedua…"}
            />
          </Field>
        )}
        {!instrumental && <LyricWorkshop />}
      </SectionCard>

      {/* 10. References */}
      <SectionCard index={10} title="Referensi Style" optional>
        <Field
          label="Referensi"
          htmlFor="references"
          hint="Tulis nama artis atau skena. Untuk Suno/Udio, referensi diterjemahkan jadi deskriptor; teks aslinya hanya dikirim di format Generic."
        >
          <Textarea
            id="references"
            value={input.references}
            onChange={(e) => setField("references", e.target.value)}
            rows={2}
            placeholder="mis. mirip Iwan Fals dengan sentuhan Portishead"
            className="text-xs"
          />
        </Field>
        <ReferenceTranslator />
      </SectionCard>
    </div>
  );
}
