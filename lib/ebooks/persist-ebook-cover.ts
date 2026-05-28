import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildEbookCoverStoragePath,
  EBOOK_COVERS_BUCKET,
  getEbookCoverPublicUrl,
} from "@/lib/ebooks/cover-storage";

export type PersistEbookCoverResult =
  | { ok: true; coverStoragePath: string; coverImageUrl: string }
  | { ok: false; error: string; details?: string; status: number };

export async function persistEbookCover(params: {
  admin: SupabaseClient;
  supabase: SupabaseClient;
  userId: string;
  projectId: string;
  previousStoragePath: string | null;
  fileBytes: Buffer;
  contentType: string;
}): Promise<PersistEbookCoverResult> {
  const storagePath = buildEbookCoverStoragePath(params.userId, params.projectId);

  if (params.previousStoragePath && params.previousStoragePath !== storagePath) {
    await params.admin.storage.from(EBOOK_COVERS_BUCKET).remove([params.previousStoragePath]);
  }

  const { error: uploadError } = await params.admin.storage
    .from(EBOOK_COVERS_BUCKET)
    .upload(storagePath, params.fileBytes, {
      contentType: params.contentType,
      upsert: true,
    });

  if (uploadError) {
    return {
      ok: false,
      status: 500,
      error: "Failed to upload cover to storage.",
      details: uploadError.message,
    };
  }

  const coverImageUrl = getEbookCoverPublicUrl(storagePath);
  if (!coverImageUrl) {
    return {
      ok: false,
      status: 500,
      error: "Could not build public cover URL.",
    };
  }

  const { error: updateError } = await params.supabase
    .from("ebook_projects")
    .update({
      cover_storage_path: storagePath,
      cover_image_url: coverImageUrl,
    })
    .eq("id", params.projectId);

  if (updateError) {
    return {
      ok: false,
      status: 500,
      error: "Cover was uploaded but could not be saved to the project.",
      details: updateError.message,
    };
  }

  return { ok: true, coverStoragePath: storagePath, coverImageUrl };
}
