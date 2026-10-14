"use client";

import { Check } from "lucide-react";
import { TEMPLATES } from "@/lib/prompt/templates";
import { useBuilderStore } from "@/store/builder-store";
import { cn } from "@/lib/utils";

export function TemplateGallery() {
  const applyTemplate = useBuilderStore((s) => s.applyTemplate);
  const activeId = useBuilderStore((s) => s.activeTemplateId);

  return (
    <section aria-labelledby="templates-heading" className="space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="templates-heading" className="text-sm font-semibold">
          Mulai dari template anti-slop
        </h2>
        <p className="hidden text-xs text-muted-foreground sm:block">Lirik yang sudah kamu tulis tidak ikut terhapus.</p>
      </div>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 xl:grid-cols-4">
        {TEMPLATES.map((t) => {
          const active = t.id === activeId;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => applyTemplate(t)}
              className={cn(
                "relative flex w-60 shrink-0 snap-start flex-col gap-2 rounded-xl border bg-card p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:w-auto",
                active && "border-accent ring-2 ring-accent/40",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold leading-snug">{t.name}</span>
                {active && <Check className="h-4 w-4 shrink-0 text-accent-strong" />}
              </div>
              <span className="text-xs leading-relaxed text-muted-foreground">{t.description}</span>
              <span className="mt-auto flex flex-wrap gap-1 pt-1">
                {t.tags.map((tag) => (
                  <span key={tag} className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
