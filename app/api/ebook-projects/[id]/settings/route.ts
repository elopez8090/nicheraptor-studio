import { NextResponse } from "next/server";

import {
  fetchEbookProjectSettings,
  parseEbookProjectSettingsBody,
  saveEbookProjectSettings,
} from "@/lib/ebooks/project-settings";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id?.trim()) {
    return NextResponse.json({ error: "Project id is required." }, { status: 400 });
  }

  const settings = await fetchEbookProjectSettings(id);
  if (!settings) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  return NextResponse.json(settings);
}

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!id?.trim()) {
    return NextResponse.json({ error: "Project id is required." }, { status: 400 });
  }

  const existing = await fetchEbookProjectSettings(id);
  if (!existing) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseEbookProjectSettingsBody(body, existing);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await saveEbookProjectSettings(id, parsed);
  if (!result.ok) {
    return NextResponse.json(
      { error: "Failed to save settings.", details: result.error },
      { status: 500 },
    );
  }

  const updated = await fetchEbookProjectSettings(id);
  return NextResponse.json(updated);
}
