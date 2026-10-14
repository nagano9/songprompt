"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";

async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }
  // Fallback for non-secure contexts (e.g. LAN IP during dev).
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

interface CopyButtonProps extends Omit<ButtonProps, "onClick" | "onCopy"> {
  text: string;
  label?: string;
  copiedLabel?: string;
  /** Called after a successful copy — used to auto-save to history. */
  onCopied?: () => void;
}

export function CopyButton({ text, label = "Copy", copiedLabel = "Tersalin", onCopied, ...props }: CopyButtonProps) {
  const [state, setState] = React.useState<"idle" | "copied" | "error">("idle");

  React.useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 1800);
    return () => clearTimeout(t);
  }, [state]);

  return (
    <Button
      type="button"
      disabled={!text.trim()}
      onClick={async () => {
        const ok = await writeClipboard(text);
        setState(ok ? "copied" : "error");
        if (ok) onCopied?.();
      }}
      aria-live="polite"
      {...props}
    >
      {state === "copied" ? <Check /> : <Copy />}
      {label && (state === "copied" ? copiedLabel : state === "error" ? "Gagal" : label)}
    </Button>
  );
}
