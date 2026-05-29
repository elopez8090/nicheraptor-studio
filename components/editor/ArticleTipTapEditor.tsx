"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";

import { EditorLibraryActions } from "@/components/content-library/editor-library-actions";
import { EditorSaveIndicator, type EditorSavePhase } from "@/components/editor/editor-save-indicator";
import { useToast } from "@/components/providers/toast-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { useOptionalEditorWorkspace } from "@/components/workspace/editor-workspace-context";
import { AUTOSAVE_DEBOUNCE_MS } from "@/lib/workspace/autosave-config";
import { recordWorkspaceActivity } from "@/lib/workspace/workspace-activity";
import { cn } from "@/lib/utils";
import { safeFetchJson } from "@/lib/utils/safe-fetch";
import { withRetry } from "@/lib/utils/error-helpers";

type ArticleTipTapEditorProps = {
  articleId: string;
  initialHtml: string;
  contentVersion?: string;
  placeholder?: string;
  onSaved?: (html: string) => void;
  onEditorReady?: (editor: Editor) => void;
  autosave?: boolean;
};

type ToolbarButtonProps = {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
};

function ToolbarButton({
  label,
  onClick,
  active,
  disabled,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-lg text-sm transition-[background-color,color,transform] duration-150",
        "hover:bg-muted active:scale-95 disabled:pointer-events-none disabled:opacity-40",
        active && "bg-primary/15 text-primary ring-1 ring-primary/20",
      )}
    >
      {children}
    </button>
  );
}

