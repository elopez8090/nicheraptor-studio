export function isProjectAiMemorySchemaMissing(message: string): boolean {
  return (
    message.includes("project_ai_memory") ||
    message.includes("chapter_content_summaries")
  );
}
