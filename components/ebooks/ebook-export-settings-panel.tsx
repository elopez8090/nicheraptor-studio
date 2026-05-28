"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EXPORT_PRESET_OPTIONS } from "@/lib/ebooks/export-presets";
import type { ManuscriptPrintOptions } from "@/lib/ebooks/workspace-settings-types";

type EbookExportSettingsPanelProps = {
  projectId: string;
};

export function EbookExportSettingsPanel({ projectId }: EbookExportSettingsPanelProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<ManuscriptPrintOptions | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/ebook-projects/${projectId}/export-settings`);
        if (!response.ok) {
          if (!cancelled) {
            setError("Could not load export settings.");
          }
          return;
        }
        const data = (await response.json()) as ManuscriptPrintOptions;
        if (!cancelled) {
          setSettings(data);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load export settings.");
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

  const persist = useCallback(
    async (next: ManuscriptPrintOptions) => {
      setSaving(true);
      setError(null);
      setSaved(false);
      try {
        const response = await fetch(`/api/ebook-projects/${projectId}/export-settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
        if (!response.ok) {
          setError("Failed to save export settings for this ebook.");
          toast.error("Could not save", "Failed to save export settings for this ebook.");
          return;
        }
        const data = (await response.json()) as ManuscriptPrintOptions;
        setSettings(data);
        setSaved(true);
        toast.success("Export settings saved");
      } catch {
        setError("Failed to save export settings for this ebook.");
        toast.error("Could not save", "Failed to save export settings for this ebook.");
      } finally {
        setSaving(false);
      }
    },
    [projectId, toast],
  );

  const update = (patch: Partial<ManuscriptPrintOptions>) => {
    setSettings((prev) => (prev ? { ...prev, ...patch } : prev));
    setSaved(false);
  };

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden />
        Loading export settings…
      </p>
    );
  }

  if (!settings) {
    return error ? (
      <p className="text-sm text-destructive" role="alert">
        {error}
      </p>
    ) : null;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="exportPreset" className="text-sm font-medium">
          PDF style preset
        </label>
        <select
          id="exportPreset"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={settings.exportPreset}
          onChange={(e) =>
            update({
              exportPreset: e.target.value as ManuscriptPrintOptions["exportPreset"],
            })
          }
        >
          {EXPORT_PRESET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Controls typography, spacing, TOC, blockquotes, and header/footer styling on
          print preview and PDF export.
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">PDF print layout</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.includeCover}
            onChange={(e) => update({ includeCover: e.target.checked })}
          />
          Include cover page
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.includeToc}
            onChange={(e) => update({ includeToc: e.target.checked })}
          />
          Include Table of Contents
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.includeDisclaimer}
            onChange={(e) => update({ includeDisclaimer: e.target.checked })}
          />
          Include copyright / disclaimer page
        </label>
      </fieldset>

      <fieldset className="space-y-2 rounded-md border border-border/70 p-3">
        <legend className="px-1 text-sm font-medium">Chapter header &amp; footer</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.includeHeader}
            onChange={(e) => update({ includeHeader: e.target.checked })}
          />
          Include header
        </label>
        <Input
          value={settings.headerText}
          onChange={(e) => update({ headerText: e.target.value })}
          placeholder="Optional header text"
          aria-label="Header text"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.showEbookTitleInHeader}
            onChange={(e) => update({ showEbookTitleInHeader: e.target.checked })}
          />
          Show ebook title in header
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.includeFooter}
            onChange={(e) => update({ includeFooter: e.target.checked })}
          />
          Include footer
        </label>
        <Input
          value={settings.footerText}
          onChange={(e) => update({ footerText: e.target.value })}
          placeholder="Optional footer text"
          aria-label="Footer text"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.showAuthorNameInFooter}
            onChange={(e) => update({ showAuthorNameInFooter: e.target.checked })}
          />
          Show author in footer
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={settings.showPageNumbers}
            onChange={(e) => update({ showPageNumbers: e.target.checked })}
          />
          Show page numbers
        </label>
      </fieldset>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="text-sm text-emerald-700" role="status">
          Saved for this ebook.
        </p>
      ) : null}

      <Button
        type="button"
        variant="secondary"
        className="w-full"
        disabled={saving}
        onClick={() => void persist(settings)}
      >
        {saving ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Saving…
          </>
        ) : (
          "Save export settings"
        )}
      </Button>
    </div>
  );
}
