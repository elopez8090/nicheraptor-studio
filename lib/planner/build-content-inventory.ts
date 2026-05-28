import { fetchArticles } from "@/lib/articles/fetch-articles";
import { fetchEbookProjects } from "@/lib/ebooks/fetch-ebook-projects";
import type { ContentInventoryItem } from "@/lib/planner/types";
import { fetchPlannerSnapshot } from "@/lib/planner/fetch-planner-snapshot";

export async function buildContentInventory(): Promise<ContentInventoryItem[]> {
  const [snapshot, ebooks, articles] = await Promise.all([
    fetchPlannerSnapshot(),
    fetchEbookProjects({ includeArchived: false }),
    fetchArticles(),
  ]);

  const items: ContentInventoryItem[] = [];

  for (const topic of snapshot.topics) {
    items.push({
      kind: "topic",
      id: topic.id,
      title: topic.title,
      topicOrNiche: topic.niche || topic.description.slice(0, 120),
      keyword: topic.targetKeyword,
      status: topic.workflowStatus,
    });
  }

  for (const ebook of ebooks) {
    items.push({
      kind: "ebook",
      id: ebook.id,
      title: ebook.title,
      topicOrNiche: ebook.audience,
      keyword: "",
      status: ebook.workflowStatus,
    });
  }

  for (const article of articles) {
    items.push({
      kind: "article",
      id: article.id,
      title: article.title,
      topicOrNiche: article.targetKeyword,
      keyword: article.targetKeyword,
      status: article.status,
    });
  }

  return items;
}

export function formatInventoryForPrompt(
  inventory: ContentInventoryItem[],
  maxItems = 80,
): string {
  const slice = inventory.slice(0, maxItems);
  if (slice.length === 0) {
    return "No existing ebooks, articles, or planned topics yet.";
  }
  return slice
    .map(
      (item) =>
        `- [${item.kind}] ${item.title} | focus: ${item.topicOrNiche || "—"} | keyword: ${item.keyword || "—"} | status: ${item.status}`,
    )
    .join("\n");
}
