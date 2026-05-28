import { handleChapterGenerationRequest } from "@/lib/ebooks/chapter-generation-api";

type RouteContext = {
  params: Promise<{ projectId: string; chapterId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { projectId, chapterId } = await context.params;
  return handleChapterGenerationRequest(
    request,
    projectId.trim(),
    chapterId.trim(),
    { regenerate: true },
  );
}
