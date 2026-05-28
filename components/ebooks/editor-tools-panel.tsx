"use client";

import { useCallback, useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  Languages,
  Loader2,
  Megaphone,
  PenLine,
  Sparkles,
  SpellCheck,
  Wand2,
} from "lucide-react";

import { EditorLibraryActions } from "@/components/content-library/editor-library-actions";
import { SaveToLibraryDialog } from "@/components/content-library/save-to-library-dialog";
import { AiRewritePreviewDialog } from "@/components/ebooks/ai-rewrite-preview-dialog";
import { EbookExportButtons } from "@/components/ebooks/ebook-export-buttons";
import { EbookExportSettingsPanel } from "@/components/ebooks/ebook-export-settings-panel";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AI_REWRITE_TOOL_LABELS,
  type AiRewriteToolId,
} from "@/lib/ebooks/ai-rewrite-tools";
import {
  getEditorTextSelection,
  replaceEditorTextRange,
  type EditorTextSelection,
} from "@/lib/ebooks/tiptap-selection";

const AI_TOOLS: {
  id: AiRewriteToolId;
  icon: typeof Wand2;
}[] = [
  { id: "rewrite_selected", icon: Wand2 },
  { id: "improve_intro", icon: PenLine },
  { id: "expand_section", icon: Sparkles },
  { id: "make_persuasive", icon: Megaphone },
  { id: "simplify_language", icon: Languages },
  { id: "fix_grammar", icon: SpellCheck },
];

type EditorToolsPanelProps = {
  projectId: string;
  ebookTitle: string;
  editor: Editor | null;
  /** When set, only render matching sections (default: both). */
  sections?: ("ai" | "export")[];
};

export function EditorToolsPanel({
  projectId,
  ebookTitle,
  editor,
  sections = ["ai", "export"],
}: EditorToolsPanelProps) {
  const showAi = sections.includes("ai");
  const showExport = sections.includes("export");
  const [panelError, setPanelError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<AiRewriteToolId | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [pendingSelection, setPendingSelection] =
    useState<EditorTextSelection | null>(null);
  const [previewToolLabel, setPreviewToolLabel] = useState("");
  const [saveAiOpen, setSaveAiOpen] = useState(false);
  const [saveAiContent, setSaveAiContent] = useState("");

  const runTool = useCallback(
    async (toolId: AiRewriteToolId) => {
      setPanelError(null);

      if (!editor) {
        setPanelError("Editor is still loading. Try again in a moment.");
        return;
      }

      const selection = getEditorTextSelection(editor);
      if (!selection) {
        setPanelError("Select some text in the chapter first, then run an AI tool.");
        return;
      }

      setActiveTool(toolId);
      setPendingSelection(selection);
      setPreviewToolLabel(AI_REWRITE_TOOL_LABELS[toolId]);
      setResultText(null);
      setPreviewError(null);
      setPreviewLoading(true);
      setPreviewOpen(true);

      try {
        const response = await fetch("/api/ai-rewrite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tool: toolId,
            text: selection.text,
          }),
        });

        const payload = (await response.json()) as {
          error?: string;
          details?: string;
          text?: string;
        };

        if (!response.ok) {
          setPreviewError(
            payload.error ??
              payload.details ??
              "Could not generate a suggestion. Please try again.",
          );
          return;
        }

        const text =
          typeof payload.text === "string" ? payload.text.trim() : "";
        if (!text) {
          setPreviewError("The AI returned an empty result.");
          return;
        }

        setResultText(text);
      } catch {
        setPreviewError("Network error. Check your connection and try again.");
      } finally {
        setPreviewLoading(false);
        setActiveTool(null);
      }
    },
    [editor],
  );

  const handleReplace = useCallback(() => {
    if (!editor || !pendingSelection || !resultText) {
      return;
    }
    replaceEditorTextRange(editor, pendingSelection, resultText);
    setPendingSelection(null);
    setResultText(null);
  }, [editor, pendingSelection, resultText]);

  const handlePreviewOpenChange = (open: boolean) => {
    setPreviewOpen(open);
    if (!open) {
      setPreviewLoading(false);
      setPreviewError(null);
      setResultText(null);
      setPendingSelection(null);
      setActiveTool(null);
    }
  };

  return (
    <>
      <aside className="flex h-full min-h-0 flex-col gap-4" aria-label="Editor tools">
        {showAi ? (
        <Card className="border-border/80 shadow-premium ring-1 ring-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">AI tools</CardTitle>
            <CardDescription className="text-sm">
              Select text in the chapter, then choose a rewrite helper. You will
              preview the result before anything is replaced.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {!editor ? (
              <p className="text-sm text-muted-foreground">Loading editor…</p>
            ) : null}
            {panelError ? (
              <p className="text-sm text-destructive" role="alert">
                {panelError}
              </p>
            ) : null}
            {AI_TOOLS.map(({ id, icon: Icon }) => {
              const loading = activeTool === id;
              return (
                <Button
                  key={id}
                  type="button"
                  variant="outline"
                  className="h-11 w-full justify-start gap-2.5 text-base"
                  disabled={!editor || loading || (activeTool !== null && !loading)}
                  onClick={() => void runTool(id)}
                >
                  {loading ? (
                    <Loader2
                      className="size-4 shrink-0 animate-spin opacity-70"
                      aria-hidden
                    />
                  ) : (
                    <Icon className="size-4 shrink-0 opacity-70" aria-hidden />
                  )}
                  {AI_REWRITE_TOOL_LABELS[id]}
                </Button>
              );
            })}
          </CardContent>
        </Card>
        ) : null}

        <EditorLibraryActions editor={editor} />

        {showExport ? (
        <Card className="border-border/80 shadow-premium ring-1 ring-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Export</CardTitle>
            <CardDescription className="text-sm">
              Choose a PDF style preset and layout options for this ebook. Preview or
              download when ready.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 [&_[role=group]]:flex-col [&_button]:w-full">
            <EbookExportSettingsPanel projectId={projectId} />
            <EbookExportButtons projectId={projectId} ebookTitle={ebookTitle} />
          </CardContent>
        </Card>
        ) : null}
      </aside>

      <AiRewritePreviewDialog
        open={previewOpen}
        onOpenChange={handlePreviewOpenChange}
        toolLabel={previewToolLabel}
        originalText={pendingSelection?.text ?? ""}
        resultText={resultText}
        loading={previewLoading}
        error={previewError}
        onReplace={handleReplace}
        onSaveToLibrary={(content) => {
          setSaveAiContent(content);
          setSaveAiOpen(true);
        }}
      />
      <SaveToLibraryDialog
        open={saveAiOpen}
        onOpenChange={setSaveAiOpen}
        defaultType="snippet"
        defaultTitle={previewToolLabel || "AI result"}
        defaultContent={saveAiContent}
      />
    </>
  );
}
