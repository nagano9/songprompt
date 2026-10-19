"use client";

import { AlertTriangle, Info, Lightbulb, Activity } from "lucide-react";
import type { Suggestion } from "@/lib/types";
import type { ScoreBreakdown } from "@/lib/prompt/suggestions";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/store/builder-store";

const ICON = { warning: AlertTriangle, tip: Lightbulb, info: Info } as const;

export function ScoreMeter({ score }: { score: ScoreBreakdown }) {
  // 20 segments representing 0-100% specificity
  const totalSegments = 20;
  const activeSegments = Math.round((score.score / 100) * totalSegments);

  return (
    <div className="space-y-2 rounded-sm border border-border/80 bg-secondary/30 p-2.5">
      <div className="flex items-baseline justify-between">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-accent-strong" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Headroom Spesifisitas
          </span>
        </div>
        <span className="font-mono text-xs tabular-nums text-foreground">
          <strong className="text-sm font-bold text-accent-strong">{score.score}</strong>
          <span className="text-muted-foreground">/100 · {score.label}</span>
        </span>
      </div>

      {/* Segmented Studio Hardware LED Meter */}
      <div
        className="flex items-center gap-0.5 h-3 rounded-xs bg-muted/60 p-0.5 border border-border/60"
        role="meter"
        aria-valuenow={score.score}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {Array.from({ length: totalSegments }).map((_, i) => {
          const isActive = i < activeSegments;
          // Gradient from green (segments 0-11) to amber (12-16) to red (17-19)
          let activeColor = "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]";
          if (i >= 12 && i < 16) {
            activeColor = "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]";
          } else if (i >= 16) {
            activeColor = "bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]";
          }

          return (
            <div
              key={i}
              className={cn(
                "flex-1 h-full rounded-xxs transition-colors duration-150",
                isActive ? activeColor : "bg-muted-foreground/15",
              )}
            />
          );
        })}
      </div>

      <div className="flex justify-between text-[9px] font-mono text-muted-foreground/70 px-0.5">
        <span>-24 dB</span>
        <span>-12 dB</span>
        <span>-6 dB</span>
        <span className="text-accent-strong">0 dB (PEAK)</span>
      </div>

      <p className="text-[11px] text-muted-foreground leading-snug">
        Semakin detail parameter akustik yang diatur, semakin minim generator AI menebak secara generik.
      </p>
    </div>
  );
}

export function SuggestionsPanel({ suggestions }: { suggestions: Suggestion[] }) {
  const input = useBuilderStore((s) => s.input);
  const replaceInput = useBuilderStore((s) => s.replaceInput);

  if (!suggestions.length) {
    return (
      <div className="py-8 text-center space-y-1">
        <p className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          PROMPT CALIBRATED
        </p>
        <p className="text-xs text-muted-foreground">Tidak ada saran perbaikan — deskriptor sudah tajam.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {suggestions.map((s) => {
        const Icon = ICON[s.level];
        return (
          <li
            key={s.id}
            className={cn(
              "rounded-sm border p-3 transition-colors",
              s.level === "warning" && "border-destructive/40 bg-destructive/5",
              s.level === "tip" && "border-accent/40 bg-accent/5",
              s.level === "info" && "border-border bg-card",
            )}
          >
            <div className="flex gap-2.5">
              <Icon
                className={cn(
                  "mt-0.5 h-3.5 w-3.5 shrink-0",
                  s.level === "warning" ? "text-destructive" : s.level === "tip" ? "text-accent-strong" : "text-muted-foreground",
                )}
              />
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold text-foreground leading-snug">{s.title}</p>
                <p className="text-[11.5px] leading-relaxed text-muted-foreground">{s.detail}</p>
                {s.actions && s.actions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {s.actions.map((a) => (
                      <button
                        key={a.label}
                        type="button"
                        onClick={() => replaceInput(a.apply(input))}
                        className="rounded-sm border border-border bg-card px-2 py-0.5 font-mono text-[11px] font-medium text-foreground hover:border-foreground/40 hover:bg-muted transition-colors active:translate-y-px"
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
