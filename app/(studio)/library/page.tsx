import { ContentLibraryWorkspace } from "@/components/content-library/content-library-workspace";
import {
  fetchContentLibraryItems,
  fetchContentLibraryTags,
} from "@/lib/content-library/fetch-content-library";

export default async function ContentLibraryPage() {
  const [items, tags] = await Promise.all([
    fetchContentLibraryItems(),
    fetchContentLibraryTags(),
  ]);

  return (
    <ContentLibraryWorkspace
      initialItems={items}
      initialTags={tags}
      showRecent
      showFavorites
    />
  );
}
