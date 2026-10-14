"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ISSUE_TAGS, type IssueTag, type Rating } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StarRow({ value, onChange, size = "md" }: { value: number; onChange?: (n: number) => void; size?: "sm" | "md" }) {
  const [hover, setHover] = React.useState(0);
  const shown = hover || value;
  const cls = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className="flex" role={onChange ? "radiogroup" : undefined} aria-label="Rating" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} bintang`}
            onMouseEnter={() => setHover(n)}
            onClick={() => onChange(n)}
            className="p-0.5"
          >
            <Star className={cn(cls, n <= shown ? "fill-accent text-accent" : "text-muted-foreground/40")} />
          </button>
        ) : (
          <Star key={n} className={cn(cls, n <= shown ? "fill-accent text-accent" : "text-muted-foreground/30")} aria-hidden />
        ),
      )}
    </div>
  );
}

/** Rate the song a prompt produced: stars + fixed issue tags + optional note. */
export function RatingEditor({ initial, onSave, onCancel }: { initial?: Rating; onSave: (r: Rating | undefined) => void; onCancel: () => void }) {
  const [score, setScore] = React.useState(initial?.score ?? 0);
  const [issues, setIssues] = React.useState<IssueTag[]>(initial?.issues ?? []);
  const [note, setNote] = React.useState(initial?.note ?? "");

  const toggle = (id: IssueTag) => setIssues((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  return (
    <div className="space-y-2.5 rounded-lg border bg-muted/40 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Seberapa bagus lagu yang dihasilkan?</span>
        <StarRow value={score} onChange={setScore} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ISSUE_TAGS.map((t) => {
          const active = issues.includes(t.id);
          const positive = t.id.startsWith("great");
          return (
            <button
              key={t.id}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(t.id)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] transition-colors",
                active
                  ? positive
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-destructive bg-destructive text-white"
                  : "bg-card hover:bg-muted",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Catatan singkat (opsional), mis. take ke-2 di Suno paling bagus"
        className="h-8 w-full rounded-md border border-input bg-card px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <div className="flex gap-1.5">
        <Button type="button" size="sm" variant="accent" disabled={!score} onClick={() => onSave({ score, issues, note: note.trim(), ratedAt: Date.now() })}>
          Simpan rating
        </Button>
        {initial && (
          <Button type="button" size="sm" variant="ghost" onClick={() => onSave(undefined)}>
            Hapus rating
          </Button>
        )}
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Batal
        </Button>
      </div>
    </div>
  );
}
