"use client";

import * as React from "react";
import { Download, FlaskConical, History, Link2, Pin, PinOff, RotateCcw, Search, Star, Tag, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/output/copy-button";
import { PLATFORM_LABELS, VARIANTS } from "@/lib/prompt/platforms";
import { buildShareUrl } from "@/lib/share";
import type { HistoryEntry } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/store/builder-store";
import { useHistoryStore } from "@/store/history-store";
import { RatingEditor, StarRow } from "./rating-editor";

const fmt = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" });

type Filter = "all" | "pinned" | "rated" | "unrated" | "experiments";
const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: "all", label: "Semua" },
  { id: "pinned", label: "Dipin" },
  { id: "unrated", label: "Belum dinilai" },
  { id: "rated", label: "Sudah dinilai" },
  { id: "experiments", label: "Eksperimen" },
];

function matches(e: HistoryEntry, q: string, filter: Filter): boolean {
  if (filter === "pinned" && !e.pinned) return false;
  if (filter === "rated" && !e.rating) return false;
  if (filter === "unrated" && e.rating) return false;
  if (filter === "experiments" && !e.experiment) return false;
  if (!q) return true;
  const hay = [e.title, e.output.combined, ...(e.tags ?? []), e.rating?.note ?? ""].join(" ").toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((w) => hay.includes(w));
}

