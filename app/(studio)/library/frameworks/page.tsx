import { ContentLibraryWorkspace } from "@/components/content-library/content-library-workspace";
import {
  fetchContentLibraryItems,
  fetchContentLibraryTags,
} from "@/lib/content-library/fetch-content-library";

export default async function LibraryFrameworksPage() {
  const [items, tags] = await Promise.all([
    fetchContentLibraryItems({ type: "framework" }),
    fetchContentLibraryTags(),
  ]);

  return (
    <ContentLibraryWorkspace
      initialItems={items}
      initialTags={tags}
      typeFilter={["framework"]}
      showRecent
      showFavorites={false}
    />
  );
}
