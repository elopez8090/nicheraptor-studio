import { NextResponse } from "next/server";

import { updateProjectIncludeSourceReferences } from "@/lib/research/research-db";
import { verifyEbookProjectAccess } from "@/lib/ebooks/verify-ebook-project-access";

type RouteContext = { params: Promise<{ projectId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { projectId } = await context.params;

  const supabase = await import("@/lib/supabase/server").then((m) =>
    m.createClient(),
  );
  const access = await verifyEbookProjectAccess(supabase, projectId);
  if (!access.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: access.status });
  }

  const body = (await request.json().catch(() => ({}))) as {
    includeSourceReferences?: unknown;
  };

  if (typeof body.includeSourceReferences !== "boolean") {
    return NextResponse.json(
      { error: "includeSourceReferences must be a boolean." },
      { status: 400 },
    );
  }

  try {
    await updateProjectIncludeSourceReferences(
      supabase,
      projectId,
      body.includeSourceReferences,
    );
    return NextResponse.json({
      settings: { includeSourceReferences: body.includeSourceReferences },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update settings.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
