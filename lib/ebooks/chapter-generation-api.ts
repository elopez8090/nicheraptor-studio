import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import {
  isAiQualityTier,
  type AiQualityTier,
} from "@/lib/ebooks/ai-quality-settings";
import {
  getGenerationJobById,
  getActiveGenerationJobForProject,
  isGenerationCancelRequested,
  isProjectGenerationCancelRequested,
  markGenerationJobChapterCompleted,
  markGenerationJobChapterStarted,
  markGenerationJobFailed,
} from "@/lib/generation/jobs-repository";
import {
  EBOOK_LENGTH_SETTINGS_DB_SELECT,
  ebookLengthSettingsFromDbRow,
} from "@/lib/ebooks/ebook-length-settings";
import { fetchLibraryFrameworkContent } from "@/lib/content-library/fetch-content-library";
import { buildEbookChapterGenerationContext } from "@/lib/context-engine/build-ebook-chapter-context";
import { runChapterGeneration } from "@/lib/ebooks/run-chapter-generation";
import { verifyEbookProjectAccess } from "@/lib/ebooks/verify-ebook-project-access";
import { formatResearchForChapterPrompt } from "@/lib/research/format-research-for-prompt";
import {
  fetchProjectResearchSettings,
  fetchResearchContextForChapter,
} from "@/lib/research/research-db";

export type ChapterGenerationRequestBody = {
  quality?: unknown;
  previousChapterId?: string;
  jobId?: string;
  libraryFrameworkId?: string;
};

