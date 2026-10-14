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
        Tiga prompt yang hanya berbeda di <strong className="text-foreground">satu variabel</strong>. Buat ketiganya di generator, lalu nilai
        di Riwayat — tab Insight akan menunjukkan pemenangnya. Mengubah satu hal saja yang membuat hasilnya bisa dibaca.
      </p>

      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Variabel eksperimen">
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
                "rounded-full border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40",
                axis === a ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
              )}
            >
              {AXES[a].label}
            </button>
          );
        })}
      </div>

      <ul className="space-y-2">
        {takes.map((t) => (
          <li key={t.take} className="rounded-lg border bg-card">
            <div className="flex items-center justify-between gap-2 border-b bg-muted/50 px-3 py-1.5">
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="font-mono text-xs font-bold text-accent-strong">{t.take}</span>
                <span className="truncate text-xs">{t.label}</span>
              </div>
              <CopyButton text={t.output.combined} label="" size="icon-sm" variant="ghost" aria-label={`Copy take ${t.take}`} />
            </div>
            <p className="border-b px-3 py-1.5 font-mono text-[11px] leading-snug">
              {t.change ? <span className="text-accent-strong">{t.change}</span> : <span className="text-muted-foreground">tanpa perubahan — pembanding</span>}
            </p>
            <div className="space-y-1 px-3 py-2">
              {t.output.fields
                .filter((f) => f.key !== "lyrics")
                .map((f) => (
                  <div key={f.key} className="flex items-start gap-2">
                    <span className="w-14 shrink-0 pt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{f.label.split(" ")[0]}</span>
                    <p className="line-clamp-3 flex-1 font-mono text-[11.5px] leading-relaxed">{f.content || "—"}</p>
                    <CopyButton text={f.content} label="" size="icon-sm" variant="ghost" className="shrink-0" aria-label={`Copy ${f.label} take ${t.take}`} />
                  </div>
                ))}
            </div>
          </li>
        ))}
      </ul>

      <Button type="button" variant="accent" className="w-full" onClick={save} disabled={saved === signature}>
        {saved === signature ? <Check /> : <FlaskConical />}
        {saved === signature ? "3 take tersimpan di Riwayat" : "Simpan ketiga take ke Riwayat"}
      </Button>
    </div>
  );
}
