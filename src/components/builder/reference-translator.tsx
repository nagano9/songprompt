"use client";

import * as React from "react";
import { Wand2 } from "lucide-react";
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

  if (!input.references.trim()) {
    return (
      <p className="text-xs text-muted-foreground">
        Dikenali: {REFERENCES.slice(0, 8).map((r) => r.display).join(", ")}, dan {REFERENCES.length - 8} lainnya.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {matches.length > 0 && (
        <div className="space-y-1.5 rounded-lg border bg-muted/40 p-3">
          <p className="text-xs font-medium">Diterjemahkan menjadi deskriptor</p>
          <ul className="space-y-1.5">
            {matches.map(({ entry }) => (
              <li key={entry.id} className="text-xs">
                <span className="font-medium">{entry.display}</span>
                <span className="text-muted-foreground"> — {describeTraits(entry)}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                replaceInput(applyReferences(input, matches.map((m) => m.entry)));
                setApplied(matches.map((m) => m.entry.display));
              }}
            >
              <Wand2 /> Isi ke form
            </Button>
            <span className="text-[11px] text-muted-foreground">Hanya mengisi field kosong — isianmu tidak ditimpa.</span>
          </div>
          {applied.length > 0 && <p className="text-[11px] text-accent-strong" role="status">Diterapkan: {applied.join(", ")}</p>}
        </div>
      )}
      {unknown.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Belum dikenali: <span className="font-medium text-foreground">{unknown.join(", ")}</span>. Deskripsikan era, instrumen,
          karakter vokal, dan mixing-nya di bagian Produksi/Vokal.
        </p>
      )}
      <p className="text-[11px] text-muted-foreground">
        Menerjemahkan <em>gaya</em> menjadi deskriptor, bukan meniru suara artis. Nama artis tidak pernah dikirim ke Suno/Udio.
      </p>
    </div>
  );
}
