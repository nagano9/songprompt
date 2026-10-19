import { describe, expect, it } from "vitest";
import { findArtistInCatalog, getArtistPopularSongs, POPULAR_ARTISTS_CATALOG } from "./artist-catalog";

describe("artist-catalog", () => {
  it("contains curated legendary artists with rich popular song libraries", () => {
    expect(POPULAR_ARTISTS_CATALOG.length).toBeGreaterThanOrEqual(4);
    for (const artist of POPULAR_ARTISTS_CATALOG) {
      expect(artist.songs.length).toBeGreaterThanOrEqual(5);
      expect(artist.songs.length).toBeLessThanOrEqual(10);
      for (const song of artist.songs) {
        expect(song.title).toBeTruthy();
        expect(song.artist).toBeTruthy();
        expect(song.bpm).toBeGreaterThan(40);
        expect(song.keyMode).toBeTruthy();
        expect(song.instruments.length).toBeGreaterThan(0);
        expect(song.secret).toBeTruthy();
      }
    }
  });

  it("finds curated artist by exact or alias name", () => {
    const so7 = findArtistInCatalog("Sheila on 7");
    expect(so7).toBeDefined();
    expect(so7?.name).toBe("Sheila on 7");

    const aliasDewa = findArtistInCatalog("dewa19");
    expect(aliasDewa).toBeDefined();
    expect(aliasDewa?.name).toBe("Dewa 19");

    const queen = findArtistInCatalog("queen");
    expect(queen).toBeDefined();
    expect(queen?.name).toBe("Queen");
  });

  it("returns exactly between 5 and 10 popular songs for a known artist", () => {
    const result5 = getArtistPopularSongs("Queen", 5);
    expect(result5.songs.length).toBe(5);
    expect(result5.songs[0].title).toBe("Bohemian Rhapsody");

    const result8 = getArtistPopularSongs("Sheila on 7", 8);
    expect(result8.songs.length).toBe(8);
    expect(result8.songs[0].title).toBe("Dan");
  });

  it("handles custom or unfamiliar artist names with intelligent synthesis yielding 5 to 10 songs", () => {
    const customResult = getArtistPopularSongs("Paramore", 6);
    expect(customResult.songs.length).toBe(6);
    expect(customResult.artist).toBe("Paramore");
    expect(customResult.songs[0].artist).toBe("Paramore");
    expect(customResult.songs[0].bpm).toBeGreaterThan(50);
  });

  it("clamps requested song count between 5 and 10", () => {
    const minResult = getArtistPopularSongs("Dewa 19", 2);
    expect(minResult.songs.length).toBe(5);

    const maxResult = getArtistPopularSongs("Dewa 19", 20);
    expect(maxResult.songs.length).toBeLessThanOrEqual(10);
  });
});
