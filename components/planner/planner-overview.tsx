import Link from "next/link";
import {
  GitBranch,
  Layers,
  Lightbulb,
  Map,
  Route,
} from "lucide-react";

import { StatCard } from "@/components/layout/stat-card";
import type { PlannerSnapshot } from "@/lib/planner/types";

type PlannerOverviewProps = {
  snapshot: PlannerSnapshot;
};

export function PlannerOverview({ snapshot }: PlannerOverviewProps) {
  const published = snapshot.topics.filter(
    (t) => t.workflowStatus === "published",
  ).length;
  const inPipeline = snapshot.topics.length - published;

  const cards = [
    {
      href: "/planner/topics",
      label: "Topic board",
      value: String(snapshot.topics.length),
      hint: `${inPipeline} in pipeline`,
      icon: Lightbulb,
    },
    {
      href: "/planner/clusters",
      label: "Clusters",
      value: String(snapshot.clusters.length),
      hint: "Pillar groupings",
      icon: Layers,
    },
    {
      href: "/planner/clusters",
      label: "Relationships",
      value: String(snapshot.relationships.length),
      hint: "Cross-content links",
      icon: GitBranch,
    },
    {
      href: "/planner/roadmaps",
      label: "Roadmaps",
      value: String(snapshot.roadmaps.length),
      hint: "Publishing sequences",
      icon: Route,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ href, label, value, hint, icon: Icon }) => (
          <Link key={label} href={href} className="block transition-transform hover:scale-[1.01]">
            <StatCard label={label} value={value} hint={hint} icon={Icon} />
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card to-muted/30 p-6">
        <div className="flex items-start gap-3">
          <Map className="size-6 text-primary" aria-hidden />
          <div>
            <h2 className="text-lg font-semibold">Strategy layer</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Plan ebook ecosystems, article series, and lead magnets before you
              draft. AI suggestions use your live library to avoid overlap and
              spot cannibalization. Roadmap items are structured for future
              calendar, WordPress, SEO tracking, and newsletter automation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
