import { ArticleEditorWorkspace } from "@/components/articles/article-editor-workspace";
import { fetchArticle } from "@/lib/articles/fetch-article";
import { isLikelyId } from "@/lib/navigation/route-params";
import { notFound } from "next/navigation";

type ArticleEditorPageProps = {
  params: Promise<{ articleId: string }>;
};

export default async function ArticleEditorPage({ params }: ArticleEditorPageProps) {
  const { articleId } = await params;
  if (!isLikelyId(articleId)) {
    notFound();
  }
  const article = await fetchArticle(articleId);

  if (!article) {
    notFound();
  }

  return <ArticleEditorWorkspace article={article} />;
}
