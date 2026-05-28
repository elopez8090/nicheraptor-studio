import { NextResponse } from "next/server";

import {
  saveEbookOutlineWithClient,
  type OutlineToSave,
} from "@/lib/ebooks/save-ebook-outline";
import { createClient } from "@/lib/supabase/server";

function isValidOutline(body: unknown): body is OutlineToSave {
  if (!body || typeof body !== "object") {
    return false;
  }
  const outline = body as OutlineToSave;
  if (
    typeof outline.title !== "string" ||
    !outline.title.trim() ||
    typeof outline.audience !== "string" ||
    !outline.audience.trim() ||
    typeof outline.goal !== "string" ||
    !outline.goal.trim() ||
    !Array.isArray(outline.chapters) ||
    outline.chapters.length === 0
  ) {
    return false;
  }
  return outline.chapters.every(
    (chapter) =>
      chapter &&
      typeof chapter.title === "string" &&
      chapter.title.trim() &&
      typeof chapter.summary === "string" &&
      chapter.summary.trim(),
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!isValidOutline(body)) {
      return NextResponse.json(
        { error: "Invalid outline payload." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const result = await saveEbookOutlineWithClient(supabase, body);

    if ("error" in result) {
      const status = result.error.includes("signed in") ? 401 : 500;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Unexpected server error while saving outline." },
      { status: 500 },
    );
  }
}
