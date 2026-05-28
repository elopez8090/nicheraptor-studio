export type ShortcutGroup = {
  id: string;
  title: string;
  items: { keys: string; description: string }[];
};

export const KEYBOARD_SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    id: "workspace",
    title: "Workspace",
    items: [
      { keys: "⌘/Ctrl + Shift + K", description: "Global search (all content)" },
      { keys: "⌘/Ctrl + K", description: "Command palette (quick actions)" },
      { keys: "⌘/Ctrl + N", description: "Quick create menu" },
      { keys: "⌘/Ctrl + /", description: "Keyboard shortcuts reference" },
    ],
  },
  {
    id: "writing",
    title: "Writing & editors",
    items: [
      { keys: "⌘/Ctrl + S", description: "Save document (in editor)" },
      { keys: "Esc", description: "Exit focus / distraction-free mode" },
    ],
  },
  {
    id: "ai",
    title: "AI tools",
    items: [
      { keys: "⌘/Ctrl + K → Generate Chapter", description: "Open AI panel (ebook editor)" },
      { keys: "⌘/Ctrl + K → Export PDF", description: "Open export panel" },
    ],
  },
];
