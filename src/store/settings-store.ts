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
  llmEnabled: boolean;
  llmModel: string;
  /** Kept in memory only unless rememberKey is on. */
  apiKey: string;
  rememberKey: boolean;

  setMode: (m: FormMode) => void;
  setProfile: (platform: Platform, id: string) => void;
  setOverride: (profileId: string, patch: ProfileOverrides[string] | null) => void;
  setLlm: (patch: Partial<Pick<SettingsState, "llmEnabled" | "llmModel" | "apiKey" | "rememberKey">>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      mode: "full",
      profileByPlatform: { suno: defaultProfileId("suno"), udio: defaultProfileId("udio"), generic: defaultProfileId("generic") },
      profileOverrides: {},
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
        llmEnabled: s.llmEnabled,
        llmModel: s.llmModel,
        rememberKey: s.rememberKey,
        apiKey: s.rememberKey ? s.apiKey : "",
      }),
    },
  ),
);
