"use client";

import * as React from "react";
import { Cpu, Terminal, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DawIntegration() {
  const [copiedDaw, setCopiedDaw] = React.useState<string | null>(null);

  const dawGuides = [
    {
      id: "ableton",
      name: "Ableton Live 12 / Suite",
      description: "Gunakan Max for Live MIDI device untuk memasukkan prompt akor dan parameter tempo secara otomatis.",
      instructions: `1. Buka Ableton Live Session View.\n2. Buat MIDI Track baru.\n3. Masukkan file .mid yang diexport dari SongPrompt.\n4. Tambahkan instrument analog & set tempo sesuai hasil scan.`
    },
    {
      id: "flstudio",
      name: "FL Studio 24",
      description: "Import file MIDI ke Piano Roll dan gunakan Fruity Squeeze / Gross Beat untuk tekstur lo-fi.",
      instructions: `1. Buka FL Studio Pattern Editor.\n2. Drag & Drop file .mid ke Channel Rack.\n3. Assign instrumen VST (Nexus / Serum / Sytrus).\n4. Export audio final ke WAV / MP3 lossless.`
    },
    {
      id: "suno",
      name: "Suno v4 / Udio v1.5",
      description: "Gunakan tag gaya musik dan struktur lirik yang dioptimalkan untuk hasil AI generation terbaik.",
      instructions: `1. Salin prompt gaya dari tab Output.\n2. Paste ke kotak Style of Music Suno (maks 1000 karakter).\n3. Masukkan lirik ke tab Custom Lyrics.\n4. Generate & render.`
    }
  ];

  const handleCopy = (id: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedDaw(id);
    setTimeout(() => setCopiedDaw(null), 2000);
  };

  return (
    <div className="rounded-md border border-border bg-card p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Cpu className="h-4 w-4 text-primary" />
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
          DAW Integration & Platform Setup Guide
        </h3>
      </div>

      <p className="text-xs text-muted-foreground">
        Panduan langkah demi langkah untuk menghubungkan output SongPrompt langsung ke DAW profesional atau platform AI music generator.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {dawGuides.map((d) => (
          <div key={d.id} className="rounded-sm border border-border/75 bg-secondary/30 p-3 space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-foreground">{d.name}</span>
                <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug">{d.description}</p>
            </div>

            <div className="pt-2 border-t border-border/50">
              <pre className="font-mono text-[10px] text-accent-strong bg-background/50 p-2 rounded whitespace-pre-wrap">
                {d.instructions}
              </pre>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleCopy(d.id, d.instructions)}
                className="w-full mt-2 h-7 font-mono text-[10px]"
              >
                {copiedDaw === d.id ? <Check className="mr-1 h-3 w-3 text-emerald-500" /> : <Copy className="mr-1 h-3 w-3" />}
                {copiedDaw === d.id ? "Berhasil Disalin" : "Salin Panduan"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
