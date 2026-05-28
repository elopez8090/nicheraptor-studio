import { NextResponse } from "next/server";

import {
  getGenerationJobById,
  markGenerationJobCancelled,
  requestCancelGenerationJob,
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

  await requestCancelGenerationJob(supabase, job.id);
  await markGenerationJobCancelled(supabase, job.id);

  const updated = await getGenerationJobById(supabase, job.id);

  return NextResponse.json({
    ok: true,
    job: updated ? toGenerationJobPublicView(updated) : null,
  });
}

