"use client";

import * as React from "react";
import { History, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/output/copy-button";
import { PLATFORMS, VARIANTS } from "@/lib/prompt/platforms";
import { useBuilderStore } from "@/store/builder-store";
import { useHistoryStore } from "@/store/history-store";

const fmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

export function HistoryPanel({ onRestored }: { onRestored?: () => void }) {
  const entries = useHistoryStore((s) => s.entries);
  const remove = useHistoryStore((s) => s.remove);
  const clear = useHistoryStore((s) => s.clear);
  const loadFromHistory = useBuilderStore((s) => s.loadFromHistory);
  const [confirmClear, setConfirmClear] = React.useState(false);

  if (!entries.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <History className="h-6 w-6 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">Belum ada riwayat.</p>
        <p className="max-w-60 text-xs text-muted-foreground">Prompt tersimpan otomatis setiap kali kamu menekan Copy.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{entries.length} prompt tersimpan di browser ini</span>
        {confirmClear ? (
          <div className="flex gap-1">
            <Button size="sm" variant="destructive" onClick={() => { clear(); setConfirmClear(false); }}>
              Hapus semua
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmClear(false)}>
              Batal
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setConfirmClear(true)}>
            <Trash2 /> Bersihkan
          </Button>
        )}
      </div>

      <ul className="space-y-2">
        {entries.map((e) => (
          <li key={e.id} className="rounded-lg border bg-card p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{e.title}</p>
                <p className="text-[11px] text-muted-foreground">{fmt.format(e.createdAt)}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Badge variant="secondary">{PLATFORMS[e.platform].label}</Badge>
                <Badge variant="outline">{VARIANTS[e.variant].label}</Badge>
              </div>
            </div>
            <p className="mt-2 line-clamp-2 font-mono text-[11.5px] leading-relaxed text-muted-foreground">
              {e.output.fields[0]?.content}
            </p>
            <div className="mt-2 flex gap-1">
              <CopyButton text={e.output.combined} size="sm" variant="outline" label="Copy" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  loadFromHistory(e.input, e.platform, e.variant);
                  onRestored?.();
                }}
              >
                <RotateCcw /> Muat ke form
              </Button>
              <Button size="icon-sm" variant="ghost" className="ml-auto h-8 w-8" onClick={() => remove(e.id)} aria-label="Hapus entri">
                <Trash2 />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
