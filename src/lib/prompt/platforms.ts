import type { Platform, Variant } from "@/lib/types";

export type LimitKey = "style" | "exclude" | "prompt" | "lyrics" | "brief";

export const DEFAULT_MAX_PROMPT_CHARS = 1000;

/**
 * Everything the generator needs to know about one model version of one platform.
 * Kept as data (not code) so a new model release is a new entry, not a refactor —
 * and so users can override values from the UI when a platform changes before we do.
 */
export interface PlatformProfile {
  id: string;
  platform: Platform;
  /** Shown in the UI, e.g. "Suno v5 / v5.5 / v6". */
  label: string;
  /** Soft character limits per output field. Missing = unknown, no warning. */
  limits: Partial<Record<LimitKey, number>>;
  /** Platform has a dedicated negative/exclude field — negatives never go in the main prompt. */
  hasExcludeField: boolean;
  /** Platform tends to sing text in (parentheses) as backing vocals. */
  singsParentheses: boolean;
  /** ISO date the values were last checked against the live product, or null if never. */
  verifiedAt: string | null;
  /** Where the numbers come from. Suno does not publish its limits. */
  source: string;
  notes?: string;
}

export const PLATFORM_LABELS: Record<Platform, { label: string; description: string }> = {
  suno: { label: "Suno", description: "Custom Mode: Style of Music + Exclude Styles + Lyrics (metatag)." },
  udio: { label: "Udio", description: "Prompt berbasis tag + lirik bertag terpisah." },
  generic: { label: "Generic", description: "Brief lengkap berbahasa natural untuk generator lain atau LLM." },
};

/** Ordered: the first profile of each platform is its default. */
export const PLATFORM_PROFILES: PlatformProfile[] = [
  {
    id: "suno-v5",
    platform: "suno",
    label: "Suno v4.5 – v6",
    limits: { style: 1000, exclude: 1000, lyrics: 5000 },
    hasExcludeField: true,
    singsParentheses: true,
    verifiedAt: "2026-10-14",
    source: "Standar output maksimal 1000 karakter untuk Style & Exclude.",
  },
  {
    id: "suno-v4",
    platform: "suno",
    label: "Suno v4 dan lebih lama",
    limits: { style: 200, exclude: 200, lyrics: 3000 },
    hasExcludeField: false,
    singsParentheses: true,
    verifiedAt: "2026-10-14",
    source: "Pengukuran komunitas. Batas legacy 200 karakter.",
    notes: "Style 200 karakter: gunakan varian Ringkas.",
  },
  {
    id: "udio",
    platform: "udio",
    label: "Udio",
    limits: { prompt: 1000, lyrics: 5000 },
    hasExcludeField: true,
    singsParentheses: false,
    verifiedAt: "2026-10-15",
    source: "Standar output maksimal 1000 karakter untuk Prompt Udio.",
  },
  {
    id: "generic",
    platform: "generic",
    label: "Generic / LLM",
    limits: { brief: 1000, prompt: 1000, lyrics: 5000 },
    hasExcludeField: false,
    singsParentheses: false,
    verifiedAt: "2026-10-15",
    source: "Standar brief musik maksimal 1000 karakter untuk generator audio & LLM.",
  },
];

export type ProfileOverrides = Record<string, Partial<Pick<PlatformProfile, "limits" | "verifiedAt" | "hasExcludeField">>>;

export function profilesFor(platform: Platform): PlatformProfile[] {
  return PLATFORM_PROFILES.filter((p) => p.platform === platform);
}

export function defaultProfileId(platform: Platform): string {
  return profilesFor(platform)[0].id;
}

/** Resolve a profile by id, applying user overrides. Falls back to the platform default. */
export function resolveProfile(platform: Platform, profileId?: string, overrides: ProfileOverrides = {}): PlatformProfile {
  const base = profilesFor(platform).find((p) => p.id === profileId) ?? profilesFor(platform)[0];
  const o = overrides[base.id];
  if (!o) return base;
  // An override of 0 means "no known limit" (JSON cannot persist undefined).
  const limits: PlatformProfile["limits"] = { ...base.limits };
  for (const [k, v] of Object.entries(o.limits ?? {}) as Array<[LimitKey, number | undefined]>) {
    if (v === undefined) continue;
    if (v > 0) limits[k] = v;
    else delete limits[k];
  }
  return { ...base, ...o, limits };
}

/** Days since verification, or null when never verified. */
export function profileAgeDays(profile: PlatformProfile, now = Date.now()): number | null {
  if (!profile.verifiedAt) return null;
  const t = Date.parse(profile.verifiedAt);
  return Number.isFinite(t) ? Math.floor((now - t) / 86_400_000) : null;
}

export const STALE_AFTER_DAYS = 90;

export const VARIANTS: Record<Variant, { label: string; description: string }> = {
  compact: { label: "Ringkas", description: "Hanya sinyal terkuat. Cocok untuk eksperimen cepat." },
  standard: { label: "Standar", description: "Seimbang antara kontrol dan ruang kreatif model." },
  detailed: { label: "Detail", description: "Kalimat deskriptif + catatan aransemen per section." },
};
