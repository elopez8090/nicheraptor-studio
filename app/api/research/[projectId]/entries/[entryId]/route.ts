import { NextResponse } from "next/server";

import { verifyEbookProjectAccess } from "@/lib/ebooks/verify-ebook-project-access";

type RouteContext = {
  params: Promise<{ projectId: string; entryId: string }>;
};

export async function DELETE(_request: Request, context: RouteContext) {
  const { projectId, entryId } = await context.params;

  const supabase = await import("@/lib/supabase/server").then((m) =>
    m.createClient(),
  );
  const access = await verifyEbookProjectAccess(supabase, projectId);
  if (!access.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: access.status });
  }

  const { error } = await supabase
    .from("ebook_research_entries")
    .delete()
    .eq("id", entryId)
    .eq("project_id", projectId);

  if (error) {
    return NextResponse.json(
      { error: error.message || "Failed to delete entry." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
