import { NextResponse } from "next/server";

import {
  getGenerationJobById,
  markGenerationJobCompleted,
} from "@/lib/generation/jobs-repository";
import { toGenerationJobPublicView } from "@/lib/generation/types";
import { createClient } from "@/lib/supabase/server";

type RouteContext = { params: Promise<{ jobId: string }> };

export async function GET(_request: Request, context: RouteContext) {
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

  return NextResponse.json({ job: toGenerationJobPublicView(job) });
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { jobId } = await context.params;
    const id = jobId?.trim();
    if (!id) {
      return NextResponse.json({ error: "jobId is required." }, { status: 400 });
    }

    const body = (await request.json()) as {
      action?: string;
      tokensUsed?: number;
    };

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

    if (body.action === "complete") {
      await markGenerationJobCompleted(
        supabase,
        id,
        job.total_steps,
        typeof body.tokensUsed === "number" ? body.tokensUsed : undefined,
      );
      const updated = await getGenerationJobById(supabase, id);
      return NextResponse.json({
        ok: true,
        job: updated ? toGenerationJobPublicView(updated) : null,
      });
    }

    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/generation/jobs/[jobId]:", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
