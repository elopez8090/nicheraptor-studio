"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Pin,
  Sparkles,
  Wand2,
} from "lucide-react";

import { RecentActivityPanel } from "@/components/workspace/recent-activity-panel";
import { Button } from "@/components/ui/button";
import { PageSection } from "@/components/layout/page-section";
import { getWorkspaceActivityByKind } from "@/lib/workspace/workspace-activity";
import type { EbookProjectListItem } from "@/lib/ebooks/fetch-ebook-projects";
import {
  getNavRecents,
  readPinnedProjectIds,
} from "@/lib/workspace/navigation-recents";
import {
  getPinnedWorkspaceItems,
  type PinnedWorkspaceItem,
} from "@/lib/workspace/workspace-favorites";
import {
  getWorkspaceMemory,
  patchWorkspaceMemory,
} from "@/lib/workspace/workspace-memory";
import { cn } from "@/lib/utils";

type DashboardProductivityProps = {
  projects: EbookProjectListItem[];
};

const SECTION_IDS = ["activity", "pinned", "carousel"] as const;

export function DashboardProductivity({ projects }: DashboardProductivityProps) {
  const [memory, setMemory] = useState(getWorkspaceMemory);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [pinnedItems, setPinnedItems] = useState<PinnedWorkspaceItem[]>([]);
  const [recentGenerationLinks, setRecentGenerationLinks] = useState<
    { id: string; title: string; href?: string; at: number }[]
  >([]);

  const refreshPinned = useCallback(() => {
    setPinnedItems(getPinnedWorkspaceItems());
  }, []);

  useEffect(() => {
    refreshPinned();
  }, [refreshPinned]);

  useEffect(() => {
    setRecentGenerationLinks(getWorkspaceActivityByKind("ai_generation", 5));
  }, []);

  const recentProjects = useMemo(() => {
    const recents = getNavRecents().projects;
    const byId = new Map(projects.map((p) => [p.id, p]));
    const merged = recents
      .map((r) => byId.get(r.id))
      .filter((p): p is EbookProjectListItem => Boolean(p));
    if (merged.length > 0) {
      return merged;
    }
    return [...projects]
      .filter((p) => !p.isArchived)
      .sort(
        (a, b) =>
          new Date(b.lastUpdatedAt).getTime() -
          new Date(a.lastUpdatedAt).getTime(),
      )
      .slice(0, 8);
  }, [projects]);

  const pinnedProjectIds = readPinnedProjectIds();
  const pinnedProjects = projects.filter((p) => pinnedProjectIds.includes(p.id));

  const compact = memory.dashboardCompact;
  const hidden = new Set(memory.dashboardHiddenSections);

  const toggleSection = (id: string) => {
    const nextHidden = hidden.has(id)
      ? memory.dashboardHiddenSections.filter((s) => s !== id)
      : [...memory.dashboardHiddenSections, id];
    const next = patchWorkspaceMemory({ dashboardHiddenSections: nextHidden });
    setMemory(next);
  };

  const toggleCompact = () => {
    const next = patchWorkspaceMemory({ dashboardCompact: !compact });
    setMemory(next);
  };

  const visibleCarousel = recentProjects.slice(carouselIndex, carouselIndex + 3);
  const fallbackRecentHref = recentProjects[0]
    ? `/ebooks/${recentProjects[0].id}/editor`
    : "/projects";
  const continueHref = memory.lastEditorPath ?? fallbackRecentHref;

  return (
    <div className={cn("space-y-6", compact && "space-y-4 text-sm")}>
      <PageSection
        title="Continue where you left off"
        description="Resume your last editor session or start a fresh project quickly."
        className="rounded-2xl border border-border/60 bg-card/40 p-4 ring-1 ring-border/50 sm:p-6"
      >
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={continueHref}>
              <Wand2 className="size-4" aria-hidden />
              Continue editing
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/create">Quick create</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/projects">Recent projects</Link>
          </Button>
        </div>
      </PageSection>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Customize your overview — hide sections you do not need.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={toggleCompact}>
            <LayoutGrid className="size-3.5" aria-hidden />
            {compact ? "Comfortable" : "Compact"} mode
          </Button>
          {SECTION_IDS.map((id) => (
            <Button
              key={id}
              type="button"
              variant={hidden.has(id) ? "outline" : "secondary"}
              size="sm"
              onClick={() => toggleSection(id)}
            >
              {hidden.has(id) ? "Show" : "Hide"} {id}
            </Button>
          ))}
        </div>
      </div>

      {!hidden.has("carousel") && recentProjects.length > 0 ? (
        <PageSection
          title="Recent projects"
          description="Jump back into your latest manuscripts."
          className="rounded-2xl border border-border/60 bg-card/40 p-4 ring-1 ring-border/50 sm:p-6"
        >
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Previous projects"
              disabled={carouselIndex <= 0}
              onClick={() => setCarouselIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft aria-hidden />
            </Button>
            <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-3">
              {visibleCarousel.map((project) => (
                <Link
                  key={project.id}
                  href={`/ebooks/${project.id}/editor`}
                  className="rounded-xl border border-border/60 bg-background/80 p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <p className="truncate font-medium">{project.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {project.chapterCount} chapters · Updated{" "}
                    {new Intl.DateTimeFormat(undefined, {
                      dateStyle: "medium",
                    }).format(new Date(project.lastUpdatedAt))}
                  </p>
                </Link>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Next projects"
              disabled={carouselIndex + 3 >= recentProjects.length}
              onClick={() =>
                setCarouselIndex((i) =>
                  Math.min(recentProjects.length - 3, i + 1),
                )
              }
            >
              <ChevronRight aria-hidden />
            </Button>
          </div>
        </PageSection>
      ) : null}

      {!hidden.has("pinned") &&
      (pinnedProjects.length > 0 || pinnedItems.length > 0) ? (
        <PageSection
          title="Pinned"
          description="Favorites across projects, articles, and library."
          className="rounded-2xl border border-border/60 bg-card/40 p-4 ring-1 ring-border/50 sm:p-6"
        >
          <ul className="flex flex-col gap-1">
            {pinnedProjects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/ebooks/${p.id}/editor`}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted"
                >
                  <Pin className="size-4 text-primary" aria-hidden />
                  {p.title}
                </Link>
              </li>
            ))}
            {pinnedItems
              .filter((item) => item.kind !== "project")
              .map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted"
                  >
                    <Pin className="size-4 text-primary" aria-hidden />
                    {item.title}
                  </Link>
                </li>
              ))}
          </ul>
        </PageSection>
      ) : null}

      {!hidden.has("activity") ? (
        <PageSection
          title="Recent activity"
          description="Exports, AI runs, notes, and opens."
          className="rounded-2xl border border-border/60 bg-card/40 p-4 ring-1 ring-border/50 sm:p-6"
        >
          <RecentActivityPanel compact={compact} />
        </PageSection>
      ) : null}

      <PageSection
        title="Recent generations"
        description="Your latest AI generation runs."
        className="rounded-2xl border border-border/60 bg-card/40 p-4 ring-1 ring-border/50 sm:p-6"
      >
        {recentGenerationLinks.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            AI generations will appear here after you run outline or draft tools.
          </p>
        ) : (
          <ul className="space-y-2">
            {recentGenerationLinks.map((entry) => (
              <li key={`${entry.id}-${entry.at}`}>
                {entry.href ? (
                  <Link
                    href={entry.href}
                    className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/70 px-3 py-2 text-sm hover:bg-muted/40"
                  >
                    <Sparkles className="size-4 text-primary" aria-hidden />
                    <span className="truncate">{entry.title}</span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background/70 px-3 py-2 text-sm">
                    <Sparkles className="size-4 text-primary" aria-hidden />
                    <span className="truncate">{entry.title}</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </PageSection>
    </div>
  );
}
