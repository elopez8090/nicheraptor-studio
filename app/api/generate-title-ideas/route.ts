import { NextResponse } from "next/server";

import { generateEbookTitleIdeas } from "@/lib/ai/generators/ebook-outline";
import { requireOpenAiApiKey } from "@/lib/ai/utilities/api-key";
import { validateTitleIdeasPayload } from "@/lib/ai/utilities/validation";

export async function POST(request: Request) {
  try {
    let apiKey: string;
    try {
      apiKey = requireOpenAiApiKey();
    } catch {
      return NextResponse.json(
        { error: "Server configuration error: missing OPENAI_API_KEY." },
        { status: 500 },
      );
    }

    const body = await request.json();
    const { topic, audience, goal } = body ?? {};

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return NextResponse.json(
        { error: "Topic is required." },
        { status: 400 },
      );
    }

    let titles: string[];
    try {
      const result = await generateEbookTitleIdeas({
        apiKey,
        topic,
        audience: typeof audience === "string" ? audience : undefined,
        goal: typeof goal === "string" ? goal : undefined,
      });
      titles = validateTitleIdeasPayload(result.content);
    } catch (error) {
      return NextResponse.json(
        {
          error: "Failed to generate title ideas.",
          details: error instanceof Error ? error.message : undefined,
        },
        { status: 502 },
      );
    }

    if (titles.length === 0) {
      return NextResponse.json(
        { error: "Title ideas were empty." },
        { status: 502 },
      );
    }

    return NextResponse.json({ titles: titles.slice(0, 8) });
  } catch (error) {
    console.error("Error in /api/generate-title-ideas:", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 },
    );
  }
}
