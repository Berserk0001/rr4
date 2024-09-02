"use strict";

export function shouldCompress(request) {
  const { originType, originSize} = request.params;

  // If the originType does not start with 'image', do not compress
  if (!originType.startsWith('image')) {
    return false;
  }

  // If the originSize is 0, do not compress
  if (originSize === 0) {
    return false;
  }

  // If the image is in WebP format and its size is smaller than the minimum compress length, do not compress
  

  // For all other cases, return true to indicate the image should be compressed
  return true;
}
