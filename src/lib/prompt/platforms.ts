import type { Platform, Variant } from "@/lib/types";

export interface PlatformInfo {
  id: Platform;
  label: string;
  description: string;
  /**
   * Soft character limits for each output field.
   * These change between model versions — verify against the generator you use
   * and adjust here. Exceeding them only triggers a warning, never truncation.
   */
  limits: Partial<Record<"style" | "exclude" | "prompt" | "lyrics", number>>;
}

export const PLATFORMS: Record<Platform, PlatformInfo> = {
  suno: {
    id: "suno",
    label: "Suno",
    description: "Custom Mode: Style of Music + Exclude Styles + Lyrics (metatag).",
    limits: { style: 1000, exclude: 1000, lyrics: 5000 },
  },
  udio: {
    id: "udio",
    label: "Udio",
    description: "Prompt berbasis tag + lirik bertag terpisah.",
    limits: {},
  },
  generic: {
    id: "generic",
    label: "Generic",
    description: "Brief lengkap berbahasa natural untuk generator lain atau LLM.",
    limits: {},
  },
};

export const VARIANTS: Record<Variant, { label: string; description: string }> = {
  compact: { label: "Ringkas", description: "Hanya sinyal terkuat. Cocok untuk eksperimen cepat." },
  standard: { label: "Standar", description: "Seimbang antara kontrol dan ruang kreatif model." },
  detailed: { label: "Detail", description: "Kalimat deskriptif + catatan aransemen per section." },
};
