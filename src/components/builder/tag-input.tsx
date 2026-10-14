"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { cn, uniq } from "@/lib/utils";

interface TagInputProps {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  /** Quick-pick chips shown below the input. Already-selected ones are hidden. */
  suggestions?: string[];
  tone?: "default" | "negative";
  max?: number;
}

/**
 * Chip input. Enter or comma commits a tag, Backspace on an empty field removes the last one.
 * Pasting "a, b, c" adds three tags at once.
 */
export function TagInput({ id, value, onChange, placeholder, suggestions = [], tone = "default", max }: TagInputProps) {
  const [draft, setDraft] = React.useState("");
  const atMax = max !== undefined && value.length >= max;

  const commit = (raw: string) => {
    const parts = raw.split(",").map((p) => p.trim()).filter(Boolean);
    if (!parts.length) return;
    let next = uniq([...value, ...parts]);
    if (max !== undefined) next = next.slice(0, max);
    onChange(next);
    setDraft("");
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      remove(value[value.length - 1]);
    }
  };

  const selected = new Set(value.map((v) => v.toLowerCase()));
  const open = suggestions.filter((s) => !selected.has(s.toLowerCase()));

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex min-h-9 flex-wrap items-center gap-1.5 rounded-md border border-input bg-card px-2 py-1.5 shadow-xs focus-within:ring-2 focus-within:ring-ring",
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
              tone === "negative" ? "bg-destructive/10 text-destructive line-through decoration-1" : "bg-secondary text-secondary-foreground",
            )}
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="-mr-0.5 rounded-sm opacity-60 hover:opacity-100"
              aria-label={`Hapus ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          disabled={atMax}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => commit(draft)}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (text.includes(",")) {
              e.preventDefault();
              commit(text);
            }
          }}
          placeholder={value.length ? "" : placeholder}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed"
        />
      </div>
      {open.length > 0 && !atMax && (
        <div className="flex flex-wrap gap-1.5">
          {open.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => commit(s)}
              className="inline-flex items-center gap-1 rounded-full border border-dashed px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:border-solid hover:border-foreground/30 hover:text-foreground"
            >
              <Plus className="h-3 w-3" />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
