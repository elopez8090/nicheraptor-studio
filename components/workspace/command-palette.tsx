"use client";

import { useCallback, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BookOpen,
  FileText,
  FolderKanban,
  Lightbulb,
  Search,
  Settings,
  Sparkles,
  StickyNote,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useOptionalEditorWorkspace } from "@/components/workspace/editor-workspace-context";
import { useStudioWorkspace } from "@/components/workspace/studio-workspace-context";
import {
  getNavRecents,
  type NavRecentItem,
} from "@/lib/workspace/navigation-recents";
import { cn } from "@/lib/utils";

type CommandItem = {
  id: string;
  label: string;
  hint?: string;
  group: string;
  icon: React.ComponentType<{ className?: string }>;
  run: () => void;
};

export function CommandPalette() {
  const {
    commandOpen,
    setCommandOpen,
    setGlobalSearchOpen,
    setQuickCreateOpen,
    setShortcutsOpen,
  } = useStudioWorkspace();
  const router = useRouter();
  const pathname = usePathname();
  const editorWorkspace = useOptionalEditorWorkspace();
  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState<{
    projects: NavRecentItem[];
    articles: NavRecentItem[];
  }>({ projects: [], articles: [] });

  const handleCommandOpenChange = (open: boolean) => {
    setCommandOpen(open);
    if (open) {
      setRecents(getNavRecents());
      setQuery("");
    }
  };

  const navigate = useCallback(
    (href: string) => {
      setCommandOpen(false);
      router.push(href);
    },
    [router, setCommandOpen],
  );

  const staticCommands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [
      {
        id: "global-search",
        label: "Global search…",
        hint: "⌘⇧K",
        group: "Navigate",
        icon: Search,
        run: () => {
          setCommandOpen(false);
          setGlobalSearchOpen(true);
        },
      },
      {
        id: "quick-create",
        label: "Quick create…",
        hint: "⌘N",
        group: "Create",
        icon: Sparkles,
        run: () => {
          setCommandOpen(false);
          setQuickCreateOpen(true);
        },
      },
      {
        id: "keyboard-shortcuts",
        label: "Keyboard shortcuts",
        hint: "⌘/",
        group: "Navigate",
        icon: Lightbulb,
        run: () => {
          setCommandOpen(false);
          setShortcutsOpen(true);
        },
      },
      {
        id: "new-ebook",
        label: "New Ebook",
        group: "Create",
        icon: BookOpen,
        run: () => navigate("/ebooks/new"),
      },
      {
        id: "new-article",
        label: "New Article",
        group: "Create",
        icon: FileText,
        run: () => navigate("/articles/new"),
      },
      {
        id: "new-landing-page",
        label: "New Landing Page",
        group: "Create",
        icon: FileText,
        run: () => navigate("/pages/new"),
      },
      {
        id: "search-projects",
        label: "Search Projects",
        group: "Navigate",
        icon: Search,
        run: () => navigate("/projects"),
      },
      {
        id: "templates",
        label: "Use Template",
        group: "Create",
        icon: Sparkles,
        run: () => navigate("/templates"),
      },
      {
        id: "content-library",
        label: "Content Library",
        group: "Navigate",
        icon: Sparkles,
        run: () => navigate("/library"),
      },
      {
        id: "dashboard",
        label: "Dashboard",
        group: "Navigate",
        icon: FolderKanban,
        run: () => navigate("/dashboard"),
      },
      {
        id: "settings",
        label: "Workspace Settings",
        group: "Project",
        icon: Settings,
        run: () => navigate("/settings"),
      },
    ];

    const ebookMatch = pathname.match(/^\/ebooks\/([^/]+)/);
    if (ebookMatch) {
      const projectId = ebookMatch[1];
      items.push(
        {
          id: "open-notes",
          label: "Open Notes",
          group: "Project",
          icon: StickyNote,
          run: () => navigate(`/ebooks/${projectId}/notes`),
        },
        {
          id: "project-settings",
          label: "Project Settings",
          group: "Project",
          icon: Settings,
          run: () => navigate(`/ebooks/${projectId}/settings`),
        },
        {
          id: "generate-chapter",
          label: "Generate Chapter (AI panel)",
          group: "AI",
          icon: Sparkles,
          run: () => {
            editorWorkspace?.openToolTab("ai");
            setCommandOpen(false);
          },
        },
        {
          id: "export-pdf",
          label: "Export PDF (Export panel)",
          group: "Export",
          icon: FileText,
          run: () => {
            editorWorkspace?.openToolTab("export");
            setCommandOpen(false);
          },
        },
      );
    }

    if (editorWorkspace) {
      items.push({
        id: "save-document",
        label: "Save document",
        group: "Writing",
        icon: FileText,
        run: () => {
          editorWorkspace.requestSave();
          setCommandOpen(false);
        },
      });
      items.push({
        id: "focus-mode",
        label: "Distraction-free mode",
        group: "Writing",
        icon: Lightbulb,
        run: () => {
          editorWorkspace.setFocusMode(true);
          setCommandOpen(false);
        },
      });
    }

    for (const project of recents.projects) {
      items.push({
        id: `recent-project-${project.id}`,
        label: project.title,
        hint: "Recent ebook",
        group: "Recent projects",
        icon: BookOpen,
        run: () => navigate(project.href),
      });
    }

    for (const article of recents.articles) {
      items.push({
        id: `recent-article-${article.id}`,
        label: article.title,
        hint: "Recent article",
        group: "Recent articles",
        icon: FileText,
        run: () => navigate(article.href),
      });
    }

    return items;
  }, [
    navigate,
    pathname,
    recents,
    editorWorkspace,
    setCommandOpen,
    setGlobalSearchOpen,
    setQuickCreateOpen,
    setShortcutsOpen,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return staticCommands;
    }
    return staticCommands.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.group.toLowerCase().includes(q) ||
        item.hint?.toLowerCase().includes(q),
    );
  }, [query, staticCommands]);

  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return [...map.entries()];
  }, [filtered]);

  return (
    <Dialog open={commandOpen} onOpenChange={handleCommandOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg" showCloseButton>
        <DialogHeader className="border-b border-border/60 px-4 py-3">
          <DialogTitle>Command palette</DialogTitle>
          <DialogDescription>
            Quick actions and navigation ·{" "}
            <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">⌘K</kbd>
          </DialogDescription>
        </DialogHeader>
        <div className="border-b border-border/60 px-4 py-2">
          <Input
            autoFocus
            placeholder="Search actions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search commands"
          />
        </div>
        <div className="max-h-[min(420px,50vh)] overflow-y-auto px-2 py-2">
          {groups.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">
              No matching commands
            </p>
          ) : (
            groups.map(([group, items]) => (
              <div key={group} className="mb-3 last:mb-0">
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {group}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {items.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                        )}
                        onClick={item.run}
                      >
                        <item.icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                        {item.hint ? (
                          <span className="truncate text-xs text-muted-foreground">{item.hint}</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
