"use client";

import Link from "next/link";
import { BookOpen, FileText, Library, NotebookPen, PanelsTopLeft } from "lucide-react";

import { TabbedPanel } from "@/components/layout/tabbed-panel";
import { Button } from "@/components/ui/button";
import type { ArticleListItem } from "@/lib/articles/fetch-articles";
import type { EbookProjectListItem } from "@/lib/ebooks/fetch-ebook-projects";
import type { LandingPageListItem } from "@/lib/landing-pages/fetch-landing-pages";

type DashboardContentTabsProps = {
  ebooks: EbookProjectListItem[];
  articles: ArticleListItem[];
  pages: LandingPageListItem[];
};

export function DashboardContentTabs({ ebooks, articles, pages }: DashboardContentTabsProps) {
  const listClassName = "rounded-xl border border-border/60 bg-card/40 p-1";

  return (
    <TabbedPanel
      listClassName={listClassName}
      contentClassName="px-1"
      items={[
        {
          id: "ebooks",
          label: "Ebooks",
          content: (
            <DashboardList
              icon={BookOpen}
              href="/projects"
              ctaLabel="Open ebooks"
              emptyLabel="No ebooks yet."
              items={ebooks.slice(0, 5).map((item) => ({
                id: item.id,
                title: item.title,
                meta: `${item.generatedCount}/${item.chapterCount} chapters`,
                href: `/ebooks/${item.id}/editor`,
              }))}
            />
          ),
        },
        {
          id: "articles",
          label: "Articles",
          content: (
            <DashboardList
              icon={FileText}
              href="/articles"
              ctaLabel="Open articles"
              emptyLabel="No articles yet."
              items={articles.slice(0, 5).map((item) => ({
                id: item.id,
                title: item.title,
                meta: item.targetKeyword || "No keyword",
                href: `/articles/${item.id}/editor`,
              }))}
            />
          ),
        },
        {
          id: "landing-pages",
          label: "Landing Pages",
          content: (
            <DashboardList
              icon={PanelsTopLeft}
              href="/pages"
              ctaLabel="Open pages"
              emptyLabel="No landing pages yet."
              items={pages.slice(0, 5).map((item) => ({
                id: item.id,
                title: item.title,
                meta: item.status,
                href: `/pages/${item.id}/editor`,
              }))}
            />
          ),
        },
        {
          id: "notes",
          label: "Notes",
          content: (
            <DashboardLinkPanel
              icon={NotebookPen}
              title="Project notes"
              description="Notes live with each ebook project."
              href="/projects"
              ctaLabel="Open project notes"
            />
          ),
        },
        {
          id: "library",
          label: "Library",
          content: (
            <DashboardLinkPanel
              icon={Library}
              title="Content library"
              description="Snippets, prompts, and frameworks in one place."
              href="/library"
              ctaLabel="Open library"
            />
          ),
        },
      ]}
    />
  );
}

function DashboardList({
  items,
  href,
  ctaLabel,
  emptyLabel,
  icon: Icon,
}: {
  items: { id: string; title: string; meta: string; href: string }[];
  href: string;
  ctaLabel: string;
  emptyLabel: string;
  icon: typeof BookOpen;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border/60 bg-card/30 p-4">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-background/70 px-3 py-2 hover:bg-muted/40"
              >
                <span className="truncate text-sm font-medium">{item.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{item.meta}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Button size="sm" variant="outline" asChild>
        <Link href={href}>
          <Icon className="size-4" aria-hidden />
          {ctaLabel}
        </Link>
      </Button>
    </div>
  );
}

function DashboardLinkPanel({
  icon: Icon,
  title,
  description,
  href,
  ctaLabel,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/30 p-5">
      <p className="flex items-center gap-2 font-medium">
        <Icon className="size-4 text-primary" aria-hidden />
        {title}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <Button className="mt-4" size="sm" variant="outline" asChild>
        <Link href={href}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}
