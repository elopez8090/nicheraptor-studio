import { ContentLibraryWorkspace } from "@/components/content-library/content-library-workspace";
import {
  fetchContentLibraryItems,
  fetchContentLibraryTags,
} from "@/lib/content-library/fetch-content-library";

export default async function LibraryPromptsPage() {
  const [items, tags] = await Promise.all([
    fetchContentLibraryItems({ type: "prompt" }),
    fetchContentLibraryTags(),
  ]);

  return (
    <ContentLibraryWorkspace
      initialItems={items}
      initialTags={tags}
      typeFilter={["prompt"]}
      showRecent
      showFavorites={false}
    />
  );
}
