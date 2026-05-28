"use client";

import { useCallback, useState } from "react";

import { GenerateIdeasPanel } from "@/components/planner/generate-ideas-panel";
import { TopicBoard } from "@/components/planner/topic-board";
import type { ContentTopicRecord } from "@/lib/planner/types";

type TopicsPlannerWorkspaceProps = {
  initialTopics: ContentTopicRecord[];
};

export function TopicsPlannerWorkspace({
  initialTopics,
}: TopicsPlannerWorkspaceProps) {
  const [topics, setTopics] = useState(initialTopics);

  const onTopicsSaved = useCallback((saved: ContentTopicRecord[]) => {
    setTopics((prev) => [...saved, ...prev]);
  }, []);

  return (
    <div className="space-y-8">
      <GenerateIdeasPanel onTopicsSaved={onTopicsSaved} />
      <TopicBoard topics={topics} onTopicsChange={setTopics} />
    </div>
  );
}
