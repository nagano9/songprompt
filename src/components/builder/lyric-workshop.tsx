"use client";

import * as React from "react";
import { AlertTriangle, ChevronDown, Info, Lightbulb, Loader2, Sparkles, Mic2 } from "lucide-react";
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
      <div className="rounded-xs border border-border/80 bg-secondary/30 p-2 font-mono text-[11px] text-muted-foreground">
        Asisten AI (opsional) nonaktif. Aktifkan di Pengaturan dengan API key Anthropic milikmu sendiri.
      </div>
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
    <div className="space-y-2 pt-1 border-t border-border/40">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" className="h-7 font-mono text-xs" disabled={!!busy || !input.lyrics.trim()} onClick={() => run("critique")}>
          {busy === "critique" ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />} Kritik lirikku
        </Button>
        <Button type="button" size="sm" variant="outline" className="h-7 font-mono text-xs" disabled={!!busy || !input.lyrics.trim()} onClick={() => run("rewrite")}>
          {busy === "rewrite" ? <Loader2 className="animate-spin h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />} Tulis ulang baris klise
        </Button>
      </div>
      {!apiKey && <p className="font-mono text-[11px] text-destructive">API key belum diisi di Pengaturan.</p>}
      {error && <p className="font-mono text-xs text-destructive" role="alert">{error}</p>}
      {critique && (
        <div className="rounded-sm border border-border/80 bg-card p-3">
          <p className="mb-1 font-mono text-xs font-semibold text-foreground">Kritik dari {llmModel}</p>
          <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-muted-foreground">{critique}</div>
        </div>
      )}
      {rewrite && (
        <div className="space-y-2 rounded-sm border border-accent/60 bg-card p-3">
          <p className="font-mono text-xs font-semibold text-accent-strong uppercase">Usulan revisi lirik — periksa sebelum menerapkan</p>
          <pre className="max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[12px] leading-relaxed bg-secondary/30 p-2.5 rounded-xs border border-border/40">{rewrite}</pre>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="accent"
              className="h-7 font-mono text-xs"
              onClick={() => {
                setField("lyrics", rewrite);
                setRewrite(null);
              }}
            >
              Terapkan revisi
            </Button>
            <Button type="button" size="sm" variant="ghost" className="h-7 font-mono text-xs" onClick={() => setRewrite(null)}>
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
    <div className="rounded-sm border border-border/80 bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left bg-secondary/20 hover:bg-secondary/40 transition-colors"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 font-mono text-xs font-semibold text-foreground">
          <Mic2 className="h-3.5 w-3.5 text-accent-strong" />
          <span>Lirik workshop</span>
          <span className="font-normal text-muted-foreground">
            · {analysis.totalLines} baris · {analysis.lang === "id" ? "Indonesia" : "Inggris"}
            {analysis.hook ? ` · hook: “${analysis.hook}”` : ""}
            {analysis.findings.length ? ` · ${analysis.findings.length} catatan` : ""}
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform text-muted-foreground", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-border/60 p-3 bg-card">
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
                    <span className="text-foreground/90">{f.message}</span>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="space-y-3">
            {analysis.sections.map((sec, si) => (
              <div key={si} className="rounded-xs border border-border/60 bg-secondary/20 p-2.5">
                <div className="mb-1.5 flex items-baseline justify-between text-[11px] border-b border-border/30 pb-1">
                  <span className="font-mono font-bold uppercase tracking-wider text-accent-strong">{sec.label}</span>
                  <span className="font-mono text-muted-foreground">
                    rima {sec.scheme || "–"} · rata-rata {sec.avgSyllables} suku kata
                  </span>
                </div>
                <table className="w-full text-xs font-mono">
                  <tbody>
                    {sec.lines.map((l, li) => (
                      <tr key={li} className={cn(l.flag && "bg-amber-500/10")}>
                        <td className="w-6 py-0.5 pr-2 text-right text-[11px] text-accent-strong">{l.rhyme}</td>
                        <td className="py-0.5 text-foreground/90">{l.text}</td>
                        <td
                          className={cn(
                            "w-10 py-0.5 text-right tabular-nums",
                            l.flag ? "font-bold text-amber-600 dark:text-amber-400" : "text-muted-foreground",
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
          <p className="font-mono text-[10.5px] text-muted-foreground">
            Suku kata bahasa Indonesia dihitung akurat (pola vokal teratur); bahasa Inggris berupa perkiraan ±1.
          </p>
          <AiAssist cliches={analysis.cliches} />
        </div>
      )}
    </div>
  );
}
