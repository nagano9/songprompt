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
    <li className={cn("rounded-lg border bg-card p-3", e.pinned && "border-accent/60")}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{e.title}</p>
          <p className="text-[11px] text-muted-foreground">{fmt.format(e.createdAt)}</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1">
          {e.experiment && (
            <Badge variant="accent">
              <FlaskConical className="h-3 w-3" /> {e.experiment.take}
            </Badge>
          )}
          <Badge variant="secondary">{PLATFORM_LABELS[e.platform].label}</Badge>
          <Badge variant="outline">{VARIANTS[e.variant].label}</Badge>
        </div>
      </div>

      {e.experiment && <p className="mt-1 text-[11px] text-muted-foreground">Variabel: {e.experiment.label}</p>}

      <p className="mt-2 line-clamp-2 font-mono text-[11.5px] leading-relaxed text-muted-foreground">{e.output.fields[0]?.content}</p>

      {(e.rating || (e.tags && e.tags.length > 0)) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {e.rating && <StarRow value={e.rating.score} size="sm" />}
          {e.rating?.issues.map((i) => (
            <span key={i} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {i}
            </span>
          ))}
          {e.tags?.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTags(e.id, (e.tags ?? []).filter((x) => x !== t))}
              className="rounded bg-secondary px-1.5 py-0.5 text-[10px] hover:line-through"
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
            className="h-8 flex-1 rounded-md border border-input bg-card px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="sm" variant="outline">
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

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <CopyButton text={e.output.combined} size="sm" variant="outline" label="Copy" />
        <Button size="sm" variant={e.rating ? "outline" : "accent"} onClick={() => setRatingOpen((o) => !o)}>
          <Star /> {e.rating ? "Ubah rating" : "Nilai hasil"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            loadFromHistory(e.input, e.platform, e.variant);
            onRestored?.();
          }}
        >
          <RotateCcw /> Muat
        </Button>
        <div className="ml-auto flex">
          <Button size="icon-sm" variant="ghost" className="h-8 w-8" onClick={share} aria-label="Salin link share" title="Salin link share">
            <Link2 className={cn(shareState === "copied" && "text-emerald-600")} />
          </Button>
          <Button size="icon-sm" variant="ghost" className="h-8 w-8" onClick={() => setTagDraft("")} aria-label="Tambah tag" title="Tambah tag">
            <Tag />
          </Button>
          <Button size="icon-sm" variant="ghost" className="h-8 w-8" onClick={() => togglePin(e.id)} aria-label={e.pinned ? "Lepas pin" : "Pin"} title={e.pinned ? "Lepas pin" : "Pin"}>
            {e.pinned ? <PinOff /> : <Pin />}
          </Button>
          <Button size="icon-sm" variant="ghost" className="h-8 w-8" onClick={() => remove(e.id)} aria-label="Hapus entri" title="Hapus">
            <Trash2 />
          </Button>
        </div>
      </div>
      {shareState !== "idle" && (
        <p className="mt-1 text-[11px] text-muted-foreground" role="status">
          {shareState === "copied" ? "Link tersalin — isi form ada di dalam link, tidak di server mana pun." : "Gagal menyalin link."}
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
            className="h-8 w-full rounded-md border border-input bg-card pl-8 pr-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Cari riwayat"
          />
        </div>
        <Button size="icon-sm" variant="outline" className="h-8 w-8" onClick={doExport} disabled={!entries.length} aria-label="Ekspor JSON" title="Ekspor JSON">
          <Download />
        </Button>
        <Button size="icon-sm" variant="outline" className="h-8 w-8" onClick={() => fileRef.current?.click()} aria-label="Impor JSON" title="Impor JSON">
          <Upload />
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

      <div className="flex flex-wrap gap-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-[11px]",
              filter === f.id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {notice && (
        <p className="text-xs text-accent-strong" role="status">
          {notice}
        </p>
      )}

      {unrated > 0 && entries.length > 0 && (
        <p className="rounded-md bg-accent/15 px-2.5 py-1.5 text-[11px] leading-snug">
          {unrated} prompt belum dinilai. Setelah mencobanya di Suno/Udio, beri bintang — rating inilah yang membuat tab Insight dan saran
          belajar dari hasilmu.
        </p>
      )}

      {!entries.length ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <History className="h-6 w-6 text-muted-foreground/60" />
          <p className="text-sm text-muted-foreground">Belum ada riwayat.</p>
          <p className="max-w-60 text-xs text-muted-foreground">Prompt tersimpan otomatis setiap kali kamu menekan Copy.</p>
        </div>
      ) : !visible.length ? (
        <p className="py-6 text-center text-xs text-muted-foreground">Tidak ada yang cocok.</p>
      ) : (
        <ul className="space-y-2">
          {visible.map((e) => (
            <EntryCard key={e.id} e={e} onRestored={onRestored} />
          ))}
        </ul>
      )}

      {entries.length > 0 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground">{entries.length} prompt · tersimpan di browser ini</span>
          {confirmClear ? (
            <div className="flex gap-1">
              <Button size="sm" variant="destructive" onClick={() => { clear(); setConfirmClear(false); }}>
                Hapus (kecuali dipin)
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
      )}
    </div>
  );
}
