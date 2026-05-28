import { NextResponse } from "next/server";

import { isPublishingTemplateKind } from "@/lib/publishing/constants";
import { mapPublishingTemplateRow } from "@/lib/publishing/map-rows";
import { fetchPublishingSnapshot } from "@/lib/publishing/fetch-publishing-snapshot";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const snapshot = await fetchPublishingSnapshot();
  return NextResponse.json({ templates: snapshot.templates });
}

type CreateTemplateBody = {
  name?: unknown;
  templateKind?: unknown;
  platformHint?: unknown;
  body?: unknown;
  metadata?: unknown;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateTemplateBody;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const kindRaw =
      typeof body.templateKind === "string" ? body.templateKind.trim() : "article";
    if (!isPublishingTemplateKind(kindRaw)) {
      return NextResponse.json({ error: "Invalid template kind." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("publishing_templates")
      .insert({
        name,
        template_kind: kindRaw,
        platform_hint:
          typeof body.platformHint === "string" ? body.platformHint.trim() : null,
        body: typeof body.body === "string" ? body.body : "",
        metadata:
          body.metadata && typeof body.metadata === "object" ? body.metadata : {},
      })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to save template." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      template: mapPublishingTemplateRow(data as Record<string, unknown>),
    });
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
}
