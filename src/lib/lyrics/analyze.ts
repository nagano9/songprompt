/**
 * Lyric workshop: syllables, rhyme scheme, line-length consistency, hook detection, clichés.
 * Pure heuristics — fast, offline, language-aware (Indonesian + English).
 * Indonesian syllabification is regular (≈ one syllable per vowel nucleus), so its counts
 * are reliable; English counts are an approximation (±1 on irregular words).
 */

export type LyricLang = "id" | "en";

export interface LyricLine {
  text: string;
  syllables: number;
  /** Rhyme-letter within its section ("A", "B"…), or "–" when the line rhymes with nothing. */
  rhyme: string;
  rhymeKey: string;
  flag?: "long" | "short";
}

export interface LyricSection {
  label: string;
  kind: "verse" | "chorus" | "other";
  lines: LyricLine[];
  avgSyllables: number;
  scheme: string;
}

export interface LyricFinding {
  level: "warning" | "tip" | "info";
  message: string;
}

export interface LyricAnalysis {
  lang: LyricLang;
  sections: LyricSection[];
  totalLines: number;
  cliches: string[];
  hook: string | null;
  findings: LyricFinding[];
}

/* ------------------------------------------------------------------ */
/* Clichés                                                              */
/* ------------------------------------------------------------------ */

export const LYRIC_CLICHES: string[] = [
  // English
  "neon lights", "city lights", "shadows", "whispers", "echoes", "fire inside", "burning bright",
  "heart of gold", "we rise", "rise up", "break free", "into the night", "tapestry", "embrace the",
  "soul on fire", "light the way", "broken wings", "stars align", "dancing in the rain",
  "forever and always", "hand in hand", "lost in the moment", "chasing dreams", "against the odds",
  "set me free", "heart on my sleeve", "through the storm", "shattered glass", "endless sky",
  // Indonesian
  "hati yang hancur", "air mata", "cinta sejati", "kau dan aku", "takkan pernah", "di bawah langit",
  "bintang-bintang", "selamanya bersama", "hancur berkeping", "patah hati", "separuh jiwa",
  "belahan jiwa", "sepenuh hati", "hingga akhir waktu", "takkan terganti", "luka yang dalam",
  "pelangi", "rindu yang menggebu", "dunia milik berdua", "sang surya",
];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole-word/phrase matching — "shadows" no longer fires on "foreshadows". */
export function findCliches(lyrics: string): string[] {
  const text = lyrics.toLowerCase();
  if (!text.trim()) return [];
  return LYRIC_CLICHES.filter((c) => new RegExp(`(^|[^\\p{L}])${escapeRegex(c)}(?=$|[^\\p{L}])`, "u").test(text));
}

/* ------------------------------------------------------------------ */
/* Language                                                             */
/* ------------------------------------------------------------------ */

const ID_WORDS = new Set(["yang", "dan", "aku", "kau", "kamu", "di", "ke", "tak", "ini", "itu", "dengan", "untuk", "dari", "akan", "masih", "sudah", "tapi", "pada", "ada", "semua", "dalam", "kita"]);
const EN_WORDS = new Set(["the", "and", "you", "i", "to", "of", "my", "in", "is", "it", "me", "your", "on", "we", "for", "that", "with", "all", "be", "love"]);

export function detectLang(lyrics: string, declared = ""): LyricLang {
  const d = declared.toLowerCase();
  if (/indo|bahasa|malay|melayu|jawa|javanese|sunda/.test(d)) return "id";
  if (/english|inggris/.test(d)) return "en";
  let id = 0;
  let en = 0;
  for (const w of lyrics.toLowerCase().match(/\p{L}+/gu) ?? []) {
    if (ID_WORDS.has(w)) id++;
    if (EN_WORDS.has(w)) en++;
  }
  return id >= en ? "id" : "en";
}

/* ------------------------------------------------------------------ */
/* Syllables                                                            */
/* ------------------------------------------------------------------ */

const ID_DIPHTHONG_END = /(ai|au|oi|ei)$/;

export function syllablesIdWord(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  const vowels = (w.match(/[aiueo]/g) ?? []).length;
  // A word-final diphthong (pan-tai, ka-lau) is one nucleus — but only when another vowel
  // precedes it; "bau" (ba-u) and "air" (a-ir) are two syllables.
  if (ID_DIPHTHONG_END.test(w) && /[aiueo]/.test(w.slice(0, -2))) return Math.max(1, vowels - 1);
  return Math.max(1, vowels);
}

