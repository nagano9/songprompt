import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { POPULAR_SONGS, type PopularSong } from "@/lib/inspiration/popular-songs";
import { getArtistPopularSongs } from "@/lib/inspiration/artist-catalog";

export interface ScanSongsRequest {
  genre?: string;
  source?: string;
  yearRange?: string;
  vibe?: string;
  vocalStyle?: string;
  tempoRange?: string;
  mood?: string;
  seed?: number | string;
  artist?: string;
  songCount?: number;
}

// In-process circuit breaker: if API key is invalid (400 API_KEY_INVALID), remember to avoid redundant failing calls
let geminiDisabled = false;

function isValidGeminiKey(key?: string): boolean {
  if (geminiDisabled) return false;
  if (!key || typeof key !== "string") return false;
  const trimmed = key.trim();
  return trimmed.startsWith("AIzaSy") && trimmed.length >= 35 && !trimmed.includes("YOUR_");
}

export async function POST(req: NextRequest) {
  try {
    const body: ScanSongsRequest = await req.json();
    const {
      artist,
      songCount = 8,
      genre = "all",
      source = "all",
      yearRange = "all",
      vibe = "all",
      vocalStyle = "all",
      tempoRange = "all",
      mood = "all",
      seed = Date.now(),
    } = body;

    const trimmedArtist = artist?.trim();

    // -------------------------------------------------------------
    // ARTIST POPULAR SONGS SEARCH (5 to 10 Popular Songs)
    // -------------------------------------------------------------
    if (trimmedArtist) {
      const targetCount = Math.min(Math.max(songCount, 5), 10);
      const apiKey = process.env.GEMINI_API_KEY;

      if (isValidGeminiKey(apiKey)) {
        try {
          const ai = new GoogleGenAI({ apiKey });

          const artistPrompt = `You are an expert musicologist and audio producer for Suno and Udio AI music generators.
Use Google Search grounding to verify the artist "${trimmedArtist}" and retrieve exactly 5 to 10 of their most iconic, verified, true popular hit songs.
Do NOT hallucinate or guess song titles. Ensure 100% factual accuracy of the artist's discography.
For each song, provide the precise musical DNA breakdown so it can be transformed into Suno/Udio prompt descriptors:
1. title and artist (real verified songs by this artist)
2. year of release
3. genre and 1-2 subgenres
4. region: "id" for Indonesian artists or "global" for international artists
5. accurate BPM and musical key (keyMode, e.g. "E major", "F# minor")
6. tempoFeel (e.g. "lazy behind-the-beat swing", "driving 4/4 pop rock pulse")
7. instruments: 3-5 specific instruments (e.g. "clean Stratocaster with chorus", "felt upright piano", "melodic bass guitar")
8. instrumentsAvoid: 3-5 negative instruments to exclude in AI prompt to prevent generic mush
9. vocal: object with type ("female" | "male" | "duet" | "choir" | "instrumental", timbre, delivery, and language)
10. production: object with era, mixStyle, texture, and space
11. moods: 2-3 specific emotions (e.g. "bittersweet longing", "nocturnal euphoria")
12. emotionalArc: brief 1-sentence note on how energy evolves from verse to chorus
13. secret: 1-sentence anti-slop production secret in Indonesian explaining why this song's arrangement works and how to avoid flat AI cliches

Output valid JSON adhering strictly to the schema.`;

          const generatePromise = ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: artistPrompt,
            config: {
              tools: [{ googleSearch: {} }],
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  songs: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        title: { type: Type.STRING },
                        artist: { type: Type.STRING },
                        year: { type: Type.INTEGER },
                        genre: { type: Type.STRING },
                        subgenres: { type: Type.ARRAY, items: { type: Type.STRING } },
                        region: { type: Type.STRING, enum: ["id", "global"] },
                        bpm: { type: Type.INTEGER },
                        keyMode: { type: Type.STRING },
                        tempoFeel: { type: Type.STRING },
                        instruments: { type: Type.ARRAY, items: { type: Type.STRING } },
                        instrumentsAvoid: { type: Type.ARRAY, items: { type: Type.STRING } },
                        vocal: {
                          type: Type.OBJECT,
                          properties: {
                            type: { type: Type.STRING, enum: ["female", "male", "duet", "choir", "instrumental", "unspecified"] },
                            timbre: { type: Type.STRING },
                            delivery: { type: Type.STRING },
                            language: { type: Type.STRING },
                            accent: { type: Type.STRING },
                          },
                          required: ["type", "timbre", "delivery"],
                        },
                        production: {
                          type: Type.OBJECT,
                          properties: {
                            era: { type: Type.STRING },
                            mixStyle: { type: Type.STRING },
                            texture: { type: Type.STRING },
                            space: { type: Type.STRING },
                          },
                          required: ["era", "mixStyle", "texture", "space"],
                        },
                        moods: { type: Type.ARRAY, items: { type: Type.STRING } },
                        emotionalArc: { type: Type.STRING },
                        secret: { type: Type.STRING },
                      },
                      required: [
                        "id",
                        "title",
                        "artist",
                        "year",
                        "genre",
                        "subgenres",
                        "region",
                        "bpm",
                        "keyMode",
                        "tempoFeel",
                        "instruments",
                        "instrumentsAvoid",
                        "vocal",
                        "production",
                        "moods",
                        "emotionalArc",
                        "secret",
                      ],
                    },
                  },
                },
                required: ["songs"],
              },
            },
          });

          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error("Gemini timeout")), 15000)
          );

          const response = await Promise.race([generatePromise, timeoutPromise]);

          if (response && response.text) {
            const parsed = JSON.parse(response.text);
            if (Array.isArray(parsed.songs) && parsed.songs.length > 0) {
              return NextResponse.json({
                success: true,
                source: "gemini-live",
                artist: trimmedArtist,
                songs: parsed.songs.slice(0, targetCount),
              });
            }
          }
        } catch (err: unknown) {
          const errMessage = err instanceof Error ? err.message : String(err);
          if (errMessage.includes("API key not valid") || errMessage.includes("API_KEY_INVALID") || errMessage.includes("403")) {
            geminiDisabled = true;
          }
        }
      }

      // If Gemini LLM failed and artist is not in curated catalog, return error instead of hallucinating songs
      const artistData = getArtistPopularSongs(trimmedArtist, targetCount);
      if (artistData) {
        return NextResponse.json({
          success: true,
          source: artistData.source,
          artist: artistData.artist,
          artistInfo: {
            genre: artistData.genre,
            era: artistData.era,
            region: artistData.region,
            summary: artistData.summary,
          },
          songs: artistData.songs,
        });
      }

      return NextResponse.json({
        success: false,
        error: `Artis "${trimmedArtist}" tidak ditemukan dalam katalog terverifikasi dan analisis real-time LLM belum berhasil. Harap pastikan kunci API Gemini valid atau pilih artis populer dari katalog.`
      }, { status: 404 });
    }

    // -------------------------------------------------------------
    // GENERAL / MULTI-CRITERIA SCAN
    // -------------------------------------------------------------
    const apiKey = process.env.GEMINI_API_KEY;

    if (isValidGeminiKey(apiKey)) {
      try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `You are an expert musicologist and audio producer for Suno and Udio AI music generators.
A music creator wants inspiration by scanning real popular songs with specific multi-dimensional criteria:
- Selected Genre: ${genre}
- Reference Chart / Source: ${source} (e.g. Billboard Hot 100, Spotify Viral Indonesia, TikTok Trending, UK Singles, K-Pop MelOn, MTV Generation, Rolling Stone 500)
- Era / Release Year Range: ${yearRange}
- Vocal Style & Lead: ${vocalStyle} (e.g. Male Baritone, Female Soprano, Duet, Raspy/Husky, Falsetto/Whisper, Melodic Autotune, Choir, Instrumental Only)
- Tempo / BPM Range: ${tempoRange} (e.g. Slow Ballad 50-75 BPM, Mid-Tempo Groove 76-105 BPM, Upbeat Dance 106-128 BPM, High Drive 129-150 BPM, Adrenaline 150+ BPM)
- Emotional Mood & Theme: ${mood} (e.g. Melancholic/Heartbreak, Euphoric/Uplifting, Romantic/Intimate, Chill/Healing, Dark/Dramatic, Nostalgic/Bittersweet, Epic/Triumphant)
- Acoustic Character / Production Vibe: ${vibe}
- Scan Seed / Iteration: ${seed} (Ensure fresh, diverse, varied song selections every time!)

Generate exactly 12 to 15 real, highly recognizable popular songs that fit these criteria.
For each song, provide the precise musical DNA breakdown:
1. title and artist (real songs)
2. year of release
3. genre and 1-2 subgenres
4. region: "id" for Indonesian songs or "global" for international songs
5. accurate BPM and musical key (keyMode, e.g. "E major", "F# minor")
6. tempoFeel (e.g. "lazy behind-the-beat swing", "driving 4/4 pop rock pulse")
7. instruments: 3-5 specific instruments (e.g. "clean Stratocaster with chorus", "felt upright piano", "melodic bass guitar")
8. instrumentsAvoid: 3-5 negative instruments to exclude in AI prompt to prevent generic mush
9. vocal: object with type ("female" | "male" | "duet" | "choir" | "instrumental", timbre, delivery, and language)
10. production: object with era, mixStyle, texture, and space
11. moods: 2-3 specific emotions (e.g. "bittersweet longing", "nocturnal euphoria")
12. emotionalArc: brief 1-sentence note on how energy evolves from verse to chorus
13. secret: 1-sentence anti-slop production secret explaining why this song's arrangement works and how to avoid flat AI cliches

Output valid JSON adhering strictly to the schema.`;

        // Timeout wrapper to ensure sub-3-second response and prevent hanging
        const generatePromise = ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
          config: {
            tools: [{ googleSearch: {} }],
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                songs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      title: { type: Type.STRING },
                      artist: { type: Type.STRING },
                      year: { type: Type.INTEGER },
                      genre: { type: Type.STRING },
                      subgenres: { type: Type.ARRAY, items: { type: Type.STRING } },
                      region: { type: Type.STRING, enum: ["id", "global"] },
                      bpm: { type: Type.INTEGER },
                      keyMode: { type: Type.STRING },
                      tempoFeel: { type: Type.STRING },
                      instruments: { type: Type.ARRAY, items: { type: Type.STRING } },
                      instrumentsAvoid: { type: Type.ARRAY, items: { type: Type.STRING } },
                      vocal: {
                        type: Type.OBJECT,
                        properties: {
                          type: { type: Type.STRING, enum: ["female", "male", "duet", "choir", "instrumental", "unspecified"] },
                          timbre: { type: Type.STRING },
                          delivery: { type: Type.STRING },
                          language: { type: Type.STRING },
                          accent: { type: Type.STRING },
                        },
                        required: ["type", "timbre", "delivery"],
                      },
                      production: {
                        type: Type.OBJECT,
                        properties: {
                          era: { type: Type.STRING },
                          mixStyle: { type: Type.STRING },
                          texture: { type: Type.STRING },
                          space: { type: Type.STRING },
                        },
                        required: ["era", "mixStyle", "texture", "space"],
                      },
                      moods: { type: Type.ARRAY, items: { type: Type.STRING } },
                      emotionalArc: { type: Type.STRING },
                      secret: { type: Type.STRING },
                    },
                    required: [
                      "id",
                      "title",
                      "artist",
                      "year",
                      "genre",
                      "subgenres",
                      "region",
                      "bpm",
                      "keyMode",
                      "tempoFeel",
                      "instruments",
                      "instrumentsAvoid",
                      "vocal",
                      "production",
                      "moods",
                      "emotionalArc",
                      "secret",
                    ],
                  },
                },
              },
              required: ["songs"],
            },
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Gemini timeout")), 3000)
        );

        const response = await Promise.race([generatePromise, timeoutPromise]);

        if (response && response.text) {
          const parsed = JSON.parse(response.text);
          if (Array.isArray(parsed.songs) && parsed.songs.length > 0) {
            return NextResponse.json({
              success: true,
              source: "gemini-live",
              songs: parsed.songs,
            });
          }
        }
      } catch (err: unknown) {
        // If the key is invalid or unauthorized, disable future calls to avoid repeated failing requests
        const errMessage = err instanceof Error ? err.message : String(err);
        if (errMessage.includes("API key not valid") || errMessage.includes("API_KEY_INVALID") || errMessage.includes("403")) {
          geminiDisabled = true;
        }
        // Gracefully and silently fall through to dynamic catalog without logging to stderr
      }
    }

    // Dynamic catalog generator with randomized shuffle & multi-dimensional filtering
    const songs = getDynamicCatalogSongs(genre, source, yearRange, vibe, vocalStyle, tempoRange, mood, seed);
    return NextResponse.json({
      success: true,
      source: "catalog-dynamic",
      songs,
    });
  } catch {
    // If request parsing fails, still return fallback catalog gracefully
    const songs = getDynamicCatalogSongs("all", "all", "all", "all", "all", "all", "all", Date.now());
    return NextResponse.json({
      success: true,
      source: "catalog-dynamic",
      songs,
    });
  }
}

