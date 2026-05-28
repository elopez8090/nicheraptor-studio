import Link from "next/link";
import { BookOpen, Download, FileText, Play, Settings } from "@/lib/studio-icons";

import { ProjectStatusBadge } from "@/components/ebooks/project-status-badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EbookProjectListItem } from "@/lib/ebooks/fetch-ebook-projects";
import { PinProjectButton } from "@/components/workspace/pin-project-button";

type EbookProjectCardProps = {
  project: EbookProjectListItem;
};

function formatCreatedDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(iso));
}

export function EbookProjectCard({ project }: EbookProjectCardProps) {
  const progressLabel =
    project.chapterCount > 0
      ? `${project.generatedCount} of ${project.chapterCount} chapters written`
      : "No chapters yet";

  return (
    <Card className="card-interactive flex h-full flex-col overflow-hidden shadow-premium">
      {project.coverImageUrl ? (
        <div className="border-b border-border/60 bg-muted/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.coverImageUrl}
            alt=""
            className="aspect-[1024/1792] w-full max-h-44 object-cover object-top"
          />
        </div>
      ) : null}
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="flex items-start gap-2 text-xl leading-snug">
            <BookOpen className="mt-0.5 size-5 shrink-0 text-primary/80" aria-hidden />
            <span>{project.title}</span>
          </CardTitle>
          <ProjectStatusBadge status={project.workflowStatus} />
        </div>
        <CardDescription className="space-y-2 text-base">
          <p>
            <span className="font-medium text-foreground">Niche: </span>
            {project.audience}
          </p>
          <p className="line-clamp-2">
            <span className="font-medium text-foreground">Goal: </span>
            {project.goal}
          </p>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <dl className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
              Progress
            </dt>
            <dd className="mt-0.5 font-medium text-foreground/90">{progressLabel}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground/80">
              Created
            </dt>
            <dd className="mt-0.5">{formatCreatedDate(project.createdAt)}</dd>
          </div>
        </dl>
      </CardContent>
      <CardFooter className="mt-auto flex flex-wrap gap-2 border-t bg-muted/30">
        <Button size="default" asChild>
          <Link href={`/ebooks/${project.id}/chapters`}>
            <Play aria-hidden />
            Continue
          </Link>
        </Button>
        <Button variant="outline" size="default" asChild>
          <Link href={`/ebooks/${project.id}/editor`}>
            <FileText aria-hidden />
            Editor
          </Link>
        </Button>
        <Button variant="secondary" size="default" asChild>
          <Link href={`/ebooks/${project.id}/editor`}>
            <Download aria-hidden />
            Export
          </Link>
        </Button>
        <Button variant="outline" size="default" asChild>
          <Link href={`/ebooks/${project.id}/settings`}>
            <Settings aria-hidden />
            Settings
          </Link>
        </Button>
        <PinProjectButton projectId={project.id} className="ml-auto" />
      </CardFooter>
    </Card>
  );
}
