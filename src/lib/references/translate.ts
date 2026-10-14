import type { PromptInput } from "@/lib/types";
import { clean, uniq } from "@/lib/utils";
import { REFERENCES, type ReferenceEntry } from "./dictionary";

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export interface ReferenceMatch {
  entry: ReferenceEntry;
  matchedName: string;
}

/** Find known artists/scenes mentioned anywhere in free text (whole-word match). */
export function matchReferences(text: string): ReferenceMatch[] {
  const t = text.toLowerCase();
  const out: ReferenceMatch[] = [];
  for (const entry of REFERENCES) {
    const name = entry.names.find((n) => new RegExp(`(^|[^\\p{L}])${escapeRegex(n)}(?=$|[^\\p{L}])`, "u").test(t));
    if (name) out.push({ entry, matchedName: name });
  }
  return out;
}

/** Capitalised word runs that look like names but are not in the dictionary. */
export function unknownNames(text: string, matches: ReferenceMatch[]): string[] {
  const known = matches.flatMap((m) => m.entry.names);
  const runs = text.match(/\b[A-Z][\p{L}'’]+(?:\s+[A-Z0-9][\p{L}'’]*)*/gu) ?? [];
  const stop = new Set(["I", "The", "A", "Like", "Mirip", "Seperti", "Ala", "Kayak", "Dan", "And"]);
  return uniq(
    runs
      .map((r) => r.split(/\s+/).filter((w) => !stop.has(w)).join(" "))
      .filter((r) => r && !known.some((k) => k.includes(r.toLowerCase()) || r.toLowerCase().includes(k))),
  );
}

const MAX_INSTRUMENTS = 6;

/**
 * Merge reference traits into the input WITHOUT overwriting what the user already wrote:
 * empty text fields get filled, list fields get unioned (capped), the genre is only set if empty.
 */
export function applyReferences(input: PromptInput, entries: ReferenceEntry[]): PromptInput {
  const next: PromptInput = {
    ...input,
    vocal: { ...input.vocal },
    production: { ...input.production },
  };
  const fill = (cur: string, val?: string) => (clean(cur) ? cur : (val ?? cur));

  for (const { traits: t } of entries) {
    next.genre = fill(next.genre, t.genre);
    next.tempoFeel = fill(next.tempoFeel, t.tempoFeel);
    next.production.era = fill(next.production.era, t.era);
    next.production.mixStyle = fill(next.production.mixStyle, t.mixStyle);
    next.production.texture = fill(next.production.texture, t.texture);
    next.production.space = fill(next.production.space, t.space);
    if (next.vocal.type !== "instrumental") {
      next.vocal.timbre = fill(next.vocal.timbre, t.timbre);
      next.vocal.delivery = fill(next.vocal.delivery, t.delivery);
    }
    if (t.subgenres && next.subgenres.length < 2) {
      next.subgenres = uniq([...next.subgenres, ...t.subgenres]).filter((s) => s.toLowerCase() !== next.genre.toLowerCase()).slice(0, 2);
    }
    if (t.moods && next.moods.length < 2) next.moods = uniq([...next.moods, ...t.moods]).slice(0, 3);
    if (t.instruments) next.instrumentsInclude = uniq([...next.instrumentsInclude, ...t.instruments]).slice(0, MAX_INSTRUMENTS);
  }
  return next;
}

/** Human-readable list of what applying an entry would contribute. */
export function describeTraits(entry: ReferenceEntry): string {
  const t = entry.traits;
  return uniq([t.genre, t.era, ...(t.instruments ?? []).slice(0, 3), t.timbre, t.delivery, t.texture]).join(" · ");
}
