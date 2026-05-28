import { getEbookTemplate } from "@/lib/ebooks/templates";
import type { OutlineToSave } from "@/lib/ebooks/save-ebook-outline";

export async function createEbookFromTemplate(
  templateId: string,
): Promise<{ projectId: string } | { error: string }> {
  const template = getEbookTemplate(templateId);

  if (template) {
    const outline: OutlineToSave = {
      title: template.defaultTitle,
      audience: template.defaultAudience,
      goal: template.defaultGoal,
      chapters: template.chapters.map((chapter) => ({
        title: chapter.title,
        summary: chapter.summary,
      })),
    };

    const response = await fetch("/api/ebook-projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(outline),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        error:
          typeof result?.error === "string"
            ? result.error
            : "Failed to create project from template.",
      };
    }

    if (typeof result?.projectId !== "string" || !result.projectId.trim()) {
      return { error: "Project was not saved correctly." };
    }

    return { projectId: result.projectId.trim() };
  }

  const customResponse = await fetch(`/api/user-templates/${templateId}/use`, {
    method: "POST",
  });
  const customResult = await customResponse.json();

  if (!customResponse.ok) {
    return {
      error:
        typeof customResult?.error === "string"
          ? customResult.error
          : "Unknown template.",
    };
  }

  if (
    typeof customResult?.projectId !== "string" ||
    !customResult.projectId.trim()
  ) {
    return { error: "Project was not saved correctly." };
  }

  return { projectId: customResult.projectId.trim() };
}
