import Link from "next/link";
import { ArrowRight, Download, Eye } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { fetchArticles } from "@/lib/articles/fetch-articles";
import { fetchEbookProjects } from "@/lib/ebooks/fetch-ebook-projects";
import { fetchLandingPages } from "@/lib/landing-pages/fetch-landing-pages";

export default async function ExportsPage() {
  const [ebooks, articles, pages] = await Promise.all([
    fetchEbookProjects({ includeArchived: false }),
    fetchArticles(),
    fetchLandingPages(),
  ]);

  const recentEbooks = ebooks.slice(0, 4);
  const recentArticles = articles.slice(0, 4);
  const recentPages = pages.slice(0, 4);

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Deliverables"
        title="Export Center"
        description="One place for all export paths: PDF, DOCX, HTML, and Markdown with preview-first links."
      />

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "PDF",
            description: "Best for print-ready ebook handoff.",
          },
          {
            label: "DOCX",
            description: "Best for collaborator edits in Word.",
          },
          {
            label: "HTML",
            description: "Best for web publishing and embeds.",
          },
          {
            label: "Markdown",
            description: "Best for portable text workflows.",
          },
        ].map((format) => (
          <Card key={format.label} className="shadow-premium">
            <CardHeader>
              <CardTitle className="text-base">{format.label}</CardTitle>
              <CardDescription>{format.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Preview first, then export from the editor tools for the selected item.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <Card className="shadow-premium">
          <CardHeader>
            <CardTitle className="text-lg">Ebooks</CardTitle>
            <CardDescription>Preview and export from manuscript projects.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentEbooks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No ebook projects found.</p>
            ) : (
              recentEbooks.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                >
                  <span className="truncate text-sm font-medium">{item.title}</span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/ebooks/${item.id}/print`}>
                        <Eye className="size-4" aria-hidden />
                        Preview
                      </Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href={`/ebooks/${item.id}/editor`}>
                        <Download className="size-4" aria-hidden />
                        Export
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            )}
            <Button size="sm" variant="outline" asChild>
              <Link href="/projects">
                Open all ebooks
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-premium">
          <CardHeader>
            <CardTitle className="text-lg">Articles</CardTitle>
            <CardDescription>Use article editor export/metadata tools.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentArticles.length === 0 ? (
              <p className="text-sm text-muted-foreground">No articles found.</p>
            ) : (
              recentArticles.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                >
                  <span className="truncate text-sm font-medium">{item.title}</span>
                  <Button size="sm" asChild>
                    <Link href={`/articles/${item.id}/editor`}>Open editor</Link>
                  </Button>
                </div>
              ))
            )}
            <Button size="sm" variant="outline" asChild>
              <Link href="/articles">
                Open all articles
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-premium">
          <CardHeader>
            <CardTitle className="text-lg">Landing Pages</CardTitle>
            <CardDescription>Use page editor preview and HTML/Markdown exports.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentPages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No landing pages found.</p>
            ) : (
              recentPages.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2"
                >
                  <span className="truncate text-sm font-medium">{item.title}</span>
                  <Button size="sm" asChild>
                    <Link href={`/pages/${item.id}/editor`}>Open editor</Link>
                  </Button>
                </div>
              ))
            )}
            <Button size="sm" variant="outline" asChild>
              <Link href="/pages">
                Open all pages
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
