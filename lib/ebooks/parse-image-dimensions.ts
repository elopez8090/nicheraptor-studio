import type { AcceptedCoverMime } from "@/lib/ebooks/cover-upload-validation";

export type ImageDimensions = { width: number; height: number };

function readUInt32BE(buffer: Buffer, offset: number): number {
  return buffer.readUInt32BE(offset);
}

function parsePngDimensions(buffer: Buffer): ImageDimensions | null {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(signature)) {
    return null;
  }
  const width = readUInt32BE(buffer, 16);
  const height = readUInt32BE(buffer, 24);
  if (width <= 0 || height <= 0) {
    return null;
  }
  return { width, height };
}

function parseJpegDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset + 3 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    const segmentLength = buffer.readUInt16BE(offset + 2);
    if (segmentLength < 2 || offset + 2 + segmentLength > buffer.length) {
      break;
    }

    const isSof =
      marker === 0xc0 ||
      marker === 0xc1 ||
      marker === 0xc2 ||
      marker === 0xc3 ||
      marker === 0xc5 ||
      marker === 0xc6 ||
      marker === 0xc7 ||
      marker === 0xc9 ||
      marker === 0xca ||
      marker === 0xcb ||
      marker === 0xcd ||
      marker === 0xce ||
      marker === 0xcf;

    if (isSof && offset + 9 < buffer.length) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      if (width > 0 && height > 0) {
        return { width, height };
      }
    }

    offset += 2 + segmentLength;
  }

  return null;
}

function parseWebpDimensions(buffer: Buffer): ImageDimensions | null {
  if (buffer.length < 30) {
    return null;
  }
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WEBP") {
    return null;
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const chunk = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + 8;

    if (chunk === "VP8X" && chunkSize >= 10 && chunkStart + 10 <= buffer.length) {
      const width = 1 + buffer.readUIntLE(chunkStart + 4, 3);
      const height = 1 + buffer.readUIntLE(chunkStart + 7, 3);
      if (width > 0 && height > 0) {
        return { width, height };
      }
    }

    if (chunk === "VP8 " && chunkSize >= 10 && chunkStart + 10 <= buffer.length) {
      const width = buffer.readUInt16LE(chunkStart + 6) & 0x3fff;
      const height = buffer.readUInt16LE(chunkStart + 8) & 0x3fff;
      if (width > 0 && height > 0) {
        return { width, height };
      }
    }

    if (chunk === "VP8L" && chunkSize >= 5 && chunkStart + 5 <= buffer.length) {
      const bits =
        buffer[chunkStart] |
        (buffer[chunkStart + 1] << 8) |
        (buffer[chunkStart + 2] << 16) |
        (buffer[chunkStart + 3] << 24);
      const width = (bits & 0x3fff) + 1;
      const height = ((bits >> 14) & 0x3fff) + 1;
      if (width > 0 && height > 0) {
        return { width, height };
      }
    }

    const padded = chunkSize + (chunkSize % 2);
    offset = chunkStart + padded;
  }

  return null;
}

export function parseImageDimensionsFromBuffer(
  buffer: Buffer,
  mime: AcceptedCoverMime,
): ImageDimensions | null {
  switch (mime) {
    case "image/png":
      return parsePngDimensions(buffer);
    case "image/jpeg":
      return parseJpegDimensions(buffer);
    case "image/webp":
      return parseWebpDimensions(buffer);
    default:
      return null;
  }
}
