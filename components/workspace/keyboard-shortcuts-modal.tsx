"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useStudioWorkspace } from "@/components/workspace/studio-workspace-context";
import { KEYBOARD_SHORTCUT_GROUPS } from "@/lib/workspace/keyboard-shortcuts";

export function KeyboardShortcutsModal() {
  const { shortcutsOpen, setShortcutsOpen } = useStudioWorkspace();

  return (
    <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Speed up daily production —{" "}
            <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">⌘/</kbd>
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[min(420px,60vh)] space-y-6 overflow-y-auto pr-1">
          {KEYBOARD_SHORTCUT_GROUPS.map((group) => (
            <section key={group.id}>
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                {group.title}
              </h3>
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li
                    key={item.description}
                    className="flex items-start justify-between gap-4 text-sm"
                  >
                    <span className="text-muted-foreground">{item.description}</span>
                    <kbd className="shrink-0 rounded border bg-muted px-2 py-0.5 text-xs font-medium">
                      {item.keys}
                    </kbd>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
