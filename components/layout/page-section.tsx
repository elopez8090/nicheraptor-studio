import { cn } from "@/lib/utils";

type PageSectionProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
};

export function PageSection({
  title,
  description,
  children,
  className,
  action,
}: PageSectionProps) {
  return (
    <section className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl space-y-1">
          <h2 className="type-section-title">{title}</h2>
          {description ? (
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
