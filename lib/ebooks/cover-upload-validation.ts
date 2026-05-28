export const COVER_UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export const COVER_RECOMMENDED_WIDTH = 1600;
export const COVER_RECOMMENDED_HEIGHT = 2560;
export const COVER_MIN_WIDTH = 1000;
export const COVER_MIN_HEIGHT = 1600;

/** Portrait width ÷ height (1 : 1.6). */
export const COVER_PORTRAIT_ASPECT = COVER_RECOMMENDED_WIDTH / COVER_RECOMMENDED_HEIGHT;

export const COVER_ASPECT_TOLERANCE = 0.08;

export const ACCEPTED_COVER_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AcceptedCoverMime = (typeof ACCEPTED_COVER_MIME_TYPES)[number];

export const COVER_UPLOAD_ACCEPT = ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp";

export function isAcceptedCoverMime(mime: string): mime is AcceptedCoverMime {
  return (ACCEPTED_COVER_MIME_TYPES as readonly string[]).includes(mime);
}

export function formatCoverFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function getCoverUploadWarnings(width: number, height: number): string[] {
  const warnings: string[] = [];

  if (width < COVER_MIN_WIDTH || height < COVER_MIN_HEIGHT) {
    warnings.push(
      `Image is smaller than the minimum recommended size (${COVER_MIN_WIDTH} × ${COVER_MIN_HEIGHT} px). It may look soft in print or on high-DPI screens.`,
    );
  }

  const ratio = width / height;
  const aspectDiff = Math.abs(ratio - COVER_PORTRAIT_ASPECT);

  if (aspectDiff > COVER_ASPECT_TOLERANCE) {
    if (width > height) {
      warnings.push(
        `This cover is landscape. Standard ebook covers are portrait ${COVER_RECOMMENDED_WIDTH} × ${COVER_RECOMMENDED_HEIGHT} px (aspect 1 : 1.6). Landscape Kindle-style art is often 2560 × 1600 px.`,
      );
    } else {
      warnings.push(
        `Aspect ratio is not close to portrait 1 : 1.6. Recommended size: ${COVER_RECOMMENDED_WIDTH} × ${COVER_RECOMMENDED_HEIGHT} px.`,
      );
    }
  }

  return warnings;
}

export async function loadCoverImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image dimensions."));
    };
    img.src = url;
  });
}

export function coverMimeToExtension(mime: AcceptedCoverMime): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "png";
  }
}
