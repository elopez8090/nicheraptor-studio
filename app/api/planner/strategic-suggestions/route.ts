import { NextResponse } from "next/server";

import { generateStrategicSuggestions } from "@/lib/ai/generators/content-planner";
import { requireOpenAiApiKey } from "@/lib/ai/utilities/api-key";
import { buildContentInventory } from "@/lib/planner/build-content-inventory";

export async function POST(request: Request) {
  try {
    const apiKey = requireOpenAiApiKey();
    const body = (await request.json()) as Record<string, unknown>;
    const focusNiche =
      typeof body.focusNiche === "string" ? body.focusNiche.trim() : "";
    if (!focusNiche) {
      return NextResponse.json(
        { error: "focusNiche is required." },
        { status: 400 },
      );
    }

    const inventory = await buildContentInventory();
    const result = await generateStrategicSuggestions({
      apiKey,
      focusNiche,
      focusTopic:
        typeof body.focusTopic === "string" ? body.focusTopic : undefined,
      inventory,
    });

    return NextResponse.json({
      ...result.content,
      meta: result.meta,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate strategic suggestions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
