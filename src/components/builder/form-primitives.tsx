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
    <Card className={className}>
      <CardHeader>
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-xs text-accent-strong tabular-nums">{String(index).padStart(2, "0")}</span>
          <CardTitle className="text-[15px]">{title}</CardTitle>
          {optional && <span className="text-xs text-muted-foreground">opsional</span>}
        </div>
        {description && <CardDescription className="pl-8">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
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
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
