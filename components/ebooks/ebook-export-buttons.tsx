"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, FileDown } from "lucide-react";
import { useToast } from "@/components/providers/toast-provider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { slugifyExportFilename } from "@/lib/ebooks/export-filename";
import type { DefaultExportFormat } from "@/lib/ebooks/workspace-settings-types";

type ExportFormat = DefaultExportFormat;

type EbookExportButtonsProps = {
  projectId: string;
  ebookTitle: string;
};

const EXPORT_ROUTES: Record<ExportFormat, string> = {
  pdf: "/api/export-pdf",
  docx: "/api/export-docx",
  markdown: "/api/export-markdown",
};

const EXPORT_EXTENSIONS: Record<ExportFormat, string> = {
  pdf: "pdf",
  docx: "docx",
  markdown: "md",
};

export function EbookExportButtons({
  projectId,
  ebookTitle,
}: EbookExportButtonsProps) {
  const toast = useToast();
  const [activeFormat, setActiveFormat] = useState<ExportFormat | null>(null);
  const [preferredFormat, setPreferredFormat] = useState<ExportFormat>("pdf");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as { defaultExportFormat?: ExportFormat };
        if (data.defaultExportFormat) {
          setPreferredFormat(data.defaultExportFormat);
        }
      } catch {
        /* ignore */
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleExport(format: ExportFormat) {
    if (activeFormat) return;
    setActiveFormat(format);

    try {
      const response = await fetch(EXPORT_ROUTES[format], {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const message = await response.text().catch(() => "");
        let detail = message;
        try {
          const parsed = JSON.parse(message) as { error?: string };
          if (parsed.error) detail = parsed.error;
        } catch {
          /* plain text */
        }
        toast.error(
          "Export failed",
          detail || `Could not export as ${format.toUpperCase()}.`,
        );
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const filename = `${slugifyExportFilename(ebookTitle)}.${EXPORT_EXTENSIONS[format]}`;

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success("Export ready", `${filename} downloaded.`);
    } catch {
      toast.error("Export failed", "Something went wrong while preparing your file.");
    } finally {
      setActiveFormat(null);
    }
  }

  const labels: Record<ExportFormat, string> = {
    pdf: activeFormat === "pdf" ? "Exporting PDF…" : "Export PDF",
    docx: activeFormat === "docx" ? "Exporting DOCX…" : "Export DOCX",
    markdown:
      activeFormat === "markdown" ? "Exporting Markdown…" : "Export Markdown",
  };

  const formatOrder: ExportFormat[] = [
    preferredFormat,
    ...(["pdf", "docx", "markdown"] as const).filter((f) => f !== preferredFormat),
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      role="group"
      aria-label="Export manuscript"
    >
      <Button variant="outline" size="default" className="w-full justify-start sm:w-auto" asChild>
        <Link href={`/ebooks/${projectId}/print`} target="_blank" rel="noopener noreferrer">
          <ExternalLink aria-hidden />
          Preview PDF
        </Link>
      </Button>
      {formatOrder.map((format) => (
        <Button
          key={format}
          variant={format === preferredFormat ? "default" : "outline"}
          size="default"
          className="w-full justify-start sm:w-auto"
          onClick={() => handleExport(format)}
          disabled={activeFormat !== null}
        >
          {activeFormat === format ? (
            <Spinner className="size-4" />
          ) : (
            <FileDown aria-hidden />
          )}
          {labels[format]}
        </Button>
      ))}
    </div>
  );
}
