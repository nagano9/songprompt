"use client";

import * as React from "react";
import { Check, Disc } from "lucide-react";
import { TEMPLATES } from "@/lib/prompt/templates";
import { useBuilderStore } from "@/store/builder-store";
import { cn } from "@/lib/utils";

export function TemplateGallery() {
  const applyTemplate = useBuilderStore((s) => s.applyTemplate);
  const activeId = useBuilderStore((s) => s.activeTemplateId);

  return (
    <section aria-labelledby="templates-heading" className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-4 border-b border-border/50 pb-2">
        <div className="flex items-center gap-2">
          <Disc className="h-3.5 w-3.5 text-accent-strong" />
          <h2 id="templates-heading" className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sound Cartridge Presets
          </h2>
        </div>
        <p className="hidden text-[11px] font-mono text-muted-foreground/80 sm:block">
          Preset tidak menghapus lirik yang sudah kamu tulis
        </p>
      </div>

      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-4">
        {TEMPLATES.map((t, idx) => {
          const active = t.id === activeId;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t)}
              className={cn(
                "group relative flex w-64 shrink-0 snap-start flex-col gap-2 rounded-sm border p-3.5 text-left transition-all sm:w-auto",
                active
                  ? "border-accent bg-accent/5 ring-1 ring-accent/30 shadow-xs"
                  : "border-border/90 bg-card hover:border-foreground/30 hover:bg-muted/30",
              )}
            >
              <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  ROM-0{idx + 1}
                </span>
                {active ? (
                  <span className="flex items-center gap-1 font-mono text-[10px] font-semibold text-accent-strong uppercase">
                    <Check className="h-3 w-3" />
                    Aktif
                  </span>
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-border group-hover:bg-accent/60 transition-colors" />
                )}
              </div>

              <div>
                <span className="text-xs font-bold text-foreground leading-snug tracking-tight">
                  {t.name}
                </span>
                <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground line-clamp-2">
                  {t.description}
                </p>
              </div>

              {/* Zero-Pill: Clean unboxed metadata with dot separators */}
              <div className="mt-auto pt-2 border-t border-border/30 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10.5px] font-mono text-muted-foreground/80">
                {t.tags.map((tag, i) => (
                  <React.Fragment key={tag}>
                    <span>{tag}</span>
                    {i < t.tags.length - 1 && <span className="opacity-40" aria-hidden="true">·</span>}
                  </React.Fragment>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
