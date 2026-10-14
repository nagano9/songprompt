import {
  INSTRUMENTAL_SECTIONS,
  type GeneratedPrompt,
  type Platform,
  type PromptField,
  type PromptInput,
  type SongSection,
  type Variant,
} from "@/lib/types";
import { capitalize, clean, uniq } from "@/lib/utils";
import { ANTI_SLOP_POSITIVES, resolveNegatives } from "./negatives";
import { resolveProfile, type PlatformProfile } from "./platforms";

/* ------------------------------------------------------------------ */
/* Building blocks                                                      */
/* ------------------------------------------------------------------ */

const VOCAL_LABEL: Record<PromptInput["vocal"]["type"], string> = {
  unspecified: "",
  female: "female vocal",
  male: "male vocal",
  duet: "male-female duet vocals",
  choir: "choir vocals",
  instrumental: "instrumental, no vocals",
};

export function isInstrumental(input: PromptInput): boolean {
  return input.vocal.type === "instrumental";
}

function tempoPhrase(input: PromptInput): string {
  return uniq([input.bpm ? `${input.bpm} BPM` : "", input.tempoFeel]).join(", ");
}

/** Vocal phrase. Order: timbre → type → delivery → accent → language (most identifying first). */
function vocalPhrase(input: PromptInput, short = false): string {
  const v = input.vocal;
  if (v.type === "instrumental") return VOCAL_LABEL.instrumental;
  const parts = short
    ? [v.timbre, VOCAL_LABEL[v.type]]
    : [
        v.timbre,
        VOCAL_LABEL[v.type],
        v.delivery,
        v.accent ? `${clean(v.accent)} accent` : "",
        v.language ? `sung in ${clean(v.language)}` : "",
      ];
  return uniq(parts).join(", ");
}

function productionParts(input: PromptInput): string[] {
  const p = input.production;
  return uniq([p.era, p.mixStyle, p.texture, p.space]);
}

/** Human-readable flow, e.g. "Intro → Verse → Chorus". */
export function structureFlow(structure: SongSection[]): string {
  return structure.map((s) => s.name).join(" → ");
}

function arrangementNotes(structure: SongSection[]): string[] {
  return structure.filter((s) => clean(s.note)).map((s) => `${s.name}: ${clean(s.note)}`);
}

/** Section tags with numbering for repeating verses ("Verse 1", "Verse 2"). */
function sectionLabels(structure: SongSection[]): string[] {
  const verseTotal = structure.filter((s) => s.name === "Verse").length;
  let verseCount = 0;
  return structure.map((s) => {
    if (s.name === "Verse" && verseTotal > 1) {
      verseCount += 1;
      return `Verse ${verseCount}`;
    }
    return s.name;
  });
}

function hasSectionTags(lyrics: string): boolean {
  return /^\s*\[[^\]]+\]\s*$/m.test(lyrics);
}

/**
 * Lyrics with metatags.
 * - If the user already tagged their lyrics, we respect them verbatim.
 * - Otherwise paragraphs are distributed across the lyric-bearing sections in order.
 *   A repeated Chorus reuses the first chorus text when paragraphs run out.
 * - Arrangement notes go on their own bracket line. We avoid (parentheses) because
 *   Suno tends to *sing* parenthesised text as backing vocals.
 */
export function buildLyrics(input: PromptInput, variant: Variant): string {
  const instrumental = isInstrumental(input);
  // An instrumental track ignores any lyrics left in the form (e.g. after switching vocal type).
  const lyrics = instrumental ? "" : input.lyrics.trim();
  if (lyrics && hasSectionTags(lyrics)) return lyrics;

  const withNotes = variant !== "compact";
  const labels = sectionLabels(input.structure);
  const blocks = lyrics ? lyrics.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean) : [];
  const chorusMemory = new Map<string, string>();

  let cursor = 0;
  const out: string[] = [];
  if (instrumental) out.push("[Instrumental]");

  input.structure.forEach((section, i) => {
    const lines = [`[${labels[i]}]`];
    if (withNotes && clean(section.note)) lines.push(`[${clean(section.note)}]`);

    const takesLyrics = !instrumental && !INSTRUMENTAL_SECTIONS.has(section.name);
    if (takesLyrics) {
      let text = "";
      const isRepeatable = section.name === "Chorus" || section.name === "Hook" || section.name === "Post-Chorus";
      if (isRepeatable && chorusMemory.has(section.name) && cursor >= blocks.length) {
        text = chorusMemory.get(section.name) ?? "";
      } else if (cursor < blocks.length) {
        text = blocks[cursor++];
        if (isRepeatable && !chorusMemory.has(section.name)) chorusMemory.set(section.name, text);
      }
      if (text) lines.push(text);
    }
    out.push(lines.join("\n"));
  });

  // Leftover paragraphs (user wrote more than the structure holds): keep them, never drop lyrics.
  if (cursor < blocks.length) {
    out[out.length - 1] += "\n" + blocks.slice(cursor).join("\n\n");
  }

  if (!input.structure.length && lyrics) return lyrics;
  return out.join("\n\n");
}

