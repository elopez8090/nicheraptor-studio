import { NextResponse } from "next/server";

import {
  COVER_UPLOAD_MAX_BYTES,
  getCoverUploadWarnings,
  isAcceptedCoverMime,
} from "@/lib/ebooks/cover-upload-validation";
import { EBOOK_COVERS_BUCKET } from "@/lib/ebooks/cover-storage";
import { parseImageDimensionsFromBuffer } from "@/lib/ebooks/parse-image-dimensions";
import { persistEbookCover } from "@/lib/ebooks/persist-ebook-cover";
import { verifyEbookProjectAccess } from "@/lib/ebooks/verify-ebook-project-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: projectId } = await context.params;

    if (!projectId?.trim()) {
      return NextResponse.json({ error: "Project id is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const access = await verifyEbookProjectAccess(supabase, projectId);
    if (!access.ok) {
      return NextResponse.json(
        {
          error:
            access.status === 401 ? "Sign in to upload a cover." : "Project not found.",
        },
        { status: access.status },
      );
    }

    const formData = await request.formData();
    const fileValue = formData.get("file");
    const ignoreWarnings = formData.get("ignoreWarnings") === "true";

    if (!(fileValue instanceof File) || fileValue.size === 0) {
      return NextResponse.json({ error: "Cover image file is required." }, { status: 400 });
    }

    const mime = fileValue.type;
    if (!isAcceptedCoverMime(mime)) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPG, PNG, or WebP." },
        { status: 400 },
      );
    }

    if (fileValue.size > COVER_UPLOAD_MAX_BYTES) {
      return NextResponse.json(
        { error: "File is too large. Maximum size is 10 MB." },
        { status: 400 },
      );
    }

    const arrayBuffer = await fileValue.arrayBuffer();
    const fileBytes = Buffer.from(arrayBuffer);

    const dimensions = parseImageDimensionsFromBuffer(fileBytes, mime);
    if (!dimensions) {
      return NextResponse.json(
        { error: "Could not read image dimensions. Try a different file." },
        { status: 400 },
      );
    }

    const warnings = getCoverUploadWarnings(dimensions.width, dimensions.height);
    if (warnings.length > 0 && !ignoreWarnings) {
      return NextResponse.json(
        {
          error: "Cover image has quality warnings.",
          warnings,
          width: dimensions.width,
          height: dimensions.height,
        },
        { status: 422 },
      );
    }

    const { data: projectRow, error: fetchError } = await supabase
      .from("ebook_projects")
      .select("cover_storage_path")
      .eq("id", projectId)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to load project.", details: fetchError.message },
        { status: 500 },
      );
    }

    let admin;
    try {
      admin = createAdminClient();
    } catch (configError) {
      console.error(configError);
      return NextResponse.json(
        {
          error:
            "Server configuration error: missing SUPABASE_SERVICE_ROLE_KEY for cover upload.",
        },
        { status: 500 },
      );
    }

    const persisted = await persistEbookCover({
      admin,
      supabase,
      userId: access.userId,
      projectId,
      previousStoragePath: projectRow?.cover_storage_path ?? null,
      fileBytes,
      contentType: mime,
    });

    if (!persisted.ok) {
      return NextResponse.json(
        { error: persisted.error, details: persisted.details },
        { status: persisted.status },
      );
    }

    return NextResponse.json({
      coverStoragePath: persisted.coverStoragePath,
      coverImageUrl: persisted.coverImageUrl,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (error) {
    console.error("Error in POST /api/ebook-projects/[id]/cover:", error);
    return NextResponse.json(
      { error: "Unexpected server error while uploading cover." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id: projectId } = await context.params;

    if (!projectId?.trim()) {
      return NextResponse.json({ error: "Project id is required." }, { status: 400 });
    }

    const supabase = await createClient();
    const access = await verifyEbookProjectAccess(supabase, projectId);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.status === 401 ? "Sign in to remove a cover." : "Project not found." },
        { status: access.status },
      );
    }

    const { data: project, error: fetchError } = await supabase
      .from("ebook_projects")
      .select("cover_storage_path")
      .eq("id", projectId)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to load project.", details: fetchError.message },
        { status: 500 },
      );
    }

    const storagePath = project?.cover_storage_path ?? null;

    if (storagePath) {
      try {
        const admin = createAdminClient();
        await admin.storage.from(EBOOK_COVERS_BUCKET).remove([storagePath]);
      } catch (configError) {
        console.error(configError);
        return NextResponse.json(
          {
            error:
              "Server configuration error: missing SUPABASE_SERVICE_ROLE_KEY for cover removal.",
          },
          { status: 500 },
        );
      }
    }

    const { error: updateError } = await supabase
      .from("ebook_projects")
      .update({
        cover_storage_path: null,
        cover_image_url: null,
      })
      .eq("id", projectId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to clear cover on project.", details: updateError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in DELETE /api/ebook-projects/[id]/cover:", error);
    return NextResponse.json(
      { error: "Unexpected server error while removing cover." },
      { status: 500 },
    );
  }
}
