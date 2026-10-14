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
    <li className="space-y-0.5">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="truncate">
          {stat.descriptor} <span className="text-[10px] text-muted-foreground">({stat.kind})</span>
        </span>
        <span className={cn("shrink-0 font-mono tabular-nums", positive ? "text-emerald-700 dark:text-emerald-400" : "text-destructive")}>
          {positive ? "+" : ""}
          {stat.lift.toFixed(1)}★ · n={stat.n}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full", positive ? "bg-emerald-600" : "bg-destructive")} style={{ width: `${pct}%` }} />
      </div>
    </li>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

export function InsightsPanel({ insights }: { insights: Insights }) {
  if (insights.rated === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <BarChart3 className="h-6 w-6 text-muted-foreground/60" />
        <p className="text-sm font-medium">Belum ada lagu yang dinilai</p>
        <p className="max-w-72 text-xs leading-relaxed text-muted-foreground">
          Buat lagu dari prompt-mu, lalu beri bintang di Riwayat. Dari {MIN_RATINGS_FOR_INSIGHTS} rating, tab ini mulai menunjukkan deskriptor mana
          yang benar-benar berhasil untukmu — bukan menurut teori.
        </p>
      </div>
    );
  }

  const maxLift = Math.max(...[...insights.top, ...insights.bottom].map((d) => Math.abs(d.lift)), 0.5);
  const thin = insights.rated < MIN_RATINGS_FOR_INSIGHTS;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-lg border p-3">
          <p className="text-[11px] text-muted-foreground">Lagu dinilai</p>
          <p className="font-mono text-xl font-semibold tabular-nums">{insights.rated}</p>
        </div>
        <div className="rounded-lg border p-3">
          <p className="text-[11px] text-muted-foreground">Rata-rata</p>
          <p className="font-mono text-xl font-semibold tabular-nums">{insights.overall.toFixed(1)}★</p>
        </div>
      </div>

      {thin && (
        <p className="rounded-md bg-muted px-2.5 py-1.5 text-[11px] leading-snug text-muted-foreground">
          Data masih tipis ({insights.rated}/{MIN_RATINGS_FOR_INSIGHTS}). Pola di bawah belum bisa dipercaya dan belum dipakai untuk saran.
        </p>
      )}

      {insights.experiments.length > 0 && (
        <Section title="Hasil eksperimen A/B">
          <ul className="space-y-2">
            {insights.experiments.slice(0, 5).map((x) => (
              <li key={x.groupId} className="rounded-lg border p-2.5">
                <p className="mb-1.5 text-xs font-medium">{AXES[x.axis].label}</p>
                <ul className="space-y-1">
                  {x.takes.map((t) => (
                    <li key={t.entryId} className={cn("flex items-center justify-between gap-2 text-xs", x.winner === t.take && "font-semibold")}>
                      <span className="flex min-w-0 items-center gap-1.5">
                        {x.winner === t.take ? <Trophy className="h-3.5 w-3.5 shrink-0 text-accent-strong" /> : <span className="w-3.5" />}
                        <span className="font-mono">{t.take}</span>
                        <span className="truncate text-muted-foreground">{t.label}</span>
                      </span>
                      <span className="shrink-0 font-mono tabular-nums">{t.score ? `${t.score}★` : "belum"}</span>
                    </li>
                  ))}
                </ul>
                {!x.winner && <p className="mt-1 text-[11px] text-muted-foreground">Nilai minimal 2 take untuk melihat pemenang.</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {insights.top.length > 0 && (
        <Section title="Deskriptor yang berhasil">
          <ul className="space-y-2">
            {insights.top.map((d) => (
              <LiftBar key={d.descriptor} stat={d} max={maxLift} />
            ))}
          </ul>
        </Section>
      )}

      {insights.bottom.length > 0 && (
        <Section title="Deskriptor yang sering gagal">
          <ul className="space-y-2">
            {insights.bottom.map((d) => (
              <LiftBar key={d.descriptor} stat={d} max={maxLift} />
            ))}
          </ul>
        </Section>
      )}

      {!insights.top.length && !insights.bottom.length && (
        <p className="text-xs text-muted-foreground">Belum ada deskriptor yang dipakai di ≥2 lagu bernilai. Pakai ulang deskriptor yang sama agar polanya terlihat.</p>
      )}

      {insights.issues.length > 0 && (
        <Section title="Masalah yang paling sering">
          <ul className="flex flex-wrap gap-1.5">
            {insights.issues.map((i) => (
              <li key={i.id} className={cn("rounded-full border px-2.5 py-0.5 text-xs", i.id.startsWith("great") ? "border-emerald-600/40" : "border-destructive/40")}>
                {i.label} <span className="font-mono text-muted-foreground">×{i.count}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {(insights.byVariant.length > 0 || insights.byPlatform.length > 0) && (
        <Section title="Per varian & platform">
          <ul className="space-y-1 text-xs">
            {[...insights.byVariant, ...insights.byPlatform].map((d) => (
              <li key={`${d.kind}-${d.descriptor}`} className="flex justify-between">
                <span>
                  {d.kind === "varian" ? VARIANTS[d.descriptor as Variant]?.label : PLATFORM_LABELS[d.descriptor as Platform]?.label}{" "}
                  <span className="text-muted-foreground">({d.kind})</span>
                </span>
                <span className="font-mono tabular-nums">
                  {d.avg.toFixed(1)}★ · n={d.n}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <p className="text-[11px] text-muted-foreground">
        “Lift” = rata-rata bintang lagu yang memakai deskriptor itu dikurangi rata-rata semua lagumu. Muncul setelah dipakai di ≥2 lagu bernilai.
      </p>
    </div>
  );
}
