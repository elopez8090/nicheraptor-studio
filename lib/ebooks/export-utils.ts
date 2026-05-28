import { NextResponse } from "next/server";
import { buildManuscript } from "@/lib/ebooks/build-manuscript";
import type { ManuscriptDocument } from "@/lib/ebooks/build-manuscript";
import { fetchManuscriptPrintOptionsForProject } from "@/lib/ebooks/fetch-project-export-settings";
import { normalizeExportPresetId } from "@/lib/ebooks/export-presets";
import { slugifyExportFilename } from "@/lib/ebooks/export-filename";
import { fetchEbookWithChapters } from "@/lib/ebooks/fetch-ebook-with-chapters";
import type { ManuscriptPrintOptions } from "@/lib/ebooks/workspace-settings-types";

export type ExportRequestBody = {
  projectId?: string;
  printOptions?: Partial<ManuscriptPrintOptions>;
};

export { slugifyExportFilename };

export type ResolvedExportManuscript =
  | {
      ok: true;
      manuscript: ManuscriptDocument;
      filenameBase: string;
      printOptions: ManuscriptPrintOptions;
    }
  | { ok: false; response: NextResponse };

export async function resolveExportManuscript(
  request: Request,
): Promise<ResolvedExportManuscript> {
  let body: ExportRequestBody | null;

  try {
    body = (await request.json()) as ExportRequestBody | null;
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      ),
    };
  }

  const projectId = body?.projectId;

  if (!projectId || typeof projectId !== "string") {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Missing or invalid projectId." },
        { status: 400 },
      ),
    };
  }

  const ebook = await fetchEbookWithChapters(projectId);

  if (!ebook) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Ebook not found or has no chapters." },
        { status: 404 },
      ),
    };
  }

  const manuscript = buildManuscript(ebook, { generatedChaptersOnly: true });

  if (manuscript.chapters.length === 0) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "No generated chapters to export yet." },
        { status: 400 },
      ),
    };
  }

  const userPrintDefaults = await fetchManuscriptPrintOptionsForProject(projectId);
  const requestPrint = body?.printOptions;
  const printOptions: ManuscriptPrintOptions = {
    authorName:
      typeof requestPrint?.authorName === "string"
        ? requestPrint.authorName
        : userPrintDefaults.authorName,
    includeCover:
      typeof requestPrint?.includeCover === "boolean"
        ? requestPrint.includeCover
        : userPrintDefaults.includeCover,
    includeToc:
      typeof requestPrint?.includeToc === "boolean"
        ? requestPrint.includeToc
        : userPrintDefaults.includeToc,
    includeDisclaimer:
      typeof requestPrint?.includeDisclaimer === "boolean"
        ? requestPrint.includeDisclaimer
        : userPrintDefaults.includeDisclaimer,
    includeHeader:
      typeof requestPrint?.includeHeader === "boolean"
        ? requestPrint.includeHeader
        : userPrintDefaults.includeHeader,
    headerText:
      typeof requestPrint?.headerText === "string"
        ? requestPrint.headerText
        : userPrintDefaults.headerText,
    includeFooter:
      typeof requestPrint?.includeFooter === "boolean"
        ? requestPrint.includeFooter
        : userPrintDefaults.includeFooter,
    footerText:
      typeof requestPrint?.footerText === "string"
        ? requestPrint.footerText
        : userPrintDefaults.footerText,
    showPageNumbers:
      typeof requestPrint?.showPageNumbers === "boolean"
        ? requestPrint.showPageNumbers
        : userPrintDefaults.showPageNumbers,
    showEbookTitleInHeader:
      typeof requestPrint?.showEbookTitleInHeader === "boolean"
        ? requestPrint.showEbookTitleInHeader
        : userPrintDefaults.showEbookTitleInHeader,
    showAuthorNameInFooter:
      typeof requestPrint?.showAuthorNameInFooter === "boolean"
        ? requestPrint.showAuthorNameInFooter
        : userPrintDefaults.showAuthorNameInFooter,
    exportPreset: normalizeExportPresetId(
      requestPrint?.exportPreset ?? userPrintDefaults.exportPreset,
      userPrintDefaults.exportPreset,
    ),
  };

  return {
    ok: true,
    manuscript,
    filenameBase: slugifyExportFilename(manuscript.title),
    printOptions,
  };
}

export function attachmentResponse(
  buffer: Buffer | Uint8Array,
  contentType: string,
  filename: string,
): Response {
  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
