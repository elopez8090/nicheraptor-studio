"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  Copy,
  Loader2,
  Trash2,
} from "lucide-react";

import { SettingsCard } from "@/components/layout/settings-card";
import { Button } from "@/components/ui/button";
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
import { HUMAN_SCORE_OPTIONS } from "@/lib/ai/humanization/config";
import { WRITING_STYLE_OPTIONS } from "@/lib/ai/styles/writing-styles";
import {
  CHAPTER_LENGTH_OPTIONS,
  WRITING_DEPTH_OPTIONS,
} from "@/lib/ebooks/ebook-length-settings";
import { EXPORT_PRESET_OPTIONS } from "@/lib/ebooks/export-presets";
import type { EbookProjectSettingsPayload } from "@/lib/ebooks/project-settings";

type EbookProjectSettingsFormProps = {
  projectId: string;
};

export function EbookProjectSettingsForm({ projectId }: EbookProjectSettingsFormProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<EbookProjectSettingsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isArchived, setIsArchived] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/ebook-projects/${projectId}/settings`);
        if (!response.ok) {
          if (!cancelled) {
            setError("Could not load project settings.");
          }
          return;
        }
        const data = (await response.json()) as EbookProjectSettingsPayload;
        if (!cancelled) {
          setSettings(data);
          setIsArchived(data.isArchived);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load project settings.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    void load();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const update = useCallback(
    (patch: Partial<EbookProjectSettingsPayload>) => {
      setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
      setMessage(null);
    },
    [],
  );

  const updateExport = useCallback(
    (patch: Partial<EbookProjectSettingsPayload["export"]>) => {
      setSettings((prev) =>
        prev ? { ...prev, export: { ...prev.export, ...patch } } : prev,
      );
      setMessage(null);
    },
    [],
  );

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!settings) return;

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/ebook-projects/${projectId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = (await response.json()) as EbookProjectSettingsPayload & {
        error?: string;
      };

      if (!response.ok) {
        setError(data.error ?? "Failed to save settings.");
        return;
      }

      setSettings(data);
      setMessage("Settings saved.");
      router.refresh();
    } catch {
      setError("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDuplicate() {
    setActionBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/ebook-projects/${projectId}/duplicate`, {
        method: "POST",
      });
      const data = (await response.json()) as { projectId?: string; error?: string };
      if (!response.ok || !data.projectId) {
        setError(data.error ?? "Could not duplicate project.");
        return;
      }
      router.push(`/ebooks/${data.projectId}/settings`);
      router.refresh();
    } catch {
      setError("Could not duplicate project.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleToggleArchive() {
    setActionBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/ebook-projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: !isArchived }),
      });
      const data = (await response.json()) as { isArchived?: boolean; error?: string };
      if (!response.ok) {
        setError(data.error ?? "Could not update archive status.");
        return;
      }
      setIsArchived(Boolean(data.isArchived));
      setMessage(isArchived ? "Project restored from archive." : "Project archived.");
      router.refresh();
    } catch {
      setError("Could not update archive status.");
    } finally {
      setActionBusy(false);
    }
  }

  async function handleDelete() {
    setActionBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/ebook-projects/${projectId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        setError(data.error ?? "Could not delete project.");
        return;
      }
      setDeleteOpen(false);
      router.push("/projects");
      router.refresh();
    } catch {
      setError("Could not delete project.");
    } finally {
      setActionBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading project settings…
      </div>
    );
  }

  if (!settings) {
    return (
      <p className="text-destructive" role="alert">
        {error ?? "Project settings are unavailable."}
      </p>
    );
  }

  return (
    <>
      <form onSubmit={(e) => void handleSave(e)} className="space-y-6">
        <SettingsCard
          title="Basic info"
          description="Title, audience, and metadata used across the editor and exports."
        >
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input
                id="title"
                value={settings.title}
                onChange={(e) => update({ title: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="subtitle" className="text-sm font-medium">
                Subtitle
              </label>
              <Input
                id="subtitle"
                value={settings.subtitle}
                onChange={(e) => update({ subtitle: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="authorName" className="text-sm font-medium">
                Author name
              </label>
              <Input
                id="authorName"
                value={settings.authorName}
                onChange={(e) => {
                  const authorName = e.target.value;
                  update({ authorName });
                  updateExport({ authorName });
                }}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="niche" className="text-sm font-medium">
                Niche / topic
              </label>
              <Input
                id="niche"
                value={settings.niche}
                onChange={(e) => update({ niche: e.target.value })}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="audience" className="text-sm font-medium">
                Target audience
              </label>
              <Textarea
                id="audience"
                value={settings.audience}
                onChange={(e) => update({ audience: e.target.value })}
                rows={3}
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="goal" className="text-sm font-medium">
                Book goal / outcome
              </label>
              <Textarea
                id="goal"
                value={settings.goal}
                onChange={(e) => update({ goal: e.target.value })}
                rows={3}
                required
              />
            </div>
        </SettingsCard>

        <SettingsCard
          title="Writing settings"
          description="Controls AI tone and chapter generation for this ebook."
        >
            <div className="space-y-2">
              <label htmlFor="writingStyle" className="text-sm font-medium">
                Writing style
              </label>
              <select
                id="writingStyle"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={settings.writingStyle}
                onChange={(e) =>
                  update({
                    writingStyle: e.target
                      .value as EbookProjectSettingsPayload["writingStyle"],
                  })
                }
              >
                {WRITING_STYLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="humanScore" className="text-sm font-medium">
                Humanization level
              </label>
              <select
                id="humanScore"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={settings.humanScore}
                onChange={(e) =>
                  update({
                    humanScore: e.target
                      .value as EbookProjectSettingsPayload["humanScore"],
                  })
                }
              >
                {HUMAN_SCORE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="chapterLength" className="text-sm font-medium">
                Chapter length
              </label>
              <select
                id="chapterLength"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={settings.chapterLength}
                onChange={(e) =>
                  update({
                    chapterLength: e.target
                      .value as EbookProjectSettingsPayload["chapterLength"],
                  })
                }
              >
                {CHAPTER_LENGTH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} ({opt.wordRange})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="writingDepth" className="text-sm font-medium">
                Writing depth
              </label>
              <select
                id="writingDepth"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={settings.writingDepth}
                onChange={(e) =>
                  update({
                    writingDepth: e.target
                      .value as EbookProjectSettingsPayload["writingDepth"],
                  })
                }
              >
                {WRITING_DEPTH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
        </SettingsCard>

        <SettingsCard
          title="Export settings"
          description="PDF print layout and preset for this ebook (overrides workspace defaults)."
          contentClassName="space-y-5 sm:grid-cols-1"
        >
            <div className="space-y-2">
              <label htmlFor="exportPreset" className="text-sm font-medium">
                Export preset
              </label>
              <select
                id="exportPreset"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={settings.export.exportPreset}
                onChange={(e) =>
                  updateExport({
                    exportPreset: e.target
                      .value as EbookProjectSettingsPayload["export"]["exportPreset"],
                  })
                }
              >
                {EXPORT_PRESET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Layout</legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.export.includeCover}
                  onChange={(e) => updateExport({ includeCover: e.target.checked })}
                />
                Include cover
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.export.includeToc}
                  onChange={(e) => updateExport({ includeToc: e.target.checked })}
                />
                Include table of contents
              </label>
            </fieldset>

            <fieldset className="space-y-3 rounded-md border border-border/70 p-3">
              <legend className="px-1 text-sm font-medium">Header &amp; footer</legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.export.includeHeader}
                  onChange={(e) => updateExport({ includeHeader: e.target.checked })}
                />
                Include header
              </label>
              <Input
                value={settings.export.headerText}
                onChange={(e) => updateExport({ headerText: e.target.value })}
                placeholder="Header text (optional)"
                aria-label="Header text"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.export.includeFooter}
                  onChange={(e) => updateExport({ includeFooter: e.target.checked })}
                />
                Include footer
              </label>
              <Input
                value={settings.export.footerText}
                onChange={(e) => updateExport({ footerText: e.target.value })}
                placeholder="Footer text (optional)"
                aria-label="Footer text"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settings.export.showPageNumbers}
                  onChange={(e) => updateExport({ showPageNumbers: e.target.checked })}
                />
                Show page numbers
              </label>
            </fieldset>
        </SettingsCard>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm text-emerald-700" role="status">
            {message}
          </p>
        ) : null}

        <Button type="submit" size="lg" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            "Save settings"
          )}
        </Button>
      </form>

      <SettingsCard
        title="Project actions"
        description="Duplicate, archive, or permanently delete this ebook."
        contentClassName="flex flex-wrap gap-3 sm:grid-cols-1"
      >
          <Button
            type="button"
            variant="outline"
            disabled={actionBusy}
            onClick={() => void handleDuplicate()}
          >
            <Copy className="size-4" aria-hidden />
            Duplicate project
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={actionBusy}
            onClick={() => void handleToggleArchive()}
          >
            {isArchived ? (
              <>
                <ArchiveRestore className="size-4" aria-hidden />
                Unarchive project
              </>
            ) : (
              <>
                <Archive className="size-4" aria-hidden />
                Archive project
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={actionBusy}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" aria-hidden />
            Delete project
          </Button>
      </SettingsCard>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete project?</DialogTitle>
            <DialogDescription>
              This permanently removes{" "}
              <span className="font-medium text-foreground">{settings.title}</span> and all
              chapters. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={actionBusy}
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={actionBusy}
              onClick={() => void handleDelete()}
            >
              {actionBusy ? (
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
    </>
  );
}
