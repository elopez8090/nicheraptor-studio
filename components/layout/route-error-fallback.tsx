"use client";

import Link from "next/link";
import { AlertTriangle, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

type RouteErrorFallbackProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
};

export function RouteErrorFallback({
  title = "Something broke in this view",
  description = "You can retry now. If this keeps happening, return to the dashboard and try again.",
  onRetry,
}: RouteErrorFallbackProps) {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10">
        <AlertTriangle className="size-7 text-amber-600 dark:text-amber-400" aria-hidden />
      </div>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="max-w-xl text-sm text-muted-foreground">{description}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" onClick={onRetry}>
          <RefreshCw className="size-4" aria-hidden />
          Retry
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
