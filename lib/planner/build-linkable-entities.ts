import { fetchArticles } from "@/lib/articles/fetch-articles";
import { fetchEbookProjects } from "@/lib/ebooks/fetch-ebook-projects";
import type { PlannerLinkableEntity } from "@/lib/planner/types";
import { fetchPlannerSnapshot } from "@/lib/planner/fetch-planner-snapshot";

export async function buildLinkableEntities(): Promise<PlannerLinkableEntity[]> {
  const [snapshot, ebooks, articles] = await Promise.all([
    fetchPlannerSnapshot(),
    fetchEbookProjects({ includeArchived: false }),
    fetchArticles(),
  ]);

  const entities: PlannerLinkableEntity[] = [];

  for (const topic of snapshot.topics) {
    entities.push({ kind: "topic", id: topic.id, label: topic.title });
  }
  for (const ebook of ebooks) {
    entities.push({ kind: "ebook", id: ebook.id, label: ebook.title });
  }
  for (const article of articles) {
    entities.push({ kind: "article", id: article.id, label: article.title });
  }

  return entities;
}
