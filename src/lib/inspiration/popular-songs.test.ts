import { describe, expect, it } from "vitest";
import { POPULAR_SONGS, filterSongs, songToPromptInput } from "./popular-songs";

describe("Popular Songs Inspiration Catalog", () => {
  it("contains curated reference tracks", () => {
    expect(POPULAR_SONGS.length).toBeGreaterThanOrEqual(25);
    for (const song of POPULAR_SONGS) {
      expect(song.title).toBeTruthy();
      expect(song.artist).toBeTruthy();
      expect(song.instruments.length).toBeGreaterThan(0);
      expect(song.bpm).toBeGreaterThan(30);
      expect(song.keyMode).toBeTruthy();
      expect(song.secret).toBeTruthy();
    }
  });

  it("filters by genre properly", () => {
    const popId = filterSongs("pop-id", "all", "");
    expect(popId.length).toBeGreaterThan(0);
    expect(popId.every((s) => s.region === "id")).toBe(true);

    const rock = filterSongs("rock-alt", "all", "");
    expect(rock.length).toBeGreaterThan(0);
    expect(rock.some((s) => s.title === "Creep")).toBe(true);
  });

  it("filters by region properly", () => {
    const indonesia = filterSongs("all", "id", "");
    expect(indonesia.every((s) => s.region === "id")).toBe(true);
    expect(indonesia.some((s) => s.artist === "Sheila on 7")).toBe(true);

    const global = filterSongs("all", "global", "");
    expect(global.every((s) => s.region === "global")).toBe(true);
    expect(global.some((s) => s.artist === "Tracy Chapman")).toBe(true);
  });

  it("filters by search query (instrument, title, artist)", () => {
    const searchStrat = filterSongs("all", "all", "Stratocaster");
    expect(searchStrat.length).toBeGreaterThan(0);
    expect(searchStrat.some((s) => s.title === "Dan")).toBe(true);

    const searchKendang = filterSongs("all", "all", "kendang");
    expect(searchKendang.length).toBeGreaterThan(0);
    expect(searchKendang.some((s) => s.title === "Pamer Bojo" || s.title === "Begadang")).toBe(true);
  });

  it("converts a popular song into prompt input parameters preserving user lyrics", () => {
    const dan = POPULAR_SONGS.find((s) => s.title === "Dan")!;
    const input = songToPromptInput(dan, "Bait lirik saya sendiri");

    expect(input.genre).toBe(dan.genre);
    expect(input.bpm).toBe(116);
    expect(input.instrumentsInclude).toEqual(dan.instruments);
    expect(input.instrumentsAvoid).toEqual(dan.instrumentsAvoid);
    expect(input.lyrics).toBe("Bait lirik saya sendiri");
    expect(input.vocal?.type).toBe("male");
    expect(input.production?.era).toBe(dan.production.era);
  });
});
