import type { PromptInput } from "@/lib/types";
import { uniq } from "@/lib/utils";

/**
 * A negative term plus the "conflict keys" that cancel it.
 * If any key appears in the user's positive spec (genre, instruments, vocal…),
 * the negative is dropped — e.g. "heavy autotune" is NOT excluded when the user
 * explicitly asks for an autotuned hyperpop vocal.
 */
export interface NegativeRule {
  term: string;
  keys: string[];
}

/** Baseline anti-slop exclusions — the sonic fingerprints of generic AI tracks. */
export const BASE_NEGATIVES: NegativeRule[] = [
  { term: "generic radio pop", keys: ["pop"] },
  { term: "heavy autotune", keys: ["autotune", "auto-tune", "hyperpop", "t-pain"] },
  { term: "glossy overproduced mix", keys: ["glossy", "polished", "maximal"] },
  { term: "EDM drop", keys: ["edm", "dubstep", "drop", "house", "trance", "electro"] },
  { term: "stock trap hi-hat rolls", keys: ["trap", "drill", "phonk"] },
  { term: "over-compressed brickwall master", keys: ["brickwall", "loud"] },
  { term: "robotic vocal timing", keys: ["robotic", "vocoder"] },
  { term: "cheesy supersaw leads", keys: ["supersaw", "trance", "eurodance"] },
  { term: "stadium reverb wash", keys: ["stadium", "arena", "anthem"] },
  { term: "predictable four-chord loop", keys: [] },
];

/** Genre-aware exclusions, triggered when the genre/subgenre matches a pattern. */
export const GENRE_NEGATIVES: Array<{ match: RegExp; rules: NegativeRule[] }> = [
  {
    match: /acoustic|folk|ballad|singer.?songwriter|keroncong|country|bluegrass/i,
    rules: [
      { term: "electronic drums", keys: ["electronic", "drum machine", "808"] },
      { term: "808 bass", keys: ["808"] },
      { term: "synth pads", keys: ["synth", "pad"] },
      { term: "EDM build-up", keys: ["edm", "build"] },
    ],
  },
  {
    match: /jazz|soul|funk|r&b|rnb|blues|gospel/i,
    // Autotune / trap hats are already covered by BASE_NEGATIVES — no duplicates here.
    rules: [{ term: "rigid quantized drums", keys: ["quantized", "drum machine"] }],
  },
  {
    match: /rock|punk|garage|grunge|metal|emo|post-hardcore/i,
    rules: [
      { term: "polished pop vocals", keys: ["pop", "polished"] },
      { term: "synth-pop sheen", keys: ["synth"] },
      { term: "grid-perfect drums", keys: ["drum machine", "programmed"] },
    ],
  },
  {
    match: /lo-?fi|bedroom|tape/i,
    rules: [
      { term: "crisp hi-fi modern master", keys: ["hi-fi", "crisp"] },
      { term: "bright pop vocals", keys: ["pop"] },
    ],
  },
  {
    match: /boom.?bap|east coast|golden age|90s hip.?hop/i,
    rules: [
      { term: "trap hi-hat rolls", keys: ["trap"] },
      { term: "808 glides", keys: ["808"] },
      { term: "mumble autotune", keys: ["autotune", "auto-tune"] },
    ],
  },
  {
    // Note: "chamber" alone is excluded on purpose — "chamber folk/pop" must not trigger orchestral rules.
    match: /classical|orchestral|cinematic|ambient|chamber music|string quartet/i,
    rules: [
      { term: "trailer braams", keys: ["trailer", "braam"] },
      { term: "hybrid synth hits", keys: ["hybrid", "synth"] },
      { term: "generic epic choir", keys: ["choir"] },
    ],
  },
  {
    match: /shoegaze|dream.?pop|post-rock/i,
    rules: [
      { term: "upfront clean pop vocal", keys: ["pop"] },
      { term: "EDM drop", keys: ["edm"] },
    ],
  },
];

/** Extra exclusions when "strong anti-slop" is on. Phrased as plain terms (no "no …"). */
export const STRONG_NEGATIVES: string[] = [
  "generic AI-sounding arrangement",
  "repetitive filler chorus",
  "sterile perfect quantization",
  "vague cliché lyrics",
  "soulless stock-music feel",
];

/**
 * Positive anti-slop directives. Kept positive on purpose: in style fields,
 * naming an unwanted thing can prime the model toward it, so we describe
 * the desired quality instead and route the unwanted things to an exclude field.
 */
export const ANTI_SLOP_POSITIVES: string[] = [
  "human performance feel",
  "natural timing and micro-dynamics",
  "clear dynamic contrast between sections",
  "distinctive, intentional arrangement",
  "restrained production with space to breathe",
];

function positiveCorpus(input: PromptInput): string {
  return [
    input.genre,
    ...input.subgenres,
    ...input.moods,
    ...input.instrumentsInclude,
    input.tempoFeel,
    input.vocal.timbre,
    input.vocal.delivery,
    input.production.era,
    input.production.mixStyle,
    input.production.texture,
    input.production.space,
  ]
    .join(" | ")
    .toLowerCase();
}

function keep(rule: NegativeRule, corpus: string): boolean {
  return !rule.keys.some((k) => corpus.includes(k.toLowerCase()));
}

/** Auto-generated negatives only (defaults + genre-aware + strong), conflict-filtered. */
export function autoNegatives(input: PromptInput): string[] {
  const corpus = positiveCorpus(input);
  const genreText = [input.genre, ...input.subgenres].join(" ");
  const out: string[] = [];

  if (input.useDefaultNegatives) {
    out.push(...BASE_NEGATIVES.filter((r) => keep(r, corpus)).map((r) => r.term));
    for (const group of GENRE_NEGATIVES) {
      if (group.match.test(genreText)) {
        out.push(...group.rules.filter((r) => keep(r, corpus)).map((r) => r.term));
      }
    }
  }
  if (input.strongAntiSlop) out.push(...STRONG_NEGATIVES);
  return uniq(out);
}

/** Final negative list: avoided instruments first (most concrete), then auto, then manual. */
export function resolveNegatives(input: PromptInput): string[] {
  return uniq([...input.instrumentsAvoid, ...autoNegatives(input), ...input.negativesManual]);
}
