"use strict";
import sharp from 'sharp';
import { redirect } from './redirect.js';

const sharpStream = () => sharp({ animated: !process.env.NO_ANIMATE, unlimited: true });

export async function compress(request, reply) {
    const format = request.params.webp ? 'webp' : 'jpeg';

    let originSize = request.params.originSize || 0;
    let chunks = [];

    try {
        // Buffer the incoming data
        for await (const chunk of request.raw) {
            originSize += chunk.length;
            chunks.push(chunk);
        }

        const buffer = Buffer.concat(chunks);

        // Process the image with sharp
        const { data, info } = await sharpStream()
            .grayscale(request.params.grayscale)
            .toFormat(format, {
                quality: request.params.quality,
                progressive: true,
                optimizeScans: true,
            })
            .toBuffer({ resolveWithObject: true });

        _sendResponse(null, data, info, format, request, reply, originSize);
    } catch (err) {
        _sendResponse(err, null, null, format, request, reply, originSize);
    }
}

function _sendResponse(err, output, info, format, request, reply, originSize) {
    if (err || !info) return redirect(request, reply);

    reply
        .header('content-type', 'image/' + format)
        .header('content-length', info.size)
        .header('x-original-size', originSize)
        .header('x-bytes-saved', originSize - info.size)
        .code(200)
        .send(output);
}

