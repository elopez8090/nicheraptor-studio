"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { buildAppBreadcrumbs } from "@/lib/navigation/build-app-breadcrumbs";
import { useOptionalStudioWorkspace } from "@/components/workspace/studio-workspace-context";
import { cn } from "@/lib/utils";

type AppBreadcrumbsProps = {
  className?: string;
};

export function AppBreadcrumbs({ className }: AppBreadcrumbsProps) {
  const pathname = usePathname();
  const studio = useOptionalStudioWorkspace();
  const crumbs = buildAppBreadcrumbs(pathname, studio?.breadcrumbTail ?? null);

  if (crumbs.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={cn("min-w-0", className)}>
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1">
              {index > 0 ? (
                <ChevronRight className="size-3.5 shrink-0 opacity-60" aria-hidden />
              ) : null}
              {crumb.href && !isLast ? (
                <Link
                  href={crumb.href}
                  className="truncate font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span
                  className={cn(
                    "truncate",
                    isLast ? "font-semibold text-foreground" : "font-medium",
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {crumb.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
