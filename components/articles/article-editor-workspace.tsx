"use client";

import { useCallback, useState } from "react";
import type { Editor } from "@tiptap/react";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

import { ArticleEditorRightPanel } from "@/components/articles/article-editor-right-panel";
import { ArticleTipTapEditor } from "@/components/editor/ArticleTipTapEditor";
import { PageHeader } from "@/components/layout/page-header";
import { ThreeColumnWorkspace } from "@/components/layout/three-column-workspace";
import { EditorLayoutControls } from "@/components/workspace/editor-layout-controls";
import { EditorWorkspaceProvider } from "@/components/workspace/editor-workspace-context";
import { TrackNavRecent } from "@/components/workspace/track-nav-recent";
import { useBreadcrumbTail } from "@/components/workspace/use-breadcrumb-tail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chapterContentToEditorHtml } from "@/lib/ebooks/chapter-content-for-editor";
import type { ArticleRecord } from "@/lib/articles/fetch-article";
import { useToast } from "@/components/providers/toast-provider";
import { safeFetchJson } from "@/lib/utils/safe-fetch";

type ArticleEditorWorkspaceProps = {
  article: ArticleRecord;
};

export function ArticleEditorWorkspace({ article: initial }: ArticleEditorWorkspaceProps) {
  return (
    <EditorWorkspaceProvider>
      <ArticleEditorWorkspaceInner article={initial} />
    </EditorWorkspaceProvider>
  );
}

function ArticleEditorWorkspaceInner({ article: initial }: ArticleEditorWorkspaceProps) {
  const toast = useToast();
  const [article, setArticle] = useState(initial);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [contentHtml, setContentHtml] = useState(
    chapterContentToEditorHtml(initial.content),
  );
  const [contentVersion, setContentVersion] = useState("0");
  const [generatingMeta, setGeneratingMeta] = useState<string | null>(null);
  useBreadcrumbTail(article.title);

  const bumpContent = useCallback((html: string) => {
    setContentHtml(html);
    setContentVersion((v) => String(Number(v) + 1));
    setArticle((a) => ({ ...a, content: html }));
  }, []);

  const handleEditorSaved = useCallback((html: string) => {
    setContentHtml((prev) => (prev === html ? prev : html));
    setArticle((a) => (a.content === html ? a : { ...a, content: html }));
  }, []);

  const getContentHtml = useCallback(() => {
    return editor?.getHTML() ?? contentHtml;
  }, [contentHtml, editor]);

  const handleGenerateMeta = useCallback(
    async (tool: "meta_title" | "meta_description" | "slug") => {
      setGeneratingMeta(tool);
      try {
        const result = await safeFetchJson<{ result?: string }>("/api/articles/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            articleId: article.id,
            tool,
            html: getContentHtml(),
          }),
          fallbackError: "Could not generate metadata.",
        });
        if (!result.ok) {
          toast.toast({
            title: "Generation failed",
            description: result.error,
            variant: "error",
          });
          return;
        }
        const data = result.data;
        if (tool === "meta_title") {
          setArticle((a) => ({ ...a, metaTitle: data.result ?? a.metaTitle }));
        } else if (tool === "meta_description") {
          setArticle((a) => ({
            ...a,
            metaDescription: data.result ?? a.metaDescription,
          }));
        } else {
          setArticle((a) => ({ ...a, slug: data.result ?? a.slug }));
        }
      } finally {
        setGeneratingMeta(null);
      }
    },
    [article.id, getContentHtml, toast],
  );

  return (
    <>
      <TrackNavRecent
        id={article.id}
        title={article.title}
        href={`/articles/${article.id}/editor`}
        kind="article"
      />
      <ThreeColumnWorkspace
      className="min-h-[calc(100vh-4rem)]"
      headerActions={<EditorLayoutControls />}
      header={
        <PageHeader
          eyebrow="Article editor"
          title="Draft workspace"
          description="Write in the center; use the right panel for AI, SEO, and article details."
          className="border-0 pb-0"
        >
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/articles">
              <ArrowLeft className="size-4" aria-hidden />
              Articles
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/create">Quick create</Link>
          </Button>
        </PageHeader>
      }
      left={
        <div className="space-y-4">
          <Button variant="ghost" size="sm" className="-ml-2 w-full justify-start" asChild>
            <Link href="/articles">
              <ArrowLeft className="size-4" aria-hidden />
              All articles
            </Link>
          </Button>
          <div className="space-y-2">
            <label htmlFor="article-title-nav" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Title
            </label>
            <Input
              id="article-title-nav"
              className="h-11 text-base font-medium"
              value={article.title}
              onChange={(e) => setArticle((a) => ({ ...a, title: e.target.value }))}
              onBlur={() => {
                const title = article.title.trim();
                if (!title) {
                  toast.warning("Title required", "Article title cannot be empty.");
                  return;
                }
                void safeFetchJson(`/api/articles/${article.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ title }),
                  fallbackError: "Could not save title.",
                }).then((result) => {
                  if (!result.ok) {
                    toast.toast({
                      title: "Could not save title",
                      description: result.error,
                      variant: "warning",
                    });
                  }
                });
              }}
              aria-label="Article title"
            />
          </div>
          <div className="rounded-xl border border-border/70 bg-card/80 p-3 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Document
            </p>
            <p className="mt-1 flex items-center gap-2 font-medium">
              <FileText className="size-4 text-muted-foreground" aria-hidden />
              {article.articleType.replace(/_/g, " ")}
            </p>
            <p className="mt-2 text-muted-foreground">
              Keyword: <span className="text-foreground">{article.targetKeyword || "—"}</span>
            </p>
          </div>
        </div>
      }
      center={
        <ArticleTipTapEditor
          articleId={article.id}
          initialHtml={contentHtml}
          contentVersion={contentVersion}
          onEditorReady={setEditor}
          onSaved={handleEditorSaved}
        />
      }
      right={
        <ArticleEditorRightPanel
          article={article}
          editor={editor}
          contentHtml={contentHtml}
          getContentHtml={getContentHtml}
          onContentReplace={bumpContent}
          onSeoUpdated={(patch) =>
            setArticle((a) => ({
              ...a,
              metaTitle: patch.metaTitle !== undefined ? patch.metaTitle : a.metaTitle,
              metaDescription:
                patch.metaDescription !== undefined
                  ? patch.metaDescription
                  : a.metaDescription,
              slug: patch.slug !== undefined ? patch.slug : a.slug,
              status: patch.status ?? a.status,
            }))
          }
          onGenerateMeta={handleGenerateMeta}
          generatingMeta={generatingMeta}
        />
      }
    />
    </>
  );
}
