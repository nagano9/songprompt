import type { Platform, PromptInput, Suggestion } from "@/lib/types";
import { clean, uniq } from "@/lib/utils";
import { findCliches } from "@/lib/lyrics/analyze";
import { findGlossaryTerms, translateText } from "@/lib/glossary/id-en";
import { underperformersIn, type Insights } from "@/lib/insights";
import { generatePrompt, isInstrumental } from "./generator";
import { planNegatives } from "./negatives";
import { resolveProfile, type PlatformProfile } from "./platforms";

/* ------------------------------------------------------------------ */
/* Knowledge tables                                                     */
/* ------------------------------------------------------------------ */

/** Vague mood words → specific, generator-friendly alternatives. */
export const GENERIC_MOODS: Record<string, string[]> = {
  happy: ["sunlit, restless optimism", "giddy first-crush excitement", "quiet contentment"],
  sad: ["bittersweet resignation", "quiet grief", "wistful nostalgia"],
  chill: ["unhurried late-night calm", "hazy Sunday-morning stillness"],
  energetic: ["urgent, nervy momentum", "defiant adrenaline"],
  epic: ["slow-burning triumph", "vast, solemn grandeur"],
  emotional: ["raw, conflicted vulnerability", "aching tenderness"],
  romantic: ["shy, hesitant longing", "warm domestic intimacy"],
  dark: ["claustrophobic dread", "cold nocturnal unease"],
  uplifting: ["hard-won hope", "sunrise-after-a-long-night relief"],
  relaxing: ["unhurried late-night calm", "warm afternoon haze"],
  sedih: ["bittersweet resignation", "quiet grief", "wistful nostalgia"],
  senang: ["sunlit, restless optimism", "quiet contentment"],
  santai: ["unhurried late-night calm", "hazy Sunday-morning stillness"],
  semangat: ["urgent, nervy momentum", "defiant adrenaline"],
  galau: ["restless heartache", "late-night overthinking"],
  romantis: ["shy, hesitant longing", "warm domestic intimacy"],
};

const GENRE_TIPS: Array<{ match: RegExp; title: string; detail: string }> = [
  {
    match: /lo-?fi/i,
    title: "Lo-fi butuh tekstur yang spesifik",
    detail: "Sebut cacat yang disengaja: tape hiss, wow & flutter, kunci sedikit fals, low-pass di intro.",
  },
  {
    match: /ballad|folk|acoustic|akustik/i,
    title: "Ballad hidup dari kontras dinamika",
    detail: "Buat verse sangat sepi (vokal + 1 instrumen) dan simpan ‘full band’ hanya untuk chorus terakhir.",
  },
  {
    match: /edm|house|techno|trance|dubstep/i,
    title: "Elektronik: sebut sound design, bukan genre saja",
    detail: "Contoh: ‘detuned analog saw bass’, ‘909 hats dengan swing 56%’, ‘sidechain halus’. Hindari kata ‘banger’.",
  },
  {
    match: /rock|punk|metal|grunge/i,
    title: "Rock: tentukan karakter amp & ruang",
    detail: "Contoh: ‘cranked tube amp’, ‘live in one room’, ‘drum kit dengan room mic keras’. Ini menjauhkan dari rock ‘pabrikan’.",
  },
  {
    match: /hip.?hop|rap|trap|drill/i,
    title: "Hip-hop: deskripsikan flow dan drum",
    detail: "Sebut gaya flow (laid-back, triplet, staccato) dan karakter drum (dusty break, punchy 808, swung hats).",
  },
  {
    match: /pop/i,
    title: "Pop rawan jadi generik",
    detail: "Kunci dengan era + satu instrumen tak lazim (mis. ‘1980s Japanese city pop, slap bass, FM electric piano’).",
  },
  {
    match: /dangdut|koplo|keroncong|gamelan|campursari/i,
    title: "Genre lokal: sebut instrumennya eksplisit",
    detail: "Model lebih memahami nama instrumen (kendang, suling, cak-cuk, gamelan Jawa) daripada nama genre lokal saja.",
  },
];

/* ------------------------------------------------------------------ */
/* Analysis helpers                                                     */
/* ------------------------------------------------------------------ */

export function findGenericMoods(input: PromptInput): string[] {
  return input.moods.filter((m) => GENERIC_MOODS[clean(m).toLowerCase()]);
}

/** Whole-word cliché detection (delegates to the lyric workshop). */
export const findLyricCliches = findCliches;

/** Descriptor fields that should be English for the generator. */
function descriptorTexts(input: PromptInput): string[] {
  return [
    input.genre,
    ...input.subgenres,
    ...input.moods,
    input.emotionalArc,
    input.tempoFeel,
    ...input.instrumentsInclude,
    input.vocal.timbre,
    input.vocal.delivery,
    ...Object.values(input.production),
  ];
}

