import type { Platform, PromptInput, Variant } from "@/lib/types";

/**
 * Shareable links without a backend: the form state lives in the URL hash (#p=…),
 * which browsers never send to the server.
 * Format: "z" + base64url(deflate-raw(json)) when CompressionStream exists, else "j" + base64url(json).
 */
export interface SharePayload {
  v: 1;
  input: PromptInput;
  platform: Platform;
  variant: Variant;
}

export const SHARE_PARAM = "p";

function toBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const body = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(body).arrayBuffer());
}

export async function encodeShare(payload: Omit<SharePayload, "v">): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify({ v: 1, ...payload }));
  if (typeof CompressionStream !== "undefined") {
    return "z" + toBase64Url(await pipe(json, new CompressionStream("deflate-raw")));
  }
  return "j" + toBase64Url(json);
}

export async function decodeShare(token: string): Promise<SharePayload | null> {
  try {
    const kind = token[0];
    const bytes = fromBase64Url(token.slice(1));
    const raw =
      kind === "z" ? await pipe(bytes, new DecompressionStream("deflate-raw")) : kind === "j" ? bytes : null;
    if (!raw) return null;
    const data = JSON.parse(new TextDecoder().decode(raw)) as Partial<SharePayload>;
    if (data.v !== 1 || !data.input || typeof data.input !== "object") return null;
    if (!["suno", "udio", "generic"].includes(String(data.platform))) return null;
    if (!["compact", "standard", "detailed"].includes(String(data.variant))) return null;
    return data as SharePayload;
  } catch {
    return null;
  }
}

/** Read the share token from a location hash like "#p=z…". */
export function tokenFromHash(hash: string): string | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  return params.get(SHARE_PARAM);
}

export async function buildShareUrl(base: string, payload: Omit<SharePayload, "v">): Promise<string> {
  const url = new URL(base);
  url.hash = `${SHARE_PARAM}=${await encodeShare(payload)}`;
  return url.toString();
}
