import { describe, expect, it } from "vitest";
import { buildSuggestions, translateDescriptors } from "./suggestions";
import { withDefaults } from "./defaults";
import { resolveProfile } from "./platforms";
import { TEMPLATES } from "./templates";
import { computeInsights } from "@/lib/insights";
import type { HistoryEntry } from "@/lib/types";
import { generatePrompt } from "./generator";

const byId = (s: ReturnType<typeof buildSuggestions>, id: string) => s.find((x) => x.id === id);

describe("suggestions", () => {
  it("offers one-click replacements for vague moods", () => {
    const input = withDefaults({ genre: "pop", moods: ["sad"] });
    const s = byId(buildSuggestions(input, "suno"), "generic-mood-sad")!;
    const next = s.actions![0].apply(input);
    expect(next.moods).toEqual(["bittersweet resignation"]);
  });

  it("detects include/avoid conflicts and fixes them", () => {
    const input = withDefaults({ instrumentsInclude: ["piano"], instrumentsAvoid: ["piano", "808"] });
    const s = byId(buildSuggestions(input, "suno"), "instrument-conflict")!;
    expect(s.actions![0].apply(input).instrumentsAvoid).toEqual(["808"]);
  });

  it("translates Indonesian descriptors", () => {
    const input = withDefaults({ genre: "folk", vocal: { type: "male", timbre: "suara serak", delivery: "mendayu", accent: "", language: "" } });
    expect(byId(buildSuggestions(input, "suno"), "glossary")).toBeDefined();
    const next = translateDescriptors(input);
    expect(next.vocal.timbre).toBe("raspy");
    expect(next.vocal.delivery).toBe("lilting, melismatic");
  });

  it("warns when the standard style exceeds an older profile's limit", () => {
    const input = withDefaults(TEMPLATES[0].input);
    const s = buildSuggestions(input, "suno", { profile: resolveProfile("suno", "suno-v4") });
    expect(byId(s, "style-too-long")?.level).toBe("warning");
    expect(byId(buildSuggestions(input, "suno"), "style-too-long")).toBeUndefined();
  });

  it("reports negatives cut by the budget", () => {
    const input = withDefaults({ genre: "indie folk", negativeBudget: 4 });
    const s = byId(buildSuggestions(input, "suno"), "negatives-dropped")!;
    expect(s.actions![0].apply(input).negativeBudget).toBe(9);
  });

  it("surfaces descriptors your own ratings say underperform", () => {
    const good = withDefaults({ genre: "indie folk", production: { era: "", mixStyle: "dry", texture: "", space: "" } });
    const bad = withDefaults({ genre: "indie folk", production: { era: "", mixStyle: "glossy wall of sound", texture: "", space: "" } });
    const entry = (input: typeof good, score: number, i: number): HistoryEntry => ({
      id: `e${i}`,
      createdAt: i,
      title: "t",
      platform: "suno",
      variant: "standard",
      input,
      output: generatePrompt(input, "suno", "standard"),
      rating: { score, issues: [], note: "", ratedAt: i },
    });
    const entries = [entry(good, 5, 1), entry(good, 5, 2), entry(good, 4, 3), entry(bad, 1, 4), entry(bad, 2, 5), entry(bad, 1, 6)];
    const insights = computeInsights(entries);
    const s = buildSuggestions(bad, "suno", { insights });
    expect(byId(s, "insight-glossy wall of sound")?.level).toBe("warning");
    expect(s[0].id).toBe("insight-glossy wall of sound");
  });
});
