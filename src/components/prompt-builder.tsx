"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PromptForm } from "@/components/builder/prompt-form";
import { TemplateGallery } from "@/components/builder/template-gallery";
import { OutputPanel } from "@/components/output/output-panel";
import { ScoreMeter, SuggestionsPanel } from "@/components/output/suggestions-panel";
import { HistoryPanel } from "@/components/history/history-panel";
import { generatePrompt } from "@/lib/prompt/generator";
import { buildSuggestions, specificityScore } from "@/lib/prompt/suggestions";
import { useBuilderStore } from "@/store/builder-store";
import { useHistoryStore } from "@/store/history-store";

function useDeferred<T>(value: T): T {
  // Keeps typing snappy: prompt generation re-runs at lower priority.
  return React.useDeferredValue(value);
}

export function PromptBuilder() {
  const input = useBuilderStore((s) => s.input);
  const platform = useBuilderStore((s) => s.platform);
  const variant = useBuilderStore((s) => s.variant);
  const reset = useBuilderStore((s) => s.reset);
  const addHistory = useHistoryStore((s) => s.add);
  const historyCount = useHistoryStore((s) => s.entries.length);

  const [tab, setTab] = React.useState("output");
  const [confirmReset, setConfirmReset] = React.useState(false);

  // Rehydrate persisted stores on the client only (both use skipHydration to avoid SSR mismatch).
  React.useEffect(() => {
    void useBuilderStore.persist.rehydrate();
    void useHistoryStore.persist.rehydrate();
  }, []);

  React.useEffect(() => {
    if (!confirmReset) return;
    const t = setTimeout(() => setConfirmReset(false), 3000);
    return () => clearTimeout(t);
  }, [confirmReset]);

  const deferredInput = useDeferred(input);
  const output = React.useMemo(() => generatePrompt(deferredInput, platform, variant), [deferredInput, platform, variant]);
  const suggestions = React.useMemo(() => buildSuggestions(deferredInput, platform), [deferredInput, platform]);
  const score = React.useMemo(() => specificityScore(deferredInput), [deferredInput]);
  const warnings = suggestions.filter((s) => s.level === "warning").length;

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-24 lg:pb-16 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b py-6">
        <div className="space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-strong">Suno · Udio · Generic</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Anti-Slop Music Prompt Builder</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Ubah ide lagu menjadi prompt yang spesifik. Model AI mengisi setiap celah dengan rata-rata — tugas kita
            menutup celah itu.
          </p>
        </div>
        <Button
          variant={confirmReset ? "destructive" : "outline"}
          onClick={() => {
            if (confirmReset) {
              reset();
              setConfirmReset(false);
            } else setConfirmReset(true);
          }}
        >
          <RotateCcw />
          {confirmReset ? "Klik lagi untuk reset" : "Reset form"}
        </Button>
      </header>

      <div className="py-6">
        <TemplateGallery />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] xl:grid-cols-[minmax(0,1fr)_minmax(0,500px)]">
        <PromptForm />

        <aside id="output" className="scroll-mt-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto">
          <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
            <ScoreMeter score={score} />
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="output">Preview</TabsTrigger>
                <TabsTrigger value="suggestions">
                  Saran
                  {suggestions.length > 0 && (
                    <span
                      className={
                        warnings
                          ? "rounded-full bg-destructive px-1.5 text-[10px] text-white"
                          : "rounded-full bg-muted-foreground/20 px-1.5 text-[10px]"
                      }
                    >
                      {suggestions.length}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="history">
                  Riwayat
                  {historyCount > 0 && <span className="rounded-full bg-muted-foreground/20 px-1.5 text-[10px]">{historyCount}</span>}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="output">
                <OutputPanel output={output} onSave={() => addHistory(deferredInput, output)} />
              </TabsContent>
              <TabsContent value="suggestions">
                <SuggestionsPanel suggestions={suggestions} />
              </TabsContent>
              <TabsContent value="history">
                <HistoryPanel onRestored={() => setTab("output")} />
              </TabsContent>
            </Tabs>
          </div>
        </aside>
      </div>

      {/* Mobile: the preview sits below 10 form cards — give a one-tap jump to it. */}
      <div className="fixed inset-x-4 bottom-4 z-20 lg:hidden">
        <Button
          variant="accent"
          size="lg"
          className="w-full shadow-lg"
          onClick={() => {
            setTab("output");
            document.getElementById("output")?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          Lihat Prompt · skor {score.score}
        </Button>
      </div>
    </div>
  );
}
