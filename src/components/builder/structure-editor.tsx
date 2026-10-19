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
      {/* Preset Arrangement Patterns */}
      <div className="space-y-1.5">
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground/80">
          Preset Aransemen DAW:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {STRUCTURE_PRESETS.map((p) => (
            <Button
              key={p.id}
              type="button"
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[11px] font-mono"
              onClick={() => onChange(makeStructure(p.sections, `${p.id}-${uid().slice(0, 4)}`))}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Sequencer Track Lanes */}
      <ol className="space-y-1.5">
        {value.map((section, i) => (
          <li
            key={section.id}
            className="group flex items-center gap-2 rounded-sm border border-border/70 bg-secondary/30 p-1.5 pl-2.5 transition-colors hover:border-border"
          >
            <span className="w-10 shrink-0 font-mono text-[10.5px] font-semibold text-accent-strong tabular-nums uppercase">
              BAR {String(i + 1).padStart(2, "0")}
            </span>
            <select
              value={section.name}
              onChange={(e) => update(section.id, { name: e.target.value as SectionName })}
              className="h-7 w-[8rem] shrink-0 rounded-xs border border-border bg-card px-2 font-mono text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
              className="h-7 min-w-0 flex-1 text-xs font-mono"
              aria-label={`Catatan section ${i + 1}`}
            />
            <div className="flex shrink-0 items-center opacity-80 group-hover:opacity-100">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => move(i, -1)}
                disabled={i === 0}
                aria-label="Naikkan"
                className="h-6 w-6"
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => move(i, 1)}
                disabled={i === value.length - 1}
                aria-label="Turunkan"
                className="h-6 w-6"
              >
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => onChange(value.filter((s) => s.id !== section.id))}
                aria-label="Hapus section"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
              >
                <X />
              </Button>
            </div>
          </li>
        ))}
      </ol>

      {/* Add Section Buttons (Zero-pill discipline: rectangular sequencer pads) */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground/80 mr-1">
          + Tambah Bagian:
        </span>
        {(["Verse", "Pre-Chorus", "Chorus", "Bridge", "Instrumental Break", "Outro"] as SectionName[]).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => add(n)}
            className="inline-flex items-center gap-1 rounded-xs border border-dashed border-border/90 px-2 py-0.5 font-mono text-[10.5px] text-muted-foreground transition-all hover:border-solid hover:border-foreground/40 hover:text-foreground active:translate-y-px"
          >
            <Plus className="h-2.5 w-2.5" />
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