export async function handleChapterGenerationRequest(
  request: Request,
  projectId: string,
  chapterId: string,
  options: { regenerate: boolean },
): Promise<NextResponse> {
  let trackedProjectId = projectId;
  let trackedChapterId = chapterId;

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error: missing OPENAI_API_KEY." },
        { status: 500 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as ChapterGenerationRequestBody;
    const quality: AiQualityTier = isAiQualityTier(body.quality)
      ? body.quality
      : "balanced";

    const supabase = await import("@/lib/supabase/server").then((m) =>
      m.createClient(),
    );
    const access = await verifyEbookProjectAccess(supabase, projectId);
    if (!access.ok) {
      return NextResponse.json({ error: "Unauthorized." }, { status: access.status });
    }

    const jobIdFromBody =
      typeof body.jobId === "string" && body.jobId.trim()
        ? body.jobId.trim()
        : undefined;

    if (jobIdFromBody) {
      if (await isGenerationCancelRequested(supabase, jobIdFromBody)) {
        return NextResponse.json(
          { error: "Generation was cancelled.", cancelled: true },
          { status: 409 },
        );
      }
    } else if (await isProjectGenerationCancelRequested(supabase, projectId)) {
      return NextResponse.json(
        { error: "Generation was cancelled.", cancelled: true },
        { status: 409 },
      );
    }

    const [
      { data: project },
      { data: chapter },
      { count, error: countError },
      { data: allChapters },
    ] = await Promise.all([
        supabase
          .from("ebook_projects")
          .select(
            `title, audience, goal, notes, niche, writing_style, human_score, humanization_options, ${EBOOK_LENGTH_SETTINGS_DB_SELECT}`,
          )
          .eq("id", projectId)
          .maybeSingle(),
        supabase
          .from("ebook_chapters")
          .select("id, position, title, summary, status, content")
          .eq("id", chapterId)
          .eq("project_id", projectId)
          .maybeSingle(),
        supabase
          .from("ebook_chapters")
          .select("id", { count: "exact", head: true })
          .eq("project_id", projectId),
        supabase
          .from("ebook_chapters")
          .select("position, title, summary, status")
          .eq("project_id", projectId)
          .order("position", { ascending: true }),
      ]);

    if (countError) {
      return NextResponse.json(
        { error: "Failed to load chapter count.", details: countError.message },
        { status: 500 },
      );
    }

    if (!project || !chapter) {
      return NextResponse.json({ error: "Chapter not found." }, { status: 404 });
    }

    const hasContent = Boolean(chapter.content?.trim());
    if (hasContent && !options.regenerate) {
      return NextResponse.json(
        {
          error:
            "This chapter already has content. Use regenerate to replace it.",
          skipped: true,
        },
        { status: 409 },
      );
    }

    if (!hasContent && options.regenerate) {
      // Allow generate path semantics when empty
    }

    const totalChapters = count ?? 0;
    if (totalChapters === 0) {
      return NextResponse.json(
        { error: "This project has no chapters." },
        { status: 400 },
      );
    }

    let previousChapterContent: string | null = null;
    let previousChapterTitle: string | undefined;

    const previousChapterId =
      typeof body.previousChapterId === "string" &&
      body.previousChapterId.trim()
        ? body.previousChapterId.trim()
        : undefined;

    if (previousChapterId) {
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
    } else if (chapter.position > 1) {
      const { data: prev } = await supabase
        .from("ebook_chapters")
        .select("id, title, content")
        .eq("project_id", projectId)
        .eq("position", chapter.position - 1)
        .maybeSingle();
      if (prev) {
        previousChapterContent = prev.content;
        previousChapterTitle = prev.title;
      }
    }

    const [researchEntries, researchSettings] = await Promise.all([
      fetchResearchContextForChapter(supabase, projectId, chapterId).catch(
        () => [],
      ),
      fetchProjectResearchSettings(supabase, projectId).catch(() => ({
        includeSourceReferences: false,
      })),
    ]);

    const researchNotesBlock = formatResearchForChapterPrompt(researchEntries);
    const lengthSettings = ebookLengthSettingsFromDbRow(project);

    let writingFrameworkBlock: string | undefined;
    const frameworkId =
      typeof body.libraryFrameworkId === "string" && body.libraryFrameworkId.trim()
        ? body.libraryFrameworkId.trim()
        : undefined;
    if (frameworkId) {
      const frameworkContent = await fetchLibraryFrameworkContent(
        frameworkId,
        access.userId,
      );
      if (frameworkContent) {
        writingFrameworkBlock = frameworkContent;
      }
    }

    const activeJob = jobIdFromBody
      ? await getGenerationJobById(supabase, jobIdFromBody)
      : await getActiveGenerationJobForProject(supabase, projectId);

    if (activeJob?.status === "running" || activeJob?.status === "pending") {
      const planIndex = activeJob.chapter_plan.findIndex(
        (item) => item.id === chapter.id,
      );
      const stepIndex = planIndex >= 0 ? planIndex : activeJob.current_step;
      await markGenerationJobChapterStarted(
        supabase,
        activeJob.id,
        {
          id: chapter.id,
          number: chapter.position,
          title: chapter.title,
          regenerate: options.regenerate,
        },
        stepIndex,
        activeJob.total_steps,
      );
    }

    const { data: priorGenerated } = await supabase
      .from("ebook_chapters")
      .select("content")
      .eq("project_id", projectId)
      .lt("position", chapter.position)
      .eq("status", "generated");

    const baseContext = {
      ebookTitle: project.title,
      audience: project.audience,
      goal: project.goal,
      chapterNumber: chapter.position,
      totalChapters,
      chapterTitle: chapter.title,
      chapterSummary: chapter.summary,
      previousChapterTitle,
      researchNotesBlock,
      includeSourceReferences: researchSettings.includeSourceReferences,
      lengthSettings,
      writingStyle: project.writing_style,
      humanScore: project.human_score,
      humanizationOptions:
        project.humanization_options &&
        typeof project.humanization_options === "object"
          ? project.humanization_options
          : null,
      writingFrameworkBlock,
    };

    const enrichedContext = await buildEbookChapterGenerationContext({
      supabase,
      apiKey,
      userId: access.userId,
      projectId,
      chapterId: chapter.id,
      baseContext,
      chapterPosition: chapter.position,
      allChapters: (allChapters ?? []).map((c) => ({
        position: c.position,
        title: c.title,
        summary: c.summary,
        status: c.status,
      })),
      priorChapterContents: (priorGenerated ?? []).map((c) => ({
        content: c.content,
      })),
      projectMeta: {
        title: project.title,
        audience: project.audience,
        goal: project.goal,
        writing_style: project.writing_style,
        human_score: project.human_score,
        notes: project.notes,
        niche: project.niche,
      },
    });

    const result = await runChapterGeneration({
      apiKey,
      supabase,
      projectId,
      chapterId,
      quality,
      chapterTitle: chapter.title,
      previousChapterContent,
      researchEntries,
      includeSourceReferences: researchSettings.includeSourceReferences,
      context: enrichedContext,
    });

    const jobAfter =
      jobIdFromBody && activeJob
        ? activeJob
        : activeJob ?? (await getActiveGenerationJobForProject(supabase, projectId));
    const tokensDelta = result.usage?.totalTokens ?? 0;
    if (
      jobAfter &&
      (jobAfter.status === "running" || jobAfter.status === "pending")
    ) {
      const planIndex = jobAfter.chapter_plan.findIndex(
        (item) => item.id === chapter.id,
      );
      const stepIndex =
        planIndex >= 0 ? planIndex : Math.max(0, jobAfter.current_step - 1);
      const refreshed = await getGenerationJobById(supabase, jobAfter.id);
      if (refreshed) {
        await markGenerationJobChapterCompleted(
          supabase,
          refreshed,
          stepIndex,
          tokensDelta,
        );
      }
    }

    return NextResponse.json({
      content: result.content,
      usage: result.usage,
      chapterTitle: chapter.title,
      chapterNumber: chapter.position,
      regenerated: options.regenerate,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error.";

    try {
      const supabase = await import("@/lib/supabase/server").then((m) =>
        m.createClient(),
      );
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
      // ignore
    }

    console.error("Chapter generation error:", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
