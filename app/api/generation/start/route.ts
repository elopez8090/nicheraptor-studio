import { NextResponse } from "next/server";

import {
  getAiQualityConfig,
  isAiQualityTier,
  type AiQualityTier,
} from "@/lib/ebooks/ai-quality-settings";
import { verifyEbookProjectAccess } from "@/lib/ebooks/verify-ebook-project-access";
import { buildGenerationChapterPlan } from "@/lib/generation/build-chapter-plan";
import { startGenerationJob } from "@/lib/generation/jobs-repository";
import { toGenerationJobPublicView } from "@/lib/generation/types";
import { createClient } from "@/lib/supabase/server";

type StartGenerationBody = {
  projectId?: string;
  quality?: unknown;
  regenerateExistingChapters?: boolean;
  chapterIds?: string[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as StartGenerationBody;
    const { searchParams } = new URL(request.url);

    const projectId =
      (typeof body.projectId === "string" ? body.projectId.trim() : "") ||
      searchParams.get("projectId")?.trim() ||
      "";

    if (!projectId) {
      return NextResponse.json(
        { error: "projectId is required." },
        { status: 400 },
      );
    }

    const quality: AiQualityTier = isAiQualityTier(body.quality)
      ? body.quality
      : "balanced";
    const regenerateExistingChapters = Boolean(body.regenerateExistingChapters);
    const chapterIds = Array.isArray(body.chapterIds)
      ? body.chapterIds.filter((id): id is string => typeof id === "string")
      : undefined;

    const supabase = await createClient();
    const access = await verifyEbookProjectAccess(supabase, projectId);
    if (!access.ok) {
      return NextResponse.json({ error: "Unauthorized." }, { status: access.status });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: chapterRows, error: chaptersError } = await supabase
      .from("ebook_chapters")
      .select("id, position, title, status")
      .eq("project_id", projectId)
      .order("position", { ascending: true });

    if (chaptersError) {
      return NextResponse.json(
        { error: "Failed to load chapters.", details: chaptersError.message },
        { status: 500 },
      );
    }

    const chapters = (chapterRows ?? []).map((row) => ({
      id: row.id,
      number: row.position,
      title: row.title,
      status:
        row.status === "generated"
          ? ("generated" as const)
          : ("not_generated" as const),
    }));

    const chapterPlan = buildGenerationChapterPlan({
      chapters,
      chapterIdsFilter: chapterIds,
      regenerateExistingChapters,
    });

    if (chapterPlan.length === 0) {
      return NextResponse.json(
        {
          error: regenerateExistingChapters
            ? "No chapters to generate."
            : "All chapters already have content. Enable regenerate to rewrite them.",
        },
        { status: 400 },
      );
    }

    const started = await startGenerationJob(supabase, {
      projectId,
      userId: user.id,
      quality,
      chapterPlan,
    });

    if (!started.ok) {
      if (started.reason === "already_running") {
        return NextResponse.json(
          { error: "A generation job is already running for this ebook." },
          { status: 409 },
        );
      }
      return NextResponse.json(
        {
          error: "Could not start generation job.",
          details: started.message,
        },
        { status: 500 },
      );
    }

    const estimate = getAiQualityConfig(quality);

    return NextResponse.json({
      job: toGenerationJobPublicView(started.job),
      quality: estimate.label,
    });
  } catch (error) {
    console.error("POST /api/generation/start:", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}

