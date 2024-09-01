"use strict";
import sharp from 'sharp';
import { redirect } from './redirect.js';

export async function compressImgStream(request, reply, imgStream) {
    const { webp, grayscale, quality, originSize } = request.params;
    const imgFormat = webp ? 'webp' : 'jpeg';

    try {
        // Create the sharp instance and start the pipeline
        const transform = sharp()
            .grayscale(grayscale) // Apply grayscale conditionally
            .toFormat(imgFormat, {
                quality, // Use the provided quality
                progressive: true,
                optimizeScans: webp, // Optimize scans only for WebP
                chromaSubsampling: webp ? '4:4:4' : '4:2:0', // Conditional chroma subsampling
            });

        // Convert the processed image to a buffer
        const buffer = await imgStream.pipe(transform).toBuffer();

        // Send response with appropriate headers
        reply
            .header('content-type', `image/${imgFormat}`)
            .header('content-length', buffer.length)
            .header('x-original-size', originSize)
            .header('x-bytes-saved', originSize - buffer.length)
            .code(200)
            .send(buffer);
    } catch (error) {
        return redirect(request, reply);
    }
}
