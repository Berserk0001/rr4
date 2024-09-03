"use strict";
import sharp from 'sharp';
import { redirect } from './redirect.js';

const sharpStream = _ => sharp({ animated: !process.env.NO_ANIMATE, unlimited: true });

export async function compressImg(request, reply, origin) {
    const { body } = origin; // Extracting body from origin
    const format = request.params.webp ? 'webp' : 'jpeg';

    try {
        // Set up the sharp processing pipeline
        body.pipe(
            sharpStream()
                .grayscale(request.params.grayscale)
                .toFormat(format, {
                    quality: request.params.quality,
                    progressive: true,
                    optimizeScans: true,
                    chromaSubsampling: '4:4:4'
                })
                .toBuffer((err, output, info) => _sendResponse(err, output, info, format, request, reply))
        );
    } catch (error) {
        return redirect(request, reply);
    }
}

function _sendResponse(err, output, info, format, request, reply) {
    if (err || !info) {
        return redirect(request, reply);
    }

    reply.header('content-type', 'image/' + format);
    reply.header('content-length', info.size);
    reply.header('x-original-size', request.params.originSize);
    reply.header('x-bytes-saved', request.params.originSize - info.size);
    reply.code(200);
    res.send(output);
}
