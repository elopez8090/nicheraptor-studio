import { cn } from "@/lib/utils";

type TwoColumnLayoutProps = {
  main: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
  asideClassName?: string;
  reverseOnMobile?: boolean;
};

export function TwoColumnLayout({
  main,
  aside,
  className,
  asideClassName,
  reverseOnMobile = false,
}: TwoColumnLayoutProps) {
  if (!aside) {
    return <div className={className}>{main}</div>;
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)] xl:gap-10",
        reverseOnMobile && "flex flex-col-reverse lg:grid",
        className,
      )}
    >
      <div className="min-w-0">{main}</div>
      <aside
        className={cn(
          "min-w-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-5.5rem)] lg:self-start lg:overflow-y-auto",
          asideClassName,
        )}
      >
        {aside}
      </aside>
    </div>
  );
}