function EntryCard({ e, onRestored }: { e: HistoryEntry; onRestored?: () => void }) {
  const { remove, togglePin, setTags, setRating } = useHistoryStore();
  const loadFromHistory = useBuilderStore((s) => s.loadFromHistory);
  const [rating, setRatingOpen] = React.useState(false);
  const [tagDraft, setTagDraft] = React.useState<string | null>(null);
  const [shareState, setShareState] = React.useState<"idle" | "copied" | "error">("idle");

  const share = async () => {
    try {
      const url = await buildShareUrl(window.location.origin + window.location.pathname, {
        input: e.input,
        platform: e.platform,
        variant: e.variant,
      });
      await navigator.clipboard.writeText(url);
      setShareState("copied");
    } catch {
      setShareState("error");
    }
    setTimeout(() => setShareState("idle"), 1800);
  };

  return (
    <li className={cn("rounded-sm border border-border/80 bg-card p-3 transition-colors", e.pinned && "border-accent/60 bg-accent/5")}>
      <div className="flex items-start justify-between gap-2 border-b border-border/40 pb-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-foreground">{e.title}</p>
          <p className="font-mono text-[10.5px] text-muted-foreground">{fmt.format(e.createdAt)}</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          {e.experiment && (
            <Badge variant="accent" className="text-[10px]">
              <FlaskConical className="h-2.5 w-2.5" /> {e.experiment.take}
            </Badge>
          )}
          <Badge variant="secondary" className="text-[10px]">{PLATFORM_LABELS[e.platform].label}</Badge>
          <Badge variant="outline" className="text-[10px]">{VARIANTS[e.variant].label}</Badge>
        </div>
      </div>

      {e.experiment && <p className="mt-1 font-mono text-[10.5px] text-muted-foreground">Variabel: {e.experiment.label}</p>}

      <p className="mt-2 line-clamp-2 font-mono text-[11px] leading-relaxed text-muted-foreground bg-secondary/30 p-2 rounded-xs border border-border/40">
        {e.output.fields[0]?.content}
      </p>

      {(e.rating || (e.tags && e.tags.length > 0)) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {e.rating && <StarRow value={e.rating.score} size="sm" />}
          {e.rating?.issues.map((i) => (
            <span key={i} className="rounded-xs border border-border/80 bg-secondary/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              {i}
            </span>
          ))}
          {e.tags?.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTags(e.id, (e.tags ?? []).filter((x) => x !== t))}
              className="rounded-xs border border-border/60 bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-foreground hover:line-through"
              title="Klik untuk menghapus tag"
            >
              #{t}
            </button>
          ))}
        </div>
      )}
      {e.rating?.note && <p className="mt-1 text-[11px] italic text-muted-foreground">“{e.rating.note}”</p>}

      {tagDraft !== null && (
        <form
          className="mt-2 flex gap-1.5"
          onSubmit={(ev) => {
            ev.preventDefault();
            const added = tagDraft.split(",").map((t) => t.trim().replace(/^#/, "")).filter(Boolean);
            setTags(e.id, [...(e.tags ?? []), ...added]);
            setTagDraft(null);
          }}
        >
          <input
            autoFocus
            value={tagDraft}
            onChange={(ev) => setTagDraft(ev.target.value)}
            placeholder="tag, pisahkan koma"
            className="h-7 flex-1 rounded-xs border border-input bg-card px-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button type="submit" size="sm" variant="outline" className="h-7 font-mono text-xs">
            Tambah
          </Button>
        </form>
      )}

      {rating && (
        <div className="mt-2">
          <RatingEditor
            initial={e.rating}
            onCancel={() => setRatingOpen(false)}
            onSave={(r) => {
              setRating(e.id, r);
              setRatingOpen(false);
            }}
          />
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/40">
        <CopyButton text={e.output.combined} size="sm" variant="outline" label="Copy" className="h-7 font-mono text-xs" />
        <Button size="sm" variant={e.rating ? "outline" : "accent"} className="h-7 font-mono text-xs" onClick={() => setRatingOpen((o) => !o)}>
          <Star className="h-3.5 w-3.5" /> {e.rating ? "Ubah rating" : "Nilai hasil"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-7 font-mono text-xs"
          onClick={() => {
            loadFromHistory(e.input, e.platform, e.variant);
            onRestored?.();
          }}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Muat
        </Button>
        <div className="ml-auto flex items-center gap-0.5">
          <Button size="icon-sm" variant="ghost" className="h-7 w-7" onClick={share} aria-label="Salin link share" title="Salin link share">
            <Link2 className={cn("h-3.5 w-3.5", shareState === "copied" && "text-emerald-500")} />
          </Button>
          <Button size="icon-sm" variant="ghost" className="h-7 w-7" onClick={() => setTagDraft("")} aria-label="Tambah tag" title="Tambah tag">
            <Tag className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon-sm" variant="ghost" className="h-7 w-7" onClick={() => togglePin(e.id)} aria-label={e.pinned ? "Lepas pin" : "Pin"} title={e.pinned ? "Lepas pin" : "Pin"}>
            {e.pinned ? <PinOff className="h-3.5 w-3.5 text-accent-strong" /> : <Pin className="h-3.5 w-3.5" />}
          </Button>
          <Button size="icon-sm" variant="ghost" className="h-7 w-7" onClick={() => remove(e.id)} aria-label="Hapus entri" title="Hapus">
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
          </Button>
        </div>
      </div>
      {shareState !== "idle" && (
        <p className="mt-1 font-mono text-[10.5px] text-muted-foreground" role="status">
          {shareState === "copied" ? "Link tersalin — parameter tersimpan di dalam URL." : "Gagal menyalin link."}
        </p>
      )}
    </li>
  );
}

export function HistoryPanel({ onRestored }: { onRestored?: () => void }) {
  const entries = useHistoryStore((s) => s.entries);
  const { clear, exportJSON, importJSON } = useHistoryStore();
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<Filter>("all");
  const [confirmClear, setConfirmClear] = React.useState(false);
  const [notice, setNotice] = React.useState<string | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const visible = React.useMemo(() => {
    const list = entries.filter((e) => matches(e, q.trim(), filter));
    return [...list.filter((e) => e.pinned), ...list.filter((e) => !e.pinned)];
  }, [entries, q, filter]);

  const doExport = () => {
    const blob = new Blob([exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `songprompt-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const doImport = async (file: File) => {
    const res = importJSON(await file.text());
    setNotice(res.error ?? `${res.added} prompt diimpor${res.skipped ? `, ${res.skipped} dilewati (duplikat/tidak valid)` : ""}.`);
  };

  const unrated = entries.filter((e) => !e.rating).length;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari judul, isi prompt, tag…"
            className="h-7 w-full rounded-xs border border-input bg-card pl-8 pr-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            aria-label="Cari riwayat"
          />
        </div>
        <Button size="icon-sm" variant="outline" className="h-7 w-7" onClick={doExport} disabled={!entries.length} aria-label="Ekspor JSON" title="Ekspor JSON">
          <Download className="h-3.5 w-3.5" />
        </Button>
        <Button size="icon-sm" variant="outline" className="h-7 w-7" onClick={() => fileRef.current?.click()} aria-label="Impor JSON" title="Impor JSON">
          <Upload className="h-3.5 w-3.5" />
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void doImport(f);
            e.target.value = "";
          }}
        />
      </div>

      {/* Zero-Pill Filter Tabs */}
      <div className="flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={cn(
              "rounded-xs border px-2 py-0.5 font-mono text-[11px] font-medium transition-all active:translate-y-px",
              filter === f.id
                ? "border-primary bg-primary text-primary-foreground shadow-xs"
                : "border-border/80 bg-card text-foreground hover:bg-muted/80",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {notice && (
        <p className="text-xs font-mono text-accent-strong" role="status">
          {notice}
        </p>
      )}

      {unrated > 0 && entries.length > 0 && (
        <div className="rounded-xs border border-accent/30 bg-accent/10 px-2.5 py-1.5 font-mono text-[11px] leading-snug text-foreground">
          {unrated} prompt belum dinilai. Setelah mencoba di Suno/Udio, beri rating bintang agar tab Insight mempelajari deskriptor yang benar-benar berhasil.
        </div>
      )}

      {!entries.length ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <History className="h-6 w-6 text-muted-foreground/50" />
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Belum Ada Riwayat
          </p>
          <p className="max-w-60 text-xs text-muted-foreground">
            Prompt tersimpan otomatis setiap kali kamu menekan Copy.
          </p>
        </div>
      ) : !visible.length ? (
        <p className="py-6 text-center font-mono text-xs text-muted-foreground">Tidak ada prompt yang cocok.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((e) => (
            <EntryCard key={e.id} e={e} onRestored={onRestored} />
          ))}
        </ul>
      )}

      {entries.length > 0 && (
        <div className="flex items-center justify-between border-t border-border/40 pt-2">
          <span className="font-mono text-[10.5px] text-muted-foreground">{entries.length} prompt tersimpan</span>
          {confirmClear ? (
            <div className="flex gap-1">
              <Button size="sm" variant="destructive" className="h-6 px-2 text-[11px] font-mono" onClick={() => { clear(); setConfirmClear(false); }}>
                Hapus (kecuali dipin)
              </Button>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] font-mono" onClick={() => setConfirmClear(false)}>
                Batal
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px] font-mono text-muted-foreground hover:text-destructive" onClick={() => setConfirmClear(true)}>
              <Trash2 className="h-3 w-3" /> Bersihkan
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
