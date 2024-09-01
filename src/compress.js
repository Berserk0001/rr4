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

        // Pipe the incoming stream through sharp and out to the reply
        const processedStream = imgStream.pipe(transform);

        // Get the output info from the sharp transform
        processedStream.on('info', (info) => {
            reply
                .header('content-type', `image/${imgFormat}`)
                .header('content-length', info.size)
                .header('x-original-size', originSize)
                .header('x-bytes-saved', originSize - info.size)
                .code(200);
        });

        // Stream the processed image back to the client
        return processedStream.pipe(reply.raw);

    } catch (error) {
        return redirect(request, reply);
    }
}