/* ------------------------------------------------------------------ */
/* Descriptor assembly (shared by Suno + Udio)                         */
/* ------------------------------------------------------------------ */

function tagDescriptors(input: PromptInput, variant: Variant): string[] {
  const vocal = vocalPhrase(input, variant === "compact");
  if (variant === "compact") {
    return uniq([
      input.genre,
      ...input.subgenres.slice(0, 2),
      ...input.moods.slice(0, 2),
      tempoPhrase(input),
      vocal,
      ...input.instrumentsInclude.slice(0, 3),
      input.production.mixStyle,
    ]);
  }
  return uniq([
    input.genre,
    ...input.subgenres,
    ...input.moods,
    input.emotionalArc,
    tempoPhrase(input),
    input.keyMode,
    vocal,
    ...input.instrumentsInclude,
    ...productionParts(input),
    ...(input.strongAntiSlop ? ANTI_SLOP_POSITIVES.slice(0, 3) : []),
  ]);
}

/**
 * Natural-language style description for the "Detail" variant. Front-loads genre.
 * `withArrangement` is false for Suno/Udio: their per-section notes already live in the
 * lyrics metatags, so repeating them here only burns the style-field character budget.
 */
function sentenceDescriptors(input: PromptInput, withArrangement = true): string {
  const s: string[] = [];
  const genre = clean(input.genre);
  const subs = uniq(input.subgenres);
  if (genre) s.push(subs.length ? `${capitalize(genre)} with ${subs.join(" and ")} influences.` : `${capitalize(genre)}.`);

  const moods = uniq(input.moods);
  if (moods.length || clean(input.emotionalArc)) {
    s.push(
      [moods.length ? `Mood: ${moods.join(", ")}` : "", clean(input.emotionalArc) ? `arc: ${clean(input.emotionalArc)}` : ""]
        .filter(Boolean)
        .join("; ") + ".",
    );
  }
  const tempo = uniq([tempoPhrase(input), input.keyMode]).join(", ");
  if (tempo) s.push(`${capitalize(tempo)}.`);

  const vocal = vocalPhrase(input);
  if (vocal) s.push(isInstrumental(input) ? "Instrumental, no vocals." : `Vocals: ${vocal}.`);

  const inst = uniq(input.instrumentsInclude);
  if (inst.length) s.push(`Instrumentation: ${inst.join(", ")}.`);

  const prod = productionParts(input);
  if (prod.length) s.push(`Production: ${prod.join(", ")}.`);

  const notes = withArrangement ? arrangementNotes(input.structure) : [];
  if (notes.length) s.push(`Arrangement: ${notes.join("; ")}.`);

  if (input.strongAntiSlop) s.push(`${capitalize(ANTI_SLOP_POSITIVES.join(", "))}.`);
  return s.join(" ");
}

/* ------------------------------------------------------------------ */
/* Platform renderers                                                   */
/* ------------------------------------------------------------------ */

function lyricsHint(input: PromptInput): string | undefined {
  if (isInstrumental(input)) return "Aktifkan mode Instrumental di generator. Tag di sini mengatur alur section.";
  if (!input.lyrics.trim())
    return "Belum ada lirik — hanya kerangka section. Lirik buatan model adalah sumber slop terbesar; tulis sendiri.";
  if (hasSectionTags(input.lyrics)) return "Lirik sudah bertag — dipakai apa adanya.";
  return "Paragraf lirik dibagikan otomatis ke section (dipisah baris kosong).";
}

function renderSuno(input: PromptInput, variant: Variant, profile: PlatformProfile): PromptField[] {
  const limits = profile.limits;
  const style = variant === "detailed" ? sentenceDescriptors(input, false) : tagDescriptors(input, variant).join(", ");
  const negatives = resolveNegatives(input);
  return [
    {
      key: "style",
      label: "Style of Music",
      content: style,
      limit: limits.style,
      hint: "Hanya deskriptor positif. Hal yang dihindari ada di Exclude Styles agar tidak ‘memancing’ model.",
    },
    {
      key: "exclude",
      label: "Exclude Styles",
      content: negatives.join(", "),
      limit: limits.exclude,
      hint: profile.hasExcludeField
        ? "Tempel di kolom Exclude Styles (More Options) pada Custom Mode."
        : "Versi ini tidak punya kolom Exclude. Jangan tempel ke Style — pakai sebagai checklist saat memilih hasil.",
    },
    {
      key: "lyrics",
      label: "Lyrics",
      content: buildLyrics(input, variant),
      limit: limits.lyrics,
      hint: lyricsHint(input),
    },
  ];
}

