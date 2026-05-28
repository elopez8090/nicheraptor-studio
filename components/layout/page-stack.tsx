import { cn } from "@/lib/utils";

type PageStackProps = {
  children: React.ReactNode;
  className?: string;
};

/** Vertical rhythm between page header and main sections. */
export function PageStack({ children, className }: PageStackProps) {
  return <div className={cn("mt-10 flex flex-col gap-10 lg:gap-12", className)}>{children}</div>;
}