export function ArticleTipTapEditor({
  articleId,
  initialHtml,
  contentVersion = "",
  placeholder = "Write your article…",
  onSaved,
  onEditorReady,
  autosave = true,
}: ArticleTipTapEditorProps) {
  const workspace = useOptionalEditorWorkspace();
  const toast = useToast();
  const [savePhase, setSavePhase] = useState<EditorSavePhase>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const mountedRef = useRef(false);
  const syncedKeyRef = useRef<string | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const handleSaveRef = useRef<((source?: "autosave" | "manual") => Promise<void>) | null>(null);
  const dirtyRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const pendingSaveRef = useRef<"autosave" | "manual" | null>(null);
  const lastPersistedHtmlRef = useRef<string | null>(null);
  const suppressAutosaveUntilRef = useRef(0);
  const focusMode = workspace?.focusMode ?? false;

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
      }),
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline underline-offset-2" },
      }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full h-auto" } }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "article-tiptap-prose min-h-[360px] max-w-none px-6 py-8 focus:outline-none sm:px-8",
      },
    },
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const syncKey = `${articleId}:${contentVersion}`;
  const retrySave = useCallback((source: "autosave" | "manual") => {
    window.setTimeout(() => {
      void handleSaveRef.current?.(source);
    }, 0);
  }, []);

  const handleSave = useCallback(async (source: "autosave" | "manual" = "manual") => {
    if (!editor) {
      return;
    }

    if (saveInFlightRef.current) {
      pendingSaveRef.current = source;
      return;
    }

    const html = editor.getHTML();
    if (
      source === "autosave" &&
      lastPersistedHtmlRef.current !== null &&
      html === lastPersistedHtmlRef.current
    ) {
      dirtyRef.current = false;
      workspace?.registerDirty(false);
      setSavePhase("saved");
      return;
    }

    if (!navigator.onLine) {
      setSaveError("You appear to be offline. Saving will resume when connection returns.");
      setSavePhase("error");
      toast.warning("Offline", "Reconnect to save article changes.");
      return;
    }

    setSavePhase("saving");
    setSaveError(null);
    saveInFlightRef.current = true;

    try {
      const result = await withRetry(
        () =>
          safeFetchJson<{ content?: string }>("/api/save-article", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              articleId,
              content: html,
            }),
            fallbackError: "Could not save article. Please try again.",
          }),
        { retries: 1, delayMs: 700 },
      );

      if (!result.ok) {
        const message = result.error || "Could not save article. Please try again.";
        setSaveError(message);
        setSavePhase("error");
        toast.toast({
          title: "Could not save article",
          description: message,
          variant: "error",
          action: {
            label: "Retry",
            onClick: () => {
              retrySave(source);
            },
          },
        });
        return;
      }

      const savedContent =
        typeof result.data.content === "string" ? result.data.content : html;
      lastPersistedHtmlRef.current = savedContent;
      suppressAutosaveUntilRef.current = Date.now() + 400;
      if (savedContent !== html) {
        onSaved?.(savedContent);
      }
      dirtyRef.current = false;
      workspace?.registerDirty(false);
      setLastSavedAt(Date.now());
      setSavePhase("saved");
      recordWorkspaceActivity({
        id: articleId,
        kind: "edit_article",
        title: "Article saved",
        href: `/articles/${articleId}/editor`,
        meta: source === "autosave" ? "Autosaved" : "Saved",
      });
      if (source === "manual") {
        toast.toast({
          id: "article-manual-save",
          title: "Article saved",
          variant: "success",
          duration: 2200,
        });
      }
    } catch {
      setSaveError("Network error while saving. Check your connection.");
      setSavePhase("error");
      toast.toast({
        title: "Save failed",
        description: "Network error while saving. Check your connection.",
        variant: "error",
        action: {
          label: "Retry",
          onClick: () => {
            retrySave(source);
          },
        },
      });
    } finally {
      saveInFlightRef.current = false;
      const pending = pendingSaveRef.current;
      pendingSaveRef.current = null;
      if (pending) {
        void handleSaveRef.current?.(pending);
      }
    }
  }, [articleId, editor, onSaved, retrySave, toast, workspace]);

  useEffect(() => {
    handleSaveRef.current = handleSave;
    return () => {
      handleSaveRef.current = null;
    };
  }, [handleSave]);

  useEffect(() => {
    if (!workspace) {
      return;
    }
    workspace.setRequestSaveHandler(() => {
      void handleSave("manual");
    });
    return () => {
      workspace.setRequestSaveHandler(null);
    };
  }, [handleSave, workspace]);

  useEffect(() => {
    if (!editor || !autosave) {
      return;
    }
    const onUpdate = () => {
      if (Date.now() < suppressAutosaveUntilRef.current) {
        return;
      }
      dirtyRef.current = true;
      workspace?.registerDirty(true);
      setSavePhase("dirty");
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
      }
      autosaveTimerRef.current = window.setTimeout(() => {
        setSavePhase("saving");
        void handleSave("autosave");
      }, AUTOSAVE_DEBOUNCE_MS);
    };
    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
      if (autosaveTimerRef.current !== null) {
        window.clearTimeout(autosaveTimerRef.current);
      }
    };
  }, [autosave, editor, handleSave, workspace]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSave("manual");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  useEffect(() => {
    if (!editor || !mountedRef.current) {
      return;
    }

    const changed = syncedKeyRef.current !== syncKey;
    syncedKeyRef.current = syncKey;

    if (changed) {
      dirtyRef.current = false;
      workspace?.registerDirty(false);
      setSaveError(null);
      setSavePhase("idle");
      lastPersistedHtmlRef.current = initialHtml || null;
    }

    if (!changed && editor.getHTML() === initialHtml) {
      return;
    }

    if (editor.getHTML() !== initialHtml) {
      suppressAutosaveUntilRef.current = Date.now() + 400;
      editor.commands.setContent(initialHtml, { emitUpdate: false });
      lastPersistedHtmlRef.current = initialHtml || null;
    }
  }, [syncKey, initialHtml, editor, articleId, workspace]);

  useEffect(() => {
    if (!editor || !mountedRef.current) {
      return;
    }

    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled && mountedRef.current) {
        onEditorReady?.(editor);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (savePhase !== "saved") {
      return;
    }
    const timer = window.setTimeout(() => setSavePhase("idle"), 2500);
    return () => window.clearTimeout(timer);
  }, [savePhase]);

  if (!editor) {
    return (
      <div
        className="flex min-h-[420px] flex-col gap-3 overflow-hidden rounded-2xl border border-border/80 p-4"
        aria-busy
        aria-label="Loading editor"
      >
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="min-h-[320px] flex-1" />
      </div>
    );
  }

  return (
    <div
      className="shadow-premium-lg flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card ring-1 ring-border/40"
      data-tiptap-target="article-editor"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 bg-muted/20 px-3 py-2.5 sm:px-4">
        {!focusMode ? (
          <div
            className="-mx-1 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto pb-0.5"
            role="toolbar"
            aria-label="Formatting"
          >
            <ToolbarButton
              label="Bold"
              active={editor.isActive("bold")}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="size-4" aria-hidden />
            </ToolbarButton>
            <ToolbarButton
              label="Italic"
              active={editor.isActive("italic")}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="size-4" aria-hidden />
            </ToolbarButton>
            <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />
            <ToolbarButton
              label="Heading 1"
              active={editor.isActive("heading", { level: 1 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
            >
              <Heading1 className="size-4" aria-hidden />
            </ToolbarButton>
            <ToolbarButton
              label="Heading 2"
              active={editor.isActive("heading", { level: 2 })}
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
            >
              <Heading2 className="size-4" aria-hidden />
            </ToolbarButton>
            <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />
            <ToolbarButton
              label="Bullet list"
              active={editor.isActive("bulletList")}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="size-4" aria-hidden />
            </ToolbarButton>
            <ToolbarButton
              label="Ordered list"
              active={editor.isActive("orderedList")}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="size-4" aria-hidden />
            </ToolbarButton>
            <ToolbarButton
              label="Blockquote"
              active={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote className="size-4" aria-hidden />
            </ToolbarButton>
            <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />
            <ToolbarButton
              label="Undo"
              disabled={!editor.can().chain().focus().undo().run()}
              onClick={() => editor.chain().focus().undo().run()}
            >
              <Undo2 className="size-4" aria-hidden />
            </ToolbarButton>
            <ToolbarButton
              label="Redo"
              disabled={!editor.can().chain().focus().redo().run()}
              onClick={() => editor.chain().focus().redo().run()}
            >
              <Redo2 className="size-4" aria-hidden />
            </ToolbarButton>
            <span className="mx-1 hidden h-6 w-px bg-border sm:block" aria-hidden />
            <EditorLibraryActions editor={editor} variant="toolbar" />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Focus writing</p>
        )}

        <EditorSaveIndicator
          phase={savePhase}
          errorMessage={saveError}
          lastSavedAt={lastSavedAt}
          onSave={() => void handleSave("manual")}
        />
      </div>

      <EditorContent editor={editor} className="flex-1 bg-card" />
    </div>
  );
}
