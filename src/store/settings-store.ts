"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Platform } from "@/lib/types";
import { defaultProfileId, type ProfileOverrides } from "@/lib/prompt/platforms";
import { DEFAULT_MODEL } from "@/lib/llm/anthropic";

export type FormMode = "quick" | "full";

interface SettingsState {
  mode: FormMode;
  profileByPlatform: Record<Platform, string>;
  profileOverrides: ProfileOverrides;
  maxPromptLength: number;
  autoTrimPrompt: boolean;
  llmEnabled: boolean;
  llmModel: string;
  /** Kept in memory only unless rememberKey is on. */
  apiKey: string;
  rememberKey: boolean;

  setMode: (m: FormMode) => void;
  setProfile: (platform: Platform, id: string) => void;
  setOverride: (profileId: string, patch: ProfileOverrides[string] | null) => void;
  setMaxPromptLength: (n: number) => void;
  setAutoTrimPrompt: (v: boolean) => void;
  setAllProfilesTo1000: () => void;
  setLlm: (patch: Partial<Pick<SettingsState, "llmEnabled" | "llmModel" | "apiKey" | "rememberKey">>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      mode: "full",
      profileByPlatform: { suno: defaultProfileId("suno"), udio: defaultProfileId("udio"), generic: defaultProfileId("generic") },
      profileOverrides: {},
      maxPromptLength: 1000,
      autoTrimPrompt: false,
      llmEnabled: false,
      llmModel: DEFAULT_MODEL,
      apiKey: "",
      rememberKey: false,

      setMode: (mode) => set({ mode }),
      setProfile: (platform, id) => set((s) => ({ profileByPlatform: { ...s.profileByPlatform, [platform]: id } })),
      setOverride: (profileId, patch) =>
        set((s) => {
          const next = { ...s.profileOverrides };
          if (patch === null) delete next[profileId];
          else next[profileId] = { ...next[profileId], ...patch, limits: { ...next[profileId]?.limits, ...patch.limits } };
          return { profileOverrides: next };
        }),
      setMaxPromptLength: (maxPromptLength) => set({ maxPromptLength }),
      setAutoTrimPrompt: (autoTrimPrompt) => set({ autoTrimPrompt }),
      setAllProfilesTo1000: () =>
        set((s) => ({
          maxPromptLength: 1000,
          profileOverrides: {
            ...s.profileOverrides,
            "suno-v5": { limits: { style: 1000, exclude: 1000, lyrics: 5000 } },
            "udio": { limits: { prompt: 1000, lyrics: 5000 } },
            "generic": { limits: { brief: 1000, prompt: 1000, lyrics: 5000 } },
          },
        })),
      setLlm: (patch) => set(patch),
    }),
    {
      name: "aspb-settings",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // The API key is only written to disk when the user explicitly opts in.
      partialize: (s) => ({
        mode: s.mode,
        profileByPlatform: s.profileByPlatform,
        profileOverrides: s.profileOverrides,
        maxPromptLength: s.maxPromptLength,
        autoTrimPrompt: s.autoTrimPrompt,
        llmEnabled: s.llmEnabled,
        llmModel: s.llmModel,
        rememberKey: s.rememberKey,
        apiKey: s.rememberKey ? s.apiKey : "",
      }),
    },
  ),
);
