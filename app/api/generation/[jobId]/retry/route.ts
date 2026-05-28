import { NextResponse } from "next/server";

import {
  getGenerationJobById,
  startGenerationJob,
} from "@/lib/generation/jobs-repository";
import { toGenerationJobPublicView } from "@/lib/generation/types";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { jobId } = await context.params;
  const id = jobId?.trim();

  if (!id) {
    return NextResponse.json({ error: "jobId is required." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const job = await getGenerationJobById(supabase, id);
  if (!job || job.user_id !== user.id) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }

  if (job.status !== "failed" && job.status !== "cancelled") {
    return NextResponse.json(
      { error: "Only failed or cancelled jobs can be retried." },
      { status: 400 },
    );
  }

  const started = await startGenerationJob(supabase, {
    projectId: job.project_id,
    userId: user.id,
    quality: job.quality,
    chapterPlan: job.chapter_plan,
  });

  if (!started.ok) {
    if (started.reason === "already_running") {
      return NextResponse.json(
        { error: "A generation job is already running for this ebook." },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { error: "Could not restart generation job.", details: started.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    job: toGenerationJobPublicView(started.job),
  });
}

