import { ISSUE_TAGS, type ExperimentAxis, type HistoryEntry, type IssueTag, type PromptInput } from "@/lib/types";
import { clean, uniq } from "@/lib/utils";

/**
 * Turns rated history into evidence: which descriptors, variants and platforms
 * actually produced songs the user liked. This is the feedback loop that lets the app
 * graduate from "heuristics we believe" to "patterns your own ratings show".
 */

export const MIN_SAMPLES = 2;
export const MIN_RATINGS_FOR_INSIGHTS = 5;

export interface DescriptorStat {
  descriptor: string;
  kind: string;
  n: number;
  avg: number;
  /** avg − overall average. Positive = this descriptor tends to do better than your norm. */
  lift: number;
}

export interface ExperimentResult {
  groupId: string;
  axis: ExperimentAxis;
  createdAt: number;
  takes: Array<{ take: string; label: string; score: number | null; entryId: string }>;
  winner: string | null;
}

export interface Insights {
  rated: number;
  overall: number;
  top: DescriptorStat[];
  bottom: DescriptorStat[];
  issues: Array<{ id: IssueTag; label: string; count: number }>;
  experiments: ExperimentResult[];
  byVariant: DescriptorStat[];
  byPlatform: DescriptorStat[];
}

/** Every descriptor of an input as "kind:value" keys. */
export function descriptorsOf(input: PromptInput): Array<{ kind: string; value: string }> {
  const out: Array<{ kind: string; value: string }> = [];
  const push = (kind: string, values: Array<string | null | undefined>) => {
    for (const v of uniq(values)) out.push({ kind, value: v.toLowerCase() });
  };
  push("genre", [input.genre, ...input.subgenres]);
  push("mood", input.moods);
  push("instrumen", input.instrumentsInclude);
  push("produksi", [input.production.era, input.production.mixStyle, input.production.texture, input.production.space]);
  if (input.vocal.type !== "instrumental") push("vokal", [input.vocal.timbre, input.vocal.delivery]);
  push("tempo", [input.tempoFeel]);
  return out.filter((d) => clean(d.value));
}

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);

function statsFrom(groups: Map<string, { kind: string; scores: number[] }>, overall: number): DescriptorStat[] {
  return [...groups.entries()]
    .filter(([, g]) => g.scores.length >= MIN_SAMPLES)
    .map(([descriptor, g]) => {
      const a = avg(g.scores);
      return { descriptor, kind: g.kind, n: g.scores.length, avg: Math.round(a * 100) / 100, lift: Math.round((a - overall) * 100) / 100 };
    });
}

export function computeInsights(entries: HistoryEntry[]): Insights {
  const rated = entries.filter((e) => e.rating && e.rating.score > 0);
  const overall = rated.length ? avg(rated.map((e) => e.rating!.score)) : 0;

  const desc = new Map<string, { kind: string; scores: number[] }>();
  const variants = new Map<string, { kind: string; scores: number[] }>();
  const platforms = new Map<string, { kind: string; scores: number[] }>();
  const issueCount = new Map<IssueTag, number>();

  for (const e of rated) {
    const s = e.rating!.score;
    for (const d of descriptorsOf(e.input)) {
      const g = desc.get(d.value) ?? { kind: d.kind, scores: [] };
      g.scores.push(s);
      desc.set(d.value, g);
    }
    const v = variants.get(e.variant) ?? { kind: "varian", scores: [] };
    v.scores.push(s);
    variants.set(e.variant, v);
    const p = platforms.get(e.platform) ?? { kind: "platform", scores: [] };
    p.scores.push(s);
    platforms.set(e.platform, p);
    for (const i of e.rating!.issues) issueCount.set(i, (issueCount.get(i) ?? 0) + 1);
  }

  const all = statsFrom(desc, overall);
  const top = all.filter((d) => d.lift > 0).sort((a, b) => b.lift - a.lift || b.n - a.n).slice(0, 8);
  const bottom = all.filter((d) => d.lift < 0).sort((a, b) => a.lift - b.lift || b.n - a.n).slice(0, 8);

  const issues = ISSUE_TAGS.map((t) => ({ id: t.id as IssueTag, label: t.label, count: issueCount.get(t.id) ?? 0 }))
    .filter((i) => i.count > 0)
    .sort((a, b) => b.count - a.count);

  const groups = new Map<string, HistoryEntry[]>();
  for (const e of entries) {
    if (!e.experiment) continue;
    const list = groups.get(e.experiment.groupId) ?? [];
    list.push(e);
    groups.set(e.experiment.groupId, list);
  }
  const experiments: ExperimentResult[] = [...groups.entries()]
    .map(([groupId, list]) => {
      const sorted = [...list].sort((a, b) => a.experiment!.take.localeCompare(b.experiment!.take));
      const takes = sorted.map((e) => ({
        take: e.experiment!.take,
        label: e.experiment!.label,
        score: e.rating?.score ?? null,
        entryId: e.id,
      }));
      const scored = takes.filter((t) => t.score !== null);
      let winner: string | null = null;
      if (scored.length >= 2) {
        const best = Math.max(...scored.map((t) => t.score!));
        const leaders = scored.filter((t) => t.score === best);
        winner = leaders.length === 1 ? leaders[0].take : null;
      }
      return { groupId, axis: sorted[0].experiment!.axis, createdAt: Math.min(...sorted.map((e) => e.createdAt)), takes, winner };
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  return {
    rated: rated.length,
    overall: Math.round(overall * 100) / 100,
    top,
    bottom,
    issues,
    experiments,
    byVariant: statsFrom(variants, overall),
    byPlatform: statsFrom(platforms, overall),
  };
}

/** Descriptors in the current input that your ratings say underperform (n ≥ 3, lift ≤ −1). */
export function underperformersIn(input: PromptInput, insights: Insights): DescriptorStat[] {
  if (insights.rated < MIN_RATINGS_FOR_INSIGHTS) return [];
  const present = new Set(descriptorsOf(input).map((d) => d.value));
  return insights.bottom.filter((d) => d.n >= 3 && d.lift <= -1 && present.has(d.descriptor));
}
