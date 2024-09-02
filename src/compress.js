"use strict";
import sharp from 'sharp';
import { redirect } from './redirect.js';

export async function compressImg(request, reply, imgStream) {
    const { webp, grayscale, quality, originSize } = request.params;
    const imgFormat = webp ? 'webp' : 'jpeg';

    try {
        // Create the sharp instance and start the pipeline with the image stream
        const sharpInstance = sharp()
            .grayscale(grayscale)
            .toFormat(imgFormat, {
                quality,
                progressive: true,
                optimizeScans: webp,
                chromaSubsampling: webp ? '4:4:4' : '4:2:0',
            });

        // Pipe the image stream into sharp
        imgStream.pipe(sharpInstance);

        // Convert to buffer and get info
        const { data, info } = await sharpInstance.toBuffer({ resolveWithObject: true });

        // Send response with appropriate headers
        reply
            .header('content-type', `image/${imgFormat}`)
            .header('content-length', info.size)
            .header('x-original-size', originSize)
            .header('x-bytes-saved', originSize - info.size)
            .code(200)
            .send(data);
    } catch (error) {
        return redirect(request, reply);
    }
}