function getDynamicCatalogSongs(
  genre: string,
  source: string,
  yearRange: string,
  vibe: string,
  vocalStyle: string = "all",
  tempoRange: string = "all",
  mood: string = "all",
  seed: number | string = Date.now(),
): PopularSong[] {
  let pool = [...POPULAR_SONGS];

  // 1. Filter by Genre
  if (genre !== "all") {
    const gLower = genre.toLowerCase();
    const filtered = pool.filter((s) => {
      const g = s.genre.toLowerCase();
      const subs = s.subgenres.map((x) => x.toLowerCase());
      const matchExact = g.includes(gLower) || subs.some((sub) => sub.includes(gLower));
      if (matchExact) return true;

      if (gLower === "pop-id" || gLower === "pop indonesia") {
        return s.region === "id" && (g.includes("pop") || subs.some((x) => x.includes("pop")));
      }
      if (gLower === "pop-global" || gLower === "pop") {
        return g.includes("pop") || subs.some((x) => x.includes("pop"));
      }
      if (gLower.includes("kpop") || gLower.includes("k-pop")) {
        return g.includes("k-pop") || subs.some((x) => x.includes("k-pop") || x.includes("asian"));
      }
      if (gLower.includes("rock") || gLower.includes("grunge")) {
        return g.includes("rock") || g.includes("grunge") || subs.some((x) => x.includes("rock") || x.includes("grunge"));
      }
      if (gLower.includes("punk")) {
        return subs.some((x) => x.includes("punk") || x.includes("emo"));
      }
      if (gLower.includes("metal")) {
        return subs.some((x) => x.includes("metal") || x.includes("hardcore"));
      }
      if (gLower.includes("folk") || gLower.includes("akustik")) {
        return g.includes("folk") || subs.some((x) => x.includes("folk") || x.includes("acoustic") || x.includes("chamber"));
      }
      if (gLower.includes("synth") || gLower.includes("city pop")) {
        return g.includes("synth") || g.includes("city pop") || subs.some((x) => x.includes("synth") || x.includes("city pop") || x.includes("disco"));
      }
      if (gLower.includes("soul") || gLower.includes("r&b")) {
        return g.includes("soul") || g.includes("r&b") || subs.some((x) => x.includes("soul") || x.includes("r&b") || x.includes("funk"));
      }
      if (gLower.includes("hip") || gLower.includes("trap") || gLower.includes("rap")) {
        return g.includes("hip hop") || subs.some((x) => x.includes("trap") || x.includes("rap") || x.includes("boom bap"));
      }
      if (gLower.includes("electronic") || gLower.includes("house") || gLower.includes("edm")) {
        return g.includes("electronic") || subs.some((x) => x.includes("house") || x.includes("edm") || x.includes("electronic"));
      }
      if (gLower.includes("dangdut") || gLower.includes("campursari") || gLower.includes("koplo")) {
        return g.includes("dangdut") || g.includes("campursari") || subs.some((x) => x.includes("koplo") || x.includes("campursari"));
      }
      if (gLower.includes("classic") || gLower.includes("cinematic") || gLower.includes("neoclassical")) {
        return g.includes("classical") || g.includes("neoclassical") || subs.some((x) => x.includes("classical") || x.includes("cinematic") || x.includes("soundtrack"));
      }
      if (gLower.includes("reggae")) {
        return g.includes("reggae") || subs.some((x) => x.includes("reggae") || x.includes("dub"));
      }
      return false;
    });

    if (filtered.length >= 3) {
      pool = filtered;
    }
  }

  // 2. Filter by Chart / Reference Source
  if (source !== "all") {
    if (source === "spotify-viral-id") {
      const idPool = pool.filter((s) => s.region === "id");
      if (idPool.length >= 3) pool = idPool;
    } else if (source === "billboard-hot-100" || source === "uk-charts") {
      const globalPool = pool.filter((s) => s.region === "global");
      if (globalPool.length >= 3) pool = globalPool;
    } else if (source === "tiktok-viral") {
      const viralPool = pool.filter((s) => s.year >= 2018 || s.bpm >= 115 || s.genre.includes("k-pop"));
      if (viralPool.length >= 3) pool = viralPool;
    } else if (source === "kpop-melon") {
      const kpopPool = pool.filter((s) => s.genre.includes("k-pop") || s.subgenres.some((x) => x.includes("k-pop")));
      if (kpopPool.length >= 2) pool = kpopPool;
    } else if (source === "mtv-classic") {
      const mtvPool = pool.filter((s) => s.year >= 1990 && s.year <= 2008);
      if (mtvPool.length >= 3) pool = mtvPool;
    } else if (source === "rolling-stone-500") {
      const classicPool = pool.filter((s) => s.year <= 2005);
      if (classicPool.length >= 3) pool = classicPool;
    }
  }

  // 3. Filter by Era / Year Range
  if (yearRange !== "all") {
    if (yearRange === "2024s") {
      const eraPool = pool.filter((s) => s.year >= 2024);
      if (eraPool.length >= 2) pool = eraPool;
    } else if (yearRange === "2020s") {
      const eraPool = pool.filter((s) => s.year >= 2020);
      if (eraPool.length >= 3) pool = eraPool;
    } else if (yearRange === "2010s") {
      const eraPool = pool.filter((s) => s.year >= 2010 && s.year < 2020);
      if (eraPool.length >= 3) pool = eraPool;
    } else if (yearRange === "2000s") {
      const eraPool = pool.filter((s) => s.year >= 2000 && s.year < 2010);
      if (eraPool.length >= 3) pool = eraPool;
    } else if (yearRange === "1990s") {
      const eraPool = pool.filter((s) => s.year >= 1990 && s.year < 2000);
      if (eraPool.length >= 3) pool = eraPool;
    } else if (yearRange === "1980s") {
      const eraPool = pool.filter((s) => s.year >= 1980 && s.year < 1990);
      if (eraPool.length >= 3) pool = eraPool;
    } else if (yearRange === "1970s") {
      const eraPool = pool.filter((s) => s.year >= 1970 && s.year < 1980);
      if (eraPool.length >= 3) pool = eraPool;
    } else if (yearRange === "1960s") {
      const eraPool = pool.filter((s) => s.year < 1975);
      if (eraPool.length >= 2) pool = eraPool;
    }
  }

  // 4. Filter by Vocal Style
  if (vocalStyle && vocalStyle !== "all") {
    const vStyle = vocalStyle.toLowerCase();
    const vocalPool = pool.filter((s) => {
      if (vStyle === "instrumental") return s.vocal.type === "instrumental";
      if (vStyle === "male") return s.vocal.type === "male";
      if (vStyle === "female") return s.vocal.type === "female";
      if (vStyle === "duet") return s.vocal.type === "duet";
      if (vStyle === "choir") return s.vocal.type === "choir" || s.instruments.some((i) => i.toLowerCase().includes("choir"));
      if (vStyle === "raspy") return s.vocal.timbre.toLowerCase().includes("raspy") || s.vocal.timbre.toLowerCase().includes("husky") || s.vocal.timbre.toLowerCase().includes("grit");
      if (vStyle === "falsetto") return s.vocal.timbre.toLowerCase().includes("falsetto") || s.vocal.timbre.toLowerCase().includes("whisper") || s.vocal.delivery.toLowerCase().includes("falsetto");
      return true;
    });
    if (vocalPool.length >= 3) {
      pool = vocalPool;
    }
  }

  // 5. Filter by Tempo / BPM Range
  if (tempoRange && tempoRange !== "all") {
    const tempoPool = pool.filter((s) => {
      if (tempoRange === "slow") return s.bpm <= 75;
      if (tempoRange === "mid") return s.bpm >= 76 && s.bpm <= 105;
      if (tempoRange === "upbeat") return s.bpm >= 106 && s.bpm <= 128;
      if (tempoRange === "high") return s.bpm >= 129 && s.bpm <= 150;
      if (tempoRange === "fast") return s.bpm > 150;
      return true;
    });
    if (tempoPool.length >= 3) {
      pool = tempoPool;
    }
  }

  // 6. Filter by Mood / Emotion
  if (mood && mood !== "all") {
    const mLower = mood.toLowerCase();
    const moodPool = pool.filter((s) => {
      const songMoodText = [...s.moods, s.emotionalArc].join(" ").toLowerCase();
      if (mLower === "heartbreak") return songMoodText.includes("heartbreak") || songMoodText.includes("longing") || songMoodText.includes("sorrow") || songMoodText.includes("grief");
      if (mLower === "euphoric") return songMoodText.includes("euphoria") || songMoodText.includes("optimism") || songMoodText.includes("joy") || songMoodText.includes("celebration");
      if (mLower === "romantic") return songMoodText.includes("romance") || songMoodText.includes("love") || songMoodText.includes("devotion");
      if (mLower === "chill") return songMoodText.includes("peace") || songMoodText.includes("healing") || songMoodText.includes("contentment") || songMoodText.includes("relaxed");
      if (mLower === "dark") return songMoodText.includes("dark") || songMoodText.includes("torment") || songMoodText.includes("angst") || songMoodText.includes("rage");
      if (mLower === "nostalgic") return songMoodText.includes("nostalgia") || songMoodText.includes("bittersweet") || songMoodText.includes("memory");
      if (mLower === "epic") return songMoodText.includes("catharsis") || songMoodText.includes("monumental") || songMoodText.includes("triumph") || songMoodText.includes("destiny");
      return songMoodText.includes(mLower);
    });
    if (moodPool.length >= 3) {
      pool = moodPool;
    }
  }

  // 7. Filter or Prioritize by Acoustic Vibe / Texture
  if (vibe && vibe !== "all") {
    const vLower = vibe.toLowerCase();
    const vibePool = pool.filter((s) => {
      const insText = s.instruments.join(" ").toLowerCase();
      const prodText = [s.production.mixStyle, s.production.texture, s.production.space].join(" ").toLowerCase();

      if (vLower.includes("acoustic")) {
        return insText.includes("acoustic") || insText.includes("piano") || insText.includes("nylon") || insText.includes("felt");
      }
      if (vLower.includes("band-live") || vLower.includes("live-band")) {
        return insText.includes("stratocaster") || insText.includes("drums") || prodText.includes("band") || prodText.includes("room bleed");
      }
      if (vLower.includes("vinyl") || vLower.includes("tape")) {
        return prodText.includes("tape") || prodText.includes("vinyl") || prodText.includes("saturation") || prodText.includes("analog");
      }
      if (vLower.includes("modern-polished")) {
        return prodText.includes("modern") || prodText.includes("crisp") || insText.includes("808") || prodText.includes("wide");
      }
      if (vLower.includes("synth-neon") || vLower.includes("synth")) {
        return insText.includes("synth") || insText.includes("arpeggio") || insText.includes("juno") || insText.includes("linndrum");
      }
      if (vLower.includes("heavy") || vLower.includes("distortion")) {
        return insText.includes("distorted") || insText.includes("overdriven") || prodText.includes("distortion") || s.bpm >= 125;
      }
      if (vLower.includes("etnik") || vLower.includes("nusantara")) {
        return insText.includes("kendang") || insText.includes("suling") || insText.includes("gamelan") || insText.includes("ukulele");
      }
      if (vLower.includes("symphonic") || vLower.includes("strings")) {
        return insText.includes("string") || insText.includes("orchestra") || insText.includes("violin") || insText.includes("cello");
      }
      if (vLower.includes("nocturnal")) {
        return s.moods.some((m) => m.toLowerCase().includes("nocturnal") || m.toLowerCase().includes("dreamy")) || prodText.includes("reverb");
      }
      return false;
    });

    if (vibePool.length >= 3) {
      pool = vibePool;
    }
  }

  // Safety fallback if filters produced too few tracks
  if (pool.length < 5) {
    pool = [...POPULAR_SONGS];
  }

  // Pseudo-random deterministic shuffle using seed
  const numSeed = typeof seed === "number" ? seed : String(seed).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const shuffled = [...pool].sort((a, b) => {
    const hashA = (a.id.length * 37 + a.year * 13 + a.bpm * 3 + numSeed) % 101;
    const hashB = (b.id.length * 37 + b.year * 13 + b.bpm * 3 + numSeed) % 101;
    return hashA - hashB;
  });

  return shuffled.slice(0, 15);
}
