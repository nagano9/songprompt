export type Platform = "suno" | "udio" | "generic";
export type Variant = "compact" | "standard" | "detailed";

export type VocalType = "unspecified" | "female" | "male" | "duet" | "choir" | "instrumental";

export const SECTION_NAMES = [
  "Intro",
  "Verse",
  "Pre-Chorus",
  "Chorus",
  "Post-Chorus",
  "Hook",
  "Bridge",
  "Instrumental Break",
  "Solo",
  "Breakdown",
  "Outro",
] as const;
export type SectionName = (typeof SECTION_NAMES)[number];

/** Sections that normally carry no sung lyrics. Used when distributing lyric paragraphs. */
export const INSTRUMENTAL_SECTIONS: ReadonlySet<SectionName> = new Set<SectionName>([
  "Intro",
  "Instrumental Break",
  "Solo",
  "Breakdown",
]);

export interface SongSection {
  id: string;
  name: SectionName;
  /** Arrangement / production note for this section, e.g. "only voice and piano". */
  note: string;
}

export interface VocalSpec {
  type: VocalType;
  timbre: string;
  delivery: string;
  accent: string;
  language: string;
}

export interface ProductionSpec {
  era: string;
  mixStyle: string;
  texture: string;
  space: string;
}

export interface PromptInput {
  genre: string;
  subgenres: string[];
  moods: string[];
  emotionalArc: string;
  bpm: number | null;
  tempoFeel: string;
  keyMode: string;
  structure: SongSection[];
  instrumentsInclude: string[];
  instrumentsAvoid: string[];
  vocal: VocalSpec;
  production: ProductionSpec;
  negativesManual: string[];
  useDefaultNegatives: boolean;
  strongAntiSlop: boolean;
  theme: string;
  lyrics: string;
  references: string;
}

export interface PromptField {
  key: string;
  label: string;
  content: string;
  /** Soft character limit for the destination field, if known. */
  limit?: number;
  hint?: string;
}

export interface GeneratedPrompt {
  platform: Platform;
  variant: Variant;
  fields: PromptField[];
  /** All fields joined with headers — what "Copy semua" puts on the clipboard. */
  combined: string;
}

export type SuggestionLevel = "warning" | "tip" | "info";

export interface SuggestionAction {
  label: string;
  apply: (input: PromptInput) => PromptInput;
}

export interface Suggestion {
  id: string;
  level: SuggestionLevel;
  title: string;
  detail: string;
  actions?: SuggestionAction[];
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  tags: string[];
  input: Partial<PromptInput>;
}

export interface HistoryEntry {
  id: string;
  createdAt: number;
  title: string;
  platform: Platform;
  variant: Variant;
  input: PromptInput;
  output: GeneratedPrompt;
}