function renderUdio(input: PromptInput, variant: Variant, profile: PlatformProfile): PromptField[] {
  const prompt = variant === "detailed" ? sentenceDescriptors(input, false) : tagDescriptors(input, variant).join(", ");
  const negatives = resolveNegatives(input);
  return [
    { key: "prompt", label: "Prompt", content: prompt, limit: profile.limits.prompt, hint: "Tag paling penting ada di depan." },
    {
      key: "avoid",
      label: "Avoid / Negative",
      content: negatives.join(", "),
      hint: "Tempel di kolom negatif jika tersedia di versi Udio kamu. Jangan ditempel ke prompt utama.",
    },
    {
      key: "lyrics",
      label: "Lyrics",
      content: buildLyrics(input, variant),
      limit: profile.limits.lyrics,
      hint: lyricsHint(input),
    },
  ];
}

function renderGeneric(input: PromptInput, variant: Variant): PromptField[] {
  const negatives = resolveNegatives(input);
  const lyrics = buildLyrics(input, variant);

  if (variant === "compact") {
    const brief = [
      sentenceDescriptors({ ...input, structure: [] }),
      clean(input.theme) ? `Theme: ${clean(input.theme)}.` : "",
      negatives.length ? `Avoid: ${negatives.join(", ")}.` : "",
    ]
      .filter(Boolean)
      .join(" ");
    return [
      { key: "brief", label: "Music Brief", content: brief },
      { key: "lyrics", label: "Lyrics", content: lyrics, hint: lyricsHint(input) },
    ];
  }

  const line = (k: string, v: string) => (clean(v) ? `${k}: ${clean(v)}` : "");
  const notes = arrangementNotes(input.structure);
  const blocks = [
    line("GENRE", input.genre),
    line("SUBGENRE / INFLUENCES", uniq(input.subgenres).join(", ")),
    line("MOOD & EMOTION", uniq(input.moods).join(", ")),
    line("EMOTIONAL ARC", input.emotionalArc),
    line("TEMPO", tempoPhrase(input)),
    line("KEY / MODE", input.keyMode),
    input.structure.length ? `STRUCTURE: ${structureFlow(input.structure)}` : "",
    variant === "detailed" && notes.length ? `ARRANGEMENT NOTES:\n${notes.map((n) => `- ${n}`).join("\n")}` : "",
    line("INSTRUMENTATION", uniq(input.instrumentsInclude).join(", ")),
    line("VOCALS", vocalPhrase(input)),
    line("PRODUCTION & MIX", productionParts(input).join(", ")),
    line("THEME / STORY", input.theme),
    line("REFERENCE FEEL", input.references),
    input.strongAntiSlop ? `ANTI-SLOP DIRECTIVES: ${ANTI_SLOP_POSITIVES.join("; ")}` : "",
    negatives.length ? `AVOID: ${negatives.join(", ")}` : "",
  ].filter(Boolean);

  return [
    { key: "brief", label: "Music Brief", content: blocks.join("\n") },
    { key: "lyrics", label: "Lyrics", content: lyrics, hint: lyricsHint(input) },
  ];
}

/* ------------------------------------------------------------------ */
/* Public API                                                           */
/* ------------------------------------------------------------------ */

export function generatePrompt(
  input: PromptInput,
  platform: Platform,
  variant: Variant,
  profile: PlatformProfile = resolveProfile(platform),
): GeneratedPrompt {
  const fields =
    platform === "suno"
      ? renderSuno(input, variant, profile)
      : platform === "udio"
        ? renderUdio(input, variant, profile)
        : renderGeneric(input, variant);

  const combined = fields
    .filter((f) => f.content.trim())
    .map((f) => `### ${f.label}\n${f.content}`)
    .join("\n\n");

  return { platform, variant, profileId: profile.id, fields, combined };
}

/** Short title for history entries. */
export function promptTitle(input: PromptInput): string {
  const head = uniq([input.genre, input.moods[0]]).join(" · ");
  return head || "Prompt tanpa judul";
}
