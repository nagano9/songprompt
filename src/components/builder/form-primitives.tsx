import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SectionCard({
  index,
  title,
  description,
  optional,
  children,
  className,
}: {
  index: number;
  title: string;
  description?: string;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden border-border/90 bg-card", className)}>
      <CardHeader className="border-b border-border/50 bg-secondary/30 px-4 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[11px] font-semibold text-accent-strong tabular-nums">
              {String(index).padStart(2, "0")}
            </span>
            <span className="text-border/60">/</span>
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-foreground">
              {title}
            </CardTitle>
          </div>
          {optional && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/80">
              opsional
            </span>
          )}
        </div>
        {description && (
          <CardDescription className="text-[11.5px] text-muted-foreground pt-0.5">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4 p-4">{children}</CardContent>
    </Card>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor} className="text-xs font-medium tracking-tight text-foreground/90">
          {label}
        </Label>
        {hint && <span className="text-[11px] text-muted-foreground/80">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
