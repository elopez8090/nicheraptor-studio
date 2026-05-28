"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  BookOpen,
  Copy,
  LayoutTemplate,
  Loader2,
  MoreHorizontal,
  Pencil,
  Search,
  Sparkles,
  Star,
  Settings,
  StickyNote,
  Trash2,
} from "lucide-react";

import {
  ProjectProgressBadge,
  ProjectStatusBadge,
} from "@/components/ebooks/project-status-badge";
import { EmptyState } from "@/components/layout/empty-state";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { EbookProjectListItem } from "@/lib/ebooks/fetch-ebook-projects";
import type { EbookWorkflowStatus } from "@/lib/ebooks/workflow-status";
import { WORKFLOW_STATUS_OPTIONS } from "@/lib/ebooks/workflow-status";
import {
  BulkActionsBar,
  type BulkActionId,
} from "@/components/workspace/bulk-actions-bar";
import { cn } from "@/lib/utils";

type DashboardProjectLibraryProps = {
  initialProjects: EbookProjectListItem[];
  /** When true, omit outer heading (used inside dashboard PageSection). */
  embedded?: boolean;
};

type WorkflowFilter = "all" | EbookWorkflowStatus;
type LibraryView = "active" | "starred" | "archived";

function formatDate(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(new Date(iso));
}

function matchesSearch(project: EbookProjectListItem, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    project.title.toLowerCase().includes(q) ||
    project.audience.toLowerCase().includes(q) ||
    project.goal.toLowerCase().includes(q) ||
    (project.notes?.toLowerCase().includes(q) ?? false)
  );
}

