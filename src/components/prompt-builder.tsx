"use client";

import * as React from "react";
import { Check, Link2, RotateCcw, X, SlidersHorizontal, Disc3, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PromptForm } from "@/components/builder/prompt-form";
import { QuickForm } from "@/components/builder/quick-form";
import { TemplateGallery } from "@/components/builder/template-gallery";
import { SongRadar } from "@/components/builder/song-radar";
import { OutputPanel } from "@/components/output/output-panel";
import { ExperimentsPanel } from "@/components/output/experiments-panel";
import { InsightsPanel } from "@/components/output/insights-panel";
import { ScoreMeter, SuggestionsPanel } from "@/components/output/suggestions-panel";
import { HistoryPanel } from "@/components/history/history-panel";
import { StyleBlender } from "@/components/builder/style-blender";
import { StemStudio } from "@/components/builder/stem-studio";
import { DawIntegration } from "@/components/builder/daw-integration";
import { AudioUploader } from "@/components/builder/audio-uploader";
import { SettingsDialog } from "@/components/settings-dialog";
import { useActiveProfile, useInsights } from "@/hooks/use-derived";
import { generatePrompt } from "@/lib/prompt/generator";
import { buildSuggestions, specificityScore } from "@/lib/prompt/suggestions";
import { buildShareUrl, decodeShare, tokenFromHash } from "@/lib/share";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/store/builder-store";
import { useHistoryStore } from "@/store/history-store";
import { useSettingsStore, type FormMode } from "@/store/settings-store";

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

  const maxPromptLength = useSettingsStore((s) => s.maxPromptLength);
  const autoTrimPrompt = useSettingsStore((s) => s.autoTrimPrompt);
  const deferredInput = React.useDeferredValue(input);
  const output = React.useMemo(
    () => generatePrompt(deferredInput, platform, variant, profile, { autoTrim: autoTrimPrompt, maxPromptLength }),
    [deferredInput, platform, variant, profile, autoTrimPrompt, maxPromptLength],
  );
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
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-accent/30">
      {/* Precision Hardware Console Top Bar */}
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-4 py-3 sm:px-6 lg:px-8">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-sm bg-primary text-primary-foreground shadow-xs">
              <Disc3 className="h-4 w-4 text-accent" />
            </div>
            <div>
              <span className="font-mono text-sm font-bold tracking-tight text-foreground uppercase">
                Anti-Slop Audio Studio
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation & Platform targets */}
          <div className="hidden lg:flex items-center gap-2 text-xs font-mono text-muted-foreground">
            <span>Suno v4</span>
            <span aria-hidden="true">·</span>
            <span>Suno v3.5</span>
            <span aria-hidden="true">·</span>
            <span>Udio v1.5</span>
            <span aria-hidden="true">·</span>
            <span>Custom DAW</span>
          </div>

          {/* Zone 3: Primary actions & Hardware controls */}
          <div className="flex items-center gap-2">
            <div className="flex rounded-sm border border-border/80 bg-secondary/60 p-0.5" role="radiogroup" aria-label="Mode form">
              {(["quick", "full"] as FormMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-xs px-2.5 py-1 font-mono text-[11px] font-medium transition-all",
                    mode === m
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "quick" ? "Cepat" : "Lengkap"}
                </button>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={share} aria-label="Salin link share" className="h-7 text-xs">
              {shared ? <Check className="text-emerald-500" /> : <Link2 />}
              <span className="hidden sm:inline">{shared ? "Link tersalin" : "Share"}</span>
            </Button>

            <SettingsDialog />

            <Button
              variant={confirmReset ? "destructive" : "outline"}
              size="sm"
              className="h-7 text-xs"
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
        </div>
      </header>

      {/* Main Container */}
      <div className="mx-auto max-w-[1440px] px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-16">
        {/* Editorial Subheader */}
        <div className="mb-6 border-b border-border/60 pb-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex items-center gap-2 text-[11px] font-mono text-accent-strong uppercase tracking-wider">
                <Radio className="h-3 w-3 animate-pulse" />
                <span>Audio Prompt Calibration Console</span>
                <span>·</span>
                <span>Anti-Generic Synthesis</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Spesifikasi Prompt Musik Bebas Slop
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Hindari aransemen murahan dan hasil generik. Tentukan genre, dinamika aransemen, instrumen organik, serta exclusion style secara eksplisit.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground shrink-0">
              <div className="text-right">
                <span className="block text-[10px] uppercase text-muted-foreground/70">Master Headroom</span>
                <span className="text-foreground font-semibold tabular-nums">{score.score}/100</span>
              </div>
              <div className="h-6 w-px bg-border/80" />
              <div className="text-right">
                <span className="block text-[10px] uppercase text-muted-foreground/70">Library Takes</span>
                <span className="text-foreground font-semibold tabular-nums">{historyCount}</span>
              </div>
            </div>
          </div>
        </div>

        {banner && (
          <div className="mb-6 flex items-start justify-between gap-3 rounded-sm border border-accent/40 bg-accent/10 px-3.5 py-2.5 text-xs text-foreground" role="status">
            <span className="break-all">{banner}</span>
            <button type="button" onClick={() => setBanner(null)} aria-label="Tutup pemberitahuan" className="shrink-0 opacity-60 hover:opacity-100">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Song Radar: Popular Song Inspiration Scanner */}
        <div className="mb-6">
          <SongRadar
            onInspirationApplied={(song) =>
              setBanner(`Inspirasi dari "${song.title}" (${song.artist}) berhasil diterapkan ke parameter! Lirikmu tetap aman.`)
            }
          />
        </div>

        {/* Preset Sound Cartridges */}
        <div className="mb-6">
          <TemplateGallery />
        </div>

        {/* Studio Rack Bay Layout */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)] xl:grid-cols-[minmax(0,1fr)_minmax(0,480px)] items-start">
          {/* Left Column: Form Bay */}
          <div className="space-y-4">
            {/* Audio Uploader & Real-time Analyzer */}
            <div className="mb-4">
              <AudioUploader />
            </div>

            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-3.5 w-3.5 text-accent-strong" />
                <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Channel Strip Parameters
                </span>
              </div>
              <span className="font-mono text-[11px] text-muted-foreground/80">
                {mode === "quick" ? "3 Kontrol Utama" : "10 Modul Lengkap"}
              </span>
            </div>

            {mode === "quick" ? <QuickForm /> : <PromptForm />}

            {/* Enrichment Modules: Style Blender, Stem Studio, DAW Integration */}
            <div className="space-y-6 pt-4">
              <StyleBlender />
              <StemStudio />
              <DawIntegration />
            </div>
          </div>

          {/* Right Column: Master Bus & Analyzer */}
          <aside id="output" className="scroll-mt-16 lg:sticky lg:top-16 lg:max-h-[calc(100vh-5rem)] lg:self-start lg:overflow-y-auto">
            <div className="space-y-3 rounded-md border border-border/90 bg-card p-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-foreground">
                  Master Bus Output
                </span>
                <span className="font-mono text-[10px] uppercase text-accent-strong tracking-wide">
                  Live Engine
                </span>
              </div>

              {/* Specificity VU Level Meter */}
              <ScoreMeter score={score} />

              {/* Navigation Tabs */}
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="grid w-full grid-cols-5 h-8 bg-secondary/80 p-0.5 rounded-sm">
                  <TabsTrigger value="output" className="px-1 text-[11px] font-mono rounded-xs">
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="ab" className="px-1 text-[11px] font-mono rounded-xs">
                    A/B
                  </TabsTrigger>
                  <TabsTrigger value="suggestions" className="px-1 text-[11px] font-mono rounded-xs">
                    Saran {suggestions.length > 0 && (
                      <span className={cn("ml-1 font-semibold", warnings > 0 ? "text-destructive" : "text-accent-strong")}>
                        {suggestions.length}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="history" className="px-1 text-[11px] font-mono rounded-xs">
                    Riwayat {historyCount > 0 && <span className="ml-1 text-muted-foreground">{historyCount}</span>}
                  </TabsTrigger>
                  <TabsTrigger value="insight" className="px-1 text-[11px] font-mono rounded-xs">
                    Insight
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="output" className="mt-3">
                  <OutputPanel output={output} profile={profile} onSave={() => addHistory(deferredInput, output)} />
                </TabsContent>
                <TabsContent value="ab" className="mt-3">
                  <ExperimentsPanel input={deferredInput} profile={profile} />
                </TabsContent>
                <TabsContent value="suggestions" className="mt-3">
                  <SuggestionsPanel suggestions={suggestions} />
                </TabsContent>
                <TabsContent value="history" className="mt-3">
                  <HistoryPanel onRestored={() => setTab("output")} />
                </TabsContent>
                <TabsContent value="insight" className="mt-3">
                  <InsightsPanel insights={insights} />
                </TabsContent>
              </Tabs>
            </div>
          </aside>
        </div>

        {/* Mobile Sticky CTA */}
        <div className="fixed inset-x-4 bottom-4 z-20 lg:hidden">
          <Button
            variant="accent"
            size="lg"
            className="w-full shadow-lg font-mono text-xs uppercase tracking-wider"
            onClick={() => {
              setTab("output");
              document.getElementById("output")?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Lihat Prompt · skor {score.score}
          </Button>
        </div>
      </div>
    </div>
  );
}
