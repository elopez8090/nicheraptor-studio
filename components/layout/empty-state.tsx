import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  action?: {
    label: string;
    href: string;
  };
  secondaryAction?: {
    label: string;
    href: string;
  };
  /** Optional short onboarding line above actions */
  prompt?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  action,
  secondaryAction,
  prompt = "What do you want to create?",
}: EmptyStateProps) {
  return (
    <Card
      className={cn(
        "card-interactive shadow-premium overflow-hidden",
        className,
      )}
    >
      <div className="pointer-events-none relative h-32 bg-gradient-to-br from-primary/12 via-muted/50 to-transparent">
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_30%,var(--color-primary)_0%,transparent_45%),radial-gradient(circle_at_80%_20%,var(--color-muted-foreground)_0%,transparent_35%)]" />
        <div className="absolute bottom-0 left-1/2 flex size-16 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-2xl border border-border/70 bg-card shadow-lg">
          <Icon className="size-8 text-primary" aria-hidden />
        </div>
      </div>
      <CardHeader className="items-center pt-12 text-center">
        <CardTitle className="text-2xl tracking-tight">{title}</CardTitle>
        <CardDescription className="max-w-md text-base leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      {action || secondaryAction ? (
        <CardContent className="flex flex-col items-center gap-4 pb-10">
          <p className="text-sm font-medium text-muted-foreground">{prompt}</p>
          <div className="flex flex-wrap justify-center gap-3">
            {action ? (
              <Button size="lg" asChild>
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ) : null}
            {secondaryAction ? (
              <Button size="lg" variant="outline" asChild>
                <Link href={secondaryAction.href}>{secondaryAction.label}</Link>
              </Button>
            ) : null}
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
