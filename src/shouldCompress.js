const MIN_COMPRESS_LENGTH = 512; // Minimum size in bytes to apply compression
const MIN_TRANSPARENT_COMPRESS_LENGTH = MIN_COMPRESS_LENGTH * 100;

export function shouldCompress(request) {
  const { originType, originSize, webp } = request.params;

  if (!originType.startsWith('image')) {
    return false;
  }
  if (originSize === 0) {
    return false;
  }
  if (webp && originSize < MIN_COMPRESS_LENGTH) {
    return false;
  }
  if (!webp && (originType.endsWith('png') || originType.endsWith('gif')) && originSize < MIN_TRANSPARENT_COMPRESS_LENGTH) {
    return false;
  }

  return true;
}
