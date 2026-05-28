"use client";

import dynamic from "next/dynamic";
import type { Editor } from "@tiptap/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FileText, Settings, StickyNote } from "lucide-react";

import { EditorToolsPanel } from "@/components/ebooks/editor-tools-panel";
import { ActionPanel } from "@/components/layout/action-panel";
import { StickyRightPanel } from "@/components/layout/sticky-right-panel";
import { TabbedPanel } from "@/components/layout/tabbed-panel";
import { Button } from "@/components/ui/button";
import { useOptionalEditorWorkspace } from "@/components/workspace/editor-workspace-context";
import {
  getRememberedEditorToolTab,
  rememberEditorToolTab,
} from "@/lib/workspace/workspace-memory";
import type { ChapterGenerationStatus } from "@/lib/ebooks/chapter-workflow-types";

const FullEbookGenerationPanel = dynamic(
  () =>
    import("@/components/ebooks/full-ebook-generation-panel").then(
      (mod) => mod.FullEbookGenerationPanel,
    ),
  { loading: () => <PanelSkeleton label="AI generation" /> },
);

const ResearchPanel = dynamic(
  () => import("@/components/research/research-panel").then((mod) => mod.ResearchPanel),
  { loading: () => <PanelSkeleton label="Research" /> },
);

const EditorCoverPanel = dynamic(
  () => import("@/components/ebooks/editor-cover-panel").then((mod) => mod.EditorCoverPanel),
  { loading: () => <PanelSkeleton label="Cover" /> },
);

const EditorNotesPreview = dynamic(
  () => import("@/components/notes/editor-notes-preview").then((mod) => mod.EditorNotesPreview),
  { loading: () => <PanelSkeleton label="Notes" /> },
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

type ChapterNavItem = {
  id: string;
  number: number;
  title: string;
  summary: string;
  status: ChapterGenerationStatus;
};

type EbookEditorRightPanelProps = {
  projectId: string;
  ebookTitle: string;
  audience: string;
  goal: string;
  defaultCoverImageUrl: string | null;
  chapters: ChapterNavItem[];
  selectedChapterId: string | null;
  editor: Editor | null;
  onChapterGenerated: (chapterId: string, content: string) => void;
};

export function EbookEditorRightPanel({
  projectId,
  ebookTitle,
  audience,
  goal,
  defaultCoverImageUrl,
  chapters,
  selectedChapterId,
  editor,
  onChapterGenerated,
}: EbookEditorRightPanelProps) {
  const workspace = useOptionalEditorWorkspace();
  const scopeKey = `ebook:${projectId}`;
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

  const chapterNav = chapters.map((ch) => ({
    id: ch.id,
    number: ch.number,
    title: ch.title,
  }));

  return (
    <StickyRightPanel>
      <TabbedPanel
        activeTab={activeTab}
        onTabChange={setActiveTab}
        defaultTab="ai"
        items={[
          {
            id: "writing",
            label: "Notes",
            category: "Writing",
            content: () => (
              <>
                <EditorNotesPreview
                  projectId={projectId}
                  selectedChapterId={selectedChapterId}
                  chapters={chapterNav}
                  editor={editor}
                />
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/ebooks/${projectId}/notes`}>
                    <StickyNote className="size-4" aria-hidden />
                    Open full notes workspace
                  </Link>
                </Button>
              </>
            ),
          },
          {
            id: "ai",
            label: "Generate",
            category: "AI",
            content: () => (
              <>
                <FullEbookGenerationPanel
                  compact
                  projectId={projectId}
                  ebookTitle={ebookTitle}
                  audience={audience}
                  goal={goal}
                  chapters={chapters}
                  onChapterGenerated={onChapterGenerated}
                />
                <EditorToolsPanel
                  projectId={projectId}
                  ebookTitle={ebookTitle}
                  editor={editor}
                  sections={["ai"]}
                />
              </>
            ),
          },
          {
            id: "research",
            label: "Research",
            category: "Research",
            content: () => (
              <ResearchPanel
                projectId={projectId}
                selectedChapterId={selectedChapterId}
                editor={editor}
              />
            ),
          },
          {
            id: "export",
            label: "Export & cover",
            category: "Export",
            content: () => (
              <>
                <EditorToolsPanel
                  projectId={projectId}
                  ebookTitle={ebookTitle}
                  editor={editor}
                  sections={["export"]}
                />
                <EditorCoverPanel
                  projectId={projectId}
                  defaultCoverTitle={ebookTitle}
                  defaultAudience={audience}
                  initialCoverImageUrl={defaultCoverImageUrl}
                />
              </>
            ),
          },
          {
            id: "settings",
            label: "Project",
            category: "Project",
            content: (
              <ActionPanel
                title="Project"
                description="Metadata, writing style, export defaults, and project actions."
              >
                <Button variant="secondary" className="w-full justify-start" asChild>
                  <Link href={`/ebooks/${projectId}/settings`}>
                    <Settings className="size-4" aria-hidden />
                    Project settings
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/ebooks/${projectId}/chapters`}>
                    <FileText className="size-4" aria-hidden />
                    Chapter manager
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/ebooks/${projectId}/notes`}>
                    <StickyNote className="size-4" aria-hidden />
                    Notes & research
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
