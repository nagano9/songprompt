import type { ExperimentAxis, PromptInput } from "@/lib/types";
import { clean, uniq } from "@/lib/utils";

/**
 * Controlled A/B/C experiments: take A is the baseline, B and C change exactly ONE axis.
 * Changing one variable at a time is what makes the user's ratings interpretable later.
 */
export interface ExperimentTake {
  take: "A" | "B" | "C";
  label: string;
  input: PromptInput;
  /** Exactly what differs from the baseline, shown so takes don't look identical in a truncated preview. */
  change: string | null;
}

export const AXES: Record<ExperimentAxis, { label: string; description: string }> = {
  era: { label: "Era produksi", description: "Pendekatan rekaman: analog 70-an vs 90-an vs modern." },
  vocalDelivery: { label: "Delivery vokal", description: "Intim/berbicara vs belting vs falsetto." },
  density: { label: "Kepadatan aransemen", description: "Sangat jarang vs padat berlapis." },
  tempo: { label: "Tempo", description: "Baseline vs ±12% BPM." },
  mix: { label: "Ruang mix", description: "Kering & dekat vs basah & luas." },
};

const ERA_OPTIONS = ["late-1970s analog studio", "mid-1990s recording", "modern 2020s production"];
const DELIVERY_OPTIONS = ["intimate, almost spoken", "belted, full-chested", "airy falsetto"];

function withProduction(input: PromptInput, patch: Partial<PromptInput["production"]>): PromptInput {
  return { ...input, production: { ...input.production, ...patch } };
}

/** Pick two alternatives that differ from the current value. */
function twoAlternatives(current: string, options: string[]): [string, string] {
  const cur = clean(current).toLowerCase();
  const rest = options.filter((o) => !cur || !cur.includes(o.split(" ")[0].toLowerCase()));
  const pool = rest.length >= 2 ? rest : options;
  return [pool[0], pool[1]];
}

export function axisAvailable(input: PromptInput, axis: ExperimentAxis): boolean {
  if (axis === "vocalDelivery") return input.vocal.type !== "instrumental";
  return true;
}

export function generateTakes(input: PromptInput, axis: ExperimentAxis): ExperimentTake[] {
  const baseLabel = (v: string) => (clean(v) ? `baseline: ${clean(v)}` : "baseline (tanpa perubahan)");

  switch (axis) {
    case "era": {
      const [b, c] = twoAlternatives(input.production.era, ERA_OPTIONS);
      return [
        { take: "A", label: baseLabel(input.production.era), input, change: null },
        { take: "B", label: b, input: withProduction(input, { era: b }), change: `era → ${b}` },
        { take: "C", label: c, input: withProduction(input, { era: c }), change: `era → ${c}` },
      ];
    }
    case "vocalDelivery": {
      const [b, c] = twoAlternatives(input.vocal.delivery, DELIVERY_OPTIONS);
      return [
        { take: "A", label: baseLabel(input.vocal.delivery), input, change: null },
        { take: "B", label: b, input: { ...input, vocal: { ...input.vocal, delivery: b } }, change: `delivery → ${b}` },
        { take: "C", label: c, input: { ...input, vocal: { ...input.vocal, delivery: c } }, change: `delivery → ${c}` },
      ];
    }
    case "density": {
      const sparse = "sparse arrangement, 2–3 instruments, lots of space";
      const dense = "dense, layered arrangement";
      return [
        { take: "A", label: "baseline (aransemen apa adanya)", input, change: null },
        {
          take: "B",
          label: "sangat jarang",
          change:
            input.instrumentsInclude.length > 2
              ? `+ “${sparse}”, instrumen dipangkas ke: ${input.instrumentsInclude.slice(0, 2).join(", ")}`
              : `+ “${sparse}”`,
          input: withProduction({ ...input, instrumentsInclude: input.instrumentsInclude.slice(0, 2) }, {
            texture: uniq([input.production.texture, sparse]).join(", "),
          }),
        },
        {
          take: "C",
          label: "padat berlapis",
          change: `+ “${dense}”`,
          input: withProduction(input, { texture: uniq([input.production.texture, dense]).join(", ") }),
        },
      ];
    }
    case "tempo": {
      if (input.bpm) {
        const slow = Math.round(input.bpm * 0.88);
        const fast = Math.round(input.bpm * 1.12);
        return [
          { take: "A", label: `baseline: ${input.bpm} BPM`, input, change: null },
          { take: "B", label: `${slow} BPM (−12%)`, input: { ...input, bpm: slow }, change: `BPM ${input.bpm} → ${slow}` },
          { take: "C", label: `${fast} BPM (+12%)`, input: { ...input, bpm: fast }, change: `BPM ${input.bpm} → ${fast}` },
        ];
      }
      return [
        { take: "A", label: baseLabel(input.tempoFeel), input, change: null },
        { take: "B", label: "slow, unhurried", input: { ...input, tempoFeel: "slow, unhurried" }, change: "rasa tempo → slow, unhurried" },
        { take: "C", label: "driving, uptempo", input: { ...input, tempoFeel: "driving, uptempo" }, change: "rasa tempo → driving, uptempo" },
      ];
    }
    case "mix": {
      const dry = { mixStyle: "dry, close-miked, intimate", space: "small dead room" };
      const wet = { mixStyle: "wet, washed in reverb", space: "huge cavernous space" };
      return [
        { take: "A", label: baseLabel(input.production.space || input.production.mixStyle), input, change: null },
        { take: "B", label: "kering & dekat", input: withProduction(input, dry), change: `mix → ${dry.mixStyle}; ruang → ${dry.space}` },
        { take: "C", label: "basah & luas", input: withProduction(input, wet), change: `mix → ${wet.mixStyle}; ruang → ${wet.space}` },
      ];
    }
  }
}