async function patchProject(
  id: string,
  body: Record<string, unknown>,
): Promise<{ error?: string }> {
  const response = await fetch(`/api/ebook-projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as { error?: string };
  if (!response.ok) {
    return { error: data.error ?? "Update failed." };
  }
  return {};
}

export function DashboardProjectLibrary({
  initialProjects,
  embedded = false,
}: DashboardProjectLibraryProps) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);

  const [search, setSearch] = useState("");
  const [workflowFilter, setWorkflowFilter] = useState<WorkflowFilter>("all");
  const [libraryView, setLibraryView] = useState<LibraryView>("active");
  const [pendingDelete, setPendingDelete] = useState<EbookProjectListItem | null>(
    null,
  );
  const [renameTarget, setRenameTarget] = useState<EbookProjectListItem | null>(
    null,
  );
  const [renameTitle, setRenameTitle] = useState("");
  const [notesTarget, setNotesTarget] = useState<EbookProjectListItem | null>(
    null,
  );
  const [notesDraft, setNotesDraft] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const filtered = useMemo(() => {
    return projects.filter((project) => {
      if (libraryView === "archived" && !project.isArchived) return false;
      if (libraryView === "active" && project.isArchived) return false;
      if (libraryView === "starred" && (!project.isStarred || project.isArchived)) {
        return false;
      }
      if (workflowFilter !== "all" && project.workflowStatus !== workflowFilter) {
        return false;
      }
      return matchesSearch(project, search);
    });
  }, [projects, search, workflowFilter, libraryView]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setActionError(null);

    try {
      const response = await fetch(
        `/api/ebook-projects/${pendingDelete.id}`,
        { method: "DELETE" },
      );
      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        setActionError(body.error ?? "Could not delete this project.");
        return;
      }

      setProjects((current) =>
        current.filter((p) => p.id !== pendingDelete.id),
      );
      setPendingDelete(null);
      router.refresh();
    } catch {
      setActionError("Could not delete this project. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDuplicate(project: EbookProjectListItem) {
    setBusyId(project.id);
    setActionError(null);
    try {
      const response = await fetch(
        `/api/ebook-projects/${project.id}/duplicate`,
        { method: "POST" },
      );
      const data = (await response.json()) as {
        projectId?: string;
        error?: string;
      };
      if (!response.ok || !data.projectId) {
        setActionError(data.error ?? "Could not duplicate project.");
        return;
      }
      router.refresh();
      router.push(`/ebooks/${data.projectId}/chapters`);
    } finally {
      setBusyId(null);
    }
  }

  async function handleToggleStar(project: EbookProjectListItem) {
    const result = await patchProject(project.id, {
      isStarred: !project.isStarred,
    });
    if (result.error) {
      setActionError(result.error);
      return;
    }
    setProjects((list) =>
      list.map((p) =>
        p.id === project.id ? { ...p, isStarred: !p.isStarred } : p,
      ),
    );
  }

  async function handleToggleArchive(project: EbookProjectListItem) {
    const result = await patchProject(project.id, {
      isArchived: !project.isArchived,
    });
    if (result.error) {
      setActionError(result.error);
      return;
    }
    setProjects((list) =>
      list.map((p) =>
        p.id === project.id ? { ...p, isArchived: !p.isArchived } : p,
      ),
    );
    router.refresh();
  }

  async function handleWorkflowChange(
    project: EbookProjectListItem,
    workflowStatus: EbookWorkflowStatus,
  ) {
    const result = await patchProject(project.id, { workflowStatus });
    if (result.error) {
      setActionError(result.error);
      return;
    }
    setProjects((list) =>
      list.map((p) => (p.id === project.id ? { ...p, workflowStatus } : p)),
    );
  }

  async function handleSaveRename() {
    if (!renameTarget) return;
    setBusyId(renameTarget.id);
    const result = await patchProject(renameTarget.id, { title: renameTitle });
    setBusyId(null);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    setProjects((list) =>
      list.map((p) =>
        p.id === renameTarget.id ? { ...p, title: renameTitle.trim() } : p,
      ),
    );
    setRenameTarget(null);
    router.refresh();
  }

  async function handleSaveNotes() {
    if (!notesTarget) return;
    setBusyId(notesTarget.id);
    const result = await patchProject(notesTarget.id, {
      notes: notesDraft.trim() || null,
    });
    setBusyId(null);
    if (result.error) {
      setActionError(result.error);
      return;
    }
    setProjects((list) =>
      list.map((p) =>
        p.id === notesTarget.id
          ? { ...p, notes: notesDraft.trim() || null }
          : p,
      ),
    );
    setNotesTarget(null);
  }

  function toggleSelected(projectId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  }

  async function handleBulkAction(action: BulkActionId) {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    setBulkBusy(true);
    setActionError(null);
    try {
      if (action === "duplicate") {
        for (const id of ids) {
          const project = projects.find((p) => p.id === id);
          if (project) {
            await handleDuplicate(project);
          }
        }
      } else if (action === "archive") {
        for (const id of ids) {
          await patchProject(id, { isArchived: true });
        }
        setProjects((list) =>
          list.map((p) =>
            ids.includes(p.id) ? { ...p, isArchived: true } : p,
          ),
        );
      } else if (action === "export") {
        router.push("/exports");
      } else if (action === "tag") {
        setActionError("Bulk tagging is coming soon — use project notes for now.");
      }
      setSelectedIds(new Set());
      router.refresh();
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleSaveAsTemplate(project: EbookProjectListItem) {
    setBusyId(project.id);
    const response = await fetch(
      `/api/ebook-projects/${project.id}/save-template`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${project.title} template` }),
      },
    );
    const data = (await response.json()) as { error?: string; templateId?: string };
    setBusyId(null);
    if (!response.ok) {
      setActionError(data.error ?? "Could not save template.");
      return;
    }
    router.push("/templates");
  }

  function ProjectRowActions({ project }: { project: EbookProjectListItem }) {
    const loading = busyId === project.id;

    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          aria-label={project.isStarred ? "Unstar project" : "Star project"}
          onClick={() => void handleToggleStar(project)}
        >
          <Star
            className={cn(
              "size-4",
              project.isStarred ? "fill-amber-400 text-amber-500" : "text-muted-foreground",
            )}
            aria-hidden
          />
        </Button>
        <select
          className="h-8 max-w-[7.5rem] rounded-md border border-input bg-background px-2 text-xs"
          value={project.workflowStatus}
          aria-label="Project status"
          onChange={(e) =>
            void handleWorkflowChange(
              project,
              e.target.value as EbookWorkflowStatus,
            )
          }
        >
          {WORKFLOW_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <Button size="sm" className="h-8" asChild>
          <Link href={`/ebooks/${project.id}/chapters`}>Continue</Link>
        </Button>
        <Button size="sm" variant="outline" className="h-8" asChild>
          <Link href={`/ebooks/${project.id}/print`}>PDF</Link>
        </Button>
        <Button size="sm" variant="outline" className="h-8" asChild>
          <Link href={`/ebooks/${project.id}/settings`}>
            <Settings className="size-3.5" aria-hidden />
            Settings
          </Link>
        </Button>
        <details className="relative">
          <summary className="flex h-8 cursor-pointer list-none items-center rounded-md border border-input px-2 text-xs font-medium marker:content-none">
            <MoreHorizontal className="size-4" aria-hidden />
            <span className="sr-only">More actions</span>
          </summary>
          <div className="absolute right-0 z-10 mt-1 min-w-[11rem] rounded-md border bg-popover p-1 shadow-md">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => {
                setRenameTarget(project);
                setRenameTitle(project.title);
              }}
            >
              <Pencil className="size-3.5" aria-hidden />
              Rename
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
              disabled={loading}
              onClick={() => void handleDuplicate(project)}
            >
              <Copy className="size-3.5" aria-hidden />
              Duplicate
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => {
                setNotesTarget(project);
                setNotesDraft(project.notes ?? "");
              }}
            >
              <StickyNote className="size-3.5" aria-hidden />
              Notes
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
              disabled={loading}
              onClick={() => void handleSaveAsTemplate(project)}
            >
              <LayoutTemplate className="size-3.5" aria-hidden />
              Save as template
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => void handleToggleArchive(project)}
            >
              {project.isArchived ? (
                <>
                  <ArchiveRestore className="size-3.5" aria-hidden />
                  Unarchive
                </>
              ) : (
                <>
                  <Archive className="size-3.5" aria-hidden />
                  Archive
                </>
              )}
            </button>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm text-destructive hover:bg-destructive/10"
              onClick={() => setPendingDelete(project)}
            >
              <Trash2 className="size-3.5" aria-hidden />
              Delete
            </button>
          </div>
        </details>
      </div>
    );
  }

  const activeCount = projects.filter((p) => !p.isArchived).length;

  if (activeCount === 0 && libraryView !== "archived") {
    const hasArchived = projects.some((p) => p.isArchived);
    if (!hasArchived) {
      return (
        <div className={embedded ? undefined : "mt-10"}>
          <EmptyState
            icon={BookOpen}
            title="Create your first ebook"
            description="Generate a custom AI outline or start from a template. Star, archive, and organize projects as your library grows."
            action={{ label: "Generate with AI", href: "/ebooks/new" }}
            secondaryAction={{
              label: "Browse Templates",
              href: "/templates",
            }}
          />
        </div>
      );
    }
  }

  return (
    <section
      className={embedded ? undefined : "mt-10"}
      aria-labelledby={embedded ? undefined : "library-heading"}
    >
      {!embedded ? (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="library-heading"
              className="text-2xl font-semibold tracking-tight"
            >
              Your projects
            </h2>
            <p className="mt-1 text-muted-foreground">
              Search, filter by status, star favorites, and archive finished work.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="lg" asChild>
              <Link href="/ebooks/new">
                <Sparkles aria-hidden />
                Generate with AI
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/templates">
                <LayoutTemplate aria-hidden />
                Templates
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex flex-wrap justify-end gap-2">
          <Button size="sm" variant="outline" asChild>
            <Link href="/templates">
              <LayoutTemplate aria-hidden />
              Templates
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/ebooks/new">
              <Sparkles aria-hidden />
              Generate with AI
            </Link>
          </Button>
        </div>
      )}

      {actionError ? (
        <p className="mb-4 text-sm text-destructive" role="alert">
          {actionError}
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {(
          [
            { value: "active", label: "Active" },
            { value: "starred", label: "Starred" },
            { value: "archived", label: "Archived" },
          ] as const
        ).map((tab) => (
          <Button
            key={tab.value}
            type="button"
            size="sm"
            variant={libraryView === tab.value ? "default" : "outline"}
            onClick={() => setLibraryView(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="Search title, niche, goal, or notes…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-10"
            aria-label="Search projects"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant={workflowFilter === "all" ? "default" : "outline"}
            onClick={() => setWorkflowFilter("all")}
          >
            All statuses
          </Button>
          {WORKFLOW_STATUS_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={workflowFilter === option.value ? "default" : "outline"}
              onClick={() => setWorkflowFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <BulkActionsBar
        selectedCount={selectedIds.size}
        busy={bulkBusy}
        onClear={() => setSelectedIds(new Set())}
        onAction={(action) => void handleBulkAction(action)}
      />

      {filtered.length === 0 ? (
        <Card className="shadow-premium">
          <CardHeader>
            <CardTitle className="text-lg">No matches</CardTitle>
            <CardDescription>
              Try a different search term, status, or library tab.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSearch("");
                setWorkflowFilter("all");
                setLibraryView("active");
              }}
            >
              Clear filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-xl border bg-card shadow-premium lg:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="w-10 px-2 py-3" aria-label="Select" />
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Topic / niche</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Progress</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((project) => (
                  <tr key={project.id} className="align-top">
                    <td className="px-2 py-4">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-input"
                        checked={selectedIds.has(project.id)}
                        aria-label={`Select ${project.title}`}
                        onChange={() => toggleSelected(project.id)}
                      />
                    </td>
                    <td className="px-4 py-4 font-medium">
                      <div className="flex items-start gap-3">
                        {project.isStarred ? (
                          <Star
                            className="mt-0.5 size-4 shrink-0 fill-amber-400 text-amber-500"
                            aria-label="Starred"
                          />
                        ) : null}
                        {project.coverImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={project.coverImageUrl}
                            alt=""
                            className="size-12 shrink-0 rounded-md border object-cover object-top"
                          />
                        ) : null}
                        <div>
                          <span>{project.title}</span>
                          {project.notes ? (
                            <p className="mt-1 line-clamp-1 text-xs font-normal text-muted-foreground">
                              {project.notes}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[200px] px-4 py-4 text-muted-foreground">
                      <p className="line-clamp-2">{project.goal}</p>
                      <p className="mt-1 text-xs">
                        <span className="font-medium text-foreground">Niche: </span>
                        {project.audience}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <ProjectStatusBadge status={project.workflowStatus} />
                    </td>
                    <td className="px-4 py-4">
                      <ProjectProgressBadge status={project.progressStatus} />
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {project.generatedCount}/{project.chapterCount} chapters
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-muted-foreground">
                      {formatDate(project.lastUpdatedAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end">
                        <ProjectRowActions project={project} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="grid gap-4 lg:hidden">
            {filtered.map((project) => (
              <li key={project.id}>
                <Card className="overflow-hidden shadow-premium">
                  {project.coverImageUrl ? (
                    <div className="border-b border-border/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={project.coverImageUrl}
                        alt=""
                        className="aspect-[1024/1792] max-h-36 w-full object-cover object-top"
                      />
                    </div>
                  ) : null}
                  <CardHeader className="gap-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <CardTitle className="text-lg leading-snug">
                        {project.isStarred ? (
                          <Star
                            className="mr-1 inline size-4 fill-amber-400 text-amber-500"
                            aria-hidden
                          />
                        ) : null}
                        {project.title}
                      </CardTitle>
                      <ProjectStatusBadge status={project.workflowStatus} />
                    </div>
                    <CardDescription className="space-y-1 text-sm">
                      <p className="line-clamp-2">{project.goal}</p>
                      <ProjectProgressBadge status={project.progressStatus} />
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="border-t bg-muted/30">
                    <ProjectRowActions project={project} />
                  </CardFooter>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setPendingDelete(null);
            setActionError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              This permanently removes{" "}
              <span className="font-medium text-foreground">
                {pendingDelete?.title}
              </span>{" "}
              and all of its chapters. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => {
                setPendingDelete(null);
                setActionError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void confirmDelete()}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Deleting…
                </>
              ) : (
                "Delete project"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameTarget !== null} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename project</DialogTitle>
          </DialogHeader>
          <Input
            value={renameTitle}
            onChange={(e) => setRenameTitle(e.target.value)}
            aria-label="Project title"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!renameTitle.trim() || busyId === renameTarget?.id}
              onClick={() => void handleSaveRename()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={notesTarget !== null} onOpenChange={(o) => !o && setNotesTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Project notes</DialogTitle>
            <DialogDescription>
              Private notes for {notesTarget?.title}. Search includes note text.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={notesDraft}
            onChange={(e) => setNotesDraft(e.target.value)}
            rows={6}
            placeholder="Ideas, publishing plans, revision reminders…"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNotesTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={busyId === notesTarget?.id}
              onClick={() => void handleSaveNotes()}
            >
              Save notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
