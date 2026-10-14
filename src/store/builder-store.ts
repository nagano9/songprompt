"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Platform, PromptInput, PromptTemplate, ProductionSpec, Variant, VocalSpec } from "@/lib/types";
import { DEFAULT_INPUT, withDefaults } from "@/lib/prompt/defaults";

interface BuilderState {
  input: PromptInput;
  platform: Platform;
  variant: Variant;
  activeTemplateId: string | null;

  setField: <K extends keyof PromptInput>(key: K, value: PromptInput[K]) => void;
  setVocal: (patch: Partial<VocalSpec>) => void;
  setProduction: (patch: Partial<ProductionSpec>) => void;
  replaceInput: (input: PromptInput) => void;
  setPlatform: (p: Platform) => void;
  setVariant: (v: Variant) => void;
  applyTemplate: (t: PromptTemplate) => void;
  loadFromHistory: (input: PromptInput, platform: Platform, variant: Variant) => void;
  reset: () => void;
}

/**
 * Form state. The draft is auto-saved to localStorage so a refresh never loses work.
 * `skipHydration` avoids SSR/client mismatches — rehydration is triggered in <PromptBuilder />.
 */
export const useBuilderStore = create<BuilderState>()(
  persist(
    (set) => ({
      input: DEFAULT_INPUT,
      platform: "suno",
      variant: "standard",
      activeTemplateId: null,

      setField: (key, value) => set((s) => ({ input: { ...s.input, [key]: value } })),
      setVocal: (patch) => set((s) => ({ input: { ...s.input, vocal: { ...s.input.vocal, ...patch } } })),
      setProduction: (patch) =>
        set((s) => ({ input: { ...s.input, production: { ...s.input.production, ...patch } } })),
      replaceInput: (input) => set({ input }),
      setPlatform: (platform) => set({ platform }),
      setVariant: (variant) => set({ variant }),
      applyTemplate: (t) =>
        set((s) => ({
          // Keep the user's own lyrics — a template should change the sound, not erase writing.
          input: { ...withDefaults(t.input), lyrics: s.input.lyrics || "" },
          activeTemplateId: t.id,
        })),
      loadFromHistory: (input, platform, variant) =>
        set({ input: withDefaults(input), platform, variant, activeTemplateId: null }),
      reset: () => set({ input: DEFAULT_INPUT, activeTemplateId: null }),
    }),
    {
      name: "aspb-draft",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (s) => ({
        input: s.input,
        platform: s.platform,
        variant: s.variant,
        activeTemplateId: s.activeTemplateId,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<BuilderState>;
        return { ...current, ...p, input: withDefaults(p.input ?? {}) };
      },
    },
  ),
);
