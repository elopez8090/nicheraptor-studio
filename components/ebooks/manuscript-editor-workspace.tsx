"use client";

import { useCallback, useMemo, useState } from "react";
import type { Editor } from "@tiptap/react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Settings, StickyNote } from "lucide-react";

import { EbookTipTapEditor } from "@/components/editor/EbookTipTapEditor";
import { ChapterStatusBadge } from "@/components/ebooks/chapter-status-badge";
import { EbookEditorRightPanel } from "@/components/ebooks/ebook-editor-right-panel";
import { PageHeader } from "@/components/layout/page-header";
import { ThreeColumnWorkspace } from "@/components/layout/three-column-workspace";
import { EditorLayoutControls } from "@/components/workspace/editor-layout-controls";
import { EditorWorkspaceProvider, useEditorWorkspace } from "@/components/workspace/editor-workspace-context";
import { TrackNavRecent } from "@/components/workspace/track-nav-recent";
import { useBreadcrumbTail } from "@/components/workspace/use-breadcrumb-tail";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/layout/empty-state";
import { cn } from "@/lib/utils";
import type {
  ChapterGenerationStatus,
  EbookWithChapters,
} from "@/lib/ebooks/chapter-workflow-types";
import type { ManuscriptDocument } from "@/lib/ebooks/build-manuscript";
import { CHAPTER_NOT_GENERATED_PLACEHOLDER } from "@/lib/ebooks/build-manuscript";
import { chapterContentToEditorHtml } from "@/lib/ebooks/chapter-content-for-editor";

type ManuscriptEditorWorkspaceProps = {
  ebook: EbookWithChapters;
  manuscript: ManuscriptDocument;
};

type ChapterDraftState = {
  content: string;
  status: ChapterGenerationStatus;
};

export function ManuscriptEditorWorkspace(props: ManuscriptEditorWorkspaceProps) {
  return (
    <EditorWorkspaceProvider>
      <ManuscriptEditorWorkspaceInner {...props} />
    </EditorWorkspaceProvider>
  );
}

