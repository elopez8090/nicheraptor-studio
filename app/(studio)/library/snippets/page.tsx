import { ContentLibraryWorkspace } from "@/components/content-library/content-library-workspace";
import {
  fetchContentLibraryItems,
  fetchContentLibraryTags,
} from "@/lib/content-library/fetch-content-library";

export default async function LibrarySnippetsPage() {
  const [items, tags] = await Promise.all([
    fetchContentLibraryItems({ type: "snippet" }),
    fetchContentLibraryTags(),
  ]);

  return (
    <ContentLibraryWorkspace
      initialItems={items}
      initialTags={tags}
      typeFilter={["snippet"]}
      showRecent
      showFavorites={false}
    />
  );
}
