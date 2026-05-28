export {
  buildEbookChapterGenerationContext,
  type BuiltEbookChapterContext,
  type EbookChapterContextExtras,
} from "@/lib/context-engine/build-ebook-chapter-context";
export {
  buildArticleGenerationMemory,
  mergeArticleMemoryIntoPrompt,
  type ArticleGenerationMemory,
} from "@/lib/context-engine/build-article-context";
export {
  analyzeWritingConsistency,
  formatConsistencyGuidanceBlock,
} from "@/lib/context-engine/consistency-engine";
export {
  buildStructureAwareness,
  formatStructureAwarenessBlock,
} from "@/lib/context-engine/chapter-relationships";
