import { NextResponse } from "next/server";

import { generateEbookOutline } from "@/lib/ai/generators/ebook-outline";
import { requireOpenAiApiKey } from "@/lib/ai/utilities/api-key";
import { normalizeHumanScore, type HumanizationOptions } from "@/lib/ai/humanization/config";
import {
  buildOutlineLengthPromptLines,
  parseEbookLengthSettingsFromBody,
} from "@/lib/ebooks/ebook-length-settings";
import {
  buildOutlineChapterCountPromptLines,
  OUTLINE_CHAPTER_COUNT_MAX,
  OUTLINE_CHAPTER_COUNT_MIN,
  resolveOutlineChapterCountFromBody,
} from "@/lib/ebooks/outline-chapter-count";
import {
  EBOOK_STYLE_OPTIONS,
  normalizeWritingTone,
} from "@/lib/ebooks/workspace-settings-types";

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
    const {
      topic,
      audience,
      goal,
      writingTone,
      writingStyle,
      ebookStyle,
      humanScore,
      humanizationOptions,
    } = body ?? {};
    const chapterCountResolved = resolveOutlineChapterCountFromBody(body);
    const lengthSettings = parseEbookLengthSettingsFromBody(body);

    if (!topic || !audience || !goal) {
      return NextResponse.json(
        { error: "Missing required fields: topic, audience, and goal are required." },
        { status: 400 },
      );
    }

    const styleLabel =
      EBOOK_STYLE_OPTIONS.find((s) => s.value === ebookStyle)?.label ??
      "How-To Guide";

    const chapterLines = buildOutlineChapterCountPromptLines(chapterCountResolved);
    const lengthLines = buildOutlineLengthPromptLines(lengthSettings);

    const resolvedWritingStyle = normalizeWritingTone(writingStyle ?? writingTone);
    const resolvedHumanScore = normalizeHumanScore(humanScore);

    let outline;
    try {
      const result = await generateEbookOutline({
        apiKey,
        topic,
        audience,
        goal,
        writingStyle: resolvedWritingStyle,
        humanScore: resolvedHumanScore,
        humanizationOptions:
          humanizationOptions as Partial<HumanizationOptions> | null | undefined,
        chapterLines,
        lengthLines: [`- Ebook style / structure: ${styleLabel}`, ...lengthLines],
      });
      outline = result.content;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate outline.";
      return NextResponse.json(
        {
          error: message.includes("unexpected format")
            ? message
            : "Failed to generate outline from OpenAI.",
          details: error instanceof Error ? error.message : undefined,
        },
        { status: 502 },
      );
    }

    if (chapterCountResolved.mode === "auto") {
      if (
        outline.chapters.length < OUTLINE_CHAPTER_COUNT_MIN ||
        outline.chapters.length > OUTLINE_CHAPTER_COUNT_MAX
      ) {
        return NextResponse.json(
          {
            error: `Outline must have between ${OUTLINE_CHAPTER_COUNT_MIN} and ${OUTLINE_CHAPTER_COUNT_MAX} chapters. Got ${outline.chapters.length}. Please try again.`,
          },
          { status: 502 },
        );
      }
    } else {
      const expected = chapterCountResolved.count;
      if (outline.chapters.length > expected) {
        outline.chapters = outline.chapters.slice(0, expected);
      } else if (outline.chapters.length < expected) {
        return NextResponse.json(
          {
            error: `Expected ${expected} chapters but received ${outline.chapters.length}. Please generate again.`,
          },
          { status: 502 },
        );
      }
    }

    return NextResponse.json({
      ...outline,
      writingStyle: resolvedWritingStyle,
      humanScore: resolvedHumanScore,
      humanizationOptions:
        (humanizationOptions as Partial<HumanizationOptions> | null | undefined) ?? null,
      chapterCount: outline.chapters.length,
      chapterCountMode: chapterCountResolved.mode,
      requestedChapterCount:
        chapterCountResolved.mode === "fixed"
          ? chapterCountResolved.count
          : null,
      lengthSettings,
    });
  } catch (error) {
    console.error("Error in /api/generate-outline:", error);
    return NextResponse.json(
      { error: "Unexpected server error while generating outline." },
      { status: 500 },
    );
  }
}
