import { BookOpen, CheckCircle2, FileStack, FolderKanban } from "lucide-react";

import { StatCard } from "@/components/layout/stat-card";
import type { EbookProjectLibraryStats } from "@/lib/ebooks/fetch-ebook-projects";

type DashboardStatsRowProps = {
  stats: EbookProjectLibraryStats;
};

const statCards = [
  {
    key: "total" as const,
    label: "Total projects",
    icon: FolderKanban,
  },
  {
    key: "drafts" as const,
    label: "Drafts",
    icon: FileStack,
  },
  {
    key: "completed" as const,
    label: "Completed",
    icon: CheckCircle2,
  },
  {
    key: "totalChapters" as const,
    label: "Total chapters",
    icon: BookOpen,
  },
];

export function DashboardStatsRow({ stats }: DashboardStatsRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map(({ key, label, icon }) => (
        <StatCard key={key} label={label} value={stats[key]} icon={icon} />
      ))}
    </div>
  );
}
