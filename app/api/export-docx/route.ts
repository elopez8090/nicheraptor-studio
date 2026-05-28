import { NextResponse } from "next/server";
import { buildManuscriptDocxBuffer } from "@/lib/ebooks/build-manuscript-docx";
import {
  attachmentResponse,
  resolveExportManuscript,
} from "@/lib/ebooks/export-utils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const resolved = await resolveExportManuscript(request);
    if (!resolved.ok) {
      return resolved.response;
    }

    const buffer = await buildManuscriptDocxBuffer(resolved.manuscript);

    return attachmentResponse(
      buffer,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      `${resolved.filenameBase}.docx`,
    );
  } catch (error) {
    console.error("Error in /api/export-docx:", error);
    return NextResponse.json(
      { error: "Failed to generate DOCX." },
      { status: 500 },
    );
  }
}
