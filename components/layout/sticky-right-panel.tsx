import { cn } from "@/lib/utils";

type StickyRightPanelProps = {
  children: React.ReactNode;
  className?: string;
  ariaLabel?: string;
};

export function StickyRightPanel({
  children,
  className,
  ariaLabel = "Tools panel",
}: StickyRightPanelProps) {
  return (
    <aside className={cn("flex h-full min-h-0 flex-col", className)} aria-label={ariaLabel}>
      <div className="flex min-h-0 flex-1 flex-col p-4 lg:sticky lg:top-16 lg:max-h-[calc(100vh-4rem)] lg:overflow-hidden lg:p-5">
        {children}
      </div>
    </aside>
  );
}
