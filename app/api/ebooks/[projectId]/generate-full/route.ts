import { NextResponse } from "next/server";

import {
  getAiQualityConfig,
  isAiQualityTier,
  type AiQualityTier,
} from "@/lib/ebooks/ai-quality-settings";
import { verifyEbookProjectAccess } from "@/lib/ebooks/verify-ebook-project-access";
import { buildGenerationChapterPlan } from "@/lib/generation/build-chapter-plan";
import {
  getActiveGenerationJobForProject,
  getLatestGenerationJobForProject,
  markGenerationJobCancelled,
  requestCancelGenerationJob,
  startGenerationJob,
  markGenerationJobCompleted,
} from "@/lib/generation/jobs-repository";
import { toGenerationJobPublicView } from "@/lib/generation/types";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ projectId: string }> };

async function resolveProjectId(context: RouteContext): Promise<string> {
  const { projectId } = await context.params;
  return projectId.trim();
}

/** @deprecated Prefer GET `/api/generation/jobs?projectId=` */
export async function GET(_request: Request, context: RouteContext) {
  const projectId = await resolveProjectId(context);
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const access = await verifyEbookProjectAccess(supabase, projectId);
  if (!access.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: access.status });
  }

  const [activeJob, latestJob, chaptersResult, projectResult] = await Promise.all([
    getActiveGenerationJobForProject(supabase, projectId),
    getLatestGenerationJobForProject(supabase, projectId),
    supabase
      .from("ebook_chapters")
      .select("id, position, title, summary, status, content")
      .eq("project_id", projectId)
      .order("position", { ascending: true }),
    supabase
      .from("ebook_projects")
      .select("title, audience, goal")
      .eq("id", projectId)
      .maybeSingle(),
  ]);

  if (chaptersResult.error) {
    return NextResponse.json(
      { error: "Failed to load chapters.", details: chaptersResult.error.message },
      { status: 500 },
    );
  }

  const job = activeJob ?? latestJob;

  return NextResponse.json({
    job: job ? toGenerationJobPublicView(job) : { status: "idle" as const },
    project: projectResult.data ?? null,
    chapters: (chaptersResult.data ?? []).map((row) => ({
      id: row.id,
      number: row.position,
      title: row.title,
      summary: row.summary,
      status: row.status === "generated" ? "generated" : "not_generated",
      hasContent: Boolean(row.content?.trim()),
    })),
  });
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const projectId = await resolveProjectId(context);
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required." }, { status: 400 });
    }

    const body = (await request.json()) as {
      quality?: unknown;
      totalChapters?: number;
      regenerateExistingChapters?: boolean;
    };
    const quality: AiQualityTier = isAiQualityTier(body.quality)
      ? body.quality
      : "balanced";

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

    let chapterPlan = buildGenerationChapterPlan({
      chapters,
      regenerateExistingChapters: Boolean(body.regenerateExistingChapters),
    });

    if (
      typeof body.totalChapters === "number" &&
      body.totalChapters > 0 &&
      body.totalChapters < chapterPlan.length
    ) {
      chapterPlan = chapterPlan.slice(0, body.totalChapters);
    }

    if (chapterPlan.length === 0) {
      return NextResponse.json(
        { error: "This project has no chapters to generate." },
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

    return NextResponse.json({
      job: toGenerationJobPublicView(started.job),
      quality: getAiQualityConfig(quality).label,
    });
  } catch (error) {
    console.error("POST generate-full:", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const projectId = await resolveProjectId(context);
    const body = (await request.json()) as {
      action?: string;
      tokensUsed?: number;
    };

    if (!projectId) {
      return NextResponse.json({ error: "projectId is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const access = await verifyEbookProjectAccess(supabase, projectId);
    if (!access.ok) {
      return NextResponse.json({ error: "Unauthorized." }, { status: access.status });
    }

    if (body.action === "complete") {
      const job =
        (await getActiveGenerationJobForProject(supabase, projectId)) ??
        (await getLatestGenerationJobForProject(supabase, projectId));
      if (job) {
        await markGenerationJobCompleted(
          supabase,
          job.id,
          job.total_steps,
          typeof body.tokensUsed === "number" ? body.tokensUsed : undefined,
        );
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.error("PATCH generate-full:", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const projectId = await resolveProjectId(context);
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const access = await verifyEbookProjectAccess(supabase, projectId);
  if (!access.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: access.status });
  }

  const active = await getActiveGenerationJobForProject(supabase, projectId);
  if (active) {
    await requestCancelGenerationJob(supabase, active.id);
    await markGenerationJobCancelled(supabase, active.id);
  }

  return NextResponse.json({ ok: true });
}
