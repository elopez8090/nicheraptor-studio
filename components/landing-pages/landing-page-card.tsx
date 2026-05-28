import Link from "next/link";
import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { landingPageTypeLabel } from "@/lib/landing-pages/landing-page-constants";
import type { LandingPageListItem } from "@/lib/landing-pages/fetch-landing-pages";

type LandingPageCardProps = {
  page: LandingPageListItem;
};

function formatUpdated(iso: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(iso),
  );
}

export function LandingPageCard({ page }: LandingPageCardProps) {
  return (
    <Card className="card-interactive flex h-full flex-col shadow-premium">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl leading-snug line-clamp-2">{page.title}</CardTitle>
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize">
            {page.status}
          </span>
        </div>
        <CardDescription>
          <p>{landingPageTypeLabel(page.pageType)}</p>
          <p className="text-xs">/{page.slug || "unset-slug"}</p>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 text-sm text-muted-foreground">
        Updated {formatUpdated(page.updatedAt)}
      </CardContent>
      <CardFooter className="mt-auto border-t bg-muted/30">
        <Button asChild className="w-full">
          <Link href={`/pages/${page.id}/editor`}>
            <Pencil className="size-4" aria-hidden />
            Open editor
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
