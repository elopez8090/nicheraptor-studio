import Link from "next/link";
import { FileText, Pencil } from "lucide-react";

import { ArticleRowActions } from "@/components/articles/article-row-actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { articleTypeLabel } from "@/lib/articles/article-constants";
import type { ArticleListItem } from "@/lib/articles/fetch-articles";

function formatUpdated(iso: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    draft: "Draft",
    outline: "Outline",
    generated: "Generated",
    published: "Published",
  };
  return labels[status] ?? status;
}

type ArticleCardProps = {
  article: ArticleListItem;
};

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card className="card-interactive flex h-full flex-col shadow-premium">
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl leading-snug line-clamp-2">
            {article.title}
          </CardTitle>
          <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize">
            {statusLabel(article.status)}
          </span>
        </div>
        <CardDescription className="space-y-1">
          <p>
            <span className="font-medium text-foreground">Keyword: </span>
            {article.targetKeyword || "—"}
          </p>
          <p className="text-sm">{articleTypeLabel(article.articleType)}</p>
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0 text-sm text-muted-foreground">
        Updated {formatUpdated(article.updatedAt)}
      </CardContent>
      <CardFooter className="mt-auto flex flex-wrap gap-2 border-t bg-muted/30">
        <Button size="default" asChild>
          <Link href={`/articles/${article.id}/editor`}>
            <Pencil className="size-4" aria-hidden />
            Edit
          </Link>
        </Button>
        <Button variant="outline" size="default" asChild>
          <Link href={`/articles/${article.id}/editor`}>
            <FileText className="size-4" aria-hidden />
            Editor
          </Link>
        </Button>
        <ArticleRowActions articleId={article.id} />
      </CardFooter>
    </Card>
  );
}
