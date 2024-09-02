"use strict";
import sharp from 'sharp';
import { redirect } from './redirect.js';

export async function compressImgStream(request, reply, imgStream) {
    const { webp, grayscale, quality, originSize } = request.params;
    const imgFormat = webp ? 'webp' : 'jpeg';

    try {
        // Create the sharp instance and start the pipeline
        let sharpInstance = sharp()
            .grayscale(grayscale) // Apply grayscale conditionally
            .toFormat(imgFormat, {
                quality, // Use the provided quality
                progressive: true,
                optimizeScans: webp, // Optimize scans only for WebP
                chromaSubsampling: webp ? '4:4:4' : '4:2:0', // Conditional chroma subsampling
            });

        // Convert the incoming stream to a buffer and process the image
        const processedBuffer = await sharpInstance
            .fromBuffer(await imgStreamToBuffer(imgStream))
            .toBuffer();

        // Get the size of the processed image
        const processedSize = processedBuffer.length;

        // Send the processed image as a buffer to the client
        reply
            .header('content-type', `image/${imgFormat}`)
            .header('content-length', processedSize)
            .header('x-original-size', originSize)
            .header('x-bytes-saved', originSize - processedSize)
            .code(200)
            .send(processedBuffer);

    } catch (error) {
        return redirect(request, reply);
    }
}

// Helper function to convert a stream to a buffer
function imgStreamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}