/** Translate every Indonesian glossary term found in descriptor fields. */
export function translateDescriptors(input: PromptInput): PromptInput {
  const t = (v: string) => translateText(v);
  return {
    ...input,
    genre: t(input.genre),
    subgenres: uniq(input.subgenres.map(t)),
    moods: uniq(input.moods.map(t)),
    emotionalArc: t(input.emotionalArc),
    tempoFeel: t(input.tempoFeel),
    instrumentsInclude: uniq(input.instrumentsInclude.map(t)),
    vocal: { ...input.vocal, timbre: t(input.vocal.timbre), delivery: t(input.vocal.delivery) },
    production: {
      era: t(input.production.era),
      mixStyle: t(input.production.mixStyle),
      texture: t(input.production.texture),
      space: t(input.production.space),
    },
  };
}

/** Words starting with a capital letter that aren't at a sentence start — likely artist/song names. */
function looksLikeProperNames(text: string): boolean {
  return /(^|[^.!?]\s)[A-Z][a-z]+/.test(text.trim()) || /\b(like|kayak|seperti|ala)\b/i.test(text);
}

function overlap(a: string[], b: string[]): string[] {
  const set = new Set(b.map((x) => clean(x).toLowerCase()));
  return a.filter((x) => set.has(clean(x).toLowerCase()));
}

/* ------------------------------------------------------------------ */
/* Specificity score                                                    */
/* ------------------------------------------------------------------ */

export interface ScoreBreakdown {
  score: number;
  label: string;
}

/**
 * 0–100 heuristic for "how much has the user told the model?".
 * Not a quality guarantee — a proxy for how little the model must guess (guessing = slop).
 */
export function specificityScore(input: PromptInput): ScoreBreakdown {
  let s = 0;
  if (clean(input.genre)) s += 10;
  if (input.subgenres.length) s += 5;

  const specificMoods = input.moods.length - findGenericMoods(input).length;
  s += Math.min(10, specificMoods * 5);
  s -= findGenericMoods(input).length * 3;
  if (clean(input.emotionalArc)) s += 5;

  if (input.bpm || clean(input.tempoFeel)) s += input.bpm && clean(input.tempoFeel) ? 10 : 6;

  const inst = input.instrumentsInclude.length;
  s += inst >= 3 ? 10 : inst > 0 ? 5 : 0;

  if (isInstrumental(input)) s += 10;
  else {
    if (clean(input.vocal.timbre)) s += 5;
    if (clean(input.vocal.delivery)) s += 5;
  }

  const prodFilled = Object.values(input.production).filter((v) => clean(v)).length;
  s += Math.min(10, prodFilled * 3);

  if (input.structure.length) s += input.structure.some((x) => clean(x.note)) ? 10 : 5;

  if (isInstrumental(input)) s += 10;
  else if (input.lyrics.trim()) s += findLyricCliches(input.lyrics).length ? 8 : 15;

  if (clean(input.theme)) s += 5;
  if (input.useDefaultNegatives || input.negativesManual.length || input.instrumentsAvoid.length) s += 5;

  const score = Math.max(0, Math.min(100, Math.round(s)));
  const label =
    score >= 80 ? "Sangat spesifik" : score >= 60 ? "Cukup spesifik" : score >= 35 ? "Masih generik" : "Rawan slop";
  return { score, label };
}

/* ------------------------------------------------------------------ */
/* Suggestion rules                                                     */
/* ------------------------------------------------------------------ */

export interface SuggestionOptions {
  profile?: PlatformProfile;
  insights?: Insights;
}

