"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ExperimentRef, GeneratedPrompt, HistoryEntry, PromptInput, Rating } from "@/lib/types";
import { promptTitle } from "@/lib/prompt/generator";
import { withDefaults } from "@/lib/prompt/defaults";
import { uid, uniq } from "@/lib/utils";

/** Rated and pinned entries are never evicted; only unrated, unpinned ones fall off past this cap. */
const MAX_UNPROTECTED = 100;
const EXPORT_FORMAT = "songprompt-history";

interface ImportResult {
  added: number;
  skipped: number;
  error?: string;
}

interface HistoryState {
  entries: HistoryEntry[];
  /** Returns the new entry id, or null when the identical prompt is already the latest entry. */
  add: (input: PromptInput, output: GeneratedPrompt, experiment?: ExperimentRef) => string | null;
  addExperiment: (takes: Array<{ input: PromptInput; output: GeneratedPrompt; experiment: ExperimentRef }>) => void;
  remove: (id: string) => void;
  clear: () => void;
  togglePin: (id: string) => void;
  setTags: (id: string, tags: string[]) => void;
  setRating: (id: string, rating: Rating | undefined) => void;
  exportJSON: () => string;
  importJSON: (text: string) => ImportResult;
}

function makeEntry(input: PromptInput, output: GeneratedPrompt, experiment?: ExperimentRef): HistoryEntry {
  return {
    id: uid(),
    createdAt: Date.now(),
    title: experiment ? `${promptTitle(input)} · take ${experiment.take}` : promptTitle(input),
    platform: output.platform,
    variant: output.variant,
    input,
    output,
    experiment,
  };
}

function prune(entries: HistoryEntry[]): HistoryEntry[] {
  let unprotected = 0;
  return entries.filter((e) => {
    if (e.pinned || e.rating) return true;
    unprotected += 1;
    return unprotected <= MAX_UNPROTECTED;
  });
}

function isEntry(x: unknown): x is HistoryEntry {
  if (!x || typeof x !== "object") return false;
  const e = x as Partial<HistoryEntry>;
  return (
    typeof e.id === "string" &&
    typeof e.createdAt === "number" &&
    !!e.input &&
    typeof e.input === "object" &&
    !!e.output &&
    typeof e.output.combined === "string" &&
    ["suno", "udio", "generic"].includes(String(e.platform))
  );
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      entries: [],

      add: (input, output, experiment) => {
        const latest = get().entries[0];
        if (!experiment && latest && !latest.experiment && latest.output.combined === output.combined) return null;
        const entry = makeEntry(input, output, experiment);
        set((s) => ({ entries: prune([entry, ...s.entries]) }));
        return entry.id;
      },

      addExperiment: (takes) => {
        const created = takes.map((t) => makeEntry(t.input, t.output, t.experiment)).reverse();
        set((s) => ({ entries: prune([...created, ...s.entries]) }));
      },

      remove: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      clear: () => set((s) => ({ entries: s.entries.filter((e) => e.pinned) })),

      togglePin: (id) => set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, pinned: !e.pinned } : e)) })),
      setTags: (id, tags) => set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, tags: uniq(tags) } : e)) })),
      setRating: (id, rating) => set((s) => ({ entries: s.entries.map((e) => (e.id === id ? { ...e, rating } : e)) })),

      exportJSON: () =>
        JSON.stringify({ format: EXPORT_FORMAT, version: 1, exportedAt: new Date().toISOString(), entries: get().entries }, null, 2),

      importJSON: (text) => {
        let data: unknown;
        try {
          data = JSON.parse(text);
        } catch {
          return { added: 0, skipped: 0, error: "File bukan JSON yang valid." };
        }
        const list = Array.isArray(data) ? data : (data as { entries?: unknown })?.entries;
        if (!Array.isArray(list)) return { added: 0, skipped: 0, error: "Format tidak dikenali — gunakan file hasil Ekspor." };
        const existing = new Set(get().entries.map((e) => e.id));
        const valid = list.filter(isEntry);
        const fresh = valid
          .filter((e) => !existing.has(e.id))
          .map((e) => ({ ...e, input: withDefaults(e.input) }));
        set((s) => ({ entries: [...fresh, ...s.entries].sort((a, b) => b.createdAt - a.createdAt) }));
        return { added: fresh.length, skipped: list.length - fresh.length };
      },
    }),
    {
      name: "aspb-history",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      migrate: (persisted) => persisted as HistoryState,
    },
  ),
);
