import { describe, expect, it } from "vitest";
import { analyzeLyrics, countSyllables, detectHook, detectLang, findCliches, parseSections, rhymeKey, syllablesEnWord, syllablesIdWord } from "./analyze";

describe("Indonesian syllables", () => {
  it.each([
    ["pantai", 2],
    ["kalau", 2],
    ["harimau", 3],
    ["bau", 2],
    ["air", 2],
    ["kertas", 2],
    ["menyimpan", 3],
    ["survei", 2],
  ])("%s → %i", (word, n) => expect(syllablesIdWord(word)).toBe(n));

  it("counts a line including hyphenated reduplication", () => {
    expect(countSyllables("bintang-bintang di langit", "id")).toBe(7);
  });
});

describe("English syllables (approximate)", () => {
  it.each([
    ["love", 1],
    ["fire", 1],
    ["river", 2],
    ["morning", 2],
    ["remember", 3],
  ])("%s → %i", (word, n) => expect(syllablesEnWord(word)).toBe(n));
});

describe("rhyme", () => {
  it("keys on the last vowel group + coda", () => {
    expect(rhymeKey("di laci lemari", "id")).toBe("i");
    expect(rhymeKey("tulisanmu miring ke kanan", "id")).toBe("an");
    expect(rhymeKey("all through the night", "en")).toBe(rhymeKey("in the light", "en"));
  });

  it("builds an AABB scheme and marks unrhymed lines", () => {
    const a = analyzeLyrics("[Verse 1]\naku di jalan\nmenunggu bulan\nkau tak datang\nhujan turun", "Indonesian");
    expect(a.sections[0].scheme).toBe("AA––");
  });
});

describe("clichés", () => {
  it("matches whole phrases only", () => {
    expect(findCliches("the foreshadows fall")).toEqual([]);
    expect(findCliches("in the shadows we wait")).toContain("shadows");
    expect(findCliches("Air mata jatuh")).toContain("air mata");
  });
});

describe("parsing & hook", () => {
  it("treats a bracket line after a section tag as a note, not a section", () => {
    const sections = parseSections("[Verse 1]\n[guitar only]\nline one\n[Chorus]\nhook line");
    expect(sections.map((s) => s.label)).toEqual(["Verse 1", "Chorus"]);
    expect(sections[0].lines).toEqual(["line one"]);
  });

  it("falls back to paragraphs when there are no tags", () => {
    expect(parseSections("a\nb\n\nc").map((s) => s.label)).toEqual(["Bait 1", "Bait 2"]);
  });

  it("finds the most repeated phrase", () => {
    expect(detectHook(["aku masih di sini", "kau pergi jauh", "aku masih di sini"])).toBe("aku masih di sini");
    expect(detectHook(["one", "two"])).toBeNull();
  });

  it("detects language from words when undeclared", () => {
    expect(detectLang("aku dan kamu di sini")).toBe("id");
    expect(detectLang("you and I in the night")).toBe("en");
  });
});

describe("findings", () => {
  it("flags a line far longer than its section", () => {
    const a = analyzeLyrics("[Verse 1]\naku pergi\nkau diam\nhujan reda\naku masih menunggu di peron stasiun yang dingin sepanjang malam", "Indonesian");
    expect(a.sections[0].lines[3].flag).toBe("long");
    expect(a.findings.some((f) => f.message.includes("jauh dari rata-rata"))).toBe(true);
  });

  it("warns about a chorus wordier than the verses", () => {
    const a = analyzeLyrics("[Verse 1]\naku pergi\nkau diam\n[Chorus]\naku masih menunggu di peron stasiun\naku masih menunggu di peron stasiun", "Indonesian");
    expect(a.findings.some((f) => f.message.includes("lebih panjang dari verse"))).toBe(true);
    expect(a.hook).toBe("aku masih menunggu di peron");
  });
});
