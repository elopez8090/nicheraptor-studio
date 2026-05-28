import { cn } from "@/lib/utils";

type ActionPanelProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function ActionPanel({
  title,
  description,
  children,
  className,
}: ActionPanelProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card p-4 shadow-sm ring-1 ring-border/40",
        className,
      )}
    >
      {title ? (
        <p className="text-sm font-semibold tracking-tight text-foreground">{title}</p>
      ) : null}
      {description ? (
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      ) : null}
      <div className={cn("flex flex-col gap-2", (title || description) && "mt-3")}>
        {children}
      </div>
    </div>
  );
}
