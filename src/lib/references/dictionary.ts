/**
 * Reference → descriptor dictionary.
 * Suno/Udio reject artist names, so we translate a reference into the musical traits
 * that make it recognisable: era, instrumentation, vocal character, production.
 * This describes a *style*; it is not a recipe for imitating anyone's voice.
 * Entries are deliberately broad and well-documented traits of the artist/scene.
 */
export interface ReferenceTraits {
  genre?: string;
  subgenres?: string[];
  moods?: string[];
  tempoFeel?: string;
  instruments?: string[];
  era?: string;
  mixStyle?: string;
  texture?: string;
  space?: string;
  timbre?: string;
  delivery?: string;
}

export interface ReferenceEntry {
  id: string;
  /** Lowercase match terms (artist names, aliases, scene names). */
  names: string[];
  display: string;
  kind: "artist" | "scene";
  region: "id" | "global";
  traits: ReferenceTraits;
}

export const REFERENCES: ReferenceEntry[] = [
  /* ---------------- Indonesia ---------------- */
  {
    id: "chrisye", names: ["chrisye"], display: "Chrisye", kind: "artist", region: "id",
    traits: {
      genre: "Indonesian pop", subgenres: ["soft rock"], era: "late-1970s Indonesian studio pop",
      instruments: ["lush string section", "grand piano", "warm electric bass"],
      timbre: "clear, gentle tenor", delivery: "restrained, precise phrasing", mixStyle: "warm analog, vocals upfront",
    },
  },
  {
    id: "iwan-fals", names: ["iwan fals"], display: "Iwan Fals", kind: "artist", region: "id",
    traits: {
      genre: "folk", subgenres: ["protest folk"], era: "1980s Indonesian folk",
      instruments: ["strummed acoustic guitar", "harmonica"],
      timbre: "raspy, weathered baritone", delivery: "storytelling, conversational, socially pointed",
      mixStyle: "raw, live-feeling",
    },
  },
  {
    id: "koes-plus", names: ["koes plus", "koes bersaudara"], display: "Koes Plus", kind: "artist", region: "id",
    traits: {
      genre: "Indonesian pop rock", subgenres: ["beat music"], era: "early-1970s Indonesian beat group",
      instruments: ["jangly electric guitars", "combo organ", "simple live drums"],
      delivery: "plain, sing-along, close group harmonies", texture: "vintage tape warmth",
    },
  },
  {
    id: "dewa-19", names: ["dewa 19", "dewa19"], display: "Dewa 19", kind: "artist", region: "id",
    traits: {
      genre: "pop rock", subgenres: ["Indonesian rock ballad"], era: "late-1990s Indonesian rock",
      instruments: ["overdriven electric guitars", "grand piano", "live drums"],
      delivery: "dramatic, soaring choruses", mixStyle: "big but organic band sound",
    },
  },
  {
    id: "sheila-on-7", names: ["sheila on 7", "so7"], display: "Sheila on 7", kind: "artist", region: "id",
    traits: {
      genre: "pop rock", era: "late-1990s Indonesian pop rock",
      instruments: ["bright clean electric guitars", "melodic bass", "live drums"],
      timbre: "warm, youthful tenor", delivery: "easygoing, sing-along",
    },
  },
  {
    id: "payung-teduh", names: ["payung teduh"], display: "Payung Teduh", kind: "artist", region: "id",
    traits: {
      genre: "indie folk", subgenres: ["keroncong"], tempoFeel: "laid-back, swaying",
      instruments: ["nylon-string guitar", "upright bass", "cuk ukulele"],
      timbre: "soft, warm male vocal", delivery: "unhurried, poetic", space: "intimate acoustic room",
    },
  },
  {
    id: "banda-neira", names: ["banda neira"], display: "Banda Neira", kind: "artist", region: "id",
    traits: {
      genre: "indie folk", instruments: ["acoustic guitar", "piano", "glockenspiel"],
      delivery: "male-female duet, bare and poetic", mixStyle: "sparse, dry, close-miked",
    },
  },
  {
    id: "erk", names: ["efek rumah kaca", "erk"], display: "Efek Rumah Kaca", kind: "artist", region: "id",
    traits: {
      genre: "indie rock", subgenres: ["pop"], instruments: ["clean jangly guitars", "melodic bass", "live drums"],
      timbre: "soft, unforced tenor", delivery: "calm, reflective, socially conscious",
    },
  },
  {
    id: "hindia", names: ["hindia", "baskara putra"], display: "Hindia", kind: "artist", region: "id",
    traits: {
      genre: "indie pop", instruments: ["piano", "subtle synth textures", "programmed drums"],
      delivery: "confessional, conversational, spoken-word passages", era: "2020s Indonesian indie",
    },
  },
  {
    id: "nadin-amizah", names: ["nadin amizah", "nadin"], display: "Nadin Amizah", kind: "artist", region: "id",
    traits: {
      genre: "indie folk", instruments: ["fingerpicked acoustic guitar", "string section", "piano"],
      timbre: "delicate, breathy female vocal", delivery: "poetic, hushed intimacy", space: "close and warm",
    },
  },
  {
    id: "tulus", names: ["tulus"], display: "Tulus", kind: "artist", region: "id",
    traits: {
      genre: "Indonesian pop", subgenres: ["jazz pop"], instruments: ["piano", "light jazz chords", "string touches"],
      timbre: "warm, deep baritone", delivery: "smooth, articulate, gentle",
    },
  },
  {
    id: "didi-kempot", names: ["didi kempot"], display: "Didi Kempot", kind: "artist", region: "id",
    traits: {
      genre: "campursari", instruments: ["kendang", "gamelan elements", "keroncong-style guitar", "suling"],
      delivery: "melancholic crooning, sung in Javanese", moods: ["heartbroken longing"],
    },
  },
  {
    id: "rhoma-irama", names: ["rhoma irama", "soneta"], display: "Rhoma Irama", kind: "artist", region: "id",
    traits: {
      genre: "dangdut", era: "1970s–80s classic dangdut",
      instruments: ["bamboo suling flute", "kendang", "rock electric guitar", "mandolin"],
      delivery: "Malay-style melisma",
    },
  },
  {
    id: "guruh-gipsy", names: ["guruh gipsy"], display: "Guruh Gipsy", kind: "artist", region: "id",
    traits: {
      genre: "progressive rock", subgenres: ["Balinese gamelan fusion"], era: "1977 progressive rock",
      instruments: ["Balinese gamelan", "Hammond organ", "Mellotron", "electric guitar"],
    },
  },
  /* ---------------- Global artists ---------------- */
  {
    id: "nick-drake", names: ["nick drake"], display: "Nick Drake", kind: "artist", region: "global",
    traits: {
      genre: "folk", subgenres: ["chamber folk"], era: "late-1960s British folk",
      instruments: ["fingerpicked open-tuned acoustic guitar", "string arrangement"],
      timbre: "hushed, soft baritone", delivery: "introspective, understated",
    },
  },
  {
    id: "bon-iver", names: ["bon iver"], display: "Bon Iver", kind: "artist", region: "global",
    traits: {
      genre: "indie folk", instruments: ["acoustic guitar", "layered vocal harmonies"],
      timbre: "layered falsetto", texture: "lo-fi cabin recording", space: "reverb-soaked",
    },
  },
  {
    id: "joni-mitchell", names: ["joni mitchell"], display: "Joni Mitchell", kind: "artist", region: "global",
    traits: {
      genre: "singer-songwriter", subgenres: ["folk jazz"], era: "early-1970s",
      instruments: ["open-tuned acoustic guitar", "dulcimer", "piano"],
      timbre: "agile, wide-ranging soprano", delivery: "conversational, jazz-inflected phrasing",
    },
  },
  {
    id: "radiohead", names: ["radiohead"], display: "Radiohead", kind: "artist", region: "global",
    traits: {
      genre: "alternative rock", subgenres: ["art rock"],
      instruments: ["arpeggiated electric guitars", "glitchy electronics", "live drums"],
      timbre: "melancholic falsetto", moods: ["anxious melancholy"],
    },
  },
  {
    id: "portishead", names: ["portishead"], display: "Portishead", kind: "artist", region: "global",
    traits: {
      genre: "trip hop", era: "mid-1990s Bristol",
      instruments: ["dusty breakbeats", "vinyl scratches", "twangy spaghetti-western guitar", "eerie analog synth"],
      timbre: "torchy, fragile female vocal", texture: "vinyl crackle, sampler grit",
    },
  },
  {
    id: "massive-attack", names: ["massive attack"], display: "Massive Attack", kind: "artist", region: "global",
    traits: {
      genre: "trip hop", tempoFeel: "slow, heavy downtempo",
      instruments: ["dub bass", "slow breakbeats", "dark atmospheric pads"], space: "dark, cavernous",
    },
  },
  {
    id: "j-dilla", names: ["j dilla", "jay dee"], display: "J Dilla", kind: "artist", region: "global",
    traits: {
      genre: "hip hop", subgenres: ["neo soul"], tempoFeel: "unquantized, drunken swing",
      instruments: ["chopped soul samples", "loose swung drums", "warm sub bass"], texture: "sampler warmth",
    },
  },
  {
    id: "nujabes", names: ["nujabes"], display: "Nujabes", kind: "artist", region: "global",
    traits: {
      genre: "jazz-hop", instruments: ["jazzy piano samples", "saxophone", "boom-bap drums"],
      moods: ["gentle melancholy"], mixStyle: "smooth, warm",
    },
  },
  {
    id: "burial", names: ["burial"], display: "Burial", kind: "artist", region: "global",
    traits: {
      genre: "UK garage", subgenres: ["ambient"], instruments: ["skittering 2-step drums", "pitched-down vocal snippets", "sub bass"],
      texture: "vinyl crackle, rain ambience", space: "foggy, nocturnal",
    },
  },
  {
    id: "mbv", names: ["my bloody valentine", "mbv"], display: "My Bloody Valentine", kind: "artist", region: "global",
    traits: {
      genre: "shoegaze", era: "early-1990s",
      instruments: ["tremolo-bent glide guitars", "melodic bass", "live drums"],
      mixStyle: "vocals buried in the guitars", texture: "dense, wavering fuzz",
    },
  },
  {
    id: "mazzy-star", names: ["mazzy star"], display: "Mazzy Star", kind: "artist", region: "global",
    traits: {
      genre: "dream pop", tempoFeel: "slow, languid", instruments: ["slide guitar", "acoustic guitar", "tambourine"],
      timbre: "hazy, languid female vocal", space: "lots of reverb",
    },
  },
  {
    id: "dangelo", names: ["d'angelo", "dangelo"], display: "D'Angelo", kind: "artist", region: "global",
    traits: {
      genre: "neo soul", tempoFeel: "deep behind-the-beat groove",
      instruments: ["Fender Rhodes", "live drums with ghost notes", "fingerstyle bass"],
      timbre: "layered falsetto harmonies", texture: "analog tape warmth",
    },
  },
  {
    id: "fleetwood-mac", names: ["fleetwood mac"], display: "Fleetwood Mac", kind: "artist", region: "global",
    traits: {
      genre: "soft rock", era: "late-1970s Californian studio rock",
      instruments: ["clean electric guitars", "acoustic guitar", "tight live drums"],
      delivery: "tight three-part harmonies",
    },
  },
  {
    id: "tame-impala", names: ["tame impala"], display: "Tame Impala", kind: "artist", region: "global",
    traits: {
      genre: "psychedelic pop", instruments: ["phased drums", "fuzzy bass", "dreamy analog synths"],
      timbre: "airy, reverb-drenched falsetto", texture: "heavy phaser and compression",
    },
  },
  {
    id: "phoebe-bridgers", names: ["phoebe bridgers"], display: "Phoebe Bridgers", kind: "artist", region: "global",
    traits: {
      genre: "indie folk", instruments: ["sparse electric guitar", "brass swells", "soft drums"],
      timbre: "soft-spoken female vocal", delivery: "deadpan, intimate, doubled vocals",
    },
  },
  {
    id: "the-strokes", names: ["the strokes", "strokes"], display: "The Strokes", kind: "artist", region: "global",
    traits: {
      genre: "garage rock", subgenres: ["indie rock"], era: "early-2000s New York",
      instruments: ["interlocking clean-crunch guitars", "tight motorik drums"],
      mixStyle: "lo-fi, compressed vocal", delivery: "detached, nonchalant",
    },
  },
  {
    id: "daft-punk", names: ["daft punk"], display: "Daft Punk", kind: "artist", region: "global",
    traits: {
      genre: "French house", instruments: ["filtered disco samples", "talk box", "four-on-the-floor drums"],
      texture: "sidechain pumping, filter sweeps",
    },
  },
  {
    id: "frank-ocean", names: ["frank ocean"], display: "Frank Ocean", kind: "artist", region: "global",
    traits: {
      genre: "alternative R&B", instruments: ["minimal electric guitar", "ambient synths", "sparse drums"],
      delivery: "introspective, pitch-shifted layers", space: "wide, minimal",
    },
  },
  {
    id: "max-richter", names: ["max richter", "olafur arnalds", "ólafur arnalds", "nils frahm"], display: "Max Richter / Ólafur Arnalds", kind: "artist", region: "global",
    traits: {
      genre: "neoclassical", instruments: ["felt piano", "string quartet", "subtle electronics"],
      mixStyle: "natural dynamics", texture: "piano hammer and pedal noise",
    },
  },
  {
    id: "tatsuro", names: ["tatsuro yamashita", "mariya takeuchi", "city pop"], display: "City pop (Tatsuro Yamashita, Mariya Takeuchi)", kind: "scene", region: "global",
    traits: {
      genre: "city pop", era: "1980s Japanese studio pop",
      instruments: ["slap bass", "brass section", "FM electric piano", "funky clean guitar"],
      moods: ["breezy nocturnal glamour"],
    },
  },
  /* ---------------- Scenes / eras ---------------- */
  {
    id: "motown", names: ["motown"], display: "Motown", kind: "scene", region: "global",
    traits: {
      genre: "soul", era: "1960s Detroit soul",
      instruments: ["tambourine on every backbeat", "bright horn section", "melodic bass"],
      delivery: "call-and-response backing vocals",
    },
  },
  {
    id: "britpop", names: ["britpop"], display: "Britpop", kind: "scene", region: "global",
    traits: { genre: "britpop", era: "mid-1990s British", instruments: ["jangly guitars", "Hammond organ"], delivery: "swaggering, sing-along" },
  },
  {
    id: "grunge", names: ["grunge", "seattle"], display: "Seattle grunge", kind: "scene", region: "global",
    traits: {
      genre: "grunge", era: "early-1990s Seattle", instruments: ["sludgy downtuned guitars", "heavy live drums"],
      delivery: "loud-quiet-loud dynamics, strained vocals",
    },
  },
];
