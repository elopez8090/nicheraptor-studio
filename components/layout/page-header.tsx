import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-border/70 pb-6 sm:flex-row sm:items-end sm:justify-between sm:pb-8",
        className,
      )}
    >
      <div className="max-w-3xl space-y-3">
        {eyebrow ? <p className="type-eyebrow">{eyebrow}</p> : null}
        <h1 className="type-display">{title}</h1>
        {description ? (
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
            {description}
          </p>
        ) : null}
      </div>
      {children ? (
        <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          {children}
        </div>
      ) : null}
    </div>
  );
}
