"use client";

import { useCallback, useState } from "react";
import type { Editor } from "@tiptap/react";
import { Loader2, Sparkles } from "lucide-react";

import { EditorLibraryActions } from "@/components/content-library/editor-library-actions";
import { SaveToLibraryDialog } from "@/components/content-library/save-to-library-dialog";
import { AiRewritePreviewDialog } from "@/components/ebooks/ai-rewrite-preview-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getEditorTextSelection,
  replaceEditorTextRange,
  type EditorTextSelection,
} from "@/lib/ebooks/tiptap-selection";

type ArticleAiToolsPanelProps = {
  articleId: string;
  editor: Editor | null;
  getContentHtml: () => string;
  onContentReplace: (html: string) => void;
  onOutlineGenerated: (html: string) => void;
  onFullGenerated: (html: string) => void;
};

export function ArticleAiToolsPanel({
  articleId,
  editor,
  getContentHtml,
  onContentReplace,
  onOutlineGenerated,
  onFullGenerated,
}: ArticleAiToolsPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [previewLabel, setPreviewLabel] = useState("");
  const [pendingSelection, setPendingSelection] =
    useState<EditorTextSelection | null>(null);
  const [pendingMode, setPendingMode] = useState<
    "selection" | "append_faq" | "replace_intro" | null
  >(null);
  const [saveAiOpen, setSaveAiOpen] = useState(false);
  const [saveAiContent, setSaveAiContent] = useState("");

  const runAi = useCallback(
    async (
      tool:
        | "rewrite_section"
        | "improve_intro"
        | "add_faq"
        | "meta_title"
        | "meta_description"
        | "slug",
      options?: { text?: string; html?: string },
    ) => {
      const response = await fetch("/api/articles/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          tool,
          text: options?.text,
          html: options?.html ?? getContentHtml(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "AI request failed.",
        );
      }
      return typeof data.result === "string" ? data.result : "";
    },
    [articleId, getContentHtml],
  );

  const runOutline = useCallback(async () => {
    setError(null);
    setBusy("outline");
    try {
      const response = await fetch("/api/articles/generate-outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Outline generation failed.",
        );
      }
      if (typeof data.content === "string") {
        onOutlineGenerated(data.content);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Outline generation failed.");
    } finally {
      setBusy(null);
    }
  }, [articleId, onOutlineGenerated]);

  const runFull = useCallback(async () => {
    setError(null);
    setBusy("full");
    try {
      const response = await fetch("/api/articles/generate-full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string" ? data.error : "Article generation failed.",
        );
      }
      if (typeof data.content === "string") {
        onFullGenerated(data.content);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Article generation failed.");
    } finally {
      setBusy(null);
    }
  }, [articleId, onFullGenerated]);

  const startRewriteSection = useCallback(async () => {
    setError(null);
    if (!editor) {
      setError("Editor is still loading.");
      return;
    }
    const selection = getEditorTextSelection(editor);
    if (!selection) {
      setError("Select text in the article first.");
      return;
    }
    setPendingSelection(selection);
    setPendingMode("selection");
    setPreviewLabel("Rewrite section");
    setResultText(null);
    setPreviewError(null);
    setPreviewLoading(true);
    setPreviewOpen(true);
    try {
      const result = await runAi("rewrite_section", { text: selection.text });
      setResultText(result);
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Rewrite failed.");
    } finally {
      setPreviewLoading(false);
    }
  }, [editor, runAi]);

  const startImproveIntro = useCallback(async () => {
    setError(null);
    setPreviewLabel("Improve intro");
    setPendingMode("replace_intro");
    setPendingSelection(null);
    setResultText(null);
    setPreviewError(null);
    setPreviewLoading(true);
    setPreviewOpen(true);
    try {
      const result = await runAi("improve_intro");
      setResultText(result);
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setPreviewLoading(false);
    }
  }, [runAi]);

  const startAddFaq = useCallback(async () => {
    setError(null);
    setPreviewLabel("Add FAQ section");
    setPendingMode("append_faq");
    setPendingSelection(null);
    setResultText(null);
    setPreviewError(null);
    setPreviewLoading(true);
    setPreviewOpen(true);
    try {
      const result = await runAi("add_faq");
      setResultText(result);
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "Request failed.");
    } finally {
      setPreviewLoading(false);
    }
  }, [runAi]);

  const applyPreview = useCallback(() => {
    if (!resultText || !editor) {
      setPreviewOpen(false);
      return;
    }
    if (pendingMode === "selection" && pendingSelection) {
      replaceEditorTextRange(editor, pendingSelection, resultText);
      onContentReplace(editor.getHTML());
    } else if (pendingMode === "append_faq") {
      const html = `${getContentHtml()}\n${resultText}`;
      editor.commands.setContent(html, { emitUpdate: true });
      onContentReplace(editor.getHTML());
    } else if (pendingMode === "replace_intro") {
      const current = getContentHtml();
      const h1Match = current.match(/<h1[^>]*>[\s\S]*?<\/h1>/i);
      const rest = h1Match
        ? current.slice(current.indexOf(h1Match[0]) + h1Match[0].length)
        : current;
      const next = h1Match ? `${h1Match[0]}${resultText}${rest}` : resultText;
      editor.commands.setContent(next, { emitUpdate: true });
      onContentReplace(editor.getHTML());
    }
    setPreviewOpen(false);
  }, [
    editor,
    getContentHtml,
    onContentReplace,
    pendingMode,
    pendingSelection,
    resultText,
  ]);

  return (
    <>
      <Card className="shadow-premium">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="size-4" aria-hidden />
            AI tools
          </CardTitle>
          <CardDescription>Outline, draft, and section helpers</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={busy !== null}
            onClick={() => void runOutline()}
          >
            {busy === "outline" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Generate article outline
          </Button>
          <Button
            type="button"
            disabled={busy !== null}
            onClick={() => void runFull()}
          >
            {busy === "full" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : null}
            Generate full article
          </Button>
          <Button type="button" variant="outline" onClick={() => void startRewriteSection()}>
            Rewrite section
          </Button>
          <Button type="button" variant="outline" onClick={() => void startImproveIntro()}>
            Improve intro
          </Button>
          <Button type="button" variant="outline" onClick={() => void startAddFaq()}>
            Add FAQ section
          </Button>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <EditorLibraryActions editor={editor} />

      <AiRewritePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        toolLabel={previewLabel}
        loading={previewLoading}
        error={previewError}
        originalText={pendingSelection?.text ?? ""}
        resultText={resultText}
        onReplace={applyPreview}
        onSaveToLibrary={(content) => {
          setSaveAiContent(content);
          setSaveAiOpen(true);
        }}
      />
      <SaveToLibraryDialog
        open={saveAiOpen}
        onOpenChange={setSaveAiOpen}
        defaultType="snippet"
        defaultTitle={previewLabel || "Article AI result"}
        defaultContent={saveAiContent}
      />
    </>
  );
}
