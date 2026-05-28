import { SectionCard } from "@/components/layout/section-card";
import { cn } from "@/lib/utils";

type SettingsCardProps = {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
};

/** Settings forms: section card with roomy field grid defaults. */
export function SettingsCard({
  title,
  description,
  children,
  className,
  contentClassName,
}: SettingsCardProps) {
  return (
    <SectionCard
      title={title}
      description={description}
      className={className}
      contentClassName={cn(
        "grid gap-5 sm:grid-cols-2 [&_label]:text-sm [&_label]:font-medium",
        "[&_input]:h-11 [&_textarea]:min-h-[100px] [&_select]:h-11",
        contentClassName,
      )}
    >
      {children}
    </SectionCard>
  );
}
