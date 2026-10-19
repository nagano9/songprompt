"use client";

import { BarChart3, Trophy } from "lucide-react";
import { MIN_RATINGS_FOR_INSIGHTS, type DescriptorStat, type Insights } from "@/lib/insights";
import { AXES } from "@/lib/prompt/experiments";
import { PLATFORM_LABELS, VARIANTS } from "@/lib/prompt/platforms";
import type { Platform, Variant } from "@/lib/types";
import { cn } from "@/lib/utils";

function LiftBar({ stat, max }: { stat: DescriptorStat; max: number }) {
  const pct = Math.min(100, (Math.abs(stat.lift) / Math.max(0.5, max)) * 100);
  const positive = stat.lift > 0;
  return (
    <li className="space-y-1 rounded-xs border border-border/70 bg-card p-2">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="truncate font-mono font-medium text-foreground">
          {stat.descriptor} <span className="text-[10px] text-muted-foreground">({stat.kind})</span>
        </span>
        <span className={cn("shrink-0 font-mono text-[11px] tabular-nums", positive ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-destructive font-semibold")}>
          {positive ? "+" : ""}
          {stat.lift.toFixed(1)}★ · n={stat.n}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-xxs bg-muted border border-border/40">
        <div className={cn("h-full transition-all duration-300", positive ? "bg-emerald-500" : "bg-destructive")} style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

export function InsightsPanel({ insights }: { insights: Insights }) {
  if (insights.rated === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <BarChart3 className="h-6 w-6 text-muted-foreground/50" />
        <p className="font-mono text-xs font-semibold uppercase tracking-wider text-foreground">Belum ada lagu yang dinilai</p>
        <p className="max-w-72 text-xs leading-relaxed text-muted-foreground">
          Buat lagu dari prompt-mu, lalu beri bintang di Riwayat. Dari {MIN_RATINGS_FOR_INSIGHTS} rating, tab ini mulai menunjukkan deskriptor mana
          yang paling terbukti berhasil.
        </p>
      </div>
    );
  }

  const maxLift = Math.max(...[...insights.top, ...insights.bottom].map((d) => Math.abs(d.lift)), 0.5);
  const thin = insights.rated < MIN_RATINGS_FOR_INSIGHTS;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-sm border border-border/80 bg-secondary/30 p-2.5">
          <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">Lagu dinilai</p>
          <p className="font-mono text-lg font-bold tabular-nums text-foreground">{insights.rated}</p>
        </div>
        <div className="rounded-sm border border-border/80 bg-secondary/30 p-2.5">
          <p className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">Rata-rata Rating</p>
          <p className="font-mono text-lg font-bold tabular-nums text-accent-strong">{insights.overall.toFixed(1)}★</p>
        </div>
      </div>

      {thin && (
        <div className="rounded-xs border border-border/80 bg-secondary/40 px-2.5 py-1.5 font-mono text-[11px] leading-snug text-muted-foreground">
          Data kalibrasi awal ({insights.rated}/{MIN_RATINGS_FOR_INSIGHTS}). Pola di bawah akan semakin akurat seiring bertambahnya lagu yang kamu beri bintang.
        </div>
      )}

      {insights.experiments.length > 0 && (
        <Section title="Hasil eksperimen A/B">
          <ul className="space-y-2">
            {insights.experiments.slice(0, 5).map((x) => (
              <li key={x.groupId} className="rounded-sm border border-border/80 bg-card p-2.5">
                <p className="mb-1.5 font-mono text-xs font-semibold text-foreground">{AXES[x.axis].label}</p>
                <ul className="space-y-1">
                  {x.takes.map((t) => (
                    <li key={t.entryId} className={cn("flex items-center justify-between gap-2 text-xs", x.winner === t.take && "font-semibold")}>
                      <span className="flex min-w-0 items-center gap-1.5">
                        {x.winner === t.take ? <Trophy className="h-3.5 w-3.5 shrink-0 text-accent-strong" /> : <span className="w-3.5" />}
                        <span className="font-mono text-accent-strong">{t.take}</span>
                        <span className="truncate text-muted-foreground font-mono">{t.label}</span>
                      </span>
                      <span className="shrink-0 font-mono tabular-nums">{t.score ? `${t.score}★` : "belum"}</span>
                    </li>
                  ))}
                </ul>
                {!x.winner && <p className="mt-1 font-mono text-[10.5px] text-muted-foreground">Nilai minimal 2 take untuk melihat pemenang.</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {insights.top.length > 0 && (
        <Section title="Deskriptor yang berhasil">
          <ul className="space-y-1.5">
            {insights.top.map((d) => (
              <LiftBar key={d.descriptor} stat={d} max={maxLift} />
            ))}
          </ul>
        </Section>
      )}

      {insights.bottom.length > 0 && (
        <Section title="Deskriptor yang sering gagal">
          <ul className="space-y-1.5">
            {insights.bottom.map((d) => (
              <LiftBar key={d.descriptor} stat={d} max={maxLift} />
            ))}
          </ul>
        </Section>
      )}

      {!insights.top.length && !insights.bottom.length && (
        <p className="font-mono text-xs text-muted-foreground">Belum ada deskriptor yang dipakai di ≥2 lagu bernilai.</p>
      )}

      {insights.issues.length > 0 && (
        <Section title="Masalah yang paling sering">
          <ul className="flex flex-wrap gap-1">
            {insights.issues.map((i) => (
              <li
                key={i.id}
                className={cn(
                  "rounded-xs border px-2 py-0.5 font-mono text-[11px] font-medium",
                  i.id.startsWith("great") ? "border-emerald-600/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-destructive/40 bg-destructive/10 text-destructive",
                )}
              >
                {i.label} <span className="font-mono text-muted-foreground font-normal">×{i.count}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {(insights.byVariant.length > 0 || insights.byPlatform.length > 0) && (
        <Section title="Per varian & platform">
          <ul className="space-y-1 font-mono text-xs">
            {[...insights.byVariant, ...insights.byPlatform].map((d) => (
              <li key={`${d.kind}-${d.descriptor}`} className="flex justify-between py-1 border-b border-border/40">
                <span>
                  {d.kind === "varian" ? VARIANTS[d.descriptor as Variant]?.label : PLATFORM_LABELS[d.descriptor as Platform]?.label}{" "}
                  <span className="text-muted-foreground">({d.kind})</span>
                </span>
                <span className="font-mono tabular-nums font-semibold">
                  {d.avg.toFixed(1)}★ · n={d.n}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <p className="text-[10.5px] font-mono text-muted-foreground/80 leading-relaxed">
        “Lift” = selisih rata-rata rating lagu yang memakai deskriptor tersebut terhadap rata-rata keseluruhan.
      </p>
    </div>
  );
}
