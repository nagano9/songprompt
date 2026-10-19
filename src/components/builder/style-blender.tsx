"use client";

import * as React from "react";
import { Sparkles, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "@/store/builder-store";

export function StyleBlender() {
  const setField = useBuilderStore((s) => s.setField);

  const [artistA, setArtistA] = React.useState("Joe Satriani");
  const [weightA, setWeightA] = React.useState(70);
  const [artistB, setArtistB] = React.useState("Yngwie Malmsteen");
  const [weightB, setWeightB] = React.useState(30);

  const [genreA, setGenreA] = React.useState("Neo-Classical Metal");
  const [genreB, setGenreB] = React.useState("Ambient Synthwave");
  const [blendGenreRatio] = React.useState(60);

  const applyBlending = () => {
    const fusedStyle = `${weightA}% ${artistA} style (${genreA}) + ${weightB}% ${artistB} style (${genreB}), modern cinematic production, hybrid guitar shredding and warm analog pads`;
    setField("genre", fusedStyle);
  };

  return (
    <div className="rounded-md border border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Layers className="h-4 w-4 text-primary" />
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
          Advanced AI Style Blender & Genre Fusion
        </h3>
      </div>

      <p className="text-xs text-muted-foreground">
        Gabungkan dua karakter artis dan genre musik secara presisi dengan persentase bobot kustom untuk menghasilkan prompt AI yang unik dan orisinal.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Artist Fusion */}
        <div className="space-y-3 rounded-sm border border-border/60 bg-secondary/30 p-3">
          <div className="flex items-center justify-between text-xs font-mono font-semibold">
            <span>Fusi Artistik</span>
            <span className="text-primary">{weightA}% : {weightB}%</span>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[11px] font-mono text-muted-foreground block mb-1">Artist Utama (Bobot: {weightA}%)</label>
              <input
                type="text"
                value={artistA}
                onChange={(e) => setArtistA(e.target.value)}
                className="w-full h-8 rounded-sm border border-border bg-card px-2 font-mono text-xs"
              />
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={weightA}
              onChange={(e) => {
                const val = Number(e.target.value);
                setWeightA(val);
                setWeightB(100 - val);
              }}
              className="w-full accent-primary"
            />
            <div>
              <label className="text-[11px] font-mono text-muted-foreground block mb-1">Artist Pendukung (Bobot: {weightB}%)</label>
              <input
                type="text"
                value={artistB}
                onChange={(e) => setArtistB(e.target.value)}
                className="w-full h-8 rounded-sm border border-border bg-card px-2 font-mono text-xs"
              />
            </div>
          </div>
        </div>

        {/* Genre Fusion */}
        <div className="space-y-3 rounded-sm border border-border/60 bg-secondary/30 p-3">
          <div className="flex items-center justify-between text-xs font-mono font-semibold">
            <span>Fusi Genre & Era</span>
            <span className="text-accent">{blendGenreRatio}% / {100 - blendGenreRatio}%</span>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[11px] font-mono text-muted-foreground block mb-1">Genre 1</label>
              <input
                type="text"
                value={genreA}
                onChange={(e) => setGenreA(e.target.value)}
                className="w-full h-8 rounded-sm border border-border bg-card px-2 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] font-mono text-muted-foreground block mb-1">Genre 2</label>
              <input
                type="text"
                value={genreB}
                onChange={(e) => setGenreB(e.target.value)}
                className="w-full h-8 rounded-sm border border-border bg-card px-2 font-mono text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      <Button
        type="button"
        variant="accent"
        onClick={applyBlending}
        className="w-full h-9 font-mono text-xs font-semibold uppercase tracking-wider"
      >
        <Sparkles className="mr-2 h-3.5 w-3.5" />
        Terapkan Hasil Fusi ke Builder Prompt
      </Button>
    </div>
  );
}
