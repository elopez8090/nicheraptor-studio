"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  FileText,
  FlaskConical,
  LayoutTemplate,
  Library,
  Loader2,
  Map as MapIcon,
  Search,
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
import { useStudioWorkspace } from "@/components/workspace/studio-workspace-context";
import type { WorkspaceSearchResult } from "@/lib/workspace/workspace-search";
import { cn } from "@/lib/utils";

const kindIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  ebook: BookOpen,
  article: FileText,
  note: StickyNote,
  snippet: Library,
  framework: Library,
  planner_topic: MapIcon,
  research: FlaskConical,
  template: LayoutTemplate,
  library: Library,
};

export function GlobalSearchDialog() {
  const { globalSearchOpen, setGlobalSearchOpen } = useStudioWorkspace();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WorkspaceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!globalSearchOpen) {
      setQuery("");
      setResults([]);
      return;
    }
    setQuery("");
    setResults([]);
  }, [globalSearchOpen]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(() => {
      void fetch(`/api/workspace/search?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data: { results?: WorkspaceSearchResult[] }) => {
          setResults(Array.isArray(data.results) ? data.results : []);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 220);
    return () => window.clearTimeout(timer);
  }, [query]);

  const openResult = useCallback(
    (href: string) => {
      setGlobalSearchOpen(false);
      router.push(href);
    },
    [router, setGlobalSearchOpen],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, WorkspaceSearchResult[]>();
    for (const row of results) {
      const list = map.get(row.kind) ?? [];
      list.push(row);
      map.set(row.kind, list);
    }
    return [...map.entries()];
  }, [results]);

  return (
    <Dialog open={globalSearchOpen} onOpenChange={setGlobalSearchOpen}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-xl" showCloseButton>
        <DialogHeader className="border-b border-border/60 px-4 py-3">
          <DialogTitle className="flex items-center gap-2">
            <Search className="size-4" aria-hidden />
            Global search
          </DialogTitle>
          <DialogDescription>
            Ebooks, articles, notes, library, planner, research, templates ·{" "}
            <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs">
              ⌘⇧K
            </kbd>
          </DialogDescription>
        </DialogHeader>
        <div className="border-b border-border/60 px-4 py-2">
          <Input
            autoFocus
            placeholder="Search everything…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Global search query"
          />
        </div>
        <div className="max-h-[min(440px,55vh)] overflow-y-auto px-2 py-2">
          {loading ? (
            <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Searching…
            </p>
          ) : query.trim().length < 2 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              Type at least 2 characters
            </p>
          ) : grouped.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query.trim()}&rdquo;
            </p>
          ) : (
            grouped.map(([kind, items]) => (
              <div key={kind} className="mb-3 last:mb-0">
                <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {kind.replace(/_/g, " ")}
                </p>
                <ul className="flex flex-col gap-0.5">
                  {items.map((item) => {
                    const Icon = kindIcons[item.kind] ?? Search;
                    return (
                      <li key={`${item.kind}-${item.id}`}>
                        <button
                          type="button"
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                          )}
                          onClick={() => openResult(item.href)}
                        >
                          <Icon
                            className="size-4 shrink-0 text-muted-foreground"
                            aria-hidden
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium">
                              {item.title}
                            </span>
                            {item.subtitle ? (
                              <span className="block truncate text-xs text-muted-foreground">
                                {item.subtitle}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
