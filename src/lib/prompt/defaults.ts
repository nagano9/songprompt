import type { PromptInput, SectionName, SongSection } from "@/lib/types";
import { DEFAULT_NEGATIVE_BUDGET } from "./negatives";

/** Build a structure from section names. Ids are deterministic so SSR and client markup match. */
export function makeStructure(
  sections: Array<SectionName | [SectionName, string]>,
  prefix = "s",
): SongSection[] {
  return sections.map((s, i) => {
    const [name, note] = Array.isArray(s) ? s : [s, ""];
    return { id: `${prefix}-${i}`, name, note };
  });
}

export const STRUCTURE_PRESETS: Array<{ id: string; label: string; sections: SectionName[] }> = [
  {
    id: "vc",
    label: "Verse–Chorus",
    sections: ["Intro", "Verse", "Chorus", "Verse", "Chorus", "Outro"],
  },
  {
    id: "vpcb",
    label: "Pop penuh (Pre-Chorus + Bridge)",
    sections: ["Intro", "Verse", "Pre-Chorus", "Chorus", "Verse", "Pre-Chorus", "Chorus", "Bridge", "Chorus", "Outro"],
  },
  {
    id: "aaba",
    label: "AABA (klasik)",
    sections: ["Verse", "Verse", "Bridge", "Verse", "Outro"],
  },
  {
    id: "build",
    label: "Slow build (tanpa chorus)",
    sections: ["Intro", "Verse", "Verse", "Instrumental Break", "Verse", "Outro"],
  },
  {
    id: "inst",
    label: "Instrumental",
    sections: ["Intro", "Verse", "Breakdown", "Verse", "Solo", "Outro"],
  },
];

export const DEFAULT_INPUT: PromptInput = {
  genre: "",
  subgenres: [],
  moods: [],
  emotionalArc: "",
  bpm: null,
  tempoFeel: "",
  keyMode: "",
  structure: makeStructure(STRUCTURE_PRESETS[0].sections, "default"),
  instrumentsInclude: [],
  instrumentsAvoid: [],
  vocal: { type: "unspecified", timbre: "", delivery: "", accent: "", language: "" },
  production: { era: "", mixStyle: "", texture: "", space: "" },
  negativesManual: [],
  useDefaultNegatives: true,
  strongAntiSlop: true,
  negativeBudget: DEFAULT_NEGATIVE_BUDGET,
  theme: "",
  lyrics: "",
  references: "",
};

/** Deep-ish merge of a partial input onto the defaults (nested vocal/production merged). */
export function withDefaults(partial: Partial<PromptInput>): PromptInput {
  return {
    ...DEFAULT_INPUT,
    ...partial,
    vocal: { ...DEFAULT_INPUT.vocal, ...(partial.vocal ?? {}) },
    production: { ...DEFAULT_INPUT.production, ...(partial.production ?? {}) },
    structure: partial.structure ?? DEFAULT_INPUT.structure,
  };
}

/** Quick-pick chips shown under the tag inputs. Written in English: generators parse it best. */
export const CHIP_SUGGESTIONS = {
  genres: ["indie folk", "neo soul", "shoegaze", "boom bap hip hop", "garage rock", "lo-fi hip hop", "keroncong", "city pop", "post-rock", "neoclassical"],
  moods: ["bittersweet resignation", "wistful nostalgia", "quiet tenderness", "defiant adrenaline", "hazy euphoria", "claustrophobic dread", "slow-burning hope", "sly playfulness"],
  instruments: ["fingerpicked acoustic guitar", "felt piano", "Fender Rhodes", "upright bass", "brushed drums", "string quartet", "analog synth bass", "muted trumpet", "fuzz guitar", "gamelan"],
};
