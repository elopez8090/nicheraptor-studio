import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EbookWithChapters } from "@/lib/ebooks/chapter-workflow-types";
import { BookOpen, Target, Users } from "lucide-react";

type EbookMetaPanelProps = {
  ebook: Pick<EbookWithChapters, "title" | "audience" | "goal">;
};

export function EbookMetaPanel({ ebook }: EbookMetaPanelProps) {
  return (
    <Card className="shadow-premium">
      <CardHeader className="border-b border-border/60 pb-5">
        <CardTitle className="flex items-start gap-3 text-2xl font-semibold tracking-tight">
          <BookOpen className="mt-1 size-5 shrink-0 text-primary" />
          {ebook.title}
        </CardTitle>
        <CardDescription className="text-base">
          Approved outline — ready for chapter generation
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border/50 bg-muted/50 p-5">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <Users className="size-3.5" aria-hidden />
            Audience
          </p>
          <p className="mt-2 text-base leading-relaxed text-foreground">
            {ebook.audience}
          </p>
        </div>
        <div className="rounded-xl border border-border/50 bg-muted/50 p-5 sm:col-span-1">
          <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            <Target className="size-3.5" aria-hidden />
            Goal
          </p>
          <p className="mt-2 text-base leading-relaxed text-foreground">
            {ebook.goal}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
