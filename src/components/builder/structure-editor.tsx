"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SECTION_NAMES, type SectionName, type SongSection } from "@/lib/types";
import { makeStructure, STRUCTURE_PRESETS } from "@/lib/prompt/defaults";
import { uid } from "@/lib/utils";

interface Props {
  value: SongSection[];
  onChange: (next: SongSection[]) => void;
}

export function StructureEditor({ value, onChange }: Props) {
  const update = (id: string, patch: Partial<SongSection>) =>
    onChange(value.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const add = (name: SectionName) => onChange([...value, { id: uid(), name, note: "" }]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {STRUCTURE_PRESETS.map((p) => (
          <Button
            key={p.id}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(makeStructure(p.sections, `${p.id}-${uid().slice(0, 4)}`))}
          >
            {p.label}
          </Button>
        ))}
      </div>

      <ol className="space-y-1.5">
        {value.map((section, i) => (
          <li key={section.id} className="group flex items-center gap-2 rounded-lg border bg-muted/40 p-1.5 pl-2">
            <span className="w-5 shrink-0 text-right font-mono text-[11px] text-muted-foreground tabular-nums">{i + 1}</span>
            <select
              value={section.name}
              onChange={(e) => update(section.id, { name: e.target.value as SectionName })}
              className="h-8 w-[8.5rem] shrink-0 rounded-md border border-input bg-card px-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Jenis section ${i + 1}`}
            >
              {SECTION_NAMES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <Input
              value={section.note}
              onChange={(e) => update(section.id, { note: e.target.value })}
              placeholder="catatan aransemen, mis. ‘voice and piano only’"
              className="h-8 min-w-0 flex-1 text-[13px]"
              aria-label={`Catatan section ${i + 1}`}
            />
            <div className="flex shrink-0 items-center opacity-70 group-hover:opacity-100">
              <Button type="button" variant="ghost" size="icon-sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Naikkan">
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => move(i, 1)}
                disabled={i === value.length - 1}
                aria-label="Turunkan"
              >
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onChange(value.filter((s) => s.id !== section.id))}
                aria-label="Hapus section"
              >
                <X />
              </Button>
            </div>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-muted-foreground">Tambah:</span>
        {(["Verse", "Pre-Chorus", "Chorus", "Bridge", "Instrumental Break", "Outro"] as SectionName[]).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => add(n)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-0.5 text-xs text-muted-foreground hover:border-solid hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
