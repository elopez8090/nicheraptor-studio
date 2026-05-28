import { NextResponse } from "next/server";

import { isAiQualityTier, type AiQualityTier } from "@/lib/ebooks/ai-quality-settings";
import {
  getActiveGenerationJobForProject,
  isProjectGenerationCancelRequested,
  markGenerationJobChapterCompleted,
  markGenerationJobFailed,
} from "@/lib/generation/jobs-repository";
import {
  EBOOK_LENGTH_SETTINGS_DB_SELECT,
  ebookLengthSettingsFromDbRow,
} from "@/lib/ebooks/ebook-length-settings";
import type { HumanizationOptions, HumanScore } from "@/lib/ai/humanization/config";
import type { WritingStyle } from "@/lib/ai/styles/writing-styles";
import { fetchLibraryFrameworkContent } from "@/lib/content-library/fetch-content-library";
import { runChapterGeneration } from "@/lib/ebooks/run-chapter-generation";
import { verifyEbookProjectAccess } from "@/lib/ebooks/verify-ebook-project-access";
import { createClient } from "@/lib/supabase/server";

type GenerateChapterBody = {
  projectId?: string;
  chapterId?: string;
  chapterTitle?: string;
  chapterSummary?: string;
  chapterNumber?: number;
  totalChapters?: number;
  ebookTitle?: string;
  audience?: string;
  goal?: string;
  quality?: unknown;
  previousChapterId?: string;
  writingStyle?: WritingStyle;
  humanScore?: HumanScore;
  humanizationOptions?: Partial<HumanizationOptions> | null;
  /** When true, allows generation even if chapter already has content. */
  regenerate?: boolean;
  libraryFrameworkId?: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(request: Request) {
  let trackedProjectId: string | undefined;
  let trackedChapterId: string | undefined;

  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error: missing OPENAI_API_KEY." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as GenerateChapterBody;
    const {
      projectId,
      chapterId,
      chapterTitle,
      chapterSummary,
      chapterNumber,
      totalChapters,
      ebookTitle,
      audience,
      goal,
      previousChapterId,
      writingStyle,
      humanScore,
      humanizationOptions,
      regenerate,
      libraryFrameworkId,
    } = body ?? {};

    const quality: AiQualityTier = isAiQualityTier(body.quality)
      ? body.quality
      : "balanced";

    if (
      !isNonEmptyString(projectId) ||
      !isNonEmptyString(chapterId) ||
      !isNonEmptyString(chapterTitle) ||
      !isNonEmptyString(chapterSummary) ||
      !isNonEmptyString(ebookTitle) ||
      !isNonEmptyString(audience) ||
      !isNonEmptyString(goal) ||
      typeof chapterNumber !== "number" ||
      typeof totalChapters !== "number"
    ) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: projectId, chapterId, chapterTitle, chapterSummary, chapterNumber, totalChapters, ebookTitle, audience, and goal are required.",
        },
        { status: 400 },
      );
    }

    trackedProjectId = projectId;
    trackedChapterId = chapterId;

    const supabase = await createClient();
    const access = await verifyEbookProjectAccess(supabase, projectId);
    if (!access.ok) {
      return NextResponse.json({ error: "Unauthorized." }, { status: access.status });
    }

    if (await isProjectGenerationCancelRequested(supabase, projectId)) {
      return NextResponse.json(
        { error: "Generation was cancelled.", cancelled: true },
        { status: 409 },
      );
    }

    const { data: projectRow } = await supabase
      .from("ebook_projects")
      .select(EBOOK_LENGTH_SETTINGS_DB_SELECT)
      .eq("id", projectId)
      .maybeSingle();
    const lengthSettings = ebookLengthSettingsFromDbRow(projectRow);

    let writingFrameworkBlock: string | undefined;
    if (isNonEmptyString(libraryFrameworkId)) {
      const frameworkContent = await fetchLibraryFrameworkContent(
        libraryFrameworkId,
        access.userId,
      );
      if (frameworkContent) {
        writingFrameworkBlock = frameworkContent;
      }
    }

    let previousChapterContent: string | null = null;
    let previousChapterTitle: string | undefined;

    if (isNonEmptyString(previousChapterId)) {
      const { data: prev } = await supabase
        .from("ebook_chapters")
        .select("title, content")
        .eq("id", previousChapterId)
        .eq("project_id", projectId)
        .maybeSingle();
      if (prev) {
        previousChapterContent = prev.content;
        previousChapterTitle = prev.title;
      }
    }

    const result = await runChapterGeneration({
      apiKey,
      supabase,
      projectId,
      chapterId,
      chapterTitle,
      quality,
      previousChapterContent,
      context: {
        ebookTitle,
        audience,
        goal,
        chapterNumber,
        totalChapters,
        chapterTitle,
        chapterSummary,
        previousChapterTitle,
        lengthSettings,
        writingStyle,
        humanScore,
        humanizationOptions: humanizationOptions ?? null,
        writingFrameworkBlock,
      },
    });

    const job = await getActiveGenerationJobForProject(supabase, projectId);
    const tokensDelta = result.usage?.totalTokens ?? 0;
    if (job?.status === "running" || job?.status === "pending") {
      const planIndex = job.chapter_plan.findIndex(
        (item) => item.id === chapterId,
      );
      const stepIndex =
        planIndex >= 0 ? planIndex : Math.max(0, job.current_step - 1);
      await markGenerationJobChapterCompleted(
        supabase,
        job,
        stepIndex,
        tokensDelta,
      );
    }

    return NextResponse.json({
      content: result.content,
      usage: result.usage,
      regenerated: Boolean(regenerate),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";

    if (trackedProjectId && trackedChapterId) {
      try {
        const supabase = await createClient();
        const job = await getActiveGenerationJobForProject(
          supabase,
          trackedProjectId,
        );
        if (job?.status === "running" || job?.status === "pending") {
          await markGenerationJobFailed(
            supabase,
            job.id,
            trackedChapterId,
            message,
          );
        }
      } catch {
        // ignore secondary failure
      }
    }

    console.error("Error in /api/generate-chapter:", error);
    return NextResponse.json(
      { error: message },
      { status: 502 },
    );
  }
}
