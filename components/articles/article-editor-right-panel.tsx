"use client";

import dynamic from "next/dynamic";
import type { Editor } from "@tiptap/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Settings } from "lucide-react";

import { ActionPanel } from "@/components/layout/action-panel";
import { StickyRightPanel } from "@/components/layout/sticky-right-panel";
import { TabbedPanel } from "@/components/layout/tabbed-panel";
import { Button } from "@/components/ui/button";
import { useOptionalEditorWorkspace } from "@/components/workspace/editor-workspace-context";
import {
  getRememberedEditorToolTab,
  rememberEditorToolTab,
} from "@/lib/workspace/workspace-memory";
import type { ArticleRecord } from "@/lib/articles/fetch-article";

const ArticleAiToolsPanel = dynamic(
  () =>
    import("@/components/articles/article-ai-tools-panel").then(
      (mod) => mod.ArticleAiToolsPanel,
    ),
  { loading: () => <PanelSkeleton label="AI tools" /> },
);

const ArticleSeoSidebar = dynamic(
  () =>
    import("@/components/articles/article-seo-sidebar").then(
      (mod) => mod.ArticleSeoSidebar,
    ),
  { loading: () => <PanelSkeleton label="SEO" /> },
);

function PanelSkeleton({ label }: { label: string }) {
  return (
    <div
      className="animate-pulse rounded-xl border border-border/60 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground"
      aria-busy
    >
      Loading {label}…
    </div>
  );
}

type ArticleEditorRightPanelProps = {
  article: ArticleRecord;
  editor: Editor | null;
  contentHtml: string;
  getContentHtml: () => string;
  onContentReplace: (html: string) => void;
  onSeoUpdated: (patch: {
    metaTitle?: string | null;
    metaDescription?: string | null;
    slug?: string | null;
    status?: string;
  }) => void;
  onGenerateMeta: (tool: "meta_title" | "meta_description" | "slug") => Promise<void>;
  generatingMeta: string | null;
};

export function ArticleEditorRightPanel({
  article,
  editor,
  contentHtml,
  getContentHtml,
  onContentReplace,
  onSeoUpdated,
  onGenerateMeta,
  generatingMeta,
}: ArticleEditorRightPanelProps) {
  const workspace = useOptionalEditorWorkspace();
  const scopeKey = `article:${article.id}`;
  const [activeTab, setActiveTab] = useState(
    () => getRememberedEditorToolTab(scopeKey) ?? "ai",
  );

  useEffect(() => {
    rememberEditorToolTab(scopeKey, activeTab);
  }, [activeTab, scopeKey]);

  useEffect(() => {
    if (!workspace) {
      return;
    }
    workspace.setOpenToolTabHandler((tabId: string) => {
      setActiveTab(tabId);
      if (workspace.rightCollapsed) {
        workspace.toggleRight();
      }
    });
    return () => {
      workspace.setOpenToolTabHandler(null);
    };
  }, [workspace]);

  return (
    <StickyRightPanel ariaLabel="Article tools">
      <TabbedPanel
        activeTab={activeTab}
        onTabChange={setActiveTab}
        defaultTab="ai"
        items={[
          {
            id: "writing",
            label: "Writing",
            category: "Writing",
            content: (
              <ActionPanel
                title="Writing flow"
                description="Keep the draft in the center column. Title and metadata live in the left panel; save happens automatically as you write."
              >
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Use distraction-free mode from the header controls or press{" "}
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">⌘K</kbd> for quick
                  actions.
                </p>
              </ActionPanel>
            ),
          },
          {
            id: "ai",
            label: "AI tools",
            category: "AI",
            content: () => (
              <ArticleAiToolsPanel
                articleId={article.id}
                editor={editor}
                getContentHtml={getContentHtml}
                onContentReplace={onContentReplace}
                onOutlineGenerated={onContentReplace}
                onFullGenerated={onContentReplace}
              />
            ),
          },
          {
            id: "seo",
            label: "SEO",
            category: "SEO",
            content: () => (
              <ArticleSeoSidebar
                key={`${article.id}:${article.metaTitle ?? ""}:${article.metaDescription ?? ""}:${article.slug ?? ""}:${article.status}`}
                articleId={article.id}
                targetKeyword={article.targetKeyword}
                metaTitle={article.metaTitle}
                metaDescription={article.metaDescription}
                slug={article.slug}
                status={article.status}
                contentHtml={contentHtml}
                onSeoUpdated={onSeoUpdated}
                onGenerateMeta={onGenerateMeta}
                generatingMeta={generatingMeta}
              />
            ),
          },
          {
            id: "settings",
            label: "Project",
            category: "Project",
            content: (
              <ActionPanel
                title="Article"
                description="Status, keyword, and library shortcuts."
              >
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd className="font-medium capitalize">{article.status}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Target keyword</dt>
                    <dd className="font-medium">{article.targetKeyword || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Type</dt>
                    <dd className="font-medium">{article.articleType}</dd>
                  </div>
                </dl>
                <Button variant="outline" className="mt-2 w-full" asChild>
                  <Link href="/articles">Back to articles library</Link>
                </Button>
                <Button variant="secondary" className="w-full" asChild>
                  <Link href={`/articles/${article.id}/editor`}>
                    <Settings className="size-4" aria-hidden />
                    Refresh editor
                  </Link>
                </Button>
              </ActionPanel>
            ),
          },
        ]}
      />
    </StickyRightPanel>
  );
}
