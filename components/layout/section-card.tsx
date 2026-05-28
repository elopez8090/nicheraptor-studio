import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type SectionCardProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  size?: "default" | "compact";
};

export function SectionCard({
  title,
  description,
  children,
  footer,
  className,
  contentClassName,
  size = "default",
}: SectionCardProps) {
  return (
    <Card
      className={cn(
        "border-border/80 shadow-premium ring-1 ring-border/50",
        size === "compact" && "py-5",
        className,
      )}
    >
      {title || description ? (
        <CardHeader className={cn(size === "compact" && "pb-3")}>
          {title ? (
            <CardTitle className={cn(size === "compact" ? "text-lg" : "text-xl")}>
              {title}
            </CardTitle>
          ) : null}
          {description ? (
            <CardDescription className="text-sm leading-relaxed">
              {description}
            </CardDescription>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent className={cn("space-y-4", contentClassName)}>{children}</CardContent>
      {footer ? <CardFooter className="border-t border-border/60 pt-4">{footer}</CardFooter> : null}
    </Card>
  );
}
