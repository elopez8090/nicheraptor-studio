import { Badge } from "@/components/ui/badge";
import type { EbookWorkflowStatus } from "@/lib/ebooks/workflow-status";
import { WORKFLOW_STATUS_OPTIONS } from "@/lib/ebooks/workflow-status";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<EbookWorkflowStatus, string> = Object.fromEntries(
  WORKFLOW_STATUS_OPTIONS.map((o) => [o.value, o.label]),
) as Record<EbookWorkflowStatus, string>;

const STATUS_CLASS: Record<EbookWorkflowStatus, string> = {
  idea: "border-slate-200/80 bg-slate-50 text-slate-800",
  drafting: "border-amber-200/80 bg-amber-50 text-amber-900",
  editing: "border-primary/20 bg-primary/10 text-primary",
  completed: "border-emerald-200/80 bg-emerald-50 text-emerald-900",
};

type ProjectStatusBadgeProps = {
  status: EbookWorkflowStatus;
  className?: string;
};

export function ProjectStatusBadge({ status, className }: ProjectStatusBadgeProps) {
  const label = STATUS_LABEL[status] ?? status;
  return (
    <Badge
      variant="secondary"
      className={cn("font-medium", STATUS_CLASS[status], className)}
    >
      {label}
    </Badge>
  );
}

/** Chapter writing progress (outline / writing / ready to export). */
export type EbookProjectProgressStatus = "outline" | "in_progress" | "ready";

const PROGRESS_LABEL: Record<EbookProjectProgressStatus, string> = {
  outline: "Outline ready",
  in_progress: "Writing",
  ready: "Ready to export",
};

type ProjectProgressBadgeProps = {
  status: EbookProjectProgressStatus;
  className?: string;
};

export function ProjectProgressBadge({ status, className }: ProjectProgressBadgeProps) {
  return (
    <Badge variant="outline" className={cn("font-normal text-xs", className)}>
      {PROGRESS_LABEL[status]}
    </Badge>
  );
}
