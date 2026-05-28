import Link from "next/link";
import { ArrowRight, FileText, Plus } from "lucide-react";

import { ArticleCard } from "@/components/articles/article-card";
import { EmptyState } from "@/components/layout/empty-state";
import { PageSection } from "@/components/layout/page-section";
import { Button } from "@/components/ui/button";
import type { ArticleListItem } from "@/lib/articles/fetch-articles";

type DashboardArticlesPreviewProps = {
  articles: ArticleListItem[];
};

export function DashboardArticlesPreview({ articles }: DashboardArticlesPreviewProps) {
  const preview = articles.slice(0, 3);

  return (
    <PageSection
      title="Articles"
      description="SEO posts and blog drafts — separate from ebook manuscripts."
      action={
        <>
          <Button variant="outline" asChild>
            <Link href="/articles">
              View all
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild>
            <Link href="/articles/new">
              <Plus className="size-4" aria-hidden />
              New article
            </Link>
          </Button>
        </>
      }
      className="rounded-2xl border border-border/60 bg-muted/15 p-6 ring-1 ring-border/40 sm:p-8"
    >
      {articles.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No articles yet"
          description="Start a keyword-focused article with AI outline and drafting tools."
          action={{ label: "Create article", href: "/articles/new" }}
          className="border-dashed bg-card/80"
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {preview.map((article) => (
            <li key={article.id}>
              <ArticleCard article={article} />
            </li>
          ))}
        </ul>
      )}
    </PageSection>
  );
}
