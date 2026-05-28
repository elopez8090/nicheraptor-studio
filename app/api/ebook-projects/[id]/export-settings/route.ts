import { NextResponse } from "next/server";

import {
  fetchManuscriptPrintOptionsForProject,
  saveProjectExportSettings,
  type ProjectExportSettings,
} from "@/lib/ebooks/fetch-project-export-settings";
import { isExportPresetId } from "@/lib/ebooks/workspace-settings-types";
import type { ManuscriptPrintOptions } from "@/lib/ebooks/workspace-settings-types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseBody(body: unknown): ProjectExportSettings | null {
  if (!body || typeof body !== "object") {
    return null;
  }
  const input = body as Partial<ManuscriptPrintOptions>;
  const settings: ProjectExportSettings = {};

  if (typeof input.authorName === "string") {
    settings.authorName = input.authorName;
  }
  if (typeof input.includeCover === "boolean") {
    settings.includeCover = input.includeCover;
  }
  if (typeof input.includeToc === "boolean") {
    settings.includeToc = input.includeToc;
  }
  if (typeof input.includeDisclaimer === "boolean") {
    settings.includeDisclaimer = input.includeDisclaimer;
  }
  if (typeof input.includeHeader === "boolean") {
    settings.includeHeader = input.includeHeader;
  }
  if (typeof input.headerText === "string") {
    settings.headerText = input.headerText;
  }
  if (typeof input.includeFooter === "boolean") {
    settings.includeFooter = input.includeFooter;
  }
  if (typeof input.footerText === "string") {
    settings.footerText = input.footerText;
  }
  if (typeof input.showPageNumbers === "boolean") {
    settings.showPageNumbers = input.showPageNumbers;
  }
  if (typeof input.showEbookTitleInHeader === "boolean") {
    settings.showEbookTitleInHeader = input.showEbookTitleInHeader;
  }
  if (typeof input.showAuthorNameInFooter === "boolean") {
    settings.showAuthorNameInFooter = input.showAuthorNameInFooter;
  }
  if (input.exportPreset !== undefined) {
    if (!isExportPresetId(input.exportPreset)) {
      return null;
    }
    settings.exportPreset = input.exportPreset;
  }

  return Object.keys(settings).length > 0 ? settings : null;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id?.trim()) {
    return NextResponse.json({ error: "Project id is required." }, { status: 400 });
  }

  const printOptions = await fetchManuscriptPrintOptionsForProject(id);
  return NextResponse.json(printOptions);
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id?.trim()) {
    return NextResponse.json({ error: "Project id is required." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const settings = parseBody(body);
  if (!settings) {
    return NextResponse.json({ error: "No valid export settings." }, { status: 400 });
  }

  const result = await saveProjectExportSettings(id, settings);
  if (!result.ok) {
    return NextResponse.json(
      { error: "Failed to save export settings.", details: result.error },
      { status: 500 },
    );
  }

  const printOptions = await fetchManuscriptPrintOptionsForProject(id);
  return NextResponse.json(printOptions);
}
