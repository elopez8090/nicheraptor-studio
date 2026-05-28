import { NextResponse } from "next/server";

import { persistEbookCover } from "@/lib/ebooks/persist-ebook-cover";
import { verifyEbookProjectAccess } from "@/lib/ebooks/verify-ebook-project-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type GenerateCoverBody = {
  projectId?: string;
  coverTitle?: string;
  subtitle?: string;
  stylePrompt?: string;
  audience?: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function buildCoverImagePrompt(fields: {
  coverTitle: string;
  subtitle: string;
  stylePrompt: string;
  audience: string;
}) {
  const parts = [
    "Professional ebook cover design, front cover only, no mockup frame, no 3D book render.",
    `Title text on cover: "${fields.coverTitle.trim()}".`,
  ];
  if (fields.subtitle.trim()) {
    parts.push(`Subtitle text on cover: "${fields.subtitle.trim()}".`);
  }
  parts.push(`Target audience / niche: ${fields.audience.trim()}.`);
  if (fields.stylePrompt.trim()) {
    parts.push(`Visual style: ${fields.stylePrompt.trim()}.`);
  }
  parts.push(
    "Legible typography, balanced composition, high-quality print-ready look, no watermarks, no logos.",
  );
  return parts.join(" ");
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Server configuration error: missing OPENAI_API_KEY." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as GenerateCoverBody;
    const { projectId, coverTitle, subtitle, stylePrompt, audience } = body ?? {};

    if (!isNonEmptyString(projectId)) {
      return NextResponse.json(
        { error: "Missing required field: projectId." },
        { status: 400 },
      );
    }

    if (!isNonEmptyString(coverTitle)) {
      return NextResponse.json(
        { error: "Cover title is required." },
        { status: 400 },
      );
    }

    const audienceValue =
      typeof audience === "string" && audience.trim()
        ? audience.trim()
        : null;
    if (!audienceValue) {
      return NextResponse.json(
        { error: "Audience / niche is required." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const access = await verifyEbookProjectAccess(supabase, projectId);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.status === 401 ? "Sign in to generate a cover." : "Project not found." },
        { status: access.status },
      );
    }

    const { data: projectRow } = await supabase
      .from("ebook_projects")
      .select("cover_storage_path")
      .eq("id", projectId)
      .maybeSingle();

    const prompt = buildCoverImagePrompt({
      coverTitle,
      subtitle: typeof subtitle === "string" ? subtitle : "",
      stylePrompt: typeof stylePrompt === "string" ? stylePrompt : "",
      audience: audienceValue,
    });

    const imageResponse = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1792",
        response_format: "b64_json",
      }),
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text().catch(() => "");
      return NextResponse.json(
        {
          error: "Failed to generate cover image from OpenAI.",
          details: errorText || `Status ${imageResponse.status}`,
        },
        { status: 502 },
      );
    }

    const imagePayload = (await imageResponse.json()) as {
      data?: { b64_json?: string }[];
    };
    const b64 = imagePayload.data?.[0]?.b64_json;
    if (!b64) {
      return NextResponse.json(
        { error: "OpenAI did not return image data." },
        { status: 502 },
      );
    }

    const imageBytes = Buffer.from(b64, "base64");

    let admin;
    try {
      admin = createAdminClient();
    } catch (configError) {
      console.error(configError);
      return NextResponse.json(
        {
          error:
            "Server configuration error: missing SUPABASE_SERVICE_ROLE_KEY for cover upload.",
        },
        { status: 500 },
      );
    }

    const persisted = await persistEbookCover({
      admin,
      supabase,
      userId: access.userId,
      projectId,
      previousStoragePath: projectRow?.cover_storage_path ?? null,
      fileBytes: imageBytes,
      contentType: "image/png",
    });

    if (!persisted.ok) {
      return NextResponse.json(
        { error: persisted.error, details: persisted.details },
        { status: persisted.status },
      );
    }

    return NextResponse.json({
      coverStoragePath: persisted.coverStoragePath,
      coverImageUrl: persisted.coverImageUrl,
    });
  } catch (error) {
    console.error("Error in /api/generate-cover:", error);
    return NextResponse.json(
      { error: "Unexpected server error while generating cover." },
      { status: 500 },
    );
  }
}
