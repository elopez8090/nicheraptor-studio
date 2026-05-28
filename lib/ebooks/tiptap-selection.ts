import type { Editor } from "@tiptap/react";

export type EditorTextSelection = {
  from: number;
  to: number;
  text: string;
};

export function getEditorTextSelection(
  editor: Editor,
): EditorTextSelection | null {
  const { from, to, empty } = editor.state.selection;
  if (empty || from === to) {
    return null;
  }
  const text = editor.state.doc.textBetween(from, to, "\n\n").trim();
  if (!text) {
    return null;
  }
  return { from, to, text };
}

export function replaceEditorTextRange(
  editor: Editor,
  range: Pick<EditorTextSelection, "from" | "to">,
  newText: string,
): void {
  editor
    .chain()
    .focus()
    .deleteRange({ from: range.from, to: range.to })
    .insertContent(newText)
    .run();
}
