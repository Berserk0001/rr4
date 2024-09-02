"use strict";
const MIN_COMPRESS_LENGTH = 512; // Minimum size in bytes to apply compression
const MIN_TRANSPARENT_COMPRESS_LENGTH = MIN_COMPRESS_LENGTH * 100;

export function shouldCompress(request) {
  const { originType, originSize, webp } = request.params;

  // If the originType does not start with 'image', do not compress
  if (!originType.startsWith('image')) {
    return false;
  }

  // If the originSize is 0, do not compress
  if (originSize === 0) {
    return false;
  }

  // If the image is in WebP format and its size is smaller than the minimum compress length, do not compress
  if (!webp && originSize < MIN_COMPRESS_LENGTH) {
    return false;
  }

  // If the image is a PNG or GIF and its size is smaller than the transparent compress length, do not compress
  if (originType.endsWith('gif') && originSize < MIN_TRANSPARENT_COMPRESS_LENGTH) {
    return false;
  }

  // Include PNG images in compression criteria regardless of their size
  if (originType.endsWith('png')) {
    return true;
  }

  if (originType.endsWith('webp')) {
    return true;
  }

  // For all other cases, return true to indicate the image should be compressed
  return true;
}
