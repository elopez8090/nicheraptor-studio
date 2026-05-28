import { NextResponse } from "next/server";

import { rewriteEbookSelection } from "@/lib/ai/rewrite/rewrite-content";
import { requireOpenAiApiKey } from "@/lib/ai/utilities/api-key";
import {
  isAiRewriteToolId,
  type AiRewriteToolId,
} from "@/lib/ebooks/ai-rewrite-tools";

type AiRewriteBody = {
  tool?: unknown;
  text?: unknown;
};

const MAX_TEXT_LENGTH = 12_000;

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

    const body = (await request.json()) as AiRewriteBody;
    const tool = body.tool;
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!isAiRewriteToolId(tool)) {
      return NextResponse.json(
        { error: "Invalid or missing tool type." },
        { status: 400 },
      );
    }

    if (!text) {
      return NextResponse.json(
        { error: "Selected text is empty." },
        { status: 400 },
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        {
          error: `Selection is too long (max ${MAX_TEXT_LENGTH} characters). Select a smaller passage.`,
        },
        { status: 400 },
      );
    }

    try {
      const { content: result } = await rewriteEbookSelection(
        apiKey,
        tool as AiRewriteToolId,
        text,
      );
      return NextResponse.json({ text: result });
    } catch (error) {
      return NextResponse.json(
        {
          error: "Failed to rewrite text with OpenAI.",
          details: error instanceof Error ? error.message : undefined,
        },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("Error in /api/ai-rewrite:", error);
    return NextResponse.json(
      { error: "Unexpected server error while rewriting text." },
      { status: 500 },
    );
  }
}
