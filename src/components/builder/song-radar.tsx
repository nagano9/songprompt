"use client";

import * as React from "react";
import {
  Radio,
  Sparkles,
  RotateCw,
  Search,
  Volume2,
  Info,
  Check,
  Disc,
  ChevronDown,
  ChevronUp,
  Flame,
  Calendar,
  Globe2,
  Music2,
  SlidersHorizontal,
  Mic2,
  Activity,
  RotateCcw,
  Layers,
  Copy,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { songToPromptInput, type PopularSong } from "@/lib/inspiration/popular-songs";
import { getArtistPopularSongs } from "@/lib/inspiration/artist-catalog";
import { useBuilderStore } from "@/store/builder-store";
import { useSettingsStore } from "@/store/settings-store";
import { cn } from "@/lib/utils";

// Comprehensive categorized genres with 35+ rich options
export const SCAN_GENRE_GROUPS = [
  {
    group: "Umum",
    options: [{ id: "all", label: "✨ Semua Genre Musik" }],
  },
  {
    group: "Pop & Mainstream",
    options: [
      { id: "pop-id", label: "🇮🇩 Pop Indonesia & Balada" },
      { id: "pop-global", label: "🌍 Pop Barat / Billboard Hot 100" },
      { id: "kpop-jpop", label: "🌸 K-Pop & Asian Pop Modern" },
      { id: "synthpop", label: "⚡ Synthpop & Electropop" },
      { id: "dream-pop", label: "☁️ Dream Pop & Bedroom Pop" },
    ],
  },
  {
    group: "Rock & Heavy",
    options: [
      { id: "rock-alt", label: "🎸 Rock, Alt & Grunge 90s" },
      { id: "pop-punk", label: "🛹 Pop-Punk & Emo 2000s" },
      { id: "garage-punk", label: "⚡ Garage Rock & Post-Punk" },
      { id: "classic-rock", label: "🎙️ Classic Rock & Psychedelic 70s" },
      { id: "metal-heavy", label: "🔥 Heavy Metal, Metalcore & Djent" },
    ],
  },
  {
    group: "Indie & Akustik",
    options: [
      { id: "indie-folk", label: "🪵 Indie Folk & Chamber Folk" },
      { id: "acoustic-fingerstyle", label: "🎸 Akustik Fingerstyle Intim" },
      { id: "country-americana", label: "🌾 Country, Bluegrass & Americana" },
    ],
  },
  {
    group: "R&B, Soul & Funk",
    options: [
      { id: "rnb-soul", label: "🍷 Contemporary R&B & Neo-Soul" },
      { id: "motown-funk", label: "🕺 Motown Soul & Funk 70s" },
      { id: "lofi-chill", label: "☕ Lo-Fi Chillhop & Bedroom Beats" },
    ],
  },
  {
    group: "Hip-Hop & Urban",
    options: [
      { id: "hiphop-trap", label: "🎤 Modern Trap & 808 Beats" },
      { id: "boombap", label: "📻 90s Golden Era Boom Bap" },
      { id: "drill", label: "🏙️ UK / NY Drill" },
      { id: "afrobeats", label: "🥁 Afrobeats & Amapiano Groove" },
    ],
  },
  {
    group: "Electronic & Dance",
    options: [
      { id: "edm-house", label: "🎧 EDM, Progressive House & Slap" },
      { id: "synth-citypop", label: "🌆 80s Retro Synthwave & City Pop" },
      { id: "techno-club", label: "🔊 Techno, Tech-House & Club" },
      { id: "dnb-jungle", label: "⚡ Drum & Bass / Jungle 170+ BPM" },
      { id: "phonk", label: "🚗 Drift Phonk & Memphis Wave" },
    ],
  },
  {
    group: "Dangdut & Nusantara",
    options: [
      { id: "dangdut-ethnic", label: "🇮🇩 Dangdut Klasik Rhoma & Nusantara" },
      { id: "dangdut-koplo", label: "🪘 Dangdut Koplo & Kendang Rampak" },
      { id: "campursari", label: "🌾 Campursari & Pop Jawa Timuran" },
      { id: "keroncong", label: "🎻 Keroncong Modern & Pop Melayu" },
    ],
  },
  {
    group: "Sinematik & Klasik",
    options: [
      { id: "cinematic", label: "🎬 Sinematik Orkestra & Film Score" },
      { id: "neoclassical", label: "🎹 Neo-Klasik Solo Felt Piano" },
      { id: "ambient", label: "🌌 Ambient Soundscape & Drone Meditasi" },
    ],
  },
  {
    group: "Jazz, Blues & Global",
    options: [
      { id: "jazz-bossa", label: "🎷 Smooth Jazz & Bossa Nova" },
      { id: "blues", label: "🎸 Delta Blues & Blues Rock" },
      { id: "reggae-dub", label: "🌴 Roots Reggae, Dub & Ska" },
      { id: "latin-reggaeton", label: "💃 Latin Pop & Reggaeton" },
    ],
  },
];

// Flat list for fallback matching
export const SCAN_GENRES_FLAT = SCAN_GENRE_GROUPS.flatMap((g) => g.options);

export const SCAN_SOURCES = [
  { id: "spotify-viral-id", label: "🇮🇩 Spotify Top 50 Indonesia & Viral", icon: Globe2 },
  { id: "billboard-hot-100", label: "🏆 Billboard Hot 100 & Global 200", icon: Flame },
  { id: "tiktok-viral", label: "⚡ TikTok & IG Reels Viral Audio FYP", icon: Flame },
  { id: "uk-charts", label: "🇬🇧 UK Official Singles & European Hits", icon: Music2 },
  { id: "kpop-melon", label: "🌸 K-Pop MelOn & Asian Hit Parade", icon: Disc },
  { id: "mtv-classic", label: "📼 MTV 90s-2000s Generation Hits", icon: Calendar },
  { id: "rolling-stone-500", label: "📜 Rolling Stone 500 Greatest Songs", icon: Disc },
  { id: "critical-acclaim", label: "☕ Pitchfork & Curated Critics Choice", icon: Layers },
  { id: "all", label: "🌐 Semua Tangga Lagu & Kurasi", icon: Layers },
] as const;

export const SCAN_VOCALS = [
  { id: "all", label: "Bebas (Semua Tipe Vokal)" },
  { id: "male", label: "🎙️ Vokal Pria (Bariton / Tenor Hangat)" },
  { id: "female", label: "🎤 Vokal Perempuan (Soprano / Mezzo Intim)" },
  { id: "duet", label: "👥 Duet Harmonis (Pria & Wanita)" },
  { id: "raspy", label: "⚡ Vokal Serak / Raspy / Raw Soul" },
  { id: "falsetto", label: "🕊️ Vokal Falsetto / Ethereal / Whispery" },
  { id: "autotune", label: "🤖 Melodic Autotune / Trap Harmonizer" },
  { id: "choir", label: "⛪ Paduan Suara / Layered Choir Megah" },
  { id: "instrumental", label: "🎹 Instrumental Saja (Tanpa Vokal)" },
] as const;

export const SCAN_TEMPOS = [
  { id: "all", label: "Semua Tempo (BPM Bebas)" },
  { id: "slow", label: "🌙 Slow Ballad & Downtempo (50–75 BPM)" },
  { id: "mid", label: "☕ Mid-Tempo Groove (76–105 BPM)" },
  { id: "upbeat", label: "⚡ Upbeat Dance & Radio Pop (106–128 BPM)" },
  { id: "high", label: "🚀 High-Drive & Sprint (129–150 BPM)" },
  { id: "fast", label: "💥 Fast & Adrenaline (150+ BPM)" },
] as const;

export const SCAN_MOODS = [
  { id: "all", label: "Semua Suasana Hati" },
  { id: "heartbreak", label: "💔 Galau, Patah Hati & Melankolis" },
  { id: "euphoric", label: "☀️ Ceria, Semangat & Euforia" },
  { id: "romantic", label: "🕯️ Romantis, Hangat & Penuh Cinta" },
  { id: "chill", label: "🛋️ Santai, Cozy, Chill & Healing" },
  { id: "dark", label: "🌌 Gelap, Misterius & Tegang" },
  { id: "nostalgic", label: "🌧️ Rindu, Nostalgia & Sentimental" },
  { id: "epic", label: "⚔️ Megah, Epik & Kemenangan" },
] as const;

export const SCAN_ERAS = [
  { id: "all", label: "Semua Era" },
  { id: "2024s", label: "2024–2026 (Ultra-Modern / Tren AI & TikTok)" },
  { id: "2020s", label: "2020-an (Streaming Modern & Bedroom Pop)" },
  { id: "2010s", label: "2010-an (Alt-Pop & Indie Boom)" },
  { id: "2000s", label: "2000-an (Y2K Pop-Rock, MTV & R&B Emas)" },
  { id: "1990s", label: "1990-an (Analog, Grunge, Britpop & Rock Indo)" },
  { id: "1980s", label: "1980-an (Retro Synth, Tokyo City Pop & Hair Metal)" },
  { id: "1970s", label: "1970-an (Classic Vinyl, Motown Soul & Rock)" },
  { id: "1960s", label: "1960-an (Vintage Motown, Psychedelic & British)" },
] as const;

export const SCAN_VIBES = [
  { id: "all", label: "Semua Karakter Akustik & Produksi" },
  { id: "acoustic-raw", label: "Akustik Murni & Minimalis (Felt piano, nilon, brush)" },
  { id: "band-live-90s", label: "Live Band Analog 90s (Chorus Stratocaster, bass melodik)" },
  { id: "vinyl-tape", label: "Vintage Vinyl & Tape Warmth (Analog saturation, tube warmth)" },
  { id: "modern-polished", label: "Modern Polished Commercial (Stereo wide, crisp vocal, 808 sub)" },
  { id: "synth-neon", label: "Analog Synthesizer & Neon Arpeggio (Juno-60, Moog bass)" },
  { id: "heavy-distorted", label: "Heavy & Gritty Distortion (Overdriven valve amps, live cymbal)" },
  { id: "etnik-nusantara", label: "Etnik Nusantara Fusion (Kendang koplo/rampak, suling bambu)" },
  { id: "symphonic-strings", label: "Simfonik Orkestra & Dawai (Chamber strings, French horn)" },
  { id: "nocturnal-dreamy", label: "Nocturnal, Reverb & Melamun (Night drive, atmospheric swell)" },
] as const;

interface QuickPreset {
  id: string;
  label: string;
  genre: string;
  source: string;
  vocal: string;
  tempo: string;
  era: string;
  mood: string;
  vibe: string;
}

const QUICK_INSPIRATIONS: QuickPreset[] = [
  {
    id: "indo-galau-2024",
    label: "🇮🇩 Hits Galau Indo 2024",
    genre: "pop-id",
    source: "spotify-viral-id",
    vocal: "female",
    tempo: "slow",
    era: "2020s",
    mood: "heartbreak",
    vibe: "acoustic-raw",
  },
  {
    id: "billboard-banger",
    label: "🏆 Billboard Hot 100",
    genre: "pop-global",
    source: "billboard-hot-100",
    vocal: "all",
    tempo: "upbeat",
    era: "2020s",
    mood: "euphoric",
    vibe: "modern-polished",
  },
  {
    id: "koplo-modern",
    label: "🪘 Koplo Jawa Modern",
    genre: "dangdut-koplo",
    source: "spotify-viral-id",
    vocal: "male",
    tempo: "high",
    era: "2020s",
    mood: "euphoric",
    vibe: "etnik-nusantara",
  },
  {
    id: "grunge-90s",
    label: "🎸 90s Grunge & Alt-Rock",
    genre: "rock-alt",
    source: "mtv-classic",
    vocal: "male",
    tempo: "mid",
    era: "1990s",
    mood: "dark",
    vibe: "band-live-90s",
  },
  {
    id: "tokyo-citypop",
    label: "🌆 80s Tokyo City Pop",
    genre: "synth-citypop",
    source: "all",
    vocal: "female",
    tempo: "mid",
    era: "1980s",
    mood: "nostalgic",
    vibe: "synth-neon",
  },
  {
    id: "felt-piano-solo",
    label: "🎹 Neo-Klasik Felt Piano",
    genre: "neoclassical",
    source: "all",
    vocal: "instrumental",
    tempo: "slow",
    era: "all",
    mood: "chill",
    vibe: "acoustic-raw",
  },
];

// Quick Artist Suggestions for 1-Click Search
export const QUICK_ARTIST_PRESETS = [
  { name: "Sheila on 7", tag: "🇮🇩 Pop Rock" },
  { name: "Dewa 19", tag: "🇮🇩 Rock Ballad" },
  { name: "Queen", tag: "🌍 Opera Rock" },
  { name: "Taylor Swift", tag: "🌍 Synthpop/Folk" },
  { name: "The Weeknd", tag: "🌍 Dark Synthwave" },
  { name: "Coldplay", tag: "🌍 Stadium Rock" },
  { name: "Tulus", tag: "🇮🇩 Jazz Pop" },
  { name: "Hindia", tag: "🇮🇩 Indie Pop" },
  { name: "Chrisye", tag: "🇮🇩 Pop Legendaris" },
  { name: "Michael Jackson", tag: "🌍 Pop King" },
  { name: "Bruno Mars", tag: "🌍 Retro Funk" },
  { name: "Billie Eilish", tag: "🌍 Bedroom Pop" },
] as const;

export function SongRadar({ onInspirationApplied }: { onInspirationApplied?: (song: PopularSong) => void }) {
  const input = useBuilderStore((s) => s.input);
  const replaceInput = useBuilderStore((s) => s.replaceInput);
  const setMode = useSettingsStore((s) => s.setMode);

  const [isOpen, setIsOpen] = React.useState(true);
  // Navigation mode: "genre" (Multi-criteria) vs "artist" (5-10 Popular Songs by Artist)
  const [radarMode, setRadarMode] = React.useState<"genre" | "artist">("artist");

  // Genre scan states
  const [selectedGenre, setSelectedGenre] = React.useState<string>("pop-id");
  const [selectedSource, setSelectedSource] = React.useState<string>("spotify-viral-id");
  const [selectedVocal, setSelectedVocal] = React.useState<string>("all");
  const [selectedTempo, setSelectedTempo] = React.useState<string>("all");
  const [selectedEra, setSelectedEra] = React.useState<string>("all");
  const [selectedMood, setSelectedMood] = React.useState<string>("all");
  const [selectedVibe, setSelectedVibe] = React.useState<string>("all");
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  // Artist scan states (The core of the user's new request)
  const [artistInput, setArtistInput] = React.useState<string>("Sheila on 7");
  const [artistSongCount, setArtistSongCount] = React.useState<number>(8); // 5 to 10
  const [activeArtistInfo, setActiveArtistInfo] = React.useState<{
    name: string;
    genre?: string;
    era?: string;
    region?: "id" | "global";
    summary?: string;
  } | null>({
    name: "Sheila on 7",
    genre: "Pop Rock",
    era: "Late 1990s - 2000s Indonesian Pop Rock",
    region: "id",
    summary:
      "Melodi pop rock anthemic yang ramah telinga, melodi vokal yang jujur dan sing-along, permainan gitar Fender Stratocaster ber-chorus khas Eross, dan bassline melodik yang mengisi ruang.",
  });

  const [isScanning, setIsScanning] = React.useState(false);
  const [scanResults, setScanResults] = React.useState<PopularSong[]>([]);
  const [scanSourceType, setScanSourceType] = React.useState<string | null>("catalog-exact");
  const [scanCount, setScanCount] = React.useState(0);
  const [searchFilter, setSearchFilter] = React.useState("");

  const [appliedSongId, setAppliedSongId] = React.useState<string | null>(null);
  const [copiedSongId, setCopiedSongId] = React.useState<string | null>(null);
  const [inspectedSong, setInspectedSong] = React.useState<PopularSong | null>(null);

  // Initial scan on mount: load initial artist songs (Sheila on 7 as instant demonstration)
  React.useEffect(() => {
    void handleArtistScan("Sheila on 7", 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen to cross-component custom event (e.g. from ReferenceTranslator)
  React.useEffect(() => {
    const handleOpenArtist = (e: Event) => {
      const customEvent = e as CustomEvent<{ artistName: string }>;
      if (customEvent.detail?.artistName) {
        setIsOpen(true);
        setRadarMode("artist");
        setArtistInput(customEvent.detail.artistName);
        void handleArtistScan(customEvent.detail.artistName, artistSongCount);
      }
    };

    window.addEventListener("ais-open-artist-radar", handleOpenArtist);
    return () => {
      window.removeEventListener("ais-open-artist-radar", handleOpenArtist);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artistSongCount]);

  // Execute Artist 5-10 Popular Songs Scan
  const handleArtistScan = async (targetArtist?: string, countOverride?: number) => {
    const artistToScan = (targetArtist ?? artistInput).trim();
    if (!artistToScan) return;

    setIsScanning(true);
    const count = countOverride ?? artistSongCount;

    try {
      const res = await fetch("/api/scan-songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artist: artistToScan,
          songCount: count,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.songs)) {
        setScanResults(data.songs);
        setScanSourceType(data.source || "catalog-exact");
        setActiveArtistInfo({
          name: data.artist || artistToScan,
          genre: data.artistInfo?.genre,
          era: data.artistInfo?.era,
          region: data.artistInfo?.region,
          summary: data.artistInfo?.summary,
        });
        setScanCount((prev) => prev + 1);
      } else {
        const localData = getArtistPopularSongs(artistToScan, count);
        if (localData) {
          setScanResults(localData.songs);
          setScanSourceType(localData.source);
          setActiveArtistInfo({
            name: localData.artist,
            genre: localData.genre,
            era: localData.era,
            region: localData.region,
            summary: localData.summary,
          });
        } else {
          alert(data.error || `Artis "${artistToScan}" tidak ditemukan dalam katalog terverifikasi.`);
        }
      }
    } catch {
      const localData = getArtistPopularSongs(artistToScan, count);
      if (localData) {
        setScanResults(localData.songs);
        setScanSourceType(localData.source);
        setActiveArtistInfo({
          name: localData.artist,
          genre: localData.genre,
          era: localData.era,
          region: localData.region,
          summary: localData.summary,
        });
      } else {
        alert(`Gagal memuat data artis "${artistToScan}". Periksa koneksi internet Anda.`);
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleGenreScan = async (
    isReshuffle: boolean = false,
    overrideParams?: Partial<{
      genre: string;
      source: string;
      vocal: string;
      tempo: string;
      era: string;
      mood: string;
      vibe: string;
    }>,
  ) => {
    setIsScanning(true);
    const genre = overrideParams?.genre ?? selectedGenre;
    const source = overrideParams?.source ?? selectedSource;
    const vocalStyle = overrideParams?.vocal ?? selectedVocal;
    const tempoRange = overrideParams?.tempo ?? selectedTempo;
    const yearRange = overrideParams?.era ?? selectedEra;
    const mood = overrideParams?.mood ?? selectedMood;
    const vibe = overrideParams?.vibe ?? selectedVibe;

    const seed = Date.now() + (isReshuffle ? Math.floor(Math.random() * 10000) : 0);
    try {
      const res = await fetch("/api/scan-songs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genre,
          source,
          vocalStyle,
          tempoRange,
          yearRange,
          mood,
          vibe,
          seed,
        }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.songs)) {
        setScanResults(data.songs);
        setScanSourceType(data.source || "catalog-dynamic");
        setActiveArtistInfo(null);
        setScanCount((prev) => prev + 1);
      }
    } catch {
      // Quietly handle network interruption
    } finally {
      setIsScanning(false);
    }
  };

  const applyQuickPreset = (preset: QuickPreset) => {
    setSelectedGenre(preset.genre);
    setSelectedSource(preset.source);
    setSelectedVocal(preset.vocal);
    setSelectedTempo(preset.tempo);
    setSelectedEra(preset.era);
    setSelectedMood(preset.mood);
    setSelectedVibe(preset.vibe);

    void handleGenreScan(true, {
      genre: preset.genre,
      source: preset.source,
      vocal: preset.vocal,
      tempo: preset.tempo,
      era: preset.era,
      mood: preset.mood,
      vibe: preset.vibe,
    });
  };

  const resetFilters = () => {
    setSelectedGenre("all");
    setSelectedSource("all");
    setSelectedVocal("all");
    setSelectedTempo("all");
    setSelectedEra("all");
    setSelectedMood("all");
    setSelectedVibe("all");
    void handleGenreScan(true, {
      genre: "all",
      source: "all",
      vocal: "all",
      tempo: "all",
      era: "all",
      mood: "all",
      vibe: "all",
    });
  };

  const filteredSongs = React.useMemo(() => {
    if (!searchFilter.trim()) return scanResults;
    const q = searchFilter.toLowerCase().trim();
    return scanResults.filter((s) => {
      const text = [
        s.title,
        s.artist,
        s.genre,
        ...(s.subgenres || []),
        ...(s.instruments || []),
        ...(s.moods || []),
        s.keyMode,
        String(s.bpm),
        s.secret,
      ]
        .join(" ")
        .toLowerCase();
      return q.split(/\s+/).every((w) => text.includes(w));
    });
  }, [scanResults, searchFilter]);

  const handleApply = (song: PopularSong) => {
    const patch = songToPromptInput(song, input.lyrics);
    replaceInput({
      ...input,
      ...patch,
    });
    setMode("full");
    setAppliedSongId(song.id);
    onInspirationApplied?.(song);
    setTimeout(() => setAppliedSongId(null), 3000);
  };

  const handleCopyStyleSnippet = (song: PopularSong) => {
    const snippet = [
      song.genre,
      ...(song.subgenres || []),
      `${song.bpm} BPM`,
      song.keyMode,
      ...(song.instruments || []),
      song.production.era,
      song.production.mixStyle,
      song.vocal.timbre,
    ]
      .filter(Boolean)
      .join(", ");

    void navigator.clipboard.writeText(snippet);
    setCopiedSongId(song.id);
    setTimeout(() => setCopiedSongId(null), 2500);
  };

  // Count active non-default filters for genre scan
  const activeFilterCount = [
    selectedGenre !== "all",
    selectedSource !== "all",
    selectedVocal !== "all",
    selectedTempo !== "all",
    selectedEra !== "all",
    selectedMood !== "all",
    selectedVibe !== "all",
  ].filter(Boolean).length;

  return (
    <section aria-labelledby="song-radar-heading" className="space-y-3">
      {/* Module Hardware Top Rail */}
      <div className="flex items-center justify-between border-b border-border/60 pb-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-5 w-5 items-center justify-center rounded-xs bg-accent/20 text-accent-strong">
            <Radio className={cn("h-3 w-3", isScanning && "animate-pulse text-amber-500")} />
          </div>
          <div>
            <h2 id="song-radar-heading" className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
              Dynamic Song Radar · Bedah Lagu Populer & Referensi Gaya
            </h2>
          </div>
          <span className="font-mono text-[10.5px] text-muted-foreground hidden sm:inline">
            · {scanResults.length > 0 ? `${scanResults.length} Lagu Ditemukan` : "Standby"}
          </span>
          {scanSourceType === "gemini-live" ? (
            <span className="rounded-xs border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.2 font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">
              Live AI Scan
            </span>
          ) : scanSourceType?.includes("catalog") ? (
            <span className="rounded-xs border border-accent/40 bg-accent/10 px-1.5 py-0.2 font-mono text-[10px] text-accent-strong font-semibold uppercase">
              Katalog Kurasi
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen((prev) => !prev)}
            className="h-6 px-2 font-mono text-[11px] text-muted-foreground hover:text-foreground"
            aria-expanded={isOpen}
          >
            {isOpen ? (
              <>
                <span>Tutup</span>
                <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                <span>Buka Radar ({scanResults.length})</span>
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="space-y-3.5 rounded-md border border-border/80 bg-card p-3 sm:p-4 shadow-2xs">
          {/* Dual Mode Switcher: Mode Artis (5-10 Lagu Populer) vs Mode Multi-Kriteria (Genre/Chart) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-b border-border/60 pb-3">
            <div className="flex rounded-sm border border-border/80 bg-secondary/60 p-0.5" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={radarMode === "artist"}
                onClick={() => {
                  setRadarMode("artist");
                  if (activeArtistInfo) {
                    void handleArtistScan(activeArtistInfo.name, artistSongCount);
                  }
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-xs px-3 py-1.5 font-mono text-xs font-semibold transition-all",
                  radarMode === "artist"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Users className="h-3.5 w-3.5" />
                <span>Cari 5–10 Lagu Populer Artis</span>
                <span className="rounded-xs bg-accent/30 px-1 text-[9.5px] font-bold text-accent-strong uppercase">
                  Pilihan Anda
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={radarMode === "genre"}
                onClick={() => {
                  setRadarMode("genre");
                  void handleGenreScan(false);
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-xs px-3 py-1.5 font-mono text-xs font-semibold transition-all",
                  radarMode === "genre"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Filter Genre & Tangga Lagu (35+)</span>
              </button>
            </div>

            <div className="text-right text-[11px] font-mono text-muted-foreground hidden sm:block">
              {radarMode === "artist" ? (
                <span>Translasi gaya artis bebas filter copyright Suno & Udio</span>
              ) : (
                <span>Pindai tangga lagu dunia & kurasi anti-slop</span>
              )}
            </div>
          </div>

          {/* ============================================================== */}
          {/* TAB 1: MODE PENCARIAN ARTIS (5 - 10 LAGU POPULER)             */}
          {/* ============================================================== */}
          {radarMode === "artist" && (
            <div className="space-y-3.5">
              {/* Explanation Banner */}
              <div className="rounded-sm border border-accent/30 bg-accent/5 p-2.5 sm:p-3 text-xs leading-relaxed text-foreground">
                <p className="font-medium text-foreground">
                  💡 <strong className="text-accent-strong">Ide Terbaik untuk Kreator Musik AI:</strong> Masukkan nama artis favoritmu. Sistem akan menyajikan <strong>5 sampai 10 lagu paling populer</strong> dari artis tersebut dan membedah DNA akustiknya (BPM, instrumen organik, gaya vokal, era mixing).
                </p>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Kamu bisa langsung klik <strong>"Terapkan ke Prompt"</strong> untuk mentransfer karakter musik lagu tersebut tanpa mencantumkan nama artis secara langsung, sehingga <strong>100% aman dari blokir moderasi copyright Suno & Udio</strong>!
                </p>
              </div>

              {/* Artist Search Bar & Count Selector */}
              <div className="space-y-2 rounded-sm border border-border/80 bg-secondary/20 p-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={artistInput}
                      onChange={(e) => setArtistInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          void handleArtistScan();
                        }
                      }}
                      placeholder="Masukkan nama artis (contoh: Sheila on 7, Dewa 19, Queen, Taylor Swift, The Weeknd, Coldplay, Tulus)..."
                      className="h-9 w-full rounded-xs border border-input bg-card pl-9 pr-8 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground/60"
                      aria-label="Nama Artis"
                    />
                    {artistInput && (
                      <button
                        type="button"
                        onClick={() => setArtistInput("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Song Count Selector: 5, 8, 10 Songs */}
                  <div className="flex items-center gap-1.5 shrink-0 bg-card rounded-xs border border-border px-2 py-1">
                    <span className="font-mono text-[10.5px] uppercase text-muted-foreground font-semibold">
                      Jumlah:
                    </span>
                    {[5, 8, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setArtistSongCount(num);
                          if (artistInput.trim()) {
                            void handleArtistScan(artistInput, num);
                          }
                        }}
                        className={cn(
                          "rounded-xs px-2 py-0.5 font-mono text-xs font-semibold transition-all",
                          artistSongCount === num
                            ? "bg-accent text-accent-strong border border-accent/60 shadow-2xs"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {num} Lagu
                      </button>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="accent"
                    onClick={() => handleArtistScan()}
                    disabled={isScanning || !artistInput.trim()}
                    className="h-9 px-4 font-mono text-xs uppercase font-bold tracking-wider shrink-0"
                  >
                    {isScanning ? (
                      <>
                        <RotateCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Menganalisis Hits…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Cari {artistSongCount} Lagu Populer</span>
                      </>
                    )}
                  </Button>
                </div>

                {/* Quick Artist Chips for Instant Inspiration */}
                <div className="space-y-1 pt-1.5 border-t border-border/40">
                  <span className="font-mono text-[10.5px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-accent-strong" /> Rekomendasi Cepat Artis Populer:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_ARTIST_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setArtistInput(preset.name);
                          void handleArtistScan(preset.name, artistSongCount);
                        }}
                        className={cn(
                          "flex items-center gap-1 rounded-xs border px-2 py-1 font-mono text-[11px] transition-all",
                          activeArtistInfo?.name.toLowerCase() === preset.name.toLowerCase()
                            ? "border-accent bg-accent/20 text-accent-strong font-semibold shadow-2xs"
                            : "border-border/70 bg-secondary/40 text-muted-foreground hover:border-foreground/30 hover:bg-secondary hover:text-foreground",
                        )}
                      >
                        <span>{preset.name}</span>
                        <span className="text-[9.5px] opacity-70">({preset.tag})</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Artist Card */}
              {activeArtistInfo && (
                <div className="rounded-sm border border-border/80 bg-secondary/15 p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">
                        {activeArtistInfo.region === "id" ? "🇮🇩" : "🌍"} {activeArtistInfo.name}
                      </span>
                      {activeArtistInfo.genre && (
                        <span className="rounded-xs bg-secondary border border-border px-1.5 py-0.2 font-mono text-[10.5px] text-foreground font-medium">
                          {activeArtistInfo.genre}
                        </span>
                      )}
                      {activeArtistInfo.era && (
                        <span className="font-mono text-[10.5px] text-muted-foreground hidden sm:inline">
                          · {activeArtistInfo.era}
                        </span>
                      )}
                    </div>
                    {activeArtistInfo.summary && (
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-4xl">
                        {activeArtistInfo.summary}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="rounded-xs border border-accent/40 bg-accent/10 px-2 py-1 font-mono text-[11px] text-accent-strong font-semibold">
                      {filteredSongs.length} Hits Populer Ditampilkan
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: MODE PEMINDAIAN MULTI-KRITERIA (GENRE & CHART 35+)     */}
          {/* ============================================================== */}
          {radarMode === "genre" && (
            <div className="space-y-3.5">
              {/* Header Explanation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-2.5 text-xs text-muted-foreground">
                <p className="leading-relaxed">
                  Pindai referensi lagu nyata dari tangga lagu global dan nasional. Dilengkapi 35+ genre lengkap, gaya vokal, rentang BPM, suasana hati, dan rahasia aransemen anti-slop yang bervariasi di setiap pemindaian.
                </p>
                <div className="flex items-center gap-2 shrink-0 font-mono text-[10.5px] text-muted-foreground">
                  {activeFilterCount > 0 && (
                    <span className="rounded-xs bg-accent/20 px-1.5 py-0.5 text-accent-strong font-semibold">
                      {activeFilterCount} Filter Aktif
                    </span>
                  )}
                  <span>Scan #{scanCount}</span>
                </div>
              </div>

              {/* Quick Inspiration Pills */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10.5px] uppercase font-semibold text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-accent-strong" /> Inspirasi Cepat (1-Klik):
                  </span>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="font-mono text-[10.5px] text-muted-foreground hover:text-accent-strong flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="h-2.5 w-2.5" />
                      <span>Reset Filter</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_INSPIRATIONS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyQuickPreset(preset)}
                      disabled={isScanning}
                      className={cn(
                        "rounded-xs border px-2 py-1 font-mono text-[11px] transition-all",
                        selectedGenre === preset.genre && selectedSource === preset.source
                          ? "border-accent bg-accent/15 text-accent-strong font-semibold shadow-2xs"
                          : "border-border/70 bg-secondary/40 text-muted-foreground hover:border-foreground/30 hover:bg-secondary hover:text-foreground",
                      )}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tier 1 Primary Controls: Genre, Chart, Vocal Style, Tempo BPM */}
              <div className="space-y-1.5 pt-1">
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 rounded-sm border border-border/60 bg-secondary/20 p-2.5 sm:p-3">
                  {/* 1. Categorized Genre Selector */}
                  <div className="space-y-1">
                    <label htmlFor="scan-genre" className="flex items-center gap-1 font-mono text-[11px] uppercase font-semibold text-foreground">
                      <Music2 className="h-3 w-3 text-accent-strong" />
                      <span>1. Genre Musik (35+):</span>
                    </label>
                    <select
                      id="scan-genre"
                      value={selectedGenre}
                      onChange={(e) => setSelectedGenre(e.target.value)}
                      className="h-7 w-full rounded-xs border border-border bg-card px-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {SCAN_GENRE_GROUPS.map((grp) => (
                        <optgroup key={grp.group} label={grp.group} className="font-bold text-foreground">
                          {grp.options.map((g) => (
                            <option key={g.id} value={g.id} className="font-normal">
                              {g.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* 2. Chart / Reference Source */}
                  <div className="space-y-1">
                    <label htmlFor="scan-source" className="flex items-center gap-1 font-mono text-[11px] uppercase font-semibold text-foreground">
                      <Flame className="h-3 w-3 text-accent-strong" />
                      <span>2. Tangga Lagu (Chart):</span>
                    </label>
                    <select
                      id="scan-source"
                      value={selectedSource}
                      onChange={(e) => setSelectedSource(e.target.value)}
                      className="h-7 w-full rounded-xs border border-border bg-card px-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {SCAN_SOURCES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 3. Vocal Style & Character */}
                  <div className="space-y-1">
                    <label htmlFor="scan-vocal" className="flex items-center gap-1 font-mono text-[11px] uppercase font-semibold text-foreground">
                      <Mic2 className="h-3 w-3 text-accent-strong" />
                      <span>3. Karakter Vokal & Lead:</span>
                    </label>
                    <select
                      id="scan-vocal"
                      value={selectedVocal}
                      onChange={(e) => setSelectedVocal(e.target.value)}
                      className="h-7 w-full rounded-xs border border-border bg-card px-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {SCAN_VOCALS.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 4. Tempo & Energy Level (BPM) */}
                  <div className="space-y-1">
                    <label htmlFor="scan-tempo" className="flex items-center gap-1 font-mono text-[11px] uppercase font-semibold text-foreground">
                      <Activity className="h-3 w-3 text-accent-strong" />
                      <span>4. Rentang Tempo (BPM):</span>
                    </label>
                    <select
                      id="scan-tempo"
                      value={selectedTempo}
                      onChange={(e) => setSelectedTempo(e.target.value)}
                      className="h-7 w-full rounded-xs border border-border bg-card px-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {SCAN_TEMPOS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Toggle Fine-Tuning Bays (Era, Mood, Acoustic Production) */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced((prev) => !prev)}
                    className="flex items-center gap-1 font-mono text-[11px] font-semibold text-accent-strong hover:underline"
                  >
                    <SlidersHorizontal className="h-3 w-3" />
                    <span>
                      {showAdvanced ? "Sembunyikan Opsi Tambahan (Era, Mood, Akustik)" : "Tampilkan Opsi Tambahan (Era, Mood, Akustik Produksi)"}
                    </span>
                    {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                </div>

                {showAdvanced && (
                  <div className="grid gap-2.5 sm:grid-cols-3 rounded-sm border border-border/60 bg-secondary/15 p-2.5 sm:p-3 mt-1.5 transition-all">
                    {/* 5. Year Range / Era */}
                    <div className="space-y-1">
                      <label htmlFor="scan-era" className="flex items-center gap-1 font-mono text-[11px] uppercase font-semibold text-foreground">
                        <Calendar className="h-3 w-3 text-accent-strong" />
                        <span>5. Rentang Tahun (Era):</span>
                      </label>
                      <select
                        id="scan-era"
                        value={selectedEra}
                        onChange={(e) => setSelectedEra(e.target.value)}
                        className="h-7 w-full rounded-xs border border-border bg-card px-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {SCAN_ERAS.map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 6. Emotional Mood */}
                    <div className="space-y-1">
                      <label htmlFor="scan-mood" className="flex items-center gap-1 font-mono text-[11px] uppercase font-semibold text-foreground">
                        <Activity className="h-3 w-3 text-accent-strong" />
                        <span>6. Suasana Hati (Mood):</span>
                      </label>
                      <select
                        id="scan-mood"
                        value={selectedMood}
                        onChange={(e) => setSelectedMood(e.target.value)}
                        className="h-7 w-full rounded-xs border border-border bg-card px-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {SCAN_MOODS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* 7. Production Vibe */}
                    <div className="space-y-1">
                      <label htmlFor="scan-vibe" className="flex items-center gap-1 font-mono text-[11px] uppercase font-semibold text-foreground">
                        <Volume2 className="h-3 w-3 text-accent-strong" />
                        <span>7. Karakter Akustik & Produksi:</span>
                      </label>
                      <select
                        id="scan-vibe"
                        value={selectedVibe}
                        onChange={(e) => setSelectedVibe(e.target.value)}
                        className="h-7 w-full rounded-xs border border-border bg-card px-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {SCAN_VIBES.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Genre Scan Action Bar */}
              <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                <Button
                  type="button"
                  variant="accent"
                  onClick={() => handleGenreScan(false)}
                  disabled={isScanning}
                  className="h-8 px-4 font-mono text-xs uppercase tracking-wider font-semibold shadow-xs"
                >
                  {isScanning ? (
                    <>
                      <RotateCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Memindai Lagu…</span>
                    </>
                  ) : (
                    <>
                      <Radio className="h-3.5 w-3.5" />
                      <span>Scan Lagu Populer</span>
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleGenreScan(true)}
                  disabled={isScanning}
                  title="Pindai ulang untuk mendapatkan variasi lagu populer yang berbeda"
                  className="h-8 px-3 font-mono text-xs"
                >
                  <RotateCw className={cn("h-3.5 w-3.5", isScanning && "animate-spin")} />
                  <span className="hidden sm:inline">Variasi Baru</span>
                </Button>
              </div>
            </div>
          )}

          {/* Quick in-memory search filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/50 pt-3">
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span className="font-semibold text-foreground">
                {filteredSongs.length} Lagu Populer Tersedia
              </span>
              <span>· Siap diubah menjadi parameter prompt</span>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Saring judul lagu, instrumen, BPM…"
                className="h-7 w-full rounded-xs border border-input bg-card pl-8 pr-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground/60"
                aria-label="Cari dalam hasil"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 font-mono text-[10px] text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Results Grid: 5-10 Popular Songs by the Artist or Genre */}
          {isScanning ? (
            <div className="py-12 text-center space-y-3 font-mono">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xs border border-accent/40 bg-accent/10">
                <Radio className="h-5 w-5 animate-pulse text-accent-strong" />
              </div>
              <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                {radarMode === "artist"
                  ? `Menganalisis 5–10 Lagu Populer Terbesar dari ${artistInput}…`
                  : "Menganalisis Database Tangga Lagu Populer…"}
              </p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Mengekstrak instrumen kunci, BPM, aransemen vokal, dan rahasia mixing anti-slop...
              </p>
            </div>
          ) : filteredSongs.length === 0 ? (
            <div className="py-8 text-center space-y-2 font-mono text-xs text-muted-foreground">
              <p>Tidak ada lagu yang cocok dengan kata kunci "{searchFilter}".</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSearchFilter("")}
                className="font-mono text-xs"
              >
                Reset Pencarian
              </Button>
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3 pt-1">
              {filteredSongs.map((song, idx) => {
                const isApplied = appliedSongId === song.id;
                const isCopied = copiedSongId === song.id;

                // Status badges for top hits
                const hitRankLabel =
                  idx === 0
                    ? "🏆 #1 Mega Hit"
                    : idx === 1
                      ? "⭐ Iconic Track"
                      : idx === 2
                        ? "🔥 Signature Hit"
                        : `#${String(idx + 1).padStart(2, "0")}`;

                return (
                  <div
                    key={`${song.id}-${idx}`}
                    className={cn(
                      "group relative flex flex-col justify-between rounded-sm border p-3 transition-all",
                      isApplied
                        ? "border-emerald-500 bg-emerald-500/5 ring-1 ring-emerald-500/30"
                        : "border-border/80 bg-card hover:border-foreground/30 hover:bg-secondary/20",
                    )}
                  >
                    {/* Header: Track number, Title, Artist, Era, Key/BPM */}
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2 border-b border-border/40 pb-1.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold text-accent-strong">
                              {hitRankLabel}
                            </span>
                            <span className="font-bold text-xs text-foreground truncate">
                              {song.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate font-mono">
                            {song.artist} · <span className="opacity-80">{song.year}</span> ·{" "}
                            <span className="capitalize">{song.genre}</span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono text-[10px] font-semibold text-foreground tabular-nums block">
                            {song.bpm} BPM
                          </span>
                          <span className="font-mono text-[9.5px] text-muted-foreground uppercase">
                            {song.keyMode}
                          </span>
                        </div>
                      </div>

                      {/* Instruments Breakdown */}
                      <div className="space-y-1 pt-0.5">
                        <div className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                          <Volume2 className="h-3 w-3 text-accent-strong" />
                          <span>Instrumen Kunci:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {song.instruments.map((inst) => (
                            <span
                              key={inst}
                              className="rounded-xs border border-border/70 bg-secondary/60 px-1.5 py-0.5 font-mono text-[10.5px] text-foreground/90"
                            >
                              {inst}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Vocal & Secret Summary */}
                      <div className="text-[11px] leading-relaxed text-muted-foreground pt-1">
                        <p className="line-clamp-2">
                          <strong className="text-foreground font-mono text-[10.5px]">💡 Rahasia Aransemen: </strong>
                          {song.secret}
                        </p>
                      </div>
                    </div>

                    {/* Action Footer: Apply, Copy Style, and Inspect */}
                    <div className="flex items-center justify-between gap-2 pt-2.5 mt-2 border-t border-border/40">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setInspectedSong(song)}
                        className="h-7 px-2 font-mono text-[10.5px] text-muted-foreground hover:text-foreground"
                      >
                        <Info className="h-3 w-3" />
                        <span>Bedah DNA</span>
                      </Button>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyStyleSnippet(song)}
                          className="h-7 px-2 font-mono text-[10.5px]"
                          title="Salin deskriptor gaya lagu ini ke clipboard"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-500" />
                              <span className="text-emerald-500">Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span className="hidden sm:inline">Salin Gaya</span>
                            </>
                          )}
                        </Button>

                        <Button
                          type="button"
                          variant={isApplied ? "outline" : "accent"}
                          size="sm"
                          onClick={() => handleApply(song)}
                          className={cn(
                            "h-7 px-2.5 font-mono text-[11px] font-semibold transition-all",
                            isApplied && "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10",
                          )}
                        >
                          {isApplied ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Diterapkan!</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3" />
                              <span>Terapkan ke Prompt</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Inspect Song DNA Modal */}
      <Dialog open={!!inspectedSong} onOpenChange={(open) => !open && setInspectedSong(null)}>
        <DialogContent className="max-w-lg rounded-sm border-border bg-card">
          {inspectedSong && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Disc className="h-4 w-4 text-accent-strong" />
                  <DialogTitle className="font-mono text-sm uppercase tracking-wide">
                    DNA Akustik: {inspectedSong.title} — {inspectedSong.artist} ({inspectedSong.year})
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs font-mono">
                  Translasi parameter musik menjadi prompt bebas slop untuk Suno & Udio tanpa melanggar filter hak cipta nama artis.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 pt-2 text-xs">
                {/* Acoustic Specs */}
                <div className="grid grid-cols-2 gap-2 rounded-xs border border-border/80 bg-secondary/30 p-2.5 font-mono text-[11px]">
                  <div>
                    <span className="text-muted-foreground uppercase text-[10px] block">Genre & Tempo</span>
                    <span className="font-semibold text-foreground">
                      {inspectedSong.genre} · {inspectedSong.bpm} BPM
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase text-[10px] block">Kunci Nada & Feel</span>
                    <span className="font-semibold text-foreground">
                      {inspectedSong.keyMode} · {inspectedSong.tempoFeel}
                    </span>
                  </div>
                </div>

                {/* Instruments */}
                <div className="space-y-1">
                  <span className="font-mono text-[10.5px] uppercase font-bold text-muted-foreground">
                    Instrumen Yang Dipakai:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {inspectedSong.instruments.map((i) => (
                      <span key={i} className="rounded-xs border border-border bg-secondary px-1.5 py-0.5 font-mono text-[11px]">
                        {i}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Avoid list */}
                <div className="space-y-1">
                  <span className="font-mono text-[10.5px] uppercase font-bold text-destructive">
                    Instrumen Dihindari (Negative Prompt):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {inspectedSong.instrumentsAvoid.map((i) => (
                      <span
                        key={i}
                        className="rounded-xs border border-destructive/30 bg-destructive/10 px-1.5 py-0.5 font-mono text-[11px] text-destructive"
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Vocal & Mix Character */}
                <div className="grid grid-cols-2 gap-2 rounded-xs border border-border/60 bg-secondary/20 p-2 font-mono text-[11px]">
                  <div>
                    <span className="text-muted-foreground uppercase text-[10px] block">Karakter Vokal</span>
                    <span className="text-foreground">{inspectedSong.vocal.timbre}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground uppercase text-[10px] block">Mixing & Ruang</span>
                    <span className="text-foreground">{inspectedSong.production.mixStyle} ({inspectedSong.production.space})</span>
                  </div>
                </div>

                {/* Production & Secret */}
                <div className="space-y-1 rounded-xs border border-border/60 bg-secondary/20 p-2.5">
                  <span className="font-mono text-[10.5px] uppercase font-bold text-accent-strong">Rahasia Anti-Slop:</span>
                  <p className="text-[11.5px] text-foreground leading-relaxed">
                    {inspectedSong.secret}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-mono pt-1">
                    Era: {inspectedSong.production.era} · Texture: {inspectedSong.production.texture}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 pt-2 border-t border-border/40">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="font-mono text-xs"
                    onClick={() => setInspectedSong(null)}
                  >
                    Tutup
                  </Button>
                  <Button
                    type="button"
                    variant="accent"
                    size="sm"
                    className="font-mono text-xs"
                    onClick={() => {
                      handleApply(inspectedSong);
                      setInspectedSong(null);
                    }}
                  >
                    <Sparkles className="h-3.5 w-3.5" /> Terapkan ke Form Builder
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
