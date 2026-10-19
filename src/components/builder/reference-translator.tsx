"use client";

import * as React from "react";
import { Wand2, Disc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { applyReferences, describeTraits, matchReferences, unknownNames } from "@/lib/references/translate";
import { REFERENCES } from "@/lib/references/dictionary";
import { useBuilderStore } from "@/store/builder-store";

export function ReferenceTranslator() {
  const input = useBuilderStore((s) => s.input);
  const replaceInput = useBuilderStore((s) => s.replaceInput);
  const [applied, setApplied] = React.useState<string[]>([]);

  const matches = React.useMemo(() => matchReferences(input.references), [input.references]);
  const unknown = React.useMemo(() => unknownNames(input.references, matches), [input.references, matches]);

  const openArtistRadar = (artistName: string) => {
    window.dispatchEvent(
      new CustomEvent("ais-open-artist-radar", {
        detail: { artistName },
      }),
    );
    const el = document.getElementById("song-radar-heading");
    el?.scrollIntoView({ behavior: "smooth" });
  };

  if (!input.references.trim()) {
    return (
      <div className="space-y-1.5">
        <p className="font-mono text-[11px] text-muted-foreground/80">
          Dikenali: {REFERENCES.slice(0, 8).map((r) => r.display).join(", ")}, dan {REFERENCES.length - 8} lainnya.
        </p>
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="font-mono text-[10.5px] text-muted-foreground">Eksplor 5–10 lagu populer:</span>
          {["Sheila on 7", "Dewa 19", "Queen", "Taylor Swift", "The Weeknd", "Tulus"].map((art) => (
            <button
              key={art}
              type="button"
              onClick={() => openArtistRadar(art)}
              className="rounded-xs border border-border/60 bg-secondary/30 px-1.5 py-0.5 font-mono text-[10.5px] text-foreground/80 hover:border-accent hover:text-accent-strong transition-colors"
            >
              🎵 {art}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {matches.length > 0 && (
        <div className="space-y-1.5 rounded-sm border border-border/80 bg-secondary/30 p-3">
          <p className="font-mono text-xs font-semibold text-accent-strong uppercase">
            Diterjemahkan Menjadi Parameter Akustik:
          </p>
          <ul className="space-y-1.5">
            {matches.map(({ entry }) => (
              <li key={entry.id} className="text-xs font-mono flex flex-wrap items-center justify-between gap-1.5 border-b border-border/30 pb-1">
                <div>
                  <span className="font-semibold text-foreground">{entry.display}</span>
                  <span className="text-muted-foreground"> — {describeTraits(entry)}</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => openArtistRadar(entry.display)}
                  className="h-6 px-1.5 font-mono text-[10.5px] text-accent-strong hover:bg-accent/10"
                >
                  <Disc className="h-3 w-3" />
                  <span>Lihat 5–10 Lagu Populer</span>
                </Button>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 font-mono text-xs"
              onClick={() => {
                replaceInput(applyReferences(input, matches.map((m) => m.entry)));
                setApplied(matches.map((m) => m.entry.display));
              }}
            >
              <Wand2 className="h-3.5 w-3.5" /> Isi ke form
            </Button>
            <span className="text-[11px] text-muted-foreground">Hanya mengisi field kosong — isianmu tidak ditimpa.</span>
          </div>
          {applied.length > 0 && <p className="font-mono text-[11px] text-accent-strong" role="status">Diterapkan: {applied.join(", ")}</p>}
        </div>
      )}
      {unknown.length > 0 && (
        <div className="space-y-1">
          <p className="font-mono text-xs text-muted-foreground">
            Belum terdaftar di kamus offline: <span className="font-semibold text-foreground">{unknown.join(", ")}</span>.
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {unknown.map((u) => (
              <Button
                key={u}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => openArtistRadar(u)}
                className="h-6 font-mono text-[10.5px] text-foreground"
              >
                <Disc className="h-3 w-3 text-accent-strong" />
                <span>Pindai 5–10 Lagu Populer "{u}" di Radar</span>
              </Button>
            ))}
          </div>
        </div>
      )}
      <p className="font-mono text-[10.5px] text-muted-foreground/80">
        Menerjemahkan <em>karakter estetika</em> menjadi deskriptor, bukan kloning suara. Nama artis tidak dikirim ke Suno/Udio.
      </p>
    </div>
  );
}
