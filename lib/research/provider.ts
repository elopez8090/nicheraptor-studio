/**
 * Future research data providers (web search, RAG, uploaded PDFs).
 * Implement `ResearchContextProvider` and call it from `run-research.ts`
 * before building the user prompt.
 */
export type ResearchContextProvider = {
  id: string;
  fetchContext: (input: {
    projectId: string;
    chapterId?: string | null;
    query: string;
  }) => Promise<string | null>;
};
