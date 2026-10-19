"use client";

import { Languages } from "lucide-react";
import { findGlossaryTerms, translateText } from "@/lib/glossary/id-en";

/**
 * Shown under a descriptor field when it contains Indonesian terms from the glossary.
 * One click rewrites the field in English; the user sees exactly what will change.
 */
export function GlossaryHint({ value, onApply }: { value: string; onApply: (next: string) => void }) {
  const terms = findGlossaryTerms(value);
  if (!terms.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs pt-1">
      <Languages className="h-3.5 w-3.5 text-accent-strong" aria-hidden />
      <span className="font-mono text-[11px] text-muted-foreground">
        {terms.map((t) => (
          <span key={t.id} className="mr-1.5 whitespace-nowrap">
            {t.id} → <span className="font-medium text-foreground">{t.en}</span>
          </span>
        ))}
      </span>
      <button
        type="button"
        onClick={() => onApply(translateText(value))}
        className="rounded-xs border border-border bg-card px-2 py-0.5 font-mono text-[11px] font-medium text-foreground hover:bg-muted transition-colors active:translate-y-px"
      >
        Terjemahkan
      </button>
    </div>
  );
}
