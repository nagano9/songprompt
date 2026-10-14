"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CHIP_SUGGESTIONS } from "@/lib/prompt/defaults";
import { autoNegatives } from "@/lib/prompt/negatives";
import { findLyricCliches } from "@/lib/prompt/suggestions";
import type { VocalType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/store/builder-store";
import { Field, SectionCard } from "./form-primitives";
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
  const autoNeg = autoNegatives(input);
  const cliches = findLyricCliches(input.lyrics);

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Tulis deskriptor dalam <strong className="font-medium text-foreground">bahasa Inggris</strong> — generator paling
        akurat membacanya. Lirik boleh bahasa apa pun.
      </p>

      {/* 1. Genre */}
      <SectionCard index={1} title="Genre & Subgenre" description="Satu genre utama, maksimal dua subgenre. Fokus mengalahkan ‘genre soup’.">
        <Field label="Genre utama" htmlFor="genre">
          <Input
            id="genre"
            value={input.genre}
            onChange={(e) => setField("genre", e.target.value)}
            placeholder="mis. indie folk"
            list="genre-options"
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
            placeholder="ketik lalu Enter, mis. chamber folk"
          />
        </Field>
      </SectionCard>

      {/* 2. Mood */}
      <SectionCard index={2} title="Mood & Emosi" description="Emosi spesifik → pilihan harmoni dan aransemen yang spesifik.">
        <Field label="Mood" htmlFor="moods">
          <TagInput
            id="moods"
            value={input.moods}
            onChange={(v) => setField("moods", v)}
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
          />
        </Field>
      </SectionCard>

      {/* 3. Tempo */}
      <SectionCard index={3} title="Tempo & Nada">
        <div className="grid gap-4 sm:grid-cols-[7rem_1fr]">
          <Field label="BPM" htmlFor="bpm">
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
            />
          </Field>
          <Field label="Rasa tempo" htmlFor="tempo-feel">
            <Input
              id="tempo-feel"
              value={input.tempoFeel}
              onChange={(e) => setField("tempoFeel", e.target.value)}
              placeholder="mis. lazy behind-the-beat swing"
            />
          </Field>
        </div>
        <Field label="Kunci / mode" htmlFor="key">
          <Input
            id="key"
            value={input.keyMode}
            onChange={(e) => setField("keyMode", e.target.value)}
            placeholder="mis. D major with modal borrowing"
          />
        </Field>
      </SectionCard>

      {/* 4. Structure */}
      <SectionCard
        index={4}
        title="Struktur Lagu"
        description="Catatan per section menciptakan kontras dinamika — obat utama lagu yang datar."
      >
        <StructureEditor value={input.structure} onChange={(v) => setField("structure", v)} />
      </SectionCard>

      {/* 5. Instruments */}
      <SectionCard index={5} title="Instrumen" description="3–4 instrumen spesifik. ‘Felt piano’ lebih kuat dari ‘piano’.">
        <Field label="Instrumen utama" htmlFor="inst-in">
          <TagInput
            id="inst-in"
            value={input.instrumentsInclude}
            onChange={(v) => setField("instrumentsInclude", v)}
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
            placeholder="mis. synth pads, 808"
          />
        </Field>
      </SectionCard>

      {/* 6. Vocals */}
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
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
                )}
              >
                {v.label}
              </button>
            );
          })}
        </div>
        {!instrumental && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Timbre" htmlFor="timbre">
              <Input
                id="timbre"
                value={input.vocal.timbre}
                onChange={(e) => setVocal({ timbre: e.target.value })}
                placeholder="mis. breathy alto with a slight rasp"
              />
            </Field>
            <Field label="Delivery" htmlFor="delivery">
              <Input
                id="delivery"
                value={input.vocal.delivery}
                onChange={(e) => setVocal({ delivery: e.target.value })}
                placeholder="mis. almost spoken in verses"
              />
            </Field>
            <Field label="Aksen" htmlFor="accent">
              <Input
                id="accent"
                value={input.vocal.accent}
                onChange={(e) => setVocal({ accent: e.target.value })}
                placeholder="mis. Javanese"
              />
            </Field>
            <Field label="Bahasa" htmlFor="language">
              <Input
                id="language"
                value={input.vocal.language}
                onChange={(e) => setVocal({ language: e.target.value })}
                placeholder="mis. Indonesian"
              />
            </Field>
          </div>
        )}
      </SectionCard>

      {/* 7. Production */}
      <SectionCard index={7} title="Produksi & Mixing" description="Di sinilah ‘glossy AI sound’ paling mudah dilawan.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Era / pendekatan" htmlFor="era">
            <Input
              id="era"
              value={input.production.era}
              onChange={(e) => setProduction({ era: e.target.value })}
              placeholder="mis. late-1970s analog studio"
            />
          </Field>
          <Field label="Gaya mix" htmlFor="mix">
            <Input
              id="mix"
              value={input.production.mixStyle}
              onChange={(e) => setProduction({ mixStyle: e.target.value })}
              placeholder="mis. dry, close-miked, minimal compression"
            />
          </Field>
          <Field label="Tekstur" htmlFor="texture">
            <Input
              id="texture"
              value={input.production.texture}
              onChange={(e) => setProduction({ texture: e.target.value })}
              placeholder="mis. tape hiss, fret squeaks left in"
            />
          </Field>
          <Field label="Ruang" htmlFor="space">
            <Input
              id="space"
              value={input.production.space}
              onChange={(e) => setProduction({ space: e.target.value })}
              placeholder="mis. small wooden room"
            />
          </Field>
        </div>
      </SectionCard>

      {/* 8. Anti-slop + negatives */}
      <SectionCard index={8} title="Anti-Slop & Negative Prompt">
        <div className="space-y-3 rounded-lg border bg-muted/40 p-3">
          <div className="flex items-start gap-3">
            <Switch
              id="strong"
              checked={input.strongAntiSlop}
              onCheckedChange={(v) => setField("strongAntiSlop", v)}
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <Label htmlFor="strong">Include strong anti-slop instructions</Label>
              <p className="text-xs text-muted-foreground">
                Menambah arahan positif (human feel, kontras dinamika, aransemen yang disengaja) + exclusion tambahan.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox
              id="defaults"
              checked={input.useDefaultNegatives}
              onCheckedChange={(v) => setField("useDefaultNegatives", v === true)}
              className="mt-0.5"
            />
            <div className="space-y-0.5">
              <Label htmlFor="defaults">Pakai negatif bawaan (genre-aware)</Label>
              <p className="text-xs text-muted-foreground">
                Otomatis menyesuaikan genre dan membuang yang bertentangan dengan pilihanmu.
              </p>
            </div>
          </div>
        </div>

        {autoNeg.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Negatif otomatis ({autoNeg.length})</p>
            <div className="flex flex-wrap gap-1">
              {autoNeg.map((n) => (
                <span key={n} className="rounded bg-destructive/8 px-1.5 py-0.5 text-[11px] text-destructive/90">
                  {n}
                </span>
              ))}
            </div>
          </div>
        )}

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

      {/* 9. Theme & lyrics */}
      <SectionCard
        index={9}
        title="Tema & Lirik"
        description="Lirik milikmu sendiri adalah pembeda terbesar antara lagu dan slop."
      >
        <Field label="Tema / cerita" htmlFor="theme">
          <Input
            id="theme"
            value={input.theme}
            onChange={(e) => setField("theme", e.target.value)}
            placeholder="mis. surat yang tak pernah dikirim untuk nenek"
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
              rows={10}
              className="font-mono text-[13px] leading-relaxed"
              placeholder={"Bait pertama…\n\nChorus…\n\nBait kedua…"}
            />
            {cliches.length > 0 && (
              <p className="text-xs text-destructive">
                Klise terdeteksi: {cliches.map((c) => `“${c}”`).join(", ")}
              </p>
            )}
          </Field>
        )}
      </SectionCard>

      {/* 10. References */}
      <SectionCard index={10} title="Referensi Style" optional>
        <Field
          label="Referensi"
          htmlFor="references"
          hint="Hanya dikirim di format Generic. Suno/Udio menolak nama artis — terjemahkan jadi deskriptor di bagian Produksi."
        >
          <Textarea
            id="references"
            value={input.references}
            onChange={(e) => setField("references", e.target.value)}
            rows={2}
            placeholder="mis. intimate 2000s singer-songwriter records, room mics, no click track"
          />
        </Field>
      </SectionCard>
    </div>
  );
}