export function buildSuggestions(input: PromptInput, platform: Platform, opts: SuggestionOptions = {}): Suggestion[] {
  const out: Suggestion[] = [];
  const profile = opts.profile ?? resolveProfile(platform);

  // Evidence from the user's own ratings outranks every heuristic below.
  if (opts.insights) {
    for (const d of underperformersIn(input, opts.insights)) {
      out.push({
        id: `insight-${d.descriptor}`,
        level: "warning",
        title: `Rating-mu: “${d.descriptor}” cenderung gagal`,
        detail: `Dipakai di ${d.n} lagu yang kamu nilai, rata-rata ${d.avg.toFixed(1)}★ (${d.lift.toFixed(1)} di bawah rata-ratamu). Pertimbangkan menggantinya.`,
      });
    }
  }

  const idTerms = uniq(descriptorTexts(input).flatMap((t) => findGlossaryTerms(t ?? "").map((g) => `${g.id} → ${g.en}`)));
  if (idTerms.length) {
    out.push({
      id: "glossary",
      level: "tip",
      title: "Deskriptor berbahasa Indonesia terdeteksi",
      detail: `Generator lebih akurat membaca bahasa Inggris: ${idTerms.slice(0, 5).join(", ")}${idTerms.length > 5 ? ", …" : ""}.`,
      actions: [{ label: "Terjemahkan semua", apply: translateDescriptors }],
    });
  }

  if (!clean(input.genre)) {
    out.push({
      id: "no-genre",
      level: "warning",
      title: "Genre belum diisi",
      detail: "Genre adalah sinyal terkuat. Tanpa ini model akan jatuh ke ‘pop generik’ — persis slop yang ingin dihindari.",
    });
  }

  if (input.subgenres.length > 2) {
    out.push({
      id: "too-many-subgenres",
      level: "tip",
      title: `Terlalu banyak subgenre (${input.subgenres.length})`,
      detail: "Lebih dari 2 subgenre biasanya dirata-rata model menjadi sesuatu yang hambar. Pilih 1–2 yang paling penting.",
      actions: [
        {
          label: "Sisakan 2 pertama",
          apply: (i) => ({ ...i, subgenres: i.subgenres.slice(0, 2) }),
        },
      ],
    });
  }

  for (const mood of findGenericMoods(input)) {
    const alts = GENERIC_MOODS[clean(mood).toLowerCase()] ?? [];
    out.push({
      id: `generic-mood-${mood}`,
      level: "tip",
      title: `Mood “${mood}” terlalu umum`,
      detail: "Emosi yang spesifik menghasilkan pilihan harmoni dan aransemen yang lebih spesifik. Ganti dengan:",
      actions: alts.map((alt) => ({
        label: alt,
        apply: (i) => ({ ...i, moods: uniq(i.moods.map((m) => (m === mood ? alt : m))) }),
      })),
    });
  }

  if (!input.moods.length) {
    out.push({
      id: "no-mood",
      level: "tip",
      title: "Belum ada mood",
      detail: "Tambahkan 1–2 emosi spesifik, misalnya ‘bittersweet resignation’ alih-alih ‘sad’.",
    });
  }

  if (!input.bpm && !clean(input.tempoFeel)) {
    out.push({
      id: "no-tempo",
      level: "tip",
      title: "Tempo belum ditentukan",
      detail: "Isi BPM dan ‘rasa’ tempo (mis. ‘behind-the-beat swing’). Tempo default model cenderung medium yang datar.",
    });
  }

  if (!isInstrumental(input) && !input.lyrics.trim()) {
    out.push({
      id: "no-lyrics",
      level: "warning",
      title: "Tulis lirik sendiri",
      detail:
        "Lirik yang dibuat model adalah sumber slop paling terdengar: rima tertebak, metafora ‘neon’ dan ‘shadows’. Lirik milikmu sendiri = pembeda terbesar.",
    });
  }

  const cliches = findLyricCliches(input.lyrics);
  if (cliches.length) {
    out.push({
      id: "lyric-cliches",
      level: "warning",
      title: `Frasa klise di lirik (${cliches.length})`,
      detail: `Ditemukan: ${cliches.map((c) => `“${c}”`).join(", ")}. Ganti dengan detail konkret — benda, tempat, jam, nama, kebiasaan kecil.`,
    });
  }

  const conflict = overlap(input.instrumentsInclude, input.instrumentsAvoid);
  if (conflict.length) {
    out.push({
      id: "instrument-conflict",
      level: "warning",
      title: "Instrumen yang sama di ‘pakai’ dan ‘hindari’",
      detail: `Bertentangan: ${conflict.join(", ")}. Model akan bingung.`,
      actions: [
        {
          label: "Hapus dari daftar hindari",
          apply: (i) => ({ ...i, instrumentsAvoid: i.instrumentsAvoid.filter((x) => !conflict.includes(x)) }),
        },
      ],
    });
  }

  if (!input.instrumentsInclude.length) {
    out.push({
      id: "no-instruments",
      level: "tip",
      title: "Sebut 3–4 instrumen utama",
      detail: "Instrumen yang spesifik (mis. ‘felt piano’ bukan ‘piano’) adalah cara termurah untuk keluar dari sound default.",
    });
  } else if (input.instrumentsInclude.length > 6) {
    out.push({
      id: "too-many-instruments",
      level: "tip",
      title: "Instrumen terlalu banyak",
      detail: "Lebih dari 6 instrumen membuat mix padat dan generik. Ruang kosong adalah ciri produksi manusia.",
    });
  }

  if (!isInstrumental(input) && (!clean(input.vocal.timbre) || !clean(input.vocal.delivery))) {
    out.push({
      id: "vocal-detail",
      level: "tip",
      title: "Detailkan vokal",
      detail: "Isi timbre (mis. ‘breathy alto with a slight rasp’) dan delivery (mis. ‘almost spoken in verses’). Tanpa ini model memakai vokal pop yang dipoles.",
    });
  }

  if (input.structure.length && !input.structure.some((s) => clean(s.note))) {
    out.push({
      id: "no-section-notes",
      level: "tip",
      title: "Beri catatan aransemen per section",
      detail: "Kontras antar-section adalah obat utama lagu datar. Contoh: Verse ‘voice and guitar only’, Chorus ‘full band enters’.",
    });
  }

  if (input.lyrics.trim() && !/^\s*\[[^\]]+\]\s*$/m.test(input.lyrics) && input.structure.length) {
    out.push({
      id: "auto-tag",
      level: "info",
      title: "Lirik akan diberi tag otomatis",
      detail: "Paragraf (dipisah baris kosong) dipetakan ke section sesuai struktur. Tulis tag sendiri, mis. [Verse 1], untuk kontrol penuh.",
    });
  }

  if (clean(input.references)) {
    out.push({
      id: "references",
      level: platform === "generic" ? "info" : "warning",
      title: platform === "generic" ? "Referensi dimasukkan ke brief" : "Referensi tidak dikirim ke prompt",
      detail: looksLikeProperNames(input.references)
        ? "Suno/Udio umumnya menolak nama artis. Terjemahkan referensimu menjadi deskriptor: era, instrumen, karakter vokal, ruang, mixing — lalu isi di bagian Produksi."
        : "Referensi hanya dipakai di format Generic. Untuk Suno/Udio, pindahkan deskriptornya ke bagian Produksi atau Vokal.",
    });
  }

  const genreText = [input.genre, ...input.subgenres].join(" ");
  for (const tip of GENRE_TIPS) {
    if (tip.match.test(genreText)) {
      out.push({ id: `genre-${tip.title}`, level: "tip", title: tip.title, detail: tip.detail });
    }
  }

  if (!input.strongAntiSlop) {
    out.push({
      id: "strong-off",
      level: "info",
      title: "Instruksi anti-slop kuat nonaktif",
      detail: "Aktifkan untuk menambah arahan positif (human feel, kontras dinamika) dan exclusion tambahan.",
      actions: [{ label: "Aktifkan", apply: (i) => ({ ...i, strongAntiSlop: true }) }],
    });
  }

  // Length check against the active platform profile.
  const activeLimit = profile.limits.style ?? profile.limits.prompt ?? profile.limits.brief;
  if (activeLimit) {
    const limit = activeLimit;
    const len = (v: "compact" | "standard" | "detailed") =>
      generatePrompt(input, platform, v, profile).fields.find((f) => f.key === "style" || f.key === "prompt" || f.key === "brief")?.content.length ?? 0;
    const std = len("standard");
    const det = len("detailed");
    if (std > limit) {
      out.push({
        id: "style-too-long",
        level: "warning",
        title: `Prompt melebihi batas ${limit} karakter (${profile.label})`,
        detail: `Varian Standar ${std}/${limit} karakter. Gunakan varian Ringkas (${len("compact")} karakter), aktifkan auto-trim 1000 karakter, atau kurangi deskriptor.`,
      });
    } else if (det > limit) {
      out.push({
        id: "style-detailed-too-long",
        level: "tip",
        title: `Varian Detail melebihi batas ${limit} karakter`,
        detail: `${det}/${limit} karakter. Varian Standar aman (${std}).`,
      });
    }
  }

  const plan = planNegatives(input);
  if (plan.dropped.length) {
    out.push({
      id: "negatives-dropped",
      level: "info",
      title: `${plan.dropped.length} negatif otomatis dipangkas oleh budget`,
      detail: `Budget ${input.negativeBudget} menjaga exclusion terpenting tetap kuat. Dipangkas: ${plan.dropped.join(", ")}.`,
      actions: [{ label: "Naikkan budget +5", apply: (i) => ({ ...i, negativeBudget: i.negativeBudget + 5 }) }],
    });
  }
  if (plan.user.length > input.negativeBudget && input.negativeBudget > 0) {
    out.push({
      id: "user-negatives-over",
      level: "tip",
      title: "Negatif manualmu melebihi budget",
      detail: `${plan.user.length} negatif ditulis manual. Semuanya tetap dikirim, tapi daftar yang panjang bisa melemahkan masing-masing item.`,
    });
  }

  const order = { warning: 0, tip: 1, info: 2 } as const;
  return out.sort((a, b) => order[a.level] - order[b.level]);
}
