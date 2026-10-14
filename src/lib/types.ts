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
  /**
   * Max total negatives sent to the model. User-written negatives (avoided instruments + manual)
   * always survive; auto negatives fill the remaining budget by priority. 0 = no cap.
   */
  negativeBudget: number;
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
  /** Platform profile id used to render (e.g. "suno-v5"). */
  profileId?: string;
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

/* ------------------------------------------------------------------ */
/* Feedback loop                                                        */
/* ------------------------------------------------------------------ */

/** Problems a user can tag on a generated song. Fixed vocabulary so insights can aggregate. */
export const ISSUE_TAGS = [
  { id: "glossy", label: "Terlalu glossy / dipoles" },
  { id: "generic-chorus", label: "Chorus generik" },
  { id: "wrong-genre", label: "Genre meleset" },
  { id: "wrong-vocal", label: "Vokal tidak sesuai" },
  { id: "wrong-tempo", label: "Tempo meleset" },
  { id: "flat-dynamics", label: "Dinamika datar" },
  { id: "lyrics-mangled", label: "Lirik rusak / salah ucap" },
  { id: "ignored-excludes", label: "Exclude diabaikan" },
  { id: "great-arrangement", label: "Aransemen bagus" },
  { id: "great-vocal", label: "Vokal bagus" },
] as const;
export type IssueTag = (typeof ISSUE_TAGS)[number]["id"];

export interface Rating {
  /** 1–5 stars. */
  score: number;
  issues: IssueTag[];
  note: string;
  ratedAt: number;
}

export type ExperimentAxis = "era" | "vocalDelivery" | "density" | "tempo" | "mix";

export interface ExperimentRef {
  /** Shared by all takes generated together. */
  groupId: string;
  axis: ExperimentAxis;
  /** "A", "B", "C" */
  take: string;
  /** Human-readable value of the axis for this take. */
  label: string;
}

export interface HistoryEntry {
  id: string;
  createdAt: number;
  title: string;
  platform: Platform;
  variant: Variant;
  input: PromptInput;
  output: GeneratedPrompt;
  pinned?: boolean;
  tags?: string[];
  rating?: Rating;
  experiment?: ExperimentRef;
}
