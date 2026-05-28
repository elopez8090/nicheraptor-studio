import Link from "next/link";
import { FileText, Plus } from "lucide-react";

import { ArticleCard } from "@/components/articles/article-card";
import { EmptyState } from "@/components/layout/empty-state";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PageStack } from "@/components/layout/page-stack";
import { PageSection } from "@/components/layout/page-section";
import { Button } from "@/components/ui/button";
import { fetchArticles } from "@/lib/articles/fetch-articles";

export default async function ArticlesPage() {
  const articles = await fetchArticles();

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Library"
        title="Articles"
        description="SEO articles and blog posts — separate from your ebook projects."
      >
        <Button size="lg" asChild>
          <Link href="/articles/new">
            <Plus aria-hidden />
            New article
          </Link>
        </Button>
      </PageHeader>

      <PageStack className="mt-8">
        {articles.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No articles yet"
            description="Create an article with your target keyword, audience, and tone. Use AI to outline and draft in the editor."
            action={{ label: "Write your first article", href: "/articles/new" }}
            secondaryAction={{ label: "Create an ebook", href: "/ebooks/new" }}
          />
        ) : (
          <PageSection
            title="Your articles"
            description={`${articles.length} article${articles.length === 1 ? "" : "s"} in your workspace.`}
          >
            <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {articles.map((article) => (
                <li key={article.id}>
                  <ArticleCard article={article} />
                </li>
              ))}
            </ul>
          </PageSection>
        )}
      </PageStack>
    </PageContainer>
  );
}