function ManuscriptEditorWorkspaceInner({
  ebook,
  manuscript: _manuscript,
}: ManuscriptEditorWorkspaceProps) {
  const { isDirty } = useEditorWorkspace();
  useBreadcrumbTail(ebook.title);
  const [selectedChapterId, setSelectedChapterId] = useState(
    ebook.chapters[0]?.id ?? "",
  );

  const [chapterEditor, setChapterEditor] = useState<Editor | null>(null);
  const [editorRefreshKey, setEditorRefreshKey] = useState(0);

  const handleEditorReady = useCallback((editor: Editor) => {
    setChapterEditor(editor);
  }, []);

  const [chapterState, setChapterState] = useState<Record<string, ChapterDraftState>>(
    () =>
      Object.fromEntries(
        ebook.chapters.map((chapter) => [
          chapter.id,
          { content: chapter.content ?? "", status: chapter.status },
        ]),
      ),
  );

  const selectedChapter = useMemo(
    () => ebook.chapters.find((ch) => ch.id === selectedChapterId),
    [ebook.chapters, selectedChapterId],
  );

  const selectedDraft = selectedChapter
    ? chapterState[selectedChapter.id]
    : undefined;

  const editorInitialHtml = useMemo(() => {
    if (!selectedChapter || !selectedDraft) {
      return "";
    }
    const raw = selectedDraft.content.trim();
    if (!raw || raw === CHAPTER_NOT_GENERATED_PLACEHOLDER) {
      return "";
    }
    return chapterContentToEditorHtml(selectedDraft.content);
  }, [selectedChapter, selectedDraft]);

  const handleChapterSaved = useCallback(
    (chapterId: string, html: string) => {
      setChapterState((prev) => ({
        ...prev,
        [chapterId]: {
          content: html,
          status: html.replace(/<[^>]+>/g, "").trim().length > 0 ? "generated" : "not_generated",
        },
      }));
    },
    [],
  );

  const handleAiChapterGenerated = useCallback(
    (chapterId: string, content: string) => {
      setChapterState((prev) => ({
        ...prev,
        [chapterId]: { content, status: "generated" },
      }));
      if (chapterId === selectedChapterId) {
        setEditorRefreshKey((k) => k + 1);
      }
    },
    [selectedChapterId],
  );

  const chaptersForPanel = useMemo(
    () =>
      ebook.chapters.map((ch) => ({
        id: ch.id,
        number: ch.number,
        title: ch.title,
        summary: ch.summary,
        status: chapterState[ch.id]?.status ?? ch.status,
      })),
    [ebook.chapters, chapterState],
  );

  return (
    <>
      <TrackNavRecent
        id={ebook.id}
        title={ebook.title}
        href={`/ebooks/${ebook.id}/editor`}
        kind="ebook"
      />
      <ThreeColumnWorkspace
      headerActions={<EditorLayoutControls />}
      header={
        <PageHeader
          eyebrow="Manuscript editor"
          title={ebook.title}
          description={`${ebook.audience} · ${ebook.goal}`}
          className="border-0 pb-0"
        >
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/projects">Ebooks</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/ebooks/${ebook.id}/chapters`}>
              <ArrowLeft aria-hidden />
              Chapters
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/ebooks/${ebook.id}/notes`}>
              <StickyNote aria-hidden />
              Notes
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/ebooks/${ebook.id}/settings`}>
              <Settings aria-hidden />
              Settings
            </Link>
          </Button>
        </PageHeader>
      }
      left={
        <>
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <BookOpen className="size-3.5" aria-hidden />
            Chapters
          </p>
          <ul className="flex flex-col gap-1">
            {ebook.chapters.map((chapter) => {
              const active = chapter.id === selectedChapterId;
              return (
                <li key={chapter.id}>
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        isDirty &&
                        !window.confirm(
                          "You have unsaved changes. Switch chapter anyway?",
                        )
                      ) {
                        return;
                      }
                      setChapterEditor(null);
                      setSelectedChapterId(chapter.id);
                    }}
                    className={cn(
                      "w-full rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                      active
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    <span className="block text-xs opacity-80">Chapter {chapter.number}</span>
                    <span className="mt-0.5 block font-medium leading-snug">{chapter.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {ebook.chapters.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No chapters found for this ebook yet.</p>
          ) : null}
        </>
      }
        center={
        selectedChapter ? (
          <div className="space-y-1">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Chapter {selectedChapter.number}
                </p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">
                  {selectedChapter.title}
                </h2>
              </div>
              <ChapterStatusBadge
                status={selectedDraft?.status ?? selectedChapter.status}
              />
            </div>

            <EbookTipTapEditor
              key={`${selectedChapter.id}-${editorRefreshKey}`}
              projectId={ebook.id}
              chapterId={selectedChapter.id}
              initialHtml={editorInitialHtml}
              placeholder={
                selectedDraft?.status === "generated"
                  ? "Edit this chapter…"
                  : "Write or paste this chapter, then save."
              }
              onSaved={(html) => handleChapterSaved(selectedChapter.id, html)}
              onEditorReady={handleEditorReady}
            />
          </div>
        ) : (
          <EmptyState
            icon={BookOpen}
            title="No chapter selected"
            description="This project has no editable chapter yet. Generate chapters or open chapter planning first."
            action={{
              label: "Open chapters",
              href: `/ebooks/${ebook.id}/chapters`,
            }}
          />
        )
      }
      right={
        <EbookEditorRightPanel
          projectId={ebook.id}
          ebookTitle={ebook.title}
          audience={ebook.audience}
          goal={ebook.goal}
          defaultCoverImageUrl={ebook.coverImageUrl}
          chapters={chaptersForPanel}
          selectedChapterId={selectedChapterId || null}
          editor={chapterEditor}
          onChapterGenerated={handleAiChapterGenerated}
        />
      }
    />
    </>
  );
}
