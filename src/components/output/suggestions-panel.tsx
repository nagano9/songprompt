"use client";

import { AlertTriangle, Info, Lightbulb } from "lucide-react";
import type { Suggestion } from "@/lib/types";
import type { ScoreBreakdown } from "@/lib/prompt/suggestions";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/store/builder-store";

const ICON = { warning: AlertTriangle, tip: Lightbulb, info: Info } as const;

export function ScoreMeter({ score }: { score: ScoreBreakdown }) {
  const tone = score.score >= 80 ? "bg-emerald-600" : score.score >= 60 ? "bg-accent" : score.score >= 35 ? "bg-amber-600" : "bg-destructive";
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-muted-foreground">Skor spesifisitas</span>
        <span className="font-mono text-sm tabular-nums">
          <strong className="text-base">{score.score}</strong>
          <span className="text-muted-foreground">/100 · {score.label}</span>
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="meter" aria-valuenow={score.score} aria-valuemin={0} aria-valuemax={100}>
        <div className={cn("h-full rounded-full transition-all duration-500", tone)} style={{ width: `${score.score}%` }} />
      </div>
      <p className="text-[11px] text-muted-foreground">Semakin sedikit yang harus ditebak model, semakin kecil peluang slop.</p>
    </div>
  );
}

export function SuggestionsPanel({ suggestions }: { suggestions: Suggestion[] }) {
  const input = useBuilderStore((s) => s.input);
  const replaceInput = useBuilderStore((s) => s.replaceInput);

  if (!suggestions.length) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Tidak ada saran — prompt-mu sudah tajam.</p>;
  }

  return (
    <ul className="space-y-2">
      {suggestions.map((s) => {
        const Icon = ICON[s.level];
        return (
          <li
            key={s.id}
            className={cn(
              "rounded-lg border p-3",
              s.level === "warning" && "border-destructive/30 bg-destructive/5",
              s.level === "tip" && "bg-card",
              s.level === "info" && "bg-muted/40",
            )}
          >
            <div className="flex gap-2.5">
              <Icon
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  s.level === "warning" ? "text-destructive" : s.level === "tip" ? "text-accent-strong" : "text-muted-foreground",
                )}
              />
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium leading-snug">{s.title}</p>
                <p className="text-xs leading-relaxed text-muted-foreground">{s.detail}</p>
                {s.actions && s.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {s.actions.map((a) => (
                      <button
                        key={a.label}
                        type="button"
                        onClick={() => replaceInput(a.apply(input))}
                        className="rounded-full border bg-card px-2.5 py-0.5 text-xs font-medium hover:border-foreground/30 hover:bg-muted"
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
