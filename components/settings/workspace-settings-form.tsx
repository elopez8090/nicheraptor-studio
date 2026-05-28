"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EXPORT_PRESET_OPTIONS } from "@/lib/ebooks/export-presets";
import {
  DEFAULT_WORKSPACE_SETTINGS,
  EBOOK_STYLE_OPTIONS,
  EXPORT_FORMAT_OPTIONS,
  WRITING_TONE_OPTIONS,
  type UserWorkspaceSettings,
} from "@/lib/ebooks/workspace-settings-types";

export function WorkspaceSettingsForm() {
  const toast = useToast();
  const [settings, setSettings] = useState<UserWorkspaceSettings>(
    DEFAULT_WORKSPACE_SETTINGS,
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) {
          if (!cancelled) {
            setError("Could not load settings.");
          }
          return;
        }
        const data = (await response.json()) as UserWorkspaceSettings;
        if (!cancelled) {
          setSettings(data);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load settings.");
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
  }, []);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const data = (await response.json()) as UserWorkspaceSettings & {
        error?: string;
      };

      if (!response.ok) {
        const msg = data.error ?? "Failed to save settings.";
        setError(msg);
        toast.error("Settings not saved", msg);
        return;
      }

      setSettings(data);
      setMessage("Settings saved.");
      toast.success("Workspace settings saved");
    } catch {
      setError("Failed to save settings.");
      toast.error("Settings not saved", "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="mt-10 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading settings…
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSave(e)} className="mt-10 space-y-6">
      <Card className="shadow-premium">
        <CardHeader>
          <CardTitle className="text-xl">Writing defaults</CardTitle>
          <CardDescription>
            Pre-fill new ebook briefs and influence AI outline generation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="defaultAuthorName" className="text-sm font-medium">
              Default author name
            </label>
            <Input
              id="defaultAuthorName"
              value={settings.defaultAuthorName}
              onChange={(e) =>
                setSettings((s) => ({ ...s, defaultAuthorName: e.target.value }))
              }
              placeholder="Your pen name or legal name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="defaultAudience" className="text-sm font-medium">
              Default audience
            </label>
            <Input
              id="defaultAudience"
              value={settings.defaultAudience}
              onChange={(e) =>
                setSettings((s) => ({ ...s, defaultAudience: e.target.value }))
              }
              placeholder="Who you usually write for"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="defaultWritingTone" className="text-sm font-medium">
                Default writing tone
              </label>
              <select
                id="defaultWritingTone"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={settings.defaultWritingTone}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    defaultWritingTone: e.target.value as UserWorkspaceSettings["defaultWritingTone"],
                  }))
                }
              >
                {WRITING_TONE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="defaultEbookStyle" className="text-sm font-medium">
                Default ebook style
              </label>
              <select
                id="defaultEbookStyle"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={settings.defaultEbookStyle}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    defaultEbookStyle: e.target.value as UserWorkspaceSettings["defaultEbookStyle"],
                  }))
                }
              >
                {EBOOK_STYLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-premium">
        <CardHeader>
          <CardTitle className="text-xl">Export defaults</CardTitle>
          <CardDescription>
            Default download format and PDF print layout options.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="defaultExportFormat" className="text-sm font-medium">
              Default export format
            </label>
            <select
              id="defaultExportFormat"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:max-w-xs"
              value={settings.defaultExportFormat}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  defaultExportFormat: e.target.value as UserWorkspaceSettings["defaultExportFormat"],
                }))
              }
            >
              {EXPORT_FORMAT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="exportPreset" className="text-sm font-medium">
              Default PDF style preset
            </label>
            <select
              id="exportPreset"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:max-w-md"
              value={settings.exportPreset}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  exportPreset: e.target.value as UserWorkspaceSettings["exportPreset"],
                }))
              }
            >
              {EXPORT_PRESET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Used for new ebooks until you save per-ebook export settings in the editor.
            </p>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">PDF print layout</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.exportIncludeCover}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    exportIncludeCover: e.target.checked,
                  }))
                }
              />
              Include cover page
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.exportIncludeToc}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    exportIncludeToc: e.target.checked,
                  }))
                }
              />
              Include Table of Contents
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.exportIncludeDisclaimer}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    exportIncludeDisclaimer: e.target.checked,
                  }))
                }
              />
              Include copyright / disclaimer page
            </label>
          </fieldset>

          <fieldset className="space-y-3 rounded-md border border-border/70 p-4">
            <legend className="px-1 text-sm font-medium">Chapter header &amp; footer</legend>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.exportIncludeHeader}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    exportIncludeHeader: e.target.checked,
                  }))
                }
              />
              Include header on chapter pages
            </label>
            <div className="space-y-2">
              <label htmlFor="exportHeaderText" className="text-sm font-medium">
                Header text
              </label>
              <Input
                id="exportHeaderText"
                value={settings.exportHeaderText}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, exportHeaderText: e.target.value }))
                }
                placeholder="Optional custom header text"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.exportShowEbookTitleInHeader}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    exportShowEbookTitleInHeader: e.target.checked,
                  }))
                }
              />
              Show ebook title in header
            </label>

            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.exportIncludeFooter}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    exportIncludeFooter: e.target.checked,
                  }))
                }
              />
              Include footer on chapter pages
            </label>
            <div className="space-y-2">
              <label htmlFor="exportFooterText" className="text-sm font-medium">
                Footer text
              </label>
              <Input
                id="exportFooterText"
                value={settings.exportFooterText}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, exportFooterText: e.target.value }))
                }
                placeholder="Optional custom footer text"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.exportShowAuthorNameInFooter}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    exportShowAuthorNameInFooter: e.target.checked,
                  }))
                }
              />
              Show author name in footer
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.exportShowPageNumbers}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    exportShowPageNumbers: e.target.checked,
                  }))
                }
              />
              Show page numbers
            </label>
            <p className="text-xs text-muted-foreground">
              Browser print page numbers can vary depending on your print dialog settings.
            </p>
          </fieldset>
        </CardContent>
      </Card>

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
  );
}