export function syllablesEnWord(word: string): number {
  let w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  w = w.replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, (m) => m.slice(0, 1)).replace(/^y/, "");
  const groups = w.match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

export function countSyllables(line: string, lang: LyricLang): number {
  const words = line.match(/[\p{L}'-]+/gu) ?? [];
  const fn = lang === "id" ? syllablesIdWord : syllablesEnWord;
  return words.reduce((sum, w) => sum + w.split("-").reduce((s, part) => s + fn(part), 0), 0);
}

/* ------------------------------------------------------------------ */
/* Rhyme                                                                */
/* ------------------------------------------------------------------ */

export function rhymeKey(line: string, lang: LyricLang): string {
  const words = line.toLowerCase().match(/\p{L}+/gu);
  if (!words?.length) return "";
  let last = words[words.length - 1].normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (lang === "en" && last.length > 3) last = last.replace(/([^aeiouy])e$/, "$1");
  const m = last.match(lang === "id" ? /[aiueo]+[^aiueo]*$/ : /[aeiouy]+[^aeiouy]*$/);
  return m ? m[0] : last;
}

function rhymeLetters(keys: string[]): string[] {
  const counts = new Map<string, number>();
  for (const k of keys) if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
  const letters = new Map<string, string>();
  return keys.map((k) => {
    if (!k || (counts.get(k) ?? 0) < 2) return "–";
    if (!letters.has(k)) letters.set(k, String.fromCharCode(65 + letters.size));
    return letters.get(k)!;
  });
}

/* ------------------------------------------------------------------ */
/* Parsing                                                              */
/* ------------------------------------------------------------------ */

const TAG_LINE = /^\s*\[([^\]]+)\]\s*$/;

function sectionKind(label: string): LyricSection["kind"] {
  const l = label.toLowerCase();
  if (/chorus|hook|refrain|reff/.test(l)) return "chorus";
  if (/verse|bait/.test(l)) return "verse";
  return "other";
}

/** Split lyrics into sections: by [Tags] when present, otherwise by blank-line paragraphs. */
export function parseSections(lyrics: string): Array<{ label: string; lines: string[] }> {
  const rawLines = lyrics.replace(/\r/g, "").split("\n");
  const hasTags = rawLines.some((l) => TAG_LINE.test(l));
  const out: Array<{ label: string; lines: string[] }> = [];

  if (hasTags) {
    let current: { label: string; lines: string[] } | null = null;
    for (const raw of rawLines) {
      const tag = raw.match(TAG_LINE);
      if (tag) {
        // A bracket line right after a section tag is an arrangement note, not a new section.
        const looksLikeSection = /^(intro|verse|pre-chorus|chorus|post-chorus|hook|bridge|outro|solo|breakdown|instrumental|interlude|refrain|reff|bait)/i.test(tag[1].trim());
        if (looksLikeSection) {
          current = { label: tag[1].trim(), lines: [] };
          out.push(current);
        }
        continue;
      }
      if (raw.trim()) {
        if (!current) {
          current = { label: "Pembuka", lines: [] };
          out.push(current);
        }
        current.lines.push(raw.trim());
      }
    }
    return out.filter((s) => s.lines.length);
  }

  const paragraphs = lyrics.split(/\n\s*\n/).map((p) => p.split("\n").map((l) => l.trim()).filter(Boolean)).filter((p) => p.length);
  paragraphs.forEach((lines, i) => out.push({ label: `Bait ${i + 1}`, lines }));
  return out;
}

/* ------------------------------------------------------------------ */
/* Hook                                                                 */
/* ------------------------------------------------------------------ */

/** Most repeated 2–5 word phrase (≥2 occurrences). Longer phrases win ties. */
export function detectHook(lines: string[]): string | null {
  const counts = new Map<string, number>();
  for (const line of lines) {
    const words = line.toLowerCase().match(/[\p{L}']+/gu) ?? [];
    const seen = new Set<string>();
    for (let n = 5; n >= 2; n--) {
      for (let i = 0; i + n <= words.length; i++) {
        const gram = words.slice(i, i + n).join(" ");
        if (seen.has(gram)) continue;
        seen.add(gram);
        counts.set(gram, (counts.get(gram) ?? 0) + 1);
      }
    }
  }
  let best: string | null = null;
  let bestScore = 0;
  for (const [gram, c] of counts) {
    if (c < 2) continue;
    const score = c * 10 + gram.split(" ").length;
    if (score > bestScore) {
      best = gram;
      bestScore = score;
    }
  }
  return best;
}

/* ------------------------------------------------------------------ */
/* Main                                                                 */
/* ------------------------------------------------------------------ */

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function analyzeLyrics(lyrics: string, declaredLanguage = ""): LyricAnalysis {
  const lang = detectLang(lyrics, declaredLanguage);
  const parsed = parseSections(lyrics);

  const sections: LyricSection[] = parsed.map(({ label, lines }) => {
    const syl = lines.map((l) => countSyllables(l, lang));
    const keys = lines.map((l) => rhymeKey(l, lang));
    const letters = rhymeLetters(keys);
    const avg = mean(syl);
    const out: LyricLine[] = lines.map((text, i) => {
      const s = syl[i];
      let flag: LyricLine["flag"];
      if (lines.length >= 3 && avg > 0 && Math.abs(s - avg) >= 3 && Math.abs(s - avg) / avg > 0.35) {
        flag = s > avg ? "long" : "short";
      }
      return { text, syllables: s, rhyme: letters[i], rhymeKey: keys[i], flag };
    });
    return { label, kind: sectionKind(label), lines: out, avgSyllables: Math.round(avg * 10) / 10, scheme: letters.join("") };
  });

  const allLines = sections.flatMap((s) => s.lines.map((l) => l.text));
  const chorusLines = sections.filter((s) => s.kind === "chorus").flatMap((s) => s.lines.map((l) => l.text));
  const hook = detectHook(chorusLines.length ? chorusLines : allLines);
  const cliches = findCliches(lyrics);
  const findings: LyricFinding[] = [];

  if (!allLines.length) return { lang, sections, totalLines: 0, cliches, hook, findings };

  const flagged = sections.flatMap((s) => s.lines.filter((l) => l.flag).map((l) => ({ s, l })));
  if (flagged.length) {
    findings.push({
      level: "tip",
      message: `${flagged.length} baris panjangnya jauh dari rata-rata section-nya — model akan menjejalkan atau meregangkan suku kata. Contoh: “${flagged[0].l.text}” (${flagged[0].l.syllables} suku kata, rata-rata ${flagged[0].s.avgSyllables}).`,
    });
  }

  const verseAvg = mean(sections.filter((s) => s.kind === "verse").map((s) => s.avgSyllables));
  const chorusAvg = mean(sections.filter((s) => s.kind === "chorus").map((s) => s.avgSyllables));
  if (verseAvg && chorusAvg && chorusAvg > verseAvg + 2) {
    findings.push({
      level: "tip",
      message: `Baris chorus (rata-rata ${chorusAvg.toFixed(1)} suku kata) lebih panjang dari verse (${verseAvg.toFixed(1)}). Hook yang kuat biasanya lebih ringkas dan mudah dinyanyikan.`,
    });
  }

  if (!hook) {
    findings.push({
      level: "tip",
      message: "Tidak ada frasa yang berulang. Tanpa hook yang diulang, model cenderung mengarang refrain generik sendiri.",
    });
  }

  const rhymed = sections.flatMap((s) => s.lines).filter((l) => l.rhyme !== "–").length;
  const ratio = rhymed / allLines.length;
  if (allLines.length >= 6 && ratio > 0.9) {
    findings.push({
      level: "info",
      message: "Hampir semua baris berima sempurna. Rima yang terlalu rapi terdengar seperti lirik AI — coba rima tak sempurna atau rima internal.",
    });
  }

  if (cliches.length) {
    findings.push({
      level: "warning",
      message: `Klise: ${cliches.map((c) => `“${c}”`).join(", ")}. Ganti dengan detail konkret — benda, tempat, jam, nama, kebiasaan kecil.`,
    });
  }

  const longLines = sections.flatMap((s) => s.lines).filter((l) => l.syllables > (lang === "id" ? 16 : 14));
  if (longLines.length) {
    findings.push({
      level: "tip",
      message: `${longLines.length} baris sangat panjang (>${lang === "id" ? 16 : 14} suku kata). Pecah menjadi dua baris agar frasa vokal bisa bernapas.`,
    });
  }

  return { lang, sections, totalLines: allLines.length, cliches, hook, findings };
}
