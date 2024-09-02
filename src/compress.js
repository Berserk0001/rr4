"use strict";
import sharp from 'sharp';
import { redirect } from './redirect.js';

export async function compressImg(request, reply, input) {
    const { webp, grayscale, quality, originSize } = request.params;
    const imgFormat = webp ? 'webp' : 'jpeg';

    try {
        const sharpInstance = sharp()
            .grayscale(grayscale)
            .toFormat(imgFormat, {
                quality,
                progressive: true,
                optimizeScans: true,
                chromaSubsampling: '4:4:4'
            });

        // Pipe the stream from input.body into the sharp instance
        input.body.pipe(sharpInstance);

        const { data, info } = await sharpInstance.toBuffer({ resolveWithObject: true });

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
