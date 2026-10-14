/**
 * Indonesian → English descriptor glossary.
 * Generators parse English descriptors far more reliably, but users think in their own language.
 * Longer phrases are listed first so "suara serak basah" wins over "serak".
 */
export interface GlossaryEntry {
  id: string;
  en: string;
  cat: "vokal" | "tempo" | "mood" | "produksi" | "instrumen" | "genre";
}

export const GLOSSARY: GlossaryEntry[] = [
  // Vokal
  { id: "suara serak basah", en: "husky, breathy rasp", cat: "vokal" },
  { id: "suara serak", en: "raspy", cat: "vokal" },
  { id: "serak", en: "raspy", cat: "vokal" },
  { id: "suara berat", en: "deep, heavy voice", cat: "vokal" },
  { id: "suara tipis", en: "thin, light voice", cat: "vokal" },
  { id: "suara lembut", en: "soft, gentle voice", cat: "vokal" },
  { id: "suara bulat", en: "full, round tone", cat: "vokal" },
  { id: "suara cempreng", en: "nasal, bright, thin tone", cat: "vokal" },
  { id: "suara mendesah", en: "breathy", cat: "vokal" },
  { id: "berbisik", en: "whispered", cat: "vokal" },
  { id: "mendayu-dayu", en: "lilting, melismatic", cat: "vokal" },
  { id: "mendayu", en: "lilting, melismatic", cat: "vokal" },
  { id: "cengkok", en: "ornamented melismatic runs", cat: "vokal" },
  { id: "melengking", en: "piercing high belts", cat: "vokal" },
  { id: "bernyanyi lepas", en: "belted, full-chested", cat: "vokal" },
  { id: "seperti berbicara", en: "almost spoken, conversational", cat: "vokal" },
  { id: "setengah berbicara", en: "half-spoken", cat: "vokal" },
  { id: "falseto", en: "falsetto", cat: "vokal" },
  { id: "vibrato halus", en: "gentle vibrato", cat: "vokal" },
  { id: "logat jawa", en: "Javanese accent", cat: "vokal" },
  { id: "logat sunda", en: "Sundanese accent", cat: "vokal" },
  { id: "logat batak", en: "Batak accent", cat: "vokal" },
  { id: "logat betawi", en: "Betawi accent", cat: "vokal" },
  { id: "paduan suara", en: "choir", cat: "vokal" },
  // Tempo
  { id: "sangat pelan", en: "very slow, unhurried", cat: "tempo" },
  { id: "pelan", en: "slow", cat: "tempo" },
  { id: "santai", en: "relaxed, laid-back", cat: "tempo" },
  { id: "sedang", en: "mid-tempo", cat: "tempo" },
  { id: "cepat", en: "fast, uptempo", cat: "tempo" },
  { id: "menghentak", en: "driving, stomping", cat: "tempo" },
  { id: "bergoyang", en: "swaying groove", cat: "tempo" },
  { id: "terseret", en: "dragging, behind the beat", cat: "tempo" },
  { id: "terburu-buru", en: "rushing, pushing ahead of the beat", cat: "tempo" },
  // Mood
  { id: "galau", en: "restless heartache", cat: "mood" },
  { id: "rindu", en: "aching longing", cat: "mood" },
  { id: "sendu", en: "quiet melancholy", cat: "mood" },
  { id: "pilu", en: "deep sorrow", cat: "mood" },
  { id: "haru", en: "tender, moved to tears", cat: "mood" },
  { id: "syahdu", en: "solemn, serene tenderness", cat: "mood" },
  { id: "riang", en: "cheerful, carefree", cat: "mood" },
  { id: "ceria", en: "bright, playful", cat: "mood" },
  { id: "megah", en: "grand, majestic", cat: "mood" },
  { id: "mencekam", en: "tense, ominous", cat: "mood" },
  { id: "marah", en: "furious, defiant", cat: "mood" },
  { id: "nostalgia", en: "wistful nostalgia", cat: "mood" },
  { id: "hangat", en: "warm, comforting", cat: "mood" },
  { id: "sepi", en: "lonely, desolate", cat: "mood" },
  // Produksi
  { id: "rekaman rumahan", en: "home recording", cat: "produksi" },
  { id: "rekaman live", en: "live recording, band in one room", cat: "produksi" },
  { id: "suara kaset", en: "cassette tape saturation", cat: "produksi" },
  { id: "suara kaset tua", en: "worn cassette tape, wow and flutter", cat: "produksi" },
  { id: "kering", en: "dry, close-miked", cat: "produksi" },
  { id: "bergema", en: "reverberant, echoing", cat: "produksi" },
  { id: "ruang luas", en: "wide, spacious", cat: "produksi" },
  { id: "ruangan kecil", en: "small room ambience", cat: "produksi" },
  { id: "jernih", en: "clean, clear", cat: "produksi" },
  { id: "kasar", en: "raw, gritty", cat: "produksi" },
  { id: "mentah", en: "raw, unpolished", cat: "produksi" },
  { id: "hangat analog", en: "warm analog", cat: "produksi" },
  { id: "jadul", en: "vintage, old-school", cat: "produksi" },
  { id: "tahun 80-an", en: "1980s", cat: "produksi" },
  { id: "tahun 90-an", en: "1990s", cat: "produksi" },
  { id: "tahun 70-an", en: "1970s", cat: "produksi" },
  // Instrumen
  { id: "gitar bolong", en: "acoustic guitar", cat: "instrumen" },
  { id: "gitar akustik", en: "acoustic guitar", cat: "instrumen" },
  { id: "gitar listrik", en: "electric guitar", cat: "instrumen" },
  { id: "petikan gitar", en: "fingerpicked guitar", cat: "instrumen" },
  { id: "genjrengan gitar", en: "strummed guitar", cat: "instrumen" },
  { id: "biola", en: "violin", cat: "instrumen" },
  { id: "seruling", en: "bamboo flute (suling)", cat: "instrumen" },
  { id: "suling", en: "bamboo flute (suling)", cat: "instrumen" },
  { id: "kendang", en: "kendang hand drums", cat: "instrumen" },
  { id: "gamelan", en: "Javanese gamelan", cat: "instrumen" },
  { id: "angklung", en: "angklung bamboo rattles", cat: "instrumen" },
  { id: "sasando", en: "sasando zither", cat: "instrumen" },
  { id: "kecapi", en: "kacapi zither", cat: "instrumen" },
  { id: "rebana", en: "rebana frame drum", cat: "instrumen" },
  { id: "drum elektronik", en: "electronic drums", cat: "instrumen" },
  { id: "senar gesek", en: "string section", cat: "instrumen" },
  // Genre
  { id: "lagu daerah", en: "Indonesian regional folk song", cat: "genre" },
  { id: "pop melayu", en: "Malay pop", cat: "genre" },
  { id: "musik religi", en: "devotional pop", cat: "genre" },
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const SORTED = [...GLOSSARY].sort((a, b) => b.id.length - a.id.length);

/** Indonesian terms found in the text (longest match wins, no overlaps). */
export function findGlossaryTerms(text: string): GlossaryEntry[] {
  let remaining = text.toLowerCase();
  const found: GlossaryEntry[] = [];
  for (const g of SORTED) {
    const re = new RegExp(`(^|[^\\p{L}])${escapeRegex(g.id)}(?=$|[^\\p{L}])`, "u");
    if (re.test(remaining)) {
      found.push(g);
      remaining = remaining.replace(re, "$1 ");
    }
  }
  return found;
}

/** Replace every glossary term in the text with its English descriptor. */
export function translateText(text: string): string {
  let out = text;
  for (const g of SORTED) {
    const re = new RegExp(`(^|[^\\p{L}])${escapeRegex(g.id)}(?=$|[^\\p{L}])`, "giu");
    out = out.replace(re, `$1${g.en}`);
  }
  return out;
}

/** Exact single-term translation (used when a tag is committed). */
export function translateTerm(term: string): string | null {
  const hit = GLOSSARY.find((g) => g.id === term.trim().toLowerCase());
  return hit ? hit.en : null;
}
