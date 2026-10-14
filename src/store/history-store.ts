"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { GeneratedPrompt, HistoryEntry, PromptInput } from "@/lib/types";
import { promptTitle } from "@/lib/prompt/generator";
import { uid } from "@/lib/utils";

const MAX_ENTRIES = 50;

interface HistoryState {
  entries: HistoryEntry[];
  /** Returns false when the identical prompt is already the latest entry (dedupe). */
  add: (input: PromptInput, output: GeneratedPrompt) => boolean;
  remove: (id: string) => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      entries: [],
      add: (input, output) => {
        const latest = get().entries[0];
        if (latest && latest.output.combined === output.combined) return false;
        const entry: HistoryEntry = {
          id: uid(),
          createdAt: Date.now(),
          title: promptTitle(input),
          platform: output.platform,
          variant: output.variant,
          input,
          output,
        };
        set((s) => ({ entries: [entry, ...s.entries].slice(0, MAX_ENTRIES) }));
        return true;
      },
      remove: (id) => set((s) => ({ entries: s.entries.filter((e) => e.id !== id) })),
      clear: () => set({ entries: [] }),
    }),
    {
      name: "aspb-history",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
