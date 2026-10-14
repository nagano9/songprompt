"use client";

import * as React from "react";
import type { Platform } from "@/lib/types";
import { resolveProfile, type PlatformProfile } from "@/lib/prompt/platforms";
import { computeInsights, type Insights } from "@/lib/insights";
import { useHistoryStore } from "@/store/history-store";
import { useSettingsStore } from "@/store/settings-store";

/** Active profile for a platform, with the user's overrides applied. */
export function useActiveProfile(platform: Platform): PlatformProfile {
  const id = useSettingsStore((s) => s.profileByPlatform[platform]);
  const overrides = useSettingsStore((s) => s.profileOverrides);
  return React.useMemo(() => resolveProfile(platform, id, overrides), [platform, id, overrides]);
}

/** Insights recomputed only when history changes. */
export function useInsights(): Insights {
  const entries = useHistoryStore((s) => s.entries);
  return React.useMemo(() => computeInsights(entries), [entries]);
}
