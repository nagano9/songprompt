import { describe, expect, it } from "vitest";
import { generatePrompt, buildLyrics, smartTrim } from "./generator";
import { makeStructure, withDefaults } from "./defaults";
import { resolveProfile } from "./platforms";
import { TEMPLATES } from "./templates";
import { specificityScore } from "./suggestions";

const base = withDefaults({
  genre: "indie folk",
  moods: ["quiet tenderness"],
  bpm: 76,
  instrumentsInclude: ["felt piano"],
  structure: makeStructure([["Intro", "piano alone"], "Verse", ["Chorus", "cello enters"], "Verse", "Chorus", "Outro"], "t"),
  lyrics: "verse one line\n\nchorus line\n\nverse two line",
});

describe("generatePrompt — Suno", () => {
  it("renders style, exclude and lyrics fields with profile limits", () => {
    const out = generatePrompt(base, "suno", "standard");
    expect(out.fields.map((f) => f.key)).toEqual(["style", "exclude", "lyrics"]);
    expect(out.fields[0].limit).toBe(1000);
    expect(out.profileId).toBe("suno-v5");
  });

  it("never puts negatives in the style field", () => {
    const style = generatePrompt(base, "suno", "standard").fields[0].content.toLowerCase();
    expect(style).not.toMatch(/\bno\b|avoid|exclude/);
    expect(style).not.toContain("autotune");
  });

  it("keeps arrangement notes out of the detailed Suno style (they live in lyric tags)", () => {
    const style = generatePrompt(base, "suno", "detailed").fields[0].content;
    expect(style).not.toContain("Arrangement:");
    const generic = generatePrompt(base, "generic", "detailed").fields[0].content;
    expect(generic).toContain("ARRANGEMENT NOTES");
  });

  it("uses the older profile's 200-char style limit when selected", () => {
    const out = generatePrompt(base, "suno", "compact", resolveProfile("suno", "suno-v4"));
    expect(out.fields[0].limit).toBe(200);
    expect(out.fields[1].hint).toMatch(/tidak punya kolom Exclude/);
  });
});

describe("buildLyrics", () => {
  it("distributes paragraphs and reuses the first chorus", () => {
    const lyrics = buildLyrics(base, "standard");
    expect(lyrics).toContain("[Verse 1]\nverse one line");
    expect(lyrics).toContain("[Verse 2]\nverse two line");
    expect(lyrics.match(/chorus line/g)).toHaveLength(2);
  });

  it("puts notes on bracket lines and never uses parentheses", () => {
    const lyrics = buildLyrics(base, "standard");
    expect(lyrics).toContain("[Intro]\n[piano alone]");
    expect(lyrics).not.toMatch(/\(/);
  });

  it("drops notes in compact variant", () => {
    expect(buildLyrics(base, "compact")).not.toContain("[piano alone]");
  });

  it("respects lyrics the user already tagged", () => {
    const tagged = "[Verse 1]\nmine\n[Chorus]\nhook";
    expect(buildLyrics({ ...base, lyrics: tagged }, "standard")).toBe(tagged);
  });

  it("never drops leftover paragraphs", () => {
    const input = { ...base, structure: makeStructure(["Verse"], "x"), lyrics: "a\n\nb\n\nc" };
    const out = buildLyrics(input, "standard");
    expect(out).toContain("a");
    expect(out).toContain("b");
    expect(out).toContain("c");
  });

  it("marks instrumental tracks", () => {
    const out = buildLyrics({ ...base, vocal: { ...base.vocal, type: "instrumental" } }, "standard");
    expect(out.startsWith("[Instrumental]")).toBe(true);
    expect(out).not.toContain("verse one line");
  });
});

describe("templates", () => {
  it.each(TEMPLATES.map((t) => [t.name, t]))("%s fits the Suno v5 style limit in every variant", (_name, t) => {
    const input = withDefaults(t.input);
    for (const v of ["compact", "standard", "detailed"] as const) {
      expect(generatePrompt(input, "suno", v).fields[0].content.length).toBeLessThanOrEqual(1000);
    }
  });

  it.each(TEMPLATES.map((t) => [t.name, t]))("%s scores as highly specific", (_name, t) => {
    expect(specificityScore(withDefaults(t.input)).score).toBeGreaterThanOrEqual(80);
  });
});

describe("1000-character limit and output settings", () => {
  it("defaults Udio prompt limit to 1000 characters", () => {
    const out = generatePrompt(base, "udio", "standard");
    const promptField = out.fields.find((f) => f.key === "prompt");
    expect(promptField?.limit).toBe(1000);
    expect(promptField?.content.length).toBeLessThanOrEqual(1000);
  });

  it("defaults Generic music brief limit to 1000 characters", () => {
    const out = generatePrompt(base, "generic", "compact");
    const briefField = out.fields.find((f) => f.key === "brief");
    expect(briefField?.limit).toBe(1000);
    expect(briefField?.content.length).toBeLessThanOrEqual(1000);
  });

  it("smartTrim trims cleanly without splitting words when exceeding limit", () => {
    const longText = "indie folk, quiet tenderness, acoustic guitar, felt piano, tape saturation, warm analog master, gentle vocal delivery, nostalgic longing, bittersweet feeling, lo-fi drum machine, vintage compression";
    const trimmed = smartTrim(longText, 60);
    expect(trimmed.length).toBeLessThanOrEqual(60);
    expect(trimmed).not.toMatch(/[,;\s]$/);
  });

  it("enforces autoTrim option when prompt exceeds maxPromptLength", () => {
    const veryLongInput = withDefaults({
      genre: "progressive post-rock symphonic fusion",
      subgenres: ["cinematic post-rock", "ambient math rock", "neo-classical crescendo", "modern orchestral drone"],
      moods: ["overwhelming awe", "existential contemplation", "transcendent euphoria", "melancholic grandeur"],
      instrumentsInclude: ["grand piano", "chamber cellos", "distorted electric guitar", "modular synthesizer", "glockenspiel", "timpani", "brass ensemble"],
    });

    const out = generatePrompt(veryLongInput, "suno", "detailed", resolveProfile("suno"), {
      autoTrim: true,
      maxPromptLength: 200,
    });

    const styleField = out.fields.find((f) => f.key === "style");
    expect(styleField).toBeDefined();
    expect(styleField!.content.length).toBeLessThanOrEqual(200);
  });
});

