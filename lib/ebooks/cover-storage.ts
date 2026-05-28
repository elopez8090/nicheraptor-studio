export const EBOOK_COVERS_BUCKET = "ebook-covers";

export function buildEbookCoverStoragePath(userId: string, projectId: string) {
  return `${userId}/${projectId}/cover.png`;
}

export function getEbookCoverPublicUrl(storagePath: string): string | null {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base?.trim()) {
    return null;
  }
  const encoded = storagePath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${EBOOK_COVERS_BUCKET}/${encoded}`;
}
