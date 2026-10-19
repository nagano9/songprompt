"use client";

import * as React from "react";
import { Check, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "./copy-button";
import { AXES, axisAvailable, generateTakes } from "@/lib/prompt/experiments";
import { generatePrompt } from "@/lib/prompt/generator";
import type { PlatformProfile } from "@/lib/prompt/platforms";
import type { ExperimentAxis, PromptInput } from "@/lib/types";
import { cn, uid } from "@/lib/utils";
import { useBuilderStore } from "@/store/builder-store";
import { useHistoryStore } from "@/store/history-store";

export function ExperimentsPanel({ input, profile }: { input: PromptInput; profile: PlatformProfile }) {
  const platform = useBuilderStore((s) => s.platform);
  const variant = useBuilderStore((s) => s.variant);
  const addExperiment = useHistoryStore((s) => s.addExperiment);
  const [axis, setAxis] = React.useState<ExperimentAxis>("density");
  const [saved, setSaved] = React.useState<string | null>(null);

  const takes = React.useMemo(
    () => generateTakes(input, axis).map((t) => ({ ...t, output: generatePrompt(t.input, platform, variant, profile) })),
    [input, axis, platform, variant, profile],
  );
  const signature = takes.map((t) => t.output.combined).join("|");

  React.useEffect(() => setSaved(null), [signature]);

  const save = () => {
    const groupId = uid();
    addExperiment(takes.map((t) => ({ input: t.input, output: t.output, experiment: { groupId, axis, take: t.take, label: t.label } })));
    setSaved(signature);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Tiga prompt yang hanya berbeda di <strong className="text-foreground">satu variabel akustik</strong>. Buat ketiganya di generator, lalu beri rating
        di Riwayat — tab Insight akan menunjukkan take mana yang menang.
      </p>

      {/* Zero-Pill: Segmented Studio Variable Selector */}
      <div className="flex flex-wrap gap-1" role="radiogroup" aria-label="Variabel eksperimen">
        {(Object.keys(AXES) as ExperimentAxis[]).map((a) => {
          const disabled = !axisAvailable(input, a);
          return (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={axis === a}
              disabled={disabled}
              title={disabled ? "Tidak berlaku untuk lagu instrumental" : AXES[a].description}
              onClick={() => setAxis(a)}
              className={cn(
                "rounded-xs border px-2 py-1 font-mono text-[11px] font-medium transition-all disabled:opacity-40 active:translate-y-px",
                axis === a
                  ? "border-primary bg-primary text-primary-foreground shadow-xs"
                  : "border-border/80 bg-card text-foreground hover:bg-muted/80",
              )}
            >
              {AXES[a].label}
            </button>
          );
        })}
      </div>

      <ul className="space-y-2">
        {takes.map((t) => (
          <li key={t.take} className="rounded-sm border border-border/80 bg-card">
            <div className="flex items-center justify-between gap-2 border-b border-border/50 bg-secondary/40 px-3 py-1.5">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="font-mono text-xs font-bold text-accent-strong">{t.take}</span>
                <span className="truncate font-mono text-xs font-medium text-foreground">{t.label}</span>
              </div>
              <CopyButton text={t.output.combined} label="" size="icon-sm" variant="ghost" aria-label={`Copy take ${t.take}`} className="h-6 w-6" />
            </div>
            <p className="border-b border-border/40 bg-secondary/15 px-3 py-1 font-mono text-[10.5px] leading-snug">
              {t.change ? <span className="text-accent-strong">{t.change}</span> : <span className="text-muted-foreground">tanpa perubahan — kontrol</span>}
            </p>
            <div className="space-y-1 px-3 py-2">
              {t.output.fields
                .filter((f) => f.key !== "lyrics")
                .map((f) => (
                  <div key={f.key} className="flex items-start gap-2">
                    <span className="w-14 shrink-0 pt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{f.label.split(" ")[0]}</span>
                    <p className="line-clamp-3 flex-1 font-mono text-[11px] leading-relaxed text-foreground/90">{f.content || "—"}</p>
                    <CopyButton text={f.content} label="" size="icon-sm" variant="ghost" className="h-5 w-5 shrink-0" aria-label={`Copy ${f.label} take ${t.take}`} />
                  </div>
                ))}
            </div>
          </li>
        ))}
      </ul>

      <Button type="button" variant="accent" className="w-full h-8 font-mono text-xs uppercase tracking-wider font-semibold" onClick={save} disabled={saved === signature}>
        {saved === signature ? <Check className="h-3.5 w-3.5" /> : <FlaskConical className="h-3.5 w-3.5" />}
        {saved === signature ? "3 take tersimpan di Riwayat" : "Simpan ketiga take ke Riwayat"}
      </Button>
    </div>
  );
}
