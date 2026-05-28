import { Sparkles } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type StudioLoadingProps = {
  label?: string;
  className?: string;
  variant?: "brand" | "skeleton";
};

export function StudioLoading({
  label = "Loading workspace…",
  className,
  variant = "brand",
}: StudioLoadingProps) {
  if (variant === "skeleton") {
    return (
      <div className={cn("space-y-4 p-6", className)} aria-busy aria-label={label}>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-full max-w-md" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-[240px] flex-col items-center justify-center gap-4 p-8 text-center",
        className,
      )}
      aria-busy
      aria-label={label}
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
        <Sparkles className="size-7 animate-pulse motion-reduce:animate-none" aria-hidden />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
