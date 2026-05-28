import type { Editor } from "@tiptap/react";

/** Insert library HTML at cursor or document end. */
export function insertLibraryContentIntoEditor(
  editor: Editor,
  html: string,
  mode: "cursor" | "end" = "cursor",
): void {
  const trimmed = html.trim();
  if (!trimmed) {
    return;
  }

  if (mode === "end") {
    editor.chain().focus("end").insertContent(trimmed).run();
    return;
  }

  const { empty } = editor.state.selection;
  if (empty) {
    editor.chain().focus().insertContent(trimmed).run();
  } else {
    editor.chain().focus().deleteSelection().insertContent(trimmed).run();
  }
}
