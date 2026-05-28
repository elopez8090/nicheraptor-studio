import { NextResponse } from "next/server";

import { verifyEbookProjectAccess } from "@/lib/ebooks/verify-ebook-project-access";
import {
  getActiveGenerationJobForProject,
  getLatestGenerationJobForProject,
  markGenerationJobCancelled,
  markGenerationJobCompleted,
  requestCancelGenerationJob,
} from "@/lib/generation/jobs-repository";
import { createClient } from "@/lib/supabase/server";

export { GET, POST } from "@/app/api/generation/jobs/route";

/** Legacy body shape: `{ projectId, action, tokensUsed }` */
export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    projectId?: string;
    action?: string;
    tokensUsed?: number;
  };
  const projectId =
    typeof body.projectId === "string" ? body.projectId.trim() : "";

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
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId")?.trim();
  if (!projectId) {
    return NextResponse.json(
      { error: "projectId query parameter is required." },
      { status: 400 },
    );
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
