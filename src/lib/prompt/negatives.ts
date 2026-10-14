import type { PromptInput } from "@/lib/types";
import { uniq } from "@/lib/utils";

/**
 * A negative term, the "conflict keys" that cancel it, and a priority (1–5).
 * If any key appears in the user's positive spec (genre, instruments, vocal…),
 * the negative is dropped — e.g. "heavy autotune" is NOT excluded when the user
 * explicitly asks for an autotuned hyperpop vocal.
 * Priority decides which negatives survive when the budget is tight:
 * 5 = the genre's typical AI failure mode, 1 = nice-to-have.
 */
export interface NegativeRule {
  term: string;
  keys: string[];
  priority: number;
}

/** Baseline anti-slop exclusions — the sonic fingerprints of generic AI tracks. */
export const BASE_NEGATIVES: NegativeRule[] = [
  { term: "glossy overproduced mix", keys: ["glossy", "polished", "maximal"], priority: 4 },
  { term: "generic radio pop", keys: ["pop"], priority: 4 },
  { term: "heavy autotune", keys: ["autotune", "auto-tune", "hyperpop", "t-pain"], priority: 3 },
  { term: "EDM drop", keys: ["edm", "dubstep", "drop", "house", "trance", "electro"], priority: 3 },
  { term: "over-compressed brickwall master", keys: ["brickwall", "loud"], priority: 3 },
  { term: "predictable four-chord loop", keys: [], priority: 2 },
  { term: "stock trap hi-hat rolls", keys: ["trap", "drill", "phonk"], priority: 2 },
  { term: "robotic vocal timing", keys: ["robotic", "vocoder"], priority: 2 },
  { term: "stadium reverb wash", keys: ["stadium", "arena", "anthem"], priority: 2 },
  { term: "cheesy supersaw leads", keys: ["supersaw", "trance", "eurodance"], priority: 1 },
];

/** Genre-aware exclusions — higher priority than the baseline because they are targeted. */
export const GENRE_NEGATIVES: Array<{ match: RegExp; rules: NegativeRule[] }> = [
  {
    match: /acoustic|folk|ballad|singer.?songwriter|keroncong|country|bluegrass/i,
    rules: [
      { term: "electronic drums", keys: ["electronic", "drum machine", "808"], priority: 5 },
      { term: "synth pads", keys: ["synth", "pad"], priority: 5 },
      { term: "808 bass", keys: ["808"], priority: 4 },
      { term: "EDM build-up", keys: ["edm", "build"], priority: 3 },
    ],
  },
  {
    match: /jazz|soul|funk|r&b|rnb|blues|gospel/i,
    // Autotune / trap hats are already covered by BASE_NEGATIVES — no duplicates here.
    rules: [{ term: "rigid quantized drums", keys: ["quantized", "drum machine"], priority: 5 }],
  },
  {
    match: /rock|punk|garage|grunge|metal|emo|post-hardcore/i,
    rules: [
      { term: "polished pop vocals", keys: ["pop", "polished"], priority: 5 },
      { term: "grid-perfect drums", keys: ["drum machine", "programmed"], priority: 4 },
      { term: "synth-pop sheen", keys: ["synth"], priority: 3 },
    ],
  },
  {
    match: /lo-?fi|bedroom|tape/i,
    rules: [
      { term: "crisp hi-fi modern master", keys: ["hi-fi", "crisp"], priority: 5 },
      { term: "bright pop vocals", keys: ["pop"], priority: 3 },
    ],
  },
  {
    match: /boom.?bap|east coast|golden age|90s hip.?hop/i,
    rules: [
      { term: "trap hi-hat rolls", keys: ["trap"], priority: 5 },
      { term: "808 glides", keys: ["808"], priority: 4 },
      { term: "mumble autotune", keys: ["autotune", "auto-tune"], priority: 3 },
    ],
  },
  {
    // "chamber" alone is excluded on purpose — "chamber folk/pop" must not trigger orchestral rules.
    match: /classical|orchestral|cinematic|ambient|chamber music|string quartet/i,
    rules: [
      { term: "trailer braams", keys: ["trailer", "braam"], priority: 5 },
      { term: "hybrid synth hits", keys: ["hybrid", "synth"], priority: 4 },
      { term: "generic epic choir", keys: ["choir"], priority: 3 },
    ],
  },
  {
    match: /shoegaze|dream.?pop|post-rock/i,
    rules: [
      { term: "upfront clean pop vocal", keys: ["pop"], priority: 5 },
      { term: "EDM drop", keys: ["edm"], priority: 3 },
    ],
  },
];

/** Extra exclusions when "strong anti-slop" is on. Phrased as plain terms (no "no …"). */
export const STRONG_NEGATIVES: NegativeRule[] = [
  { term: "generic AI-sounding arrangement", keys: [], priority: 4 },
  { term: "repetitive filler chorus", keys: [], priority: 3 },
  { term: "sterile perfect quantization", keys: ["quantized"], priority: 2 },
  { term: "vague cliché lyrics", keys: [], priority: 2 },
  { term: "soulless stock-music feel", keys: [], priority: 1 },
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

export const DEFAULT_NEGATIVE_BUDGET = 10;

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

/**
 * All applicable auto negatives, conflict-filtered and ranked.
 * Ranking: priority desc; ties keep source order (genre rules first, then base, then strong).
 */
export function rankedAutoNegatives(input: PromptInput): string[] {
  const corpus = positiveCorpus(input);
  const genreText = [input.genre, ...input.subgenres].join(" ");
  const pool: NegativeRule[] = [];

  if (input.useDefaultNegatives) {
    for (const group of GENRE_NEGATIVES) {
      if (group.match.test(genreText)) pool.push(...group.rules);
    }
    pool.push(...BASE_NEGATIVES);
  }
  if (input.strongAntiSlop) pool.push(...STRONG_NEGATIVES);

  const ranked = pool
    .map((rule, order) => ({ rule, order }))
    .filter(({ rule }) => keep(rule, corpus))
    .sort((a, b) => b.rule.priority - a.rule.priority || a.order - b.order)
    .map(({ rule }) => rule.term);
  return uniq(ranked);
}

/** Back-compat alias: every auto negative, unbudgeted. */
export const autoNegatives = rankedAutoNegatives;

export interface NegativePlan {
  /** What is actually sent. */
  sent: string[];
  /** Auto negatives that applied but were cut by the budget. */
  dropped: string[];
  /** Negatives the user wrote (always sent). */
  user: string[];
}

/** User negatives always survive; auto negatives fill what is left of the budget. */
export function planNegatives(input: PromptInput): NegativePlan {
  const user = uniq([...input.instrumentsAvoid, ...input.negativesManual]);
  const userSet = new Set(user.map((u) => u.toLowerCase()));
  const auto = rankedAutoNegatives(input).filter((n) => !userSet.has(n.toLowerCase()));
  const budget = input.negativeBudget > 0 ? input.negativeBudget : Infinity;
  const room = Math.max(0, budget - user.length);
  const kept = auto.slice(0, room);
  return { sent: [...user, ...kept], dropped: auto.slice(kept.length), user };
}

/** Final negative list sent to the model. */
export function resolveNegatives(input: PromptInput): string[] {
  return planNegatives(input).sent;
}
