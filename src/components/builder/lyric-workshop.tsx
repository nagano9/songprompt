"use client";

import * as React from "react";
import { AlertTriangle, ChevronDown, Info, Lightbulb, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analyzeLyrics } from "@/lib/lyrics/analyze";
import { callClaude, cleanRewrite, critiquePrompt, LlmError, rewritePrompt, SONGWRITER_SYSTEM } from "@/lib/llm/anthropic";
import { cn, uniq } from "@/lib/utils";
import { useBuilderStore } from "@/store/builder-store";
import { useSettingsStore } from "@/store/settings-store";

const ICON = { warning: AlertTriangle, tip: Lightbulb, info: Info } as const;

function AiAssist({ cliches }: { cliches: string[] }) {
  const input = useBuilderStore((s) => s.input);
  const setField = useBuilderStore((s) => s.setField);
  const { llmEnabled, apiKey, llmModel } = useSettingsStore();
  const [busy, setBusy] = React.useState<"critique" | "rewrite" | null>(null);
  const [critique, setCritique] = React.useState<string | null>(null);
  const [rewrite, setRewrite] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => () => abortRef.current?.abort(), []);

  if (!llmEnabled) {
    return (
      <p className="text-[11px] text-muted-foreground">
        Asisten AI (opsional) nonaktif. Aktifkan di Pengaturan dengan API key Anthropic milikmu sendiri.
      </p>
    );
  }

  const context = uniq([input.genre, ...input.moods, input.theme]).join(", ");

  const run = async (kind: "critique" | "rewrite") => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setBusy(kind);
    setError(null);
    try {
      const text = await callClaude({
        apiKey,
        model: llmModel,
        system: SONGWRITER_SYSTEM,
        prompt: kind === "critique" ? critiquePrompt(input.lyrics, context) : rewritePrompt(input.lyrics, cliches, context),
        maxTokens: kind === "critique" ? 900 : 2000,
        signal: ctrl.signal,
      });
      if (kind === "critique") setCritique(text);
      else setRewrite(cleanRewrite(text));
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError(e instanceof LlmError ? e.message : "Terjadi kesalahan.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" disabled={!!busy || !input.lyrics.trim()} onClick={() => run("critique")}>
          {busy === "critique" ? <Loader2 className="animate-spin" /> : <Sparkles />} Kritik lirikku
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={!!busy || !input.lyrics.trim()} onClick={() => run("rewrite")}>
          {busy === "rewrite" ? <Loader2 className="animate-spin" /> : <Sparkles />} Tulis ulang baris klise
        </Button>
      </div>
      {!apiKey && <p className="text-[11px] text-destructive">API key belum diisi di Pengaturan.</p>}
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
      {critique && (
        <div className="rounded-lg border bg-card p-3">
          <p className="mb-1 text-xs font-semibold">Kritik dari {llmModel}</p>
          <div className="whitespace-pre-wrap text-xs leading-relaxed">{critique}</div>
        </div>
      )}
      {rewrite && (
        <div className="space-y-2 rounded-lg border border-accent/50 bg-card p-3">
          <p className="text-xs font-semibold">Usulan revisi — periksa sebelum menerapkan</p>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[12px] leading-relaxed">{rewrite}</pre>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="accent"
              onClick={() => {
                setField("lyrics", rewrite);
                setRewrite(null);
              }}
            >
              Terapkan revisi
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setRewrite(null)}>
              Buang
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function LyricWorkshop() {
  const lyrics = useBuilderStore((s) => s.input.lyrics);
  const language = useBuilderStore((s) => s.input.vocal.language);
  const deferred = React.useDeferredValue(lyrics);
  const analysis = React.useMemo(() => analyzeLyrics(deferred, language), [deferred, language]);
  const [open, setOpen] = React.useState(false);

  if (!lyrics.trim()) return null;

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
        aria-expanded={open}
      >
        <span className="text-xs font-semibold">
          Lirik workshop
          <span className="ml-2 font-normal text-muted-foreground">
            {analysis.totalLines} baris · {analysis.lang === "id" ? "Indonesia" : "Inggris"}
            {analysis.hook ? ` · hook: “${analysis.hook}”` : ""}
            {analysis.findings.length ? ` · ${analysis.findings.length} catatan` : ""}
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-3 border-t px-3 py-3">
          {analysis.findings.length > 0 && (
            <ul className="space-y-1.5">
              {analysis.findings.map((f, i) => {
                const Icon = ICON[f.level];
                return (
                  <li key={i} className="flex gap-2 text-xs leading-relaxed">
                    <Icon
                      className={cn(
                        "mt-0.5 h-3.5 w-3.5 shrink-0",
                        f.level === "warning" ? "text-destructive" : f.level === "tip" ? "text-accent-strong" : "text-muted-foreground",
                      )}
                    />
                    <span>{f.message}</span>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="space-y-3">
            {analysis.sections.map((sec, si) => (
              <div key={si}>
                <div className="mb-1 flex items-baseline justify-between text-[11px]">
                  <span className="font-semibold uppercase tracking-wide">{sec.label}</span>
                  <span className="font-mono text-muted-foreground">
                    rima {sec.scheme || "–"} · rata-rata {sec.avgSyllables} suku kata
                  </span>
                </div>
                <table className="w-full text-[12px]">
                  <tbody>
                    {sec.lines.map((l, li) => (
                      <tr key={li} className={cn(l.flag && "bg-amber-500/10")}>
                        <td className="w-6 py-0.5 pr-2 text-right font-mono text-[11px] text-accent-strong">{l.rhyme}</td>
                        <td className="py-0.5">{l.text}</td>
                        <td
                          className={cn(
                            "w-10 py-0.5 text-right font-mono tabular-nums",
                            l.flag ? "font-semibold text-amber-700 dark:text-amber-400" : "text-muted-foreground",
                          )}
                          title={l.flag === "long" ? "Jauh lebih panjang dari rata-rata section" : l.flag === "short" ? "Jauh lebih pendek dari rata-rata section" : undefined}
                        >
                          {l.syllables}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Suku kata bahasa Indonesia akurat (pola vokal teratur); bahasa Inggris berupa perkiraan ±1.
          </p>
          <AiAssist cliches={analysis.cliches} />
        </div>
      )}
    </div>
  );
}
