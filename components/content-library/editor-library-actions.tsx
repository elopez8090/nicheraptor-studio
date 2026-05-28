"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import { BookMarked, BookmarkPlus, FileStack, Sparkles } from "lucide-react";

import { InsertFromLibraryDialog } from "@/components/content-library/insert-from-library-dialog";
import { SaveToLibraryDialog } from "@/components/content-library/save-to-library-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getEditorTextSelection } from "@/lib/ebooks/tiptap-selection";
import type { ContentLibraryType } from "@/lib/content-library/types";

type EditorLibraryActionsProps = {
  editor: Editor | null;
  variant?: "toolbar" | "panel";
  className?: string;
};

export function EditorLibraryActions({
  editor,
  variant = "panel",
  className,
}: EditorLibraryActionsProps) {
  const [insertOpen, setInsertOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveDefaults, setSaveDefaults] = useState<{
    type: ContentLibraryType;
    title: string;
    content: string;
  }>({ type: "snippet", title: "", content: "" });

  function openSave(
    type: ContentLibraryType,
    title: string,
    content: string,
  ) {
    setSaveDefaults({ type, title, content });
    setSaveOpen(true);
  }

  function saveSelection() {
    if (!editor) {
      return;
    }
    const selection = getEditorTextSelection(editor);
    const text =
      selection?.text ??
      editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n\n");
    openSave("snippet", "Editor selection", text);
  }

  function saveDocumentSection() {
    if (!editor) {
      return;
    }
    const html = editor.getHTML();
    openSave("introduction", "Reusable section", html);
  }

  if (variant === "toolbar") {
    return (
      <>
        <button
          type="button"
          aria-label="Insert from library"
          title="Insert from library"
          className="inline-flex size-9 items-center justify-center rounded-lg text-sm transition-[background-color,color,transform] duration-150 hover:bg-muted active:scale-95"
          onClick={() => setInsertOpen(true)}
        >
          <BookMarked className="size-4" aria-hidden />
        </button>
        <InsertFromLibraryDialog
          open={insertOpen}
          onOpenChange={setInsertOpen}
          editor={editor}
        />
      </>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Content library</CardTitle>
          <CardDescription>
            Save and reuse snippets, prompts, frameworks, and sections.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Button
            type="button"
            variant="secondary"
            className="justify-start"
            onClick={() => setInsertOpen(true)}
          >
            <BookMarked className="size-4" aria-hidden />
            Insert from library
          </Button>
          <Button
            type="button"
            variant="outline"
            className="justify-start"
            onClick={saveSelection}
          >
            <BookmarkPlus className="size-4" aria-hidden />
            Save selection to library
          </Button>
          <Button
            type="button"
            variant="outline"
            className="justify-start"
            onClick={() => openSave("prompt", "AI prompt", "")}
          >
            <Sparkles className="size-4" aria-hidden />
            Save AI prompt
          </Button>
          <Button
            type="button"
            variant="outline"
            className="justify-start"
            onClick={() => openSave("framework", "Writing framework", "")}
          >
            <FileStack className="size-4" aria-hidden />
            Save framework
          </Button>
          <Button
            type="button"
            variant="outline"
            className="justify-start"
            onClick={saveDocumentSection}
          >
            <BookmarkPlus className="size-4" aria-hidden />
            Save as reusable section
          </Button>
        </CardContent>
      </Card>

      <InsertFromLibraryDialog
        open={insertOpen}
        onOpenChange={setInsertOpen}
        editor={editor}
      />
      <SaveToLibraryDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        defaultType={saveDefaults.type}
        defaultTitle={saveDefaults.title}
        defaultContent={saveDefaults.content}
      />
    </>
  );
}
