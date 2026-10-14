/**
 * Optional, opt-in LLM assist using the user's own Anthropic API key.
 * Calls go straight from the browser to api.anthropic.com — there is no server in this app,
 * so the key never touches anything we run. Direct browser access requires the
 * `anthropic-dangerous-direct-browser-access` header; the "dangerous" part is that a key in a
 * web page is visible to that page, which is acceptable only because it is the user's own key
 * in their own browser.
 */

export const DEFAULT_MODEL = "claude-haiku-5-5";
export const MODEL_OPTIONS = [
  { id: "claude-haiku-5-5", label: "Claude Haiku 5.5 (cepat, murah)" },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 (lebih tajam)" },
];

const ENDPOINT = "https://api.anthropic.com/v1/messages";

export class LlmError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

interface CallOptions {
  apiKey: string;
  model: string;
  system: string;
  prompt: string;
  maxTokens?: number;
  signal?: AbortSignal;
}

export async function callClaude({ apiKey, model, system, prompt, maxTokens = 1500, signal }: CallOptions): Promise<string> {
  if (!apiKey.trim()) throw new LlmError("API key belum diisi. Buka Pengaturan → Asisten AI.");
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey.trim(),
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new LlmError("Tidak bisa menghubungi API Anthropic. Periksa koneksi internet.");
  }

  if (!res.ok) {
    let detail = "";
    try {
      const body = (await res.json()) as { error?: { message?: string } };
      detail = body.error?.message ?? "";
    } catch {
      /* ignore */
    }
    const hint =
      res.status === 401 ? "API key tidak valid." : res.status === 404 ? "Model tidak ditemukan — ganti model di Pengaturan." : res.status === 429 ? "Kena rate limit, coba lagi sebentar." : "";
    throw new LlmError([hint, detail].filter(Boolean).join(" ") || `Permintaan gagal (HTTP ${res.status}).`, res.status);
  }

  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("\n").trim();
  if (!text) throw new LlmError("Respons kosong dari model.");
  return text;
}

const SONGWRITER_SYSTEM =
  "You are a demanding, honest songwriting editor. You hate clichés, vague imagery and AI-sounding lyrics. " +
  "You value concrete detail (objects, places, times, names, small habits), singable phrasing and earned emotion. " +
  "Answer in the same language the user writes their instructions in.";

export function critiquePrompt(lyrics: string, context: string): string {
  return [
    "Kritik lirik lagu berikut. Fokus pada: klise dan citra yang kabur, baris yang sulit dinyanyikan,",
    "kekuatan hook, konsistensi sudut pandang, dan detail konkret yang hilang.",
    "Format: maksimal 6 poin, tiap poin mengutip baris yang bermasalah lalu memberi saran konkret. Tutup dengan satu kalimat tentang kekuatan terbesar lirik ini.",
    context ? `\nKonteks lagu: ${context}` : "",
    "\n<lyrics>\n" + lyrics + "\n</lyrics>",
  ].join("\n");
}

export function rewritePrompt(lyrics: string, cliches: string[], context: string): string {
  return [
    "Tulis ulang HANYA baris-baris yang klise atau kabur dalam lirik berikut. Pertahankan semua baris lain persis sama,",
    "pertahankan bahasa, jumlah baris, tag section seperti [Verse 1], dan jumlah suku kata kira-kira sama agar tetap bisa dinyanyikan.",
    cliches.length ? `Klise yang terdeteksi: ${cliches.join(", ")}.` : "",
    context ? `Konteks lagu: ${context}` : "",
    "Balas HANYA dengan lirik lengkap hasil revisi, tanpa penjelasan, tanpa pembuka.",
    "\n<lyrics>\n" + lyrics + "\n</lyrics>",
  ].join("\n");
}

export { SONGWRITER_SYSTEM };

/** Strip accidental wrappers (code fences, <lyrics> tags) from a rewrite. */
export function cleanRewrite(text: string): string {
  return text
    .replace(/^```[a-z]*\n?/i, "")
    .replace(/\n?```$/, "")
    .replace(/^<lyrics>\n?/i, "")
    .replace(/\n?<\/lyrics>$/i, "")
    .trim();
}
