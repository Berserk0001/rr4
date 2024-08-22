import { redirect as redirectFunc } from './redirect.js';
import sharp from 'sharp';

export async function compressImg(request, reply, imgData) {
  const imgFormat = request.params.webp ? 'webp' : 'jpeg';
  try {
    const outputBuffer = await sharp(imgData)
      .grayscale(request.params.grayscale)
      .toFormat(imgFormat, { quality: request.params.quality, progressive: true, optimizeScans: true, chromaSubsampling: '4:4:4' })
      .toBuffer({ resolveWithObject: true });

    reply.header('content-type', `image/${imgFormat}`);
    reply.header('content-length', outputBuffer.info.size);
    reply.header('x-original-size', request.params.originSize);
    reply.header('x-bytes-saved', request.params.originSize - outputBuffer.info.size);
    return reply.code(200).send(outputBuffer.data);
  } catch (error) {
    return redirectFunc(request, reply);
  }
}
