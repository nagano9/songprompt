"use client";

import * as React from "react";
import { Check, Link2, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PromptForm } from "@/components/builder/prompt-form";
import { QuickForm } from "@/components/builder/quick-form";
import { TemplateGallery } from "@/components/builder/template-gallery";
import { OutputPanel } from "@/components/output/output-panel";
import { ExperimentsPanel } from "@/components/output/experiments-panel";
import { InsightsPanel } from "@/components/output/insights-panel";
import { ScoreMeter, SuggestionsPanel } from "@/components/output/suggestions-panel";
import { HistoryPanel } from "@/components/history/history-panel";
import { SettingsDialog } from "@/components/settings-dialog";
import { useActiveProfile, useInsights } from "@/hooks/use-derived";
import { generatePrompt } from "@/lib/prompt/generator";
import { buildSuggestions, specificityScore } from "@/lib/prompt/suggestions";
import { buildShareUrl, decodeShare, tokenFromHash } from "@/lib/share";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/store/builder-store";
import { useHistoryStore } from "@/store/history-store";
import { useSettingsStore, type FormMode } from "@/store/settings-store";

const Pill = ({ children, alert }: { children: React.ReactNode; alert?: boolean }) => (
  <span className={cn("rounded-full px-1.5 text-[10px]", alert ? "bg-destructive text-white" : "bg-muted-foreground/20")}>{children}</span>
);

export function PromptBuilder() {
  const input = useBuilderStore((s) => s.input);
  const platform = useBuilderStore((s) => s.platform);
  const variant = useBuilderStore((s) => s.variant);
  const reset = useBuilderStore((s) => s.reset);
  const loadFromHistory = useBuilderStore((s) => s.loadFromHistory);
  const addHistory = useHistoryStore((s) => s.add);
  const historyCount = useHistoryStore((s) => s.entries.length);
  const mode = useSettingsStore((s) => s.mode);
  const setMode = useSettingsStore((s) => s.setMode);
  const profile = useActiveProfile(platform);
  const insights = useInsights();

  const [tab, setTab] = React.useState("output");
  const [confirmReset, setConfirmReset] = React.useState(false);
  const [banner, setBanner] = React.useState<string | null>(null);
  const [shared, setShared] = React.useState(false);

  // Rehydrate persisted stores on the client only (all use skipHydration to avoid SSR mismatch),
  // THEN apply a shared link so it wins over the saved draft.
  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      await Promise.all([
        useBuilderStore.persist.rehydrate(),
        useHistoryStore.persist.rehydrate(),
        useSettingsStore.persist.rehydrate(),
      ]);
      const token = tokenFromHash(window.location.hash);
      if (!token || cancelled) return;
      const payload = await decodeShare(token);
      if (cancelled) return;
      history.replaceState(null, "", window.location.pathname + window.location.search);
      if (payload) {
        loadFromHistory(payload.input, payload.platform, payload.variant);
        useSettingsStore.getState().setMode("full");
        setBanner("Prompt dibuka dari link share. Draft sebelumnya diganti — ada di Riwayat bila pernah kamu copy.");
      } else {
        setBanner("Link share tidak valid atau rusak.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadFromHistory]);

  React.useEffect(() => {
    if (!confirmReset) return;
    const t = setTimeout(() => setConfirmReset(false), 3000);
    return () => clearTimeout(t);
  }, [confirmReset]);

  const deferredInput = React.useDeferredValue(input);
  const output = React.useMemo(() => generatePrompt(deferredInput, platform, variant, profile), [deferredInput, platform, variant, profile]);
  const suggestions = React.useMemo(
    () => buildSuggestions(deferredInput, platform, { profile, insights }),
    [deferredInput, platform, profile, insights],
  );
  const score = React.useMemo(() => specificityScore(deferredInput), [deferredInput]);
  const warnings = suggestions.filter((s) => s.level === "warning").length;

  const share = async () => {
    const url = await buildShareUrl(window.location.origin + window.location.pathname, { input, platform, variant });
    try {
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    } catch {
      setBanner(`Salin link ini: ${url}`);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-24 sm:px-6 lg:px-8 lg:pb-16">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b py-6">
        <div className="space-y-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-strong">Suno · Udio · Generic</p>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Anti-Slop Music Prompt Builder</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Ubah ide lagu menjadi prompt yang spesifik, lalu biarkan rating hasilmu sendiri menunjukkan apa yang benar-benar berhasil.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border p-0.5" role="radiogroup" aria-label="Mode form">
            {(["quick", "full"] as FormMode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-medium",
                  mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "quick" ? "Cepat" : "Lengkap"}
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={share} aria-label="Salin link share">
            {shared ? <Check /> : <Link2 />}
            <span className="hidden sm:inline">{shared ? "Link tersalin" : "Share"}</span>
          </Button>
          <SettingsDialog />
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
            {confirmReset ? "Klik lagi untuk reset" : <span className="hidden sm:inline">Reset form</span>}
          </Button>
        </div>
      </header>

      {banner && (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-lg border border-accent/50 bg-accent/10 px-3 py-2 text-sm" role="status">
          <span className="break-all">{banner}</span>
          <button type="button" onClick={() => setBanner(null)} aria-label="Tutup pemberitahuan" className="shrink-0 opacity-60 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="py-6">
        <TemplateGallery />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
        {mode === "quick" ? <QuickForm /> : <PromptForm />}

        <aside id="output" className="scroll-mt-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:self-start lg:overflow-y-auto">
          <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
            <ScoreMeter score={score} />
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="output" className="px-1 text-xs">
                  Preview
                </TabsTrigger>
                <TabsTrigger value="ab" className="px-1 text-xs">
                  A/B
                </TabsTrigger>
                <TabsTrigger value="suggestions" className="px-1 text-xs">
                  Saran {suggestions.length > 0 && <Pill alert={warnings > 0}>{suggestions.length}</Pill>}
                </TabsTrigger>
                <TabsTrigger value="history" className="px-1 text-xs">
                  Riwayat {historyCount > 0 && <Pill>{historyCount}</Pill>}
                </TabsTrigger>
                <TabsTrigger value="insight" className="px-1 text-xs">
                  Insight
                </TabsTrigger>
              </TabsList>
              <TabsContent value="output">
                <OutputPanel output={output} profile={profile} onSave={() => addHistory(deferredInput, output)} />
              </TabsContent>
              <TabsContent value="ab">
                <ExperimentsPanel input={deferredInput} profile={profile} />
              </TabsContent>
              <TabsContent value="suggestions">
                <SuggestionsPanel suggestions={suggestions} />
              </TabsContent>
              <TabsContent value="history">
                <HistoryPanel onRestored={() => setTab("output")} />
              </TabsContent>
              <TabsContent value="insight">
                <InsightsPanel insights={insights} />
              </TabsContent>
            </Tabs>
          </div>
        </aside>
      </div>

      {/* Mobile: the preview sits below the form — give a one-tap jump to it. */}
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
