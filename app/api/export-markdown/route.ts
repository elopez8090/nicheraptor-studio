import { NextResponse } from "next/server";
import { buildManuscriptMarkdown } from "@/lib/ebooks/build-manuscript-markdown";
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

    const markdown = buildManuscriptMarkdown(resolved.manuscript);
    const buffer = Buffer.from(markdown, "utf-8");

    return attachmentResponse(
      buffer,
      "text/markdown; charset=utf-8",
      `${resolved.filenameBase}.md`,
    );
  } catch (error) {
    console.error("Error in /api/export-markdown:", error);
    return NextResponse.json(
      { error: "Failed to generate Markdown." },
      { status: 500 },
    );
  }
}
