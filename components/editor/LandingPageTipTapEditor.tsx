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

import { EditorSaveIndicator, type EditorSavePhase } from "@/components/editor/editor-save-indicator";
import { useToast } from "@/components/providers/toast-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { AUTOSAVE_DEBOUNCE_MS } from "@/lib/workspace/autosave-config";
import { safeFetchJson } from "@/lib/utils/safe-fetch";
import { withRetry } from "@/lib/utils/error-helpers";

type LandingPageTipTapEditorProps = {
  pageId: string;
  initialHtml: string;
  contentVersion?: string;
  placeholder?: string;
  onSaved?: (html: string) => void;
  onEditorReady?: (editor: Editor) => void;
};

type ToolbarButtonProps = {
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: ReactNode;
};

function ToolbarButton({ label, onClick, active, disabled, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex size-9 items-center justify-center rounded-lg text-sm transition-[background-color,color,transform] duration-150 hover:bg-muted active:scale-95 disabled:pointer-events-none disabled:opacity-40 ${
        active ? "bg-primary/15 text-primary ring-1 ring-primary/20" : ""
      }`}
    >
      {children}
    </button>
  );
}

export function LandingPageTipTapEditor({
  pageId,
  initialHtml,
  contentVersion = "",
  placeholder = "Write your landing page copy…",
  onSaved,
  onEditorReady,
}: LandingPageTipTapEditorProps) {
  const toast = useToast();
  const [savePhase, setSavePhase] = useState<EditorSavePhase>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const mountedRef = useRef(false);
  const syncedKeyRef = useRef<string | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const handleSaveRef = useRef<((source?: "autosave" | "manual") => Promise<void>) | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] }, link: false }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg max-w-full h-auto" } }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "article-tiptap-prose min-h-[360px] max-w-none px-6 py-8 focus:outline-none sm:px-8",
      },
    },
  });

  const retrySave = useCallback((source: "autosave" | "manual") => {
    window.setTimeout(() => {
      void handleSaveRef.current?.(source);
    }, 0);
  }, []);

  const handleSave = useCallback(
    async (source: "autosave" | "manual" = "manual") => {
      if (!editor) return;
      if (!navigator.onLine) {
        setSaveError("You appear to be offline. Reconnect to save this page.");
        setSavePhase("error");
        toast.warning("Offline", "Reconnect to save landing page changes.");
        return;
      }
      const html = editor.getHTML();
      setSavePhase("saving");
      setSaveError(null);

      try {
        const result = await withRetry(
          () =>
            safeFetchJson<{ contentHtml?: string }>(`/api/landing-pages/${pageId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ contentHtml: html, status: "generated" }),
              fallbackError: "Could not save page.",
            }),
          { retries: 1, delayMs: 700 },
        );
        if (!result.ok) {
          setSaveError(result.error ?? "Could not save page.");
          setSavePhase("error");
          toast.toast({
            title: "Could not save page",
            description: result.error ?? "Try again in a moment.",
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
        onSaved?.(typeof result.data.contentHtml === "string" ? result.data.contentHtml : html);
        setLastSavedAt(Date.now());
        setSavePhase("saved");
        if (source === "manual") toast.success("Landing page saved");
      } catch {
        setSaveError("Network error while saving.");
        setSavePhase("error");
        toast.toast({
          title: "Save failed",
          description: "Network error while saving landing page.",
          variant: "error",
          action: {
            label: "Retry",
            onClick: () => {
              retrySave(source);
            },
          },
        });
      }
    },
    [editor, onSaved, pageId, retrySave, toast],
  );

  useEffect(() => {
    handleSaveRef.current = handleSave;
    return () => {
      handleSaveRef.current = null;
    };
  }, [handleSave]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!editor) return;
    const onUpdate = () => {
      setSavePhase("dirty");
      if (autosaveTimerRef.current !== null) window.clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = window.setTimeout(() => {
        void handleSave("autosave");
      }, AUTOSAVE_DEBOUNCE_MS);
    };
    editor.on("update", onUpdate);
    return () => {
      editor.off("update", onUpdate);
      if (autosaveTimerRef.current !== null) window.clearTimeout(autosaveTimerRef.current);
    };
  }, [editor, handleSave]);

  const syncKey = `${pageId}:${contentVersion}`;
  useEffect(() => {
    if (!editor || !mountedRef.current) return;
    const changed = syncedKeyRef.current !== syncKey;
    syncedKeyRef.current = syncKey;
    if (!changed && editor.getHTML() === initialHtml) return;
    if (editor.getHTML() !== initialHtml) {
      editor.commands.setContent(initialHtml, { emitUpdate: false });
    }
  }, [editor, initialHtml, syncKey]);

  useEffect(() => {
    if (!editor) return;
    onEditorReady?.(editor);
  }, [editor, onEditorReady]);

  if (!editor) {
    return (
      <div className="flex min-h-[420px] flex-col gap-3 overflow-hidden rounded-2xl border border-border/80 p-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="min-h-[320px] flex-1" />
      </div>
    );
  }

  return (
    <div className="shadow-premium-lg flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card ring-1 ring-border/40">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 bg-muted/20 px-3 py-2.5 sm:px-4">
        <div className="-mx-1 flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto pb-0.5" role="toolbar" aria-label="Formatting">
          <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" aria-hidden /></ToolbarButton>
          <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" aria-hidden /></ToolbarButton>
          <ToolbarButton label="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="size-4" aria-hidden /></ToolbarButton>
          <ToolbarButton label="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" aria-hidden /></ToolbarButton>
          <ToolbarButton label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="size-4" aria-hidden /></ToolbarButton>
          <ToolbarButton label="Ordered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" aria-hidden /></ToolbarButton>
          <ToolbarButton label="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="size-4" aria-hidden /></ToolbarButton>
          <ToolbarButton label="Undo" disabled={!editor.can().chain().focus().undo().run()} onClick={() => editor.chain().focus().undo().run()}><Undo2 className="size-4" aria-hidden /></ToolbarButton>
          <ToolbarButton label="Redo" disabled={!editor.can().chain().focus().redo().run()} onClick={() => editor.chain().focus().redo().run()}><Redo2 className="size-4" aria-hidden /></ToolbarButton>
        </div>
        <EditorSaveIndicator phase={savePhase} errorMessage={saveError} lastSavedAt={lastSavedAt} onSave={() => void handleSave("manual")} />
      </div>
      <EditorContent editor={editor} className="flex-1 bg-card" />
    </div>
  );
}
