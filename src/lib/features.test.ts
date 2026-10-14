import { describe, expect, it } from "vitest";
import { applyReferences, matchReferences, unknownNames } from "@/lib/references/translate";
import { findGlossaryTerms, translateTerm, translateText } from "@/lib/glossary/id-en";
import { generateTakes } from "@/lib/prompt/experiments";
import { computeInsights } from "@/lib/insights";
import { decodeShare, encodeShare, tokenFromHash } from "@/lib/share";
import { cleanRewrite } from "@/lib/llm/anthropic";
import { withDefaults } from "@/lib/prompt/defaults";
import { generatePrompt } from "@/lib/prompt/generator";
import type { HistoryEntry } from "@/lib/types";

describe("reference translator", () => {
  it("matches known artists by whole name", () => {
    const m = matchReferences("mirip Iwan Fals dan sedikit Portishead");
    expect(m.map((x) => x.entry.id)).toEqual(["iwan-fals", "portishead"]);
    expect(matchReferences("tulusan").length).toBe(0);
  });

  it("fills empty fields without overwriting the user's own values", () => {
    const input = withDefaults({ genre: "indie rock", vocal: { type: "male", timbre: "my own timbre", delivery: "", accent: "", language: "" } });
    const next = applyReferences(input, [matchReferences("iwan fals")[0].entry]);
    expect(next.genre).toBe("indie rock");
    expect(next.vocal.timbre).toBe("my own timbre");
    expect(next.vocal.delivery).toMatch(/storytelling/);
    expect(next.instrumentsInclude).toContain("harmonica");
  });

  it("lists names it does not know", () => {
    const text = "like Iwan Fals and Zaphod Beeblebrox";
    expect(unknownNames(text, matchReferences(text))).toEqual(["Zaphod Beeblebrox"]);
  });
});

describe("glossary", () => {
  it("prefers the longest phrase", () => {
    expect(findGlossaryTerms("suara serak basah").map((g) => g.id)).toEqual(["suara serak basah"]);
  });
  it("translates inside free text and as exact terms", () => {
    expect(translateText("vokal serak, sangat pelan")).toBe("vokal raspy, very slow, unhurried");
    expect(translateTerm("Galau")).toBe("restless heartache");
    expect(translateTerm("unknown")).toBeNull();
  });
});

describe("experiments", () => {
  const input = withDefaults({ genre: "folk", bpm: 100, production: { era: "", mixStyle: "", texture: "", space: "" } });

  it("changes exactly one axis", () => {
    const takes = generateTakes(input, "tempo");
    expect(takes.map((t) => t.input.bpm)).toEqual([100, 88, 112]);
    expect(takes.map((t) => t.change)).toEqual([null, "BPM 100 → 88", "BPM 100 → 112"]);
    expect(takes[1].input.genre).toBe("folk");
  });

  it("keeps take A identical to the baseline", () => {
    for (const axis of ["era", "density", "mix"] as const) {
      expect(generateTakes(input, axis)[0].input).toBe(input);
    }
  });

  it("trims instruments for the sparse density take", () => {
    const takes = generateTakes({ ...input, instrumentsInclude: ["a", "b", "c", "d"] }, "density");
    expect(takes[1].input.instrumentsInclude).toEqual(["a", "b"]);
  });
});

describe("insights", () => {
  const mk = (id: string, score: number | null, take?: string): HistoryEntry => {
    const input = withDefaults({ genre: "folk" });
    return {
      id,
      createdAt: 1,
      title: id,
      platform: "suno",
      variant: "standard",
      input,
      output: generatePrompt(input, "suno", "standard"),
      rating: score ? { score, issues: score < 3 ? ["glossy"] : [], note: "", ratedAt: 1 } : undefined,
      experiment: take ? { groupId: "g1", axis: "tempo", take, label: take } : undefined,
    };
  };

  it("computes averages, issues and experiment winners", () => {
    const ins = computeInsights([mk("a", 5, "A"), mk("b", 2, "B"), mk("c", null, "C")]);
    expect(ins.rated).toBe(2);
    expect(ins.overall).toBe(3.5);
    expect(ins.issues[0]).toMatchObject({ id: "glossy", count: 1 });
    expect(ins.experiments[0].winner).toBe("A");
    expect(ins.experiments[0].takes.map((t) => t.score)).toEqual([5, 2, null]);
  });
});

describe("share links", () => {
  it("round-trips the form through the URL hash", async () => {
    const input = withDefaults({ genre: "keroncong", lyrics: "Kertas kuning di laci\n\n— ünïcödé ✓" });
    const token = await encodeShare({ input, platform: "udio", variant: "detailed" });
    expect(tokenFromHash(`#p=${token}`)).toBe(token);
    const back = await decodeShare(token);
    expect(back?.input.lyrics).toBe(input.lyrics);
    expect(back?.platform).toBe("udio");
  });

  it("rejects garbage", async () => {
    expect(await decodeShare("zNOTVALID")).toBeNull();
    expect(await decodeShare("")).toBeNull();
  });
});

describe("llm helpers", () => {
  it("strips fences and wrappers from rewrites", () => {
    expect(cleanRewrite("```\n<lyrics>\n[Verse 1]\nhi\n</lyrics>\n```")).toBe("[Verse 1]\nhi");
  });
});
