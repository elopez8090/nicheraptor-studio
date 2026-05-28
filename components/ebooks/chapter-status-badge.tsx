import { Badge } from "@/components/ui/badge";
import type { ChapterGenerationStatus } from "@/lib/ebooks/chapter-workflow-types";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<ChapterGenerationStatus, string> = {
  not_generated: "Not Generated",
  generated: "Generated",
};

type ChapterStatusBadgeProps = {
  status: ChapterGenerationStatus;
  className?: string;
};

export function ChapterStatusBadge({ status, className }: ChapterStatusBadgeProps) {
  return (
    <Badge
      variant={status === "generated" ? "default" : "secondary"}
      className={cn(
        status === "generated" &&
          "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
        status === "not_generated" && "text-muted-foreground",
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </Badge>
  );
}
